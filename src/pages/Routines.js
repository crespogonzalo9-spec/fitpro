import React, { useState, useEffect } from 'react';
import { Plus, ClipboardList, MoreVertical, Edit, Trash2, Users, Lock, Globe, Dumbbell, Play } from 'lucide-react';
import { Button, Card, Modal, Input, Select, Textarea, SearchInput, EmptyState, LoadingState, ConfirmDialog, Badge, Dropdown, DropdownItem, Avatar , GymRequired } from '../components/Common';
import RoutineTimer from '../components/Common/RoutineTimer';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

const RoutinesContent = () => {
  const { userData, canCreateRoutines, isOnlyAlumno } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  
  const [routines, setRoutines] = useState([]);
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [selected, setSelected] = useState(null);

  const canEdit = canCreateRoutines();

  // Reset estados cuando cambia el gimnasio
  useEffect(() => {
    setRoutines([]);
    setClasses([]);
    setMembers([]);
    setExercises([]);
    setMyEnrollments([]);
    setLoading(true);
    setSearch('');
    setFilter('all');
  }, [currentGym?.id]);

  useEffect(() => {
    if (!currentGym?.id) { setLoading(false); return; }

    // Cargar rutinas
    const routinesQuery = query(collection(db, 'routines'), where('gymId', '==', currentGym.id));
    const unsubRoutines = onSnapshot(routinesQuery, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      setRoutines(items);
      setLoading(false);
    });

    // Cargar clases
    const classesQuery = query(collection(db, 'classes'), where('gymId', '==', currentGym.id));
    const unsubClasses = onSnapshot(classesQuery, (snap) => {
      setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Cargar ejercicios
    const exQuery = query(collection(db, 'exercises'), where('gymId', '==', currentGym.id));
    const unsubEx = onSnapshot(exQuery, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => a.name?.localeCompare(b.name));
      setExercises(items);
    });

    // Cargar miembros (para profesores/admin)
    if (canEdit) {
      const membersQuery = query(collection(db, 'users'), where('gymId', '==', currentGym.id));
      const unsubMembers = onSnapshot(membersQuery, (snap) => {
        const allMembers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Filtrar solo alumnos
        setMembers(allMembers.filter(m => m.roles?.includes('alumno') || !m.roles || m.roles.length === 0));
      });
      return () => { unsubRoutines(); unsubClasses(); unsubEx(); unsubMembers(); };
    }

    // Para alumnos: cargar inscripciones
    if (isOnlyAlumno() && userData?.id) {
      const enrollQuery = query(collection(db, 'enrollments'), where('userId', '==', userData.id));
      const unsubEnroll = onSnapshot(enrollQuery, (snap) => {
        setMyEnrollments(snap.docs.map(d => d.data().classId));
      });
      return () => { unsubRoutines(); unsubClasses(); unsubEx(); unsubEnroll(); };
    }

    return () => { unsubRoutines(); unsubClasses(); unsubEx(); };
  }, [currentGym, userData, canEdit, isOnlyAlumno]);

  const getVisibleRoutines = () => {
    let visible = routines;

    // Filtrar por visibilidad para alumnos
    if (isOnlyAlumno()) {
      visible = routines.filter(r => {
        if (r.assignmentType === 'individual' && r.memberIds?.includes(userData.id)) return true;
        if (r.assignmentType === 'class' && myEnrollments.includes(r.classId)) return true;
        if (!r.assignmentType || r.assignmentType === 'general') return true;
        return false;
      });
    }

    if (filter !== 'all') visible = visible.filter(r => r.assignmentType === filter);
    if (search) {
      const s = search.toLowerCase();
      visible = visible.filter(r => 
        r.name?.toLowerCase().includes(s) || 
        r.description?.toLowerCase().includes(s)
      );
    }

    return visible;
  };

  const handleSave = async (data) => {
    try {
      const routineData = { ...data, gymId: currentGym.id, updatedAt: serverTimestamp() };

      if (selected?.id) {
        await updateDoc(doc(db, 'routines', selected.id), routineData);
        success('Rutina actualizada');
      } else {
        await addDoc(collection(db, 'routines'), { 
          ...routineData, 
          createdBy: userData.id, 
          createdByName: userData.name, 
          createdAt: serverTimestamp() 
        });
        success('Rutina creada');
      }
      setShowModal(false);
      setSelected(null);
    } catch (err) {
      console.error('Error saving routine:', err);
      showError('Error al guardar');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'routines', selected.id));
      success('Rutina eliminada');
      setShowDelete(false);
      setSelected(null);
    } catch (err) {
      showError('Error al eliminar');
    }
  };

  const handleCompleteRoutine = async (sessionData) => {
    try {
      // Guardar sesión de rutina
      await addDoc(collection(db, 'routine_sessions'), {
        ...sessionData,
        userId: userData.id,
        userName: userData.name,
        gymId: currentGym.id,
        createdAt: serverTimestamp()
      });
      success(`Rutina completada! Tiempo total: ${Math.floor(sessionData.totalTimeInSeconds / 60)} min ${sessionData.totalTimeInSeconds % 60} seg`);
      setShowTimer(false);
      setSelected(null);
    } catch (err) {
      console.error('Error saving routine session:', err);
      showError('Error al guardar la sesión');
    }
  };

  const getClassName = (classId) => classes.find(c => c.id === classId)?.name || 'Sin clase';
  const getMemberNames = (memberIds) => {
    if (!memberIds || memberIds.length === 0) return '';
    const names = memberIds.map(id => members.find(m => m.id === id)?.name).filter(Boolean);
    return names.length <= 2 ? names.join(', ') : `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  };

  const visibleRoutines = getVisibleRoutines();

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={ClipboardList} title="Sin gimnasio" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rutinas</h1>
          <p className="text-gray-400">{visibleRoutines.length} rutinas</p>
        </div>
        {canEdit && (
          <Button icon={Plus} onClick={() => { setSelected(null); setShowModal(true); }}>
            Nueva Rutina
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar rutina..." className="flex-1" />
        <Select 
          value={filter} 
          onChange={e => setFilter(e.target.value)} 
          options={[
            { value: 'all', label: 'Todas' }, 
            { value: 'general', label: '🌐 Generales' }, 
            { value: 'class', label: '📅 Para Clases' }, 
            { value: 'individual', label: '👤 Individuales' }
          ]} 
          className="w-full sm:w-48" 
        />
      </div>

      {/* Info para profesores */}
      {canEdit && members.length === 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <p className="text-yellow-400 text-sm">
            No hay alumnos en este gimnasio. Las rutinas individuales requieren alumnos registrados.
          </p>
        </Card>
      )}

      {visibleRoutines.length === 0 ? (
        <EmptyState 
          icon={ClipboardList} 
          title="No hay rutinas" 
          description={routines.length === 0 ? "Creá la primera rutina para tu gimnasio" : "No se encontraron rutinas con esos filtros"}
          action={canEdit && <Button icon={Plus} onClick={() => setShowModal(true)}>Crear Rutina</Button>} 
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleRoutines.map(routine => (
            <Card key={routine.id} className="hover:border-gray-600 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => { setSelected(routine); setShowView(true); }}>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <ClipboardList className="text-blue-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{routine.name}</h3>
                    <p className="text-sm text-gray-400">{routine.exercises?.length || 0} ejercicios</p>
                  </div>
                </div>
                {canEdit && (
                  <Dropdown trigger={<button onClick={e => e.stopPropagation()} className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                    <DropdownItem icon={Edit} onClick={() => { setSelected(routine); setShowModal(true); }}>Editar</DropdownItem>
                    <DropdownItem icon={Trash2} danger onClick={() => { setSelected(routine); setShowDelete(true); }}>Eliminar</DropdownItem>
                  </Dropdown>
                )}
              </div>
              
              {routine.description && (
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{routine.description}</p>
              )}

              <div className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                {routine.assignmentType === 'individual' && (
                  <>
                    <Lock size={12} />
                    <span>{getMemberNames(routine.memberIds) || 'Sin asignar'}</span>
                  </>
                )}
                {routine.assignmentType === 'class' && (
                  <>
                    <Users size={12} />
                    <span>{getClassName(routine.classId)}</span>
                  </>
                )}
                {(!routine.assignmentType || routine.assignmentType === 'general') && (
                  <>
                    <Globe size={12} />
                    <span>General</span>
                  </>
                )}
              </div>

              {/* Botón para iniciar rutina con timer */}
              {routine.exercises && routine.exercises.length > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={Play}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(routine);
                    setShowTimer(true);
                  }}
                  className="w-full"
                >
                  Iniciar con Timer
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      <RoutineModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelected(null); }}
        onSave={handleSave}
        routine={selected}
        classes={classes}
        members={members}
        exercises={exercises}
      />
      <ViewRoutineModal
        isOpen={showView}
        onClose={() => { setShowView(false); setSelected(null); }}
        routine={selected}
        exercises={exercises}
        getClassName={getClassName}
        getMemberNames={getMemberNames}
        members={members}
        onStartTimer={() => {
          setShowView(false);
          setShowTimer(true);
        }}
      />
      {showTimer && selected && (
        <RoutineTimer
          routine={selected}
          exercises={exercises}
          onClose={() => { setShowTimer(false); setSelected(null); }}
          onComplete={handleCompleteRoutine}
        />
      )}
      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Eliminar Rutina"
        message={`¿Eliminar "${selected?.name}"?`}
        confirmText="Eliminar"
      />
    </div>
  );
};

const RoutineModal = ({ isOpen, onClose, onSave, routine, classes, members, exercises }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    assignmentType: 'general',
    classId: '',
    memberIds: [],
    exercises: [],
    hasRestBetweenExercises: true
  });
  const [loading, setLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  useEffect(() => {
    if (routine) {
      setForm({
        name: routine.name || '',
        description: routine.description || '',
        assignmentType: routine.assignmentType || 'general',
        classId: routine.classId || '',
        memberIds: routine.memberIds || [],
        exercises: routine.exercises || [],
        hasRestBetweenExercises: routine.hasRestBetweenExercises !== undefined ? routine.hasRestBetweenExercises : true
      });
    } else {
      setForm({
        name: '',
        description: '',
        assignmentType: 'general',
        classId: '',
        memberIds: [],
        exercises: [],
        hasRestBetweenExercises: true
      });
    }
    setMemberSearch('');
  }, [routine, isOpen]);

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

  const addExercise = () => {
    setForm(prev => ({
      ...prev,
      exercises: [...prev.exercises, { exerciseId: '', sets: 3, reps: '10', rest: '60', restDuration: 60, notes: '' }]
    }));
  };

  const updateExercise = (index, field, value) => {
    setForm(prev => ({ 
      ...prev, 
      exercises: prev.exercises.map((ex, i) => i === index ? { ...ex, [field]: value } : ex) 
    }));
  };

  const removeExercise = (index) => {
    setForm(prev => ({ 
      ...prev, 
      exercises: prev.exercises.filter((_, i) => i !== index) 
    }));
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
    <Modal isOpen={isOpen} onClose={onClose} title={routine ? 'Editar Rutina' : 'Nueva Rutina'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
          label="Nombre *" 
          value={form.name} 
          onChange={e => setForm({ ...form, name: e.target.value })} 
          placeholder="Ej: Full Body, Piernas, Upper..."
          required 
        />
        
        <Textarea 
          label="Descripción" 
          value={form.description} 
          onChange={e => setForm({ ...form, description: e.target.value })} 
          placeholder="Descripción opcional de la rutina"
          rows={2} 
        />

        <Select 
          label="Asignar a" 
          value={form.assignmentType} 
          onChange={e => setForm({ ...form, assignmentType: e.target.value, classId: '', memberIds: [] })} 
          options={[
            { value: 'general', label: '🌐 General (todos la ven)' }, 
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
            
            <input
              type="text"
              value={memberSearch}
              onChange={e => setMemberSearch(e.target.value)}
              placeholder="Buscar alumno..."
              className="w-full px-3 py-2 mb-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            />
            
            <div className="max-h-40 overflow-y-auto space-y-1 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
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

        {/* Opción de descanso entre ejercicios */}
        <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.hasRestBetweenExercises}
              onChange={e => setForm({ ...form, hasRestBetweenExercises: e.target.checked })}
              className="w-5 h-5"
            />
            <div>
              <p className="font-medium text-white">Incluir descanso entre ejercicios</p>
              <p className="text-xs text-gray-400 mt-1">
                Configurá un tiempo de descanso después de cada ejercicio. Se mostrará una cuenta regresiva durante el descanso.
              </p>
            </div>
          </label>
        </div>

        {/* Ejercicios */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-300">
              Ejercicios ({form.exercises.length})
            </label>
            <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={addExercise}>
              Agregar
            </Button>
          </div>
          
          {exercises.length === 0 && (
            <Card className="bg-yellow-500/10 border-yellow-500/30 mb-2">
              <p className="text-yellow-400 text-sm">
                No hay ejercicios cargados. Agregá ejercicios desde la sección correspondiente.
              </p>
            </Card>
          )}
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {form.exercises.map((ex, idx) => (
              <div key={idx} className="p-3 bg-gray-800/50 rounded-xl space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-sm font-bold text-blue-400">
                    {idx + 1}
                  </div>
                  <Select
                    value={ex.exerciseId}
                    onChange={e => updateExercise(idx, 'exerciseId', e.target.value)}
                    options={[
                      { value: '', label: 'Seleccionar ejercicio...' },
                      ...exercises.map(e => ({ value: e.id, label: e.name }))
                    ]}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeExercise(idx)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Series</label>
                    <Input
                      type="number"
                      value={ex.sets}
                      onChange={e => updateExercise(idx, 'sets', e.target.value)}
                      placeholder="3"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Reps</label>
                    <Input
                      value={ex.reps}
                      onChange={e => updateExercise(idx, 'reps', e.target.value)}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Desc entre series (s)</label>
                    <Input
                      type="number"
                      value={ex.rest}
                      onChange={e => updateExercise(idx, 'rest', e.target.value)}
                      placeholder="60"
                    />
                  </div>
                </div>
                {form.hasRestBetweenExercises && (
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Descanso después del ejercicio (segundos)</label>
                    <Input
                      type="number"
                      value={ex.restDuration || 60}
                      onChange={e => updateExercise(idx, 'restDuration', e.target.value)}
                      placeholder="60"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tiempo de descanso antes del siguiente ejercicio
                    </p>
                  </div>
                )}
                <Input
                  value={ex.notes || ''}
                  onChange={e => updateExercise(idx, 'notes', e.target.value)}
                  placeholder="Notas (opcional)"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
};

const ViewRoutineModal = ({ isOpen, onClose, routine, exercises, getClassName, getMemberNames, members, onStartTimer }) => {
  if (!routine) return null;

  const getExerciseName = (id) => exercises.find(e => e.id === id)?.name || 'Ejercicio';
  const assignedMembers = routine.memberIds?.map(id => members.find(m => m.id === id)).filter(Boolean) || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={routine.name} size="lg">
      <div className="space-y-4">
        {routine.description && (
          <p className="text-gray-400">{routine.description}</p>
        )}

        {/* Botón para iniciar con timer */}
        {routine.exercises && routine.exercises.length > 0 && (
          <Button
            variant="primary"
            icon={Play}
            onClick={onStartTimer}
            className="w-full"
          >
            Iniciar Rutina con Timer
          </Button>
        )}

        {/* Ejercicios */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-300">{routine.exercises?.length || 0} ejercicios</p>
          {routine.exercises?.map((ex, idx) => (
            <div key={idx} className="flex items-center gap-4 p-3 bg-gray-800 rounded-xl">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-sm font-bold text-blue-400">
                {idx + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium">{getExerciseName(ex.exerciseId)}</p>
                <p className="text-sm text-gray-400">
                  {ex.sets} series × {ex.reps} reps • {ex.rest}s descanso
                </p>
                {ex.notes && <p className="text-xs text-gray-500 mt-1">{ex.notes}</p>}
                {routine.hasRestBetweenExercises && ex.restDuration && (
                  <p className="text-xs text-yellow-400 mt-1">
                    Descanso después: {ex.restDuration}s
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Asignación */}
        <div className="pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 mb-2">Asignación:</p>
          {routine.assignmentType === 'class' && (
            <div className="flex items-center gap-2">
              <Users size={14} className="text-gray-400" />
              <span className="text-sm">{getClassName(routine.classId)}</span>
            </div>
          )}
          {routine.assignmentType === 'individual' && assignedMembers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {assignedMembers.map(m => (
                <div key={m.id} className="flex items-center gap-2 px-2 py-1 bg-gray-800 rounded-lg">
                  <Avatar name={m.name} size="xs" />
                  <span className="text-sm">{m.name}</span>
                </div>
              ))}
            </div>
          )}
          {(!routine.assignmentType || routine.assignmentType === 'general') && (
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-gray-400" />
              <span className="text-sm">Visible para todos</span>
            </div>
          )}
        </div>
        
        {routine.createdByName && (
          <p className="text-xs text-gray-500">
            Creado por {routine.createdByName}
          </p>
        )}
      </div>
    </Modal>
  );
};

const Routines = () => (<GymRequired><RoutinesContent /></GymRequired>);
export default Routines;
