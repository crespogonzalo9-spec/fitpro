import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Plus, TrendingUp, Calendar, Edit, Trash2, MoreVertical, CheckCircle, Clock, AlertCircle, Filter } from 'lucide-react';
import { Button, Card, Modal, Input, Textarea, Select, SearchInput, EmptyState, LoadingState, Badge, ConfirmDialog, Dropdown, DropdownItem, Avatar, GymRequired } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { formatDate } from '../utils/helpers';

const MEASURE_LABELS = {
  kg: 'kg',
  reps: 'reps',
  time: '',
  distance: 'm',
  calories: 'cal'
};

const PRsContent = () => {
  const { userData, isProfesor, isSysadmin } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  
  const [prs, setPrs] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterExercise, setFilterExercise] = useState('all');
  const [viewMode, setViewMode] = useState('mine');
  
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const canValidate = isProfesor() || isSysadmin();
  const canViewAll = isProfesor() || isSysadmin();

  // Reset estados cuando cambia el gimnasio
  useEffect(() => {
    setPrs([]);
    setExercises([]);
    setMembers([]);
    setLoading(true);
    setSearch('');
    setFilterStatus('all');
    setFilterExercise('all');
  }, [currentGym?.id]);

  // Cargar ejercicios
  useEffect(() => {
    if (!currentGym?.id) {
      setExercises([]);
      return;
    }

    const q = query(collection(db, 'exercises'), where('gymId', '==', currentGym.id));
    const unsubscribe = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => a.name?.localeCompare(b.name));
      setExercises(items);
    });

    return () => unsubscribe();
  }, [currentGym?.id]);

  // Cargar miembros (para validadores)
  useEffect(() => {
    if (!currentGym?.id || !canViewAll) {
      setMembers([]);
      return;
    }

    const q = query(collection(db, 'users'), where('gymId', '==', currentGym.id));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsubscribe();
  }, [currentGym?.id, canViewAll]);

  // Cargar PRs
  useEffect(() => {
    if (!currentGym?.id || !userData?.id) { 
      setPrs([]);
      setLoading(false); 
      return; 
    }

    setLoading(true);
    
    let q;
    if (viewMode === 'mine') {
      q = query(
        collection(db, 'prs'), 
        where('gymId', '==', currentGym.id),
        where('userId', '==', userData.id)
      );
    } else if (viewMode === 'pending' && canValidate) {
      q = query(
        collection(db, 'prs'), 
        where('gymId', '==', currentGym.id),
        where('status', '==', 'pending')
      );
    } else if (canViewAll) {
      q = query(collection(db, 'prs'), where('gymId', '==', currentGym.id));
    } else {
      q = query(
        collection(db, 'prs'), 
        where('gymId', '==', currentGym.id),
        where('userId', '==', userData.id)
      );
    }
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => {
        const dateA = a.date?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.date?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      setPrs(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentGym?.id, userData?.id, viewMode, canViewAll, canValidate]);

  const handleSave = async (data) => {
    try {
      const exercise = exercises.find(e => e.id === data.exerciseId);

      if (editMode && selected) {
        // Modo edición: actualizar el PR existente
        await updateDoc(doc(db, 'prs', selected.id), {
          ...data,
          exerciseName: exercise?.name || 'Ejercicio',
          measureType: exercise?.measureType || 'kg',
          updatedAt: serverTimestamp()
        });
        success('PR actualizado');
      } else {
        // Buscar si ya existe un PR para este ejercicio y usuario (validado o pendiente)
        const existingPRs = prs.filter(pr =>
          pr.exerciseId === data.exerciseId &&
          pr.userId === userData.id
        );

        // Ordenar por fecha para obtener el más reciente
        existingPRs.sort((a, b) => {
          const dateA = a.date?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.date?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        });

        const existingPR = existingPRs[0]; // El más reciente

        if (existingPR) {
          // Existe un PR anterior - calcular mejora
          const oldValue = parseFloat(existingPR.value);
          const newValue = parseFloat(data.value);
          let improvement = 0;

          if (exercise?.measureType === 'time') {
            // Para tiempo, menor es mejor
            improvement = ((oldValue - newValue) / oldValue) * 100;
          } else {
            // Para peso, reps, distancia, calorías: mayor es mejor
            improvement = ((newValue - oldValue) / oldValue) * 100;
          }

          // Actualizar el PR existente con el nuevo valor
          // Solo se guarda el anterior inmediato (no toda la cadena histórica)
          await updateDoc(doc(db, 'prs', existingPR.id), {
            previousValue: oldValue,
            value: data.value,
            improvement: improvement,
            date: data.date,
            notes: data.notes || '',
            videoUrl: data.videoUrl || '',
            status: 'pending', // Requiere nueva validación
            updatedAt: serverTimestamp()
          });

          success(`¡PR mejorado en ${improvement.toFixed(1)}%! Pendiente de validación`);
        } else {
          // No existe PR anterior - crear uno nuevo
          await addDoc(collection(db, 'prs'), {
            ...data,
            exerciseName: exercise?.name || 'Ejercicio',
            measureType: exercise?.measureType || 'kg',
            gymId: currentGym.id,
            userId: userData.id,
            userName: userData.name,
            status: 'pending',
            previousValue: null,
            improvement: null,
            createdAt: serverTimestamp()
          });
          success('Primer PR registrado! Pendiente de validación');
        }
      }
      setShowModal(false);
      setSelected(null);
      setEditMode(false);
    } catch (err) {
      console.error('Error saving PR:', err);
      showError('Error al guardar');
    }
  };

  const handleValidate = async (pr, status) => {
    try {
      await updateDoc(doc(db, 'prs', pr.id), {
        status,
        validatedAt: serverTimestamp(),
        validatedBy: userData.id,
        validatedByName: userData.name
      });
      success(status === 'validated' ? 'PR validado!' : 'PR rechazado');
    } catch (err) {
      showError('Error al validar');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'prs', selected.id));
      success('PR eliminado');
      setShowDelete(false);
      setSelected(null);
    } catch (err) {
      showError('Error al eliminar');
    }
  };

  const openEdit = (pr) => {
    setSelected(pr);
    setEditMode(true);
    setShowModal(true);
  };

  const openCreate = () => {
    setSelected(null);
    setEditMode(false);
    setShowModal(true);
  };

  const formatValue = (pr) => {
    if (pr.measureType === 'time') {
      const totalSeconds = pr.value;
      if (totalSeconds >= 3600) {
        const hours = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${pr.value} ${MEASURE_LABELS[pr.measureType] || ''}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'validated':
        return <Badge className="bg-green-500/20 text-green-400"><CheckCircle size={12} className="mr-1" /> Validado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400"><AlertCircle size={12} className="mr-1" /> Rechazado</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400"><Clock size={12} className="mr-1" /> Pendiente</Badge>;
    }
  };

  const getFilteredPRs = () => {
    let filtered = prs;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(pr => pr.status === filterStatus);
    }
    
    if (filterExercise !== 'all') {
      filtered = filtered.filter(pr => pr.exerciseId === filterExercise);
    }
    
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(pr => 
        pr.exerciseName?.toLowerCase().includes(s) || 
        pr.userName?.toLowerCase().includes(s) ||
        pr.notes?.toLowerCase().includes(s)
      );
    }
    
    return filtered;
  };

  const filteredPRs = getFilteredPRs();
  const pendingCount = prs.filter(pr => pr.status === 'pending').length;

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Marcas Personales</h1>
          <p className="text-gray-400">
            {viewMode === 'mine' ? 'Mis PRs' : viewMode === 'pending' ? 'Pendientes de validación' : 'Todos los PRs'}
            {' '}en {currentGym?.name}
          </p>
        </div>
        <div className="flex gap-2">
          {canViewAll && (
            <div className="flex bg-gray-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('mine')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${viewMode === 'mine' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
              >
                👤 Mis PRs
              </button>
              {canValidate && (
                <button
                  onClick={() => setViewMode('pending')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${viewMode === 'pending' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <Clock size={14} /> Pendientes
                  {pendingCount > 0 && (
                    <span className="bg-yellow-500 text-black text-xs px-1.5 rounded-full">{pendingCount}</span>
                  )}
                </button>
              )}
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${viewMode === 'all' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
              >
                📋 Todos
              </button>
            </div>
          )}
          <Button icon={Plus} onClick={openCreate}>Registrar PR</Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput 
          value={search} 
          onChange={setSearch} 
          placeholder="Buscar por ejercicio, persona o notas..." 
          className="flex-1" 
        />
        <Select
          value={filterExercise}
          onChange={e => setFilterExercise(e.target.value)}
          options={[
            { value: 'all', label: 'Todos los ejercicios' },
            ...exercises.map(e => ({ value: e.id, label: e.name }))
          ]}
          className="w-full sm:w-48"
        />
        <Select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          options={[
            { value: 'all', label: 'Todos los estados' },
            { value: 'validated', label: '✓ Validados' },
            { value: 'pending', label: '⏳ Pendientes' },
            { value: 'rejected', label: '✗ Rechazados' }
          ]}
          className="w-full sm:w-48"
        />
      </div>

      {/* Lista de PRs */}
      {filteredPRs.length === 0 ? (
        <EmptyState 
          icon={Trophy} 
          title={viewMode === 'pending' ? 'No hay PRs pendientes' : 'No hay marcas personales'}
          description={viewMode === 'mine' ? 'Registrá tu primera marca personal' : 'No se encontraron PRs'}
          action={viewMode === 'mine' && <Button icon={Plus} onClick={openCreate}>Registrar PR</Button>}
        />
      ) : (
        <div className="space-y-3">
          {filteredPRs.map(pr => (
            <Card key={pr.id} className="hover:border-gray-600 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Avatar del usuario (solo si no es "mis PRs") */}
                  {viewMode !== 'mine' && (
                    <Avatar name={pr.userName} size="md" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{pr.exerciseName}</h3>
                      {getStatusBadge(pr.status)}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(pr.date || pr.createdAt)}
                      </span>
                      {viewMode !== 'mine' && (
                        <span className="flex items-center gap-1">
                          <Trophy size={14} />
                          {pr.userName}
                        </span>
                      )}
                    </div>
                    {pr.status === 'validated' && pr.validatedByName && (
                      <p className="text-xs text-green-400 mt-1">Validado por {pr.validatedByName}</p>
                    )}
                    {pr.notes && (
                      <p className="text-sm text-gray-500 mt-1 truncate">{pr.notes}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Valor del PR */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{formatValue(pr)}</p>
                    {pr.previousValue && pr.improvement != null && (
                      <div className="text-xs">
                        <p className="text-gray-500">
                          Anterior: {pr.measureType === 'time' ? (() => {
                            const mins = Math.floor(pr.previousValue / 60);
                            const secs = pr.previousValue % 60;
                            return `${mins}:${secs.toString().padStart(2, '0')}`;
                          })() : `${pr.previousValue} ${MEASURE_LABELS[pr.measureType] || ''}`}
                        </p>
                        <p className={`font-semibold ${pr.improvement > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {pr.improvement > 0 ? '↑' : '↓'} {Math.abs(pr.improvement).toFixed(1)}%
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex gap-2">
                    {/* Botones de validación */}
                    {canValidate && pr.status === 'pending' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleValidate(pr, 'validated')}
                          className="text-green-400 hover:bg-green-500/20"
                        >
                          <CheckCircle size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleValidate(pr, 'rejected')}
                          className="text-red-400 hover:bg-red-500/20"
                        >
                          <AlertCircle size={18} />
                        </Button>
                      </>
                    )}
                    
                    {/* Menú para el dueño del PR */}
                    {(pr.userId === userData.id || isSysadmin()) && (
                      <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                        <DropdownItem icon={Edit} onClick={() => openEdit(pr)}>Editar</DropdownItem>
                        <DropdownItem icon={Trash2} danger onClick={() => { setSelected(pr); setShowDelete(true); }}>Eliminar</DropdownItem>
                      </Dropdown>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <PRModal 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); setSelected(null); setEditMode(false); }} 
        onSave={handleSave} 
        pr={editMode ? selected : null}
        exercises={exercises}
      />

      <ConfirmDialog 
        isOpen={showDelete} 
        onClose={() => setShowDelete(false)} 
        onConfirm={handleDelete} 
        title="Eliminar PR" 
        message={`¿Eliminar este PR de ${selected?.exerciseName}?`}
        confirmText="Eliminar" 
      />
    </div>
  );
};

const PRModal = ({ isOpen, onClose, onSave, pr, exercises }) => {
  const [form, setForm] = useState({
    exerciseId: '',
    value: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const selectedExercise = exercises.find(e => e.id === form.exerciseId);

  useEffect(() => {
    if (pr) {
      setForm({
        exerciseId: pr.exerciseId || '',
        value: pr.measureType === 'time' ? '' : pr.value?.toString() || '',
        timeMinutes: pr.measureType === 'time' ? Math.floor(pr.value / 60) : 0,
        timeSeconds: pr.measureType === 'time' ? pr.value % 60 : 0,
        date: pr.date?.toDate?.().toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        notes: pr.notes || ''
      });
    } else {
      setForm({
        exerciseId: exercises[0]?.id || '',
        value: '',
        timeMinutes: 0,
        timeSeconds: 0,
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
  }, [pr, isOpen, exercises]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let finalValue = parseFloat(form.value);
    
    if (selectedExercise?.measureType === 'time') {
      finalValue = (parseInt(form.timeMinutes) || 0) * 60 + (parseInt(form.timeSeconds) || 0);
    }
    
    if (!form.exerciseId || isNaN(finalValue) || finalValue <= 0) {
      return;
    }
    
    setLoading(true);
    await onSave({
      exerciseId: form.exerciseId,
      value: finalValue,
      date: new Date(form.date),
      notes: form.notes
    });
    setLoading(false);
  };

  const getMeasureLabel = () => {
    if (!selectedExercise) return 'Valor';
    switch (selectedExercise.measureType) {
      case 'kg': return 'Peso (kg)';
      case 'reps': return 'Repeticiones';
      case 'time': return 'Tiempo';
      case 'distance': return 'Distancia (metros)';
      case 'calories': return 'Calorías';
      default: return 'Valor';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={pr ? 'Editar PR' : 'Registrar PR'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {exercises.length === 0 ? (
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <p className="text-yellow-400 text-sm">
              No hay ejercicios cargados. Primero agregá ejercicios desde la sección correspondiente.
            </p>
          </Card>
        ) : (
          <>
            <Select 
              label="Ejercicio *" 
              value={form.exerciseId} 
              onChange={e => setForm({ ...form, exerciseId: e.target.value })}
              options={exercises.map(e => ({ 
                value: e.id, 
                label: `${e.name} (${e.measureType === 'kg' ? 'peso' : e.measureType === 'reps' ? 'reps' : e.measureType === 'time' ? 'tiempo' : e.measureType})` 
              }))}
            />

            {selectedExercise?.measureType === 'time' ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tiempo *</label>
                <div className="flex gap-2 items-center">
                  <Input 
                    type="number"
                    value={form.timeMinutes} 
                    onChange={e => setForm({ ...form, timeMinutes: e.target.value })} 
                    placeholder="0"
                    min="0"
                    className="flex-1"
                  />
                  <span className="text-gray-400">min</span>
                  <Input 
                    type="number"
                    value={form.timeSeconds} 
                    onChange={e => setForm({ ...form, timeSeconds: e.target.value })} 
                    placeholder="0"
                    min="0"
                    max="59"
                    className="flex-1"
                  />
                  <span className="text-gray-400">seg</span>
                </div>
              </div>
            ) : (
              <Input 
                label={`${getMeasureLabel()} *`}
                type="number"
                step={selectedExercise?.measureType === 'kg' ? '0.5' : '1'}
                value={form.value} 
                onChange={e => setForm({ ...form, value: e.target.value })} 
                placeholder={selectedExercise?.measureType === 'kg' ? 'Ej: 100' : 'Ej: 10'}
                required
              />
            )}

            <Input 
              label="Fecha" 
              type="date"
              value={form.date} 
              onChange={e => setForm({ ...form, date: e.target.value })} 
            />

            <Textarea 
              label="Notas (opcional)" 
              value={form.notes} 
              onChange={e => setForm({ ...form, notes: e.target.value })} 
              placeholder="Ej: Sin cinturón, con pausa, primera vez..."
              rows={2}
            />

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
              <Button type="submit" loading={loading} className="flex-1" disabled={exercises.length === 0}>
                {pr ? 'Guardar' : 'Registrar PR'}
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};

const PRs = () => (<GymRequired><PRsContent /></GymRequired>);
export default PRs;
