import React, { useState, useEffect } from 'react';
import { Plus, Flame, MoreVertical, Edit, Trash2, Users, Lock, Clock, Zap, Globe } from 'lucide-react';
import { Button, Card, Modal, Input, Select, Textarea, SearchInput, EmptyState, LoadingState, ConfirmDialog, Badge, Dropdown, DropdownItem, Avatar, GymRequired } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { WOD_TYPES, BENCHMARK_WODS, ESD_INTERVALS } from '../utils/constants';

const WODsContent = () => {
  const { userData, canCreateRoutines, isOnlyAlumno } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  
  const [wods, setWods] = useState([]);
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selected, setSelected] = useState(null);

  const canEdit = canCreateRoutines();

  // Reset estados cuando cambia el gimnasio
  useEffect(() => {
    setWods([]);
    setClasses([]);
    setMembers([]);
    setMyEnrollments([]);
    setLoading(true);
    setSearch('');
    setFilter('all');
  }, [currentGym?.id]);

  useEffect(() => {
    if (!currentGym?.id) { 
      setWods([]);
      setLoading(false); 
      return; 
    }

    // Cargar WODs
    const wodsQuery = query(collection(db, 'wods'), where('gymId', '==', currentGym.id));
    const unsubWods = onSnapshot(wodsQuery, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      setWods(items);
      setLoading(false);
    });

    // Cargar clases
    const classesQuery = query(collection(db, 'classes'), where('gymId', '==', currentGym.id));
    const unsubClasses = onSnapshot(classesQuery, (snap) => {
      setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Cargar miembros (para profesores/admin que pueden asignar)
    if (canEdit) {
      const membersQuery = query(collection(db, 'users'), where('gymId', '==', currentGym.id));
      const unsubMembers = onSnapshot(membersQuery, (snap) => {
        // Filtrar solo alumnos (tienen rol alumno)
        const allMembers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMembers(allMembers.filter(m => m.roles?.includes('alumno') || !m.roles || m.roles.length === 0));
      });
      return () => { unsubWods(); unsubClasses(); unsubMembers(); };
    }

    // Para alumnos: cargar sus inscripciones
    if (isOnlyAlumno() && userData?.id) {
      const enrollQuery = query(collection(db, 'enrollments'), where('userId', '==', userData.id));
      const unsubEnroll = onSnapshot(enrollQuery, (snap) => {
        setMyEnrollments(snap.docs.map(d => d.data().classId));
      });
      return () => { unsubWods(); unsubClasses(); unsubEnroll(); };
    }

    return () => { unsubWods(); unsubClasses(); };
  }, [currentGym, userData, canEdit, isOnlyAlumno]);

  const getVisibleWods = () => {
    let visible = wods;

    // Filtrar por visibilidad para alumnos
    if (isOnlyAlumno()) {
      visible = wods.filter(w => {
        if (w.assignmentType === 'individual' && w.memberIds?.includes(userData.id)) return true;
        if (w.assignmentType === 'class' && myEnrollments.includes(w.classId)) return true;
        if (!w.assignmentType || w.assignmentType === 'general') return true;
        return false;
      });
    }

    // Filtrar por tipo de asignación
    if (filter !== 'all') visible = visible.filter(w => w.assignmentType === filter);
    
    // Filtrar por búsqueda
    if (search) {
      const s = search.toLowerCase();
      visible = visible.filter(w => 
        w.name?.toLowerCase().includes(s) || 
        w.description?.toLowerCase().includes(s)
      );
    }

    return visible;
  };

  const handleSave = async (data) => {
    try {
      const wodData = { ...data, gymId: currentGym.id, updatedAt: serverTimestamp() };

      if (selected?.id) {
        await updateDoc(doc(db, 'wods', selected.id), wodData);
        success('WOD actualizado');
      } else {
        await addDoc(collection(db, 'wods'), { 
          ...wodData, 
          createdBy: userData.id, 
          createdByName: userData.name, 
          createdAt: serverTimestamp() 
        });
        success('WOD creado');
      }
      setShowModal(false);
      setSelected(null);
    } catch (err) {
      console.error('Error saving WOD:', err);
      showError('Error al guardar');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'wods', selected.id));
      success('WOD eliminado');
      setShowDelete(false);
      setSelected(null);
    } catch (err) {
      showError('Error al eliminar');
    }
  };

  const getTypeName = (type) => WOD_TYPES.find(t => t.id === type)?.name || type;
  const getClassName = (classId) => classes.find(c => c.id === classId)?.name || 'Sin clase';
  const getMemberNames = (memberIds) => {
    if (!memberIds || memberIds.length === 0) return '';
    const names = memberIds.map(id => members.find(m => m.id === id)?.name).filter(Boolean);
    return names.length <= 2 ? names.join(', ') : `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  };

  const visibleWods = getVisibleWods();

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={Flame} title="Sin gimnasio" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">WODs</h1>
          <p className="text-gray-400">{visibleWods.length} workouts</p>
        </div>
        {canEdit && (
          <Button icon={Plus} onClick={() => { setSelected(null); setShowModal(true); }}>
            Nuevo WOD
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar WOD..." className="flex-1" />
        <Select 
          value={filter} 
          onChange={e => setFilter(e.target.value)} 
          options={[
            { value: 'all', label: 'Todos' }, 
            { value: 'general', label: '🌐 Generales' }, 
            { value: 'class', label: '📅 Para Clases' }, 
            { value: 'individual', label: '👤 Individuales' }
          ]} 
          className="w-full sm:w-48" 
        />
      </div>

      {/* Info para profesores si no hay miembros */}
      {canEdit && members.length === 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <p className="text-yellow-400 text-sm">
            No hay alumnos en este gimnasio. Los WODs individuales requieren alumnos registrados.
          </p>
        </Card>
      )}

      {visibleWods.length === 0 ? (
        <EmptyState 
          icon={Flame} 
          title="No hay WODs" 
          description={wods.length === 0 ? "Creá el primer WOD para tu gimnasio" : "No se encontraron WODs con esos filtros"}
          action={canEdit && <Button icon={Plus} onClick={() => setShowModal(true)}>Crear WOD</Button>} 
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleWods.map(wod => (
            <Card key={wod.id} className="hover:border-gray-600 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => { setSelected(wod); setShowView(true); }}
                >
                  <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <Flame className="text-orange-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{wod.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <Badge className="bg-orange-500/20 text-orange-400">{getTypeName(wod.type)}</Badge>
                      {wod.timeLimit && (
                        <Badge className="bg-gray-500/20 text-gray-400">
                          <Clock size={10} className="mr-1" />{wod.timeLimit}'
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {canEdit && (
                  <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                    <DropdownItem icon={Edit} onClick={() => { setSelected(wod); setShowModal(true); }}>Editar</DropdownItem>
                    <DropdownItem icon={Trash2} danger onClick={() => { setSelected(wod); setShowDelete(true); }}>Eliminar</DropdownItem>
                  </Dropdown>
                )}
              </div>
              
              {wod.description && (
                <p className="text-sm text-gray-400 mb-3 line-clamp-3 whitespace-pre-wrap">{wod.description}</p>
              )}
              
              <div className="text-xs text-gray-500 flex items-center gap-1">
                {wod.assignmentType === 'individual' && (
                  <>
                    <Lock size={12} /> 
                    <span>{getMemberNames(wod.memberIds) || 'Sin asignar'}</span>
                  </>
                )}
                {wod.assignmentType === 'class' && (
                  <>
                    <Users size={12} /> 
                    <span>{getClassName(wod.classId)}</span>
                  </>
                )}
                {(!wod.assignmentType || wod.assignmentType === 'general') && (
                  <>
                    <Globe size={12} /> 
                    <span>General</span>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <WODModal 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); setSelected(null); }} 
        onSave={handleSave} 
        wod={selected} 
        classes={classes} 
        members={members} 
      />
      <ViewWODModal 
        isOpen={showView} 
        onClose={() => { setShowView(false); setSelected(null); }} 
        wod={selected} 
        getTypeName={getTypeName} 
        getClassName={getClassName} 
        getMemberNames={getMemberNames}
        members={members}
      />
      <ConfirmDialog 
        isOpen={showDelete} 
        onClose={() => setShowDelete(false)} 
        onConfirm={handleDelete} 
        title="Eliminar WOD" 
        message={`¿Eliminar "${selected?.name}"?`} 
        confirmText="Eliminar" 
      />
    </div>
  );
};

const WODModal = ({ isOpen, onClose, onSave, wod, classes, members }) => {
  const [form, setForm] = useState({
    name: '',
    type: 'for_time',
    description: '',
    timeLimit: '',
    assignmentType: 'general',
    classId: '',
    memberIds: [],
    // Campos específicos para ESD
    esdInterval: 60,
    esdRounds: 10,
    // Campos específicos para AMRAP
    amrapTime: 20,
    // Campos específicos para For Time
    forTimeRounds: 1,
    // Campos específicos para Tabata
    tabataRounds: 8
  });
  const [loading, setLoading] = useState(false);
  const [showBenchmarks, setShowBenchmarks] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  useEffect(() => {
    if (wod) {
      setForm({
        name: wod.name || '',
        type: wod.type || 'for_time',
        description: wod.description || '',
        timeLimit: wod.timeLimit || '',
        assignmentType: wod.assignmentType || 'general',
        classId: wod.classId || '',
        memberIds: wod.memberIds || [],
        esdInterval: wod.esdInterval || 60,
        esdRounds: wod.esdRounds || 10,
        amrapTime: wod.amrapTime || 20,
        forTimeRounds: wod.forTimeRounds || 1,
        tabataRounds: wod.tabataRounds || 8
      });
    } else {
      setForm({
        name: '',
        type: 'for_time',
        description: '',
        timeLimit: '',
        assignmentType: 'general',
        classId: '',
        memberIds: [],
        esdInterval: 60,
        esdRounds: 10,
        amrapTime: 20,
        forTimeRounds: 1,
        tabataRounds: 8
      });
    }
    setMemberSearch('');
  }, [wod, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    if (form.assignmentType === 'class' && !form.classId) { 
      alert('Seleccioná una clase'); 
      return; 
    }
    if (form.assignmentType === 'individual' && form.memberIds.length === 0) { 
      alert('Seleccioná al menos un alumno'); 
      return; 
    }
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  const selectBenchmark = (b) => {
    setForm(prev => ({ ...prev, name: b.name, type: b.type, description: b.description }));
    setShowBenchmarks(false);
  };

  const toggleMember = (id) => {
    setForm(prev => ({ 
      ...prev, 
      memberIds: prev.memberIds.includes(id) 
        ? prev.memberIds.filter(m => m !== id) 
        : [...prev.memberIds, id] 
    }));
  };

  const selectAllMembers = () => {
    setForm(prev => ({ ...prev, memberIds: members.map(m => m.id) }));
  };

  const clearMembers = () => {
    setForm(prev => ({ ...prev, memberIds: [] }));
  };

  const filteredMembers = members.filter(m => 
    m.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={wod ? 'Editar WOD' : 'Nuevo WOD'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Input 
            label="Nombre *" 
            value={form.name} 
            onChange={e => setForm({ ...form, name: e.target.value })} 
            className="flex-1" 
            required 
          />
          <div className="pt-6">
            <Button type="button" variant="secondary" size="sm" icon={Zap} onClick={() => setShowBenchmarks(!showBenchmarks)}>
              Benchmarks
            </Button>
          </div>
        </div>

        {showBenchmarks && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-gray-800/50 rounded-xl max-h-40 overflow-y-auto">
            {BENCHMARK_WODS.map(b => (
              <button 
                key={b.name} 
                type="button" 
                onClick={() => selectBenchmark(b)} 
                className="text-left p-2 hover:bg-gray-700 rounded-lg"
              >
                <p className="font-medium text-sm text-orange-400">{b.name}</p>
                <p className="text-xs text-gray-500">{b.type}</p>
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Tipo"
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value })}
            options={WOD_TYPES.map(t => ({ value: t.id, label: t.name }))}
          />
          <Input
            label="Time Cap (min)"
            type="number"
            value={form.timeLimit}
            onChange={e => setForm({ ...form, timeLimit: e.target.value })}
            placeholder="20"
          />
        </div>

        {/* Campos específicos para ESD */}
        {form.type === 'esd' && (
          <Card className="bg-blue-500/10 border-blue-500/30">
            <h4 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
              <Clock size={16} />
              Configuración ESD
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Intervalo"
                value={form.esdInterval}
                onChange={e => setForm({ ...form, esdInterval: parseInt(e.target.value) })}
                options={ESD_INTERVALS.map(i => ({ value: i.value, label: i.label }))}
              />
              <Input
                label="Rondas"
                type="number"
                min="1"
                max="60"
                value={form.esdRounds}
                onChange={e => setForm({ ...form, esdRounds: parseInt(e.target.value) || 1 })}
                placeholder="10"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Ejemplo: Intervalo de 1 minuto con 10 rondas = E1MOM 10
            </p>
          </Card>
        )}

        {/* Campos específicos para AMRAP */}
        {form.type === 'amrap' && (
          <Card className="bg-green-500/10 border-green-500/30">
            <h4 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
              <Clock size={16} />
              Configuración AMRAP
            </h4>
            <Input
              label="Tiempo (minutos)"
              type="number"
              min="1"
              max="60"
              value={form.amrapTime}
              onChange={e => setForm({ ...form, amrapTime: parseInt(e.target.value) || 1 })}
              placeholder="20"
            />
            <p className="text-xs text-gray-400 mt-2">
              As Many Rounds As Possible - Máximas rondas en el tiempo indicado
            </p>
          </Card>
        )}

        {/* Campos específicos para For Time */}
        {form.type === 'for_time' && (
          <Card className="bg-purple-500/10 border-purple-500/30">
            <h4 className="text-sm font-medium text-purple-400 mb-3 flex items-center gap-2">
              <Clock size={16} />
              Configuración For Time
            </h4>
            <Input
              label="Rondas"
              type="number"
              min="1"
              max="10"
              value={form.forTimeRounds}
              onChange={e => setForm({ ...form, forTimeRounds: parseInt(e.target.value) || 1 })}
              placeholder="3"
            />
            <p className="text-xs text-gray-400 mt-2">
              Completar todas las rondas lo más rápido posible
            </p>
          </Card>
        )}

        {/* Campos específicos para Tabata */}
        {form.type === 'tabata' && (
          <Card className="bg-red-500/10 border-red-500/30">
            <h4 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
              <Clock size={16} />
              Configuración Tabata
            </h4>
            <Input
              label="Rondas"
              type="number"
              min="4"
              max="12"
              value={form.tabataRounds}
              onChange={e => setForm({ ...form, tabataRounds: parseInt(e.target.value) || 8 })}
              placeholder="8"
            />
            <p className="text-xs text-gray-400 mt-2">
              Protocolo Tabata: 20 segundos trabajo / 10 segundos descanso
            </p>
          </Card>
        )}

        <Textarea
          label="Descripción / Movimientos *"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          rows={5}
          placeholder={
            form.type === 'esd' ? 'Ejemplo:\n5 Thrusters (43/30 kg)\n10 Pull-ups\n15 Air Squats' :
            form.type === 'amrap' ? 'Ejemplo:\n5 Pull-ups\n10 Push-ups\n15 Air Squats' :
            form.type === 'for_time' ? 'Ejemplo:\n21-15-9\nThrusters (43/30 kg)\nPull-ups' :
            form.type === 'tabata' ? 'Ejemplo:\nBurpees' :
            '21-15-9\nThrusters (43/30 kg)\nPull-ups'
          }
          required
        />

        <Select 
          label="Asignar a" 
          value={form.assignmentType} 
          onChange={e => setForm({ ...form, assignmentType: e.target.value, classId: '', memberIds: [] })} 
          options={[
            { value: 'general', label: '🌐 General (todos lo ven)' }, 
            { value: 'class', label: '📅 Clase específica' }, 
            { value: 'individual', label: '👤 Alumnos específicos' }
          ]} 
        />

        {form.assignmentType === 'class' && (
          <Select 
            label="Clase *" 
            value={form.classId} 
            onChange={e => setForm({ ...form, classId: e.target.value })} 
            options={[
              { value: '', label: 'Elegir clase...' },
              ...classes.map(c => ({ value: c.id, label: `${c.name} - ${c.schedule || ''}` }))
            ]} 
          />
        )}

        {form.assignmentType === 'individual' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                Alumnos ({form.memberIds.length} seleccionados)
              </label>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={selectAllMembers}
                  className="text-xs text-primary hover:underline"
                >
                  Seleccionar todos
                </button>
                <button 
                  type="button" 
                  onClick={clearMembers}
                  className="text-xs text-gray-400 hover:underline"
                >
                  Limpiar
                </button>
              </div>
            </div>
            
            {/* Buscador de miembros */}
            <input
              type="text"
              value={memberSearch}
              onChange={e => setMemberSearch(e.target.value)}
              placeholder="Buscar alumno..."
              className="w-full px-3 py-2 mb-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            />
            
            <div className="max-h-48 overflow-y-auto space-y-1 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
              {filteredMembers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  {members.length === 0 ? 'No hay alumnos en el gimnasio' : 'No se encontraron alumnos'}
                </p>
              ) : (
                filteredMembers.map(m => (
                  <label 
                    key={m.id} 
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      form.memberIds.includes(m.id) ? 'bg-primary/20 border border-primary/50' : 'hover:bg-gray-700'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={form.memberIds.includes(m.id)} 
                      onChange={() => toggleMember(m.id)} 
                      className="w-4 h-4" 
                    />
                    <Avatar name={m.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-xs text-gray-500 truncate">{m.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
};

const ViewWODModal = ({ isOpen, onClose, wod, getTypeName, getClassName, getMemberNames, members }) => {
  if (!wod) return null;

  const assignedMembers = wod.memberIds?.map(id => members.find(m => m.id === id)).filter(Boolean) || [];

  // Formatear el intervalo ESD
  const formatEsdInterval = (seconds) => {
    if (seconds < 60) return `${seconds} segundos`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return `${minutes}:${secs.toString().padStart(2, '0')} minutos`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={wod.name} size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-orange-500/20 text-orange-400">{getTypeName(wod.type)}</Badge>
          {wod.timeLimit && <Badge className="bg-gray-500/20 text-gray-400">{wod.timeLimit} min</Badge>}
          {wod.type === 'esd' && wod.esdInterval && wod.esdRounds && (
            <Badge className="bg-blue-500/20 text-blue-400">
              <Clock size={12} className="mr-1" />
              {formatEsdInterval(wod.esdInterval)} × {wod.esdRounds} rondas
            </Badge>
          )}
          {wod.type === 'amrap' && wod.amrapTime && (
            <Badge className="bg-green-500/20 text-green-400">
              <Clock size={12} className="mr-1" />
              {wod.amrapTime} min
            </Badge>
          )}
          {wod.type === 'for_time' && wod.forTimeRounds && wod.forTimeRounds > 1 && (
            <Badge className="bg-purple-500/20 text-purple-400">
              {wod.forTimeRounds} rondas
            </Badge>
          )}
          {wod.type === 'tabata' && wod.tabataRounds && (
            <Badge className="bg-red-500/20 text-red-400">
              {wod.tabataRounds} rondas × 20s/10s
            </Badge>
          )}
        </div>

        <div className="bg-gray-800 rounded-xl p-4 whitespace-pre-wrap font-mono text-sm">
          {wod.description}
        </div>
        
        <div className="pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 mb-2">Asignación:</p>
          {wod.assignmentType === 'class' && (
            <div className="flex items-center gap-2">
              <Users size={14} className="text-gray-400" />
              <span className="text-sm">{getClassName(wod.classId)}</span>
            </div>
          )}
          {wod.assignmentType === 'individual' && assignedMembers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {assignedMembers.map(m => (
                <div key={m.id} className="flex items-center gap-2 px-2 py-1 bg-gray-800 rounded-lg">
                  <Avatar name={m.name} size="xs" />
                  <span className="text-sm">{m.name}</span>
                </div>
              ))}
            </div>
          )}
          {(!wod.assignmentType || wod.assignmentType === 'general') && (
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-gray-400" />
              <span className="text-sm">Visible para todos</span>
            </div>
          )}
        </div>
        
        {wod.createdByName && (
          <p className="text-xs text-gray-500">
            Creado por {wod.createdByName}
          </p>
        )}
      </div>
    </Modal>
  );
};

// Wrapper con GymRequired
const WODs = () => (
  <GymRequired>
    <WODsContent />
  </GymRequired>
);

export default WODs;
