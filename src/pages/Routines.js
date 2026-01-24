import React, { useState, useEffect } from 'react';
import { Plus, ClipboardList, MoreVertical, Edit, Trash2, Users, Lock, Globe, Dumbbell, Play, Flame, Copy, Clock, Video } from 'lucide-react';
import { Button, Card, Modal, Input, Select, Textarea, SearchInput, EmptyState, LoadingState, ConfirmDialog, Badge, Dropdown, DropdownItem, Avatar, GymRequired, Tabs, Autocomplete } from '../components/Common';
import RoutineTimer from '../components/Common/RoutineTimer';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

const RoutinesContent = () => {
  const { userData, canCreateRoutines, isMiembro } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  
  const [routines, setRoutines] = useState([]);
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [wods, setWods] = useState([]);
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
    setWods([]);
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

    // Cargar WODs
    const wodsQuery = query(collection(db, 'wods'), where('gymId', '==', currentGym.id));
    const unsubWods = onSnapshot(wodsQuery, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => a.name?.localeCompare(b.name));
      setWods(items);
    });

    // Cargar miembros (para profesores/admin)
    if (canEdit) {
      const membersQuery = query(collection(db, 'users'), where('gymId', '==', currentGym.id));
      const unsubMembers = onSnapshot(membersQuery, (snap) => {
        const allMembers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Filtrar solo miembros
        setMembers(allMembers.filter(m => m.roles?.includes('miembro') || !m.roles || m.roles.length === 0));
      });
      return () => { unsubRoutines(); unsubClasses(); unsubEx(); unsubWods(); unsubMembers(); };
    }

    // Para miembros: cargar inscripciones
    if (isMiembro() && userData?.id) {
      const enrollQuery = query(collection(db, 'enrollments'), where('userId', '==', userData.id));
      const unsubEnroll = onSnapshot(enrollQuery, (snap) => {
        setMyEnrollments(snap.docs.map(d => d.data().classId));
      });
      return () => { unsubRoutines(); unsubClasses(); unsubEx(); unsubWods(); unsubEnroll(); };
    }

    return () => { unsubRoutines(); unsubClasses(); unsubEx(); unsubWods(); };
  }, [currentGym, userData, canEdit, isMiembro]);

  const getVisibleRoutines = () => {
    let visible = routines;

    // Filtrar por visibilidad para miembros
    if (isMiembro()) {
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

  const handleCopy = async (routine) => {
    try {
      // Crear copia de la rutina sin el ID y sin las fechas
      const { id, createdAt, updatedAt, createdBy, createdByName, ...routineCopy } = routine;

      // Agregar "(Copia)" al nombre si no lo tiene
      const newName = routineCopy.name.includes('(Copia)')
        ? routineCopy.name
        : `${routineCopy.name} (Copia)`;

      // Cambiar asignación a general para evitar conflictos
      const newRoutineData = {
        ...routineCopy,
        name: newName,
        assignmentType: 'general',
        classId: '',
        memberIds: [],
        gymId: currentGym.id,
        createdBy: userData.id,
        createdByName: userData.name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'routines'), newRoutineData);
      success('Rutina copiada exitosamente');
    } catch (err) {
      console.error('Error copying routine:', err);
      showError('Error al copiar la rutina');
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
            No hay miembros en este gimnasio. Las rutinas individuales requieren miembros registrados.
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
                  <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                    <DropdownItem icon={Edit} onClick={() => { setSelected(routine); setShowModal(true); }}>Editar</DropdownItem>
                    <DropdownItem icon={Copy} onClick={() => handleCopy(routine)}>Copiar</DropdownItem>
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
              {((routine.exercises && routine.exercises.length > 0) || (routine.wods && routine.wods.length > 0)) && (
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
        wods={wods}
      />
      <ViewRoutineModal
        isOpen={showView}
        onClose={() => { setShowView(false); setSelected(null); }}
        routine={selected}
        exercises={exercises}
        wods={wods}
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
          wods={wods}
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

const RoutineModal = ({ isOpen, onClose, onSave, routine, classes, members, exercises, wods }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    assignmentType: 'general',
    classId: '',
    memberIds: [],
    blocks: [],
    hasRestBetweenExercises: true
  });
  const [loading, setLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('exercises');

  // Migrar rutinas antiguas al formato de bloques
  const migrateToBlocks = (oldRoutine) => {
    if (oldRoutine.blocks && Array.isArray(oldRoutine.blocks)) {
      return oldRoutine.blocks;
    }

    // Si tiene formato antiguo (exercises/wods), crear un bloque por defecto
    const defaultBlock = {
      name: 'Bloque 1',
      type: 'regular',
      exercises: oldRoutine.exercises || [],
      wods: oldRoutine.wods || []
    };

    return [defaultBlock];
  };

  useEffect(() => {
    if (routine) {
      setForm({
        name: routine.name || '',
        description: routine.description || '',
        assignmentType: routine.assignmentType || 'general',
        classId: routine.classId || '',
        memberIds: routine.memberIds || [],
        blocks: migrateToBlocks(routine),
        hasRestBetweenExercises: routine.hasRestBetweenExercises !== undefined ? routine.hasRestBetweenExercises : true
      });
      setCurrentBlockIndex(0);
    } else {
      setForm({
        name: '',
        description: '',
        assignmentType: 'general',
        classId: '',
        memberIds: [],
        blocks: [{ name: 'Bloque 1', type: 'regular', exercises: [], wods: [] }],
        hasRestBetweenExercises: true
      });
      setCurrentBlockIndex(0);
    }
    setMemberSearch('');
    setActiveTab('exercises');
  }, [routine, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    if (form.assignmentType === 'class' && !form.classId) { 
      alert('Seleccioná una clase'); 
      return; 
    }
    if (form.assignmentType === 'individual' && form.memberIds.length === 0) {
      alert('Seleccioná al menos un miembro');
      return;
    }
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  // Funciones para manejar bloques
  const addBlock = () => {
    setForm(prev => ({
      ...prev,
      blocks: [...prev.blocks, {
        name: `Bloque ${prev.blocks.length + 1}`,
        type: 'regular',
        exercises: [],
        wods: []
      }]
    }));
    setCurrentBlockIndex(form.blocks.length);
  };

  const updateBlock = (field, value) => {
    setForm(prev => ({
      ...prev,
      blocks: prev.blocks.map((block, i) =>
        i === currentBlockIndex ? { ...block, [field]: value } : block
      )
    }));
  };

  const removeBlock = (index) => {
    setForm(prev => ({
      ...prev,
      blocks: prev.blocks.filter((_, i) => i !== index)
    }));
    if (currentBlockIndex >= index && currentBlockIndex > 0) {
      setCurrentBlockIndex(currentBlockIndex - 1);
    }
  };

  // Obtener bloque actual
  const currentBlock = form.blocks[currentBlockIndex];

  // Funciones para manejar ejercicios dentro del bloque actual
  const addExercise = () => {
    setForm(prev => ({
      ...prev,
      blocks: prev.blocks.map((block, i) =>
        i === currentBlockIndex
          ? { ...block, exercises: [...block.exercises, { exerciseId: '', sets: 3, reps: '10', rest: '60', restDuration: 60, notes: '', intensity: 100 }] }
          : block
      )
    }));
  };

  const updateExercise = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      blocks: prev.blocks.map((block, i) =>
        i === currentBlockIndex
          ? { ...block, exercises: block.exercises.map((ex, j) => j === index ? { ...ex, [field]: value } : ex) }
          : block
      )
    }));
  };

  const removeExercise = (index) => {
    setForm(prev => ({
      ...prev,
      blocks: prev.blocks.map((block, i) =>
        i === currentBlockIndex
          ? { ...block, exercises: block.exercises.filter((_, j) => j !== index) }
          : block
      )
    }));
  };

  // Funciones para manejar WODs dentro del bloque actual
  const addWod = () => {
    setForm(prev => ({
      ...prev,
      blocks: prev.blocks.map((block, i) =>
        i === currentBlockIndex
          ? { ...block, wods: [...block.wods, { wodId: '', notes: '', restDuration: 60 }] }
          : block
      )
    }));
  };

  const updateWod = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      blocks: prev.blocks.map((block, i) =>
        i === currentBlockIndex
          ? { ...block, wods: block.wods.map((w, j) => j === index ? { ...w, [field]: value } : w) }
          : block
      )
    }));
  };

  const removeWod = (index) => {
    setForm(prev => ({
      ...prev,
      blocks: prev.blocks.map((block, i) =>
        i === currentBlockIndex
          ? { ...block, wods: block.wods.filter((_, j) => j !== index) }
          : block
      )
    }));
  };

  // Funciones para manejar ESDs dentro del bloque actual
  const addEsd = () => {
    setForm(prev => ({
      ...prev,
      blocks: prev.blocks.map((block, i) =>
        i === currentBlockIndex
          ? { ...block, esds: [...(block.esds || []), { esdId: '', notes: '', restDuration: 60 }] }
          : block
      )
    }));
  };

  const updateEsd = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      blocks: prev.blocks.map((block, i) =>
        i === currentBlockIndex
          ? { ...block, esds: block.esds.map((e, j) => j === index ? { ...e, [field]: value } : e) }
          : block
      )
    }));
  };

  const removeEsd = (index) => {
    setForm(prev => ({
      ...prev,
      blocks: prev.blocks.map((block, i) =>
        i === currentBlockIndex
          ? { ...block, esds: (block.esds || []).filter((_, j) => j !== index) }
          : block
      )
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
            { value: 'individual', label: '👤 Miembros específicos' }
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
                Miembros ({form.memberIds.length} seleccionados)
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
              placeholder="Buscar miembro..."
              className="w-full px-3 py-2 mb-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            />
            
            <div className="max-h-40 overflow-y-auto space-y-1 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
              {filteredMembers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  {members.length === 0 ? 'No hay miembros en el gimnasio' : 'No se encontraron miembros'}
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

        {/* Gestión de Bloques */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-300">
              Bloques de la Rutina ({form.blocks.length})
            </label>
            <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={addBlock}>
              Agregar Bloque
            </Button>
          </div>

          {/* Lista de bloques como cuadros */}
          <div className="space-y-4">
            {form.blocks.map((block, idx) => (
              <Card key={idx} className="bg-gray-800/50 border-2 border-gray-700 hover:border-primary/50 transition-colors">
                <div className="space-y-4">
                  {/* Header del bloque */}
                  <div className="space-y-3 pb-3 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold text-primary">{idx + 1}</span>
                        </div>
                        <div className="flex-1">
                          <Input
                            value={block.name}
                            onChange={e => {
                              const newBlocks = [...form.blocks];
                              newBlocks[idx].name = e.target.value;
                              setForm({ ...form, blocks: newBlocks });
                            }}
                            placeholder="Nombre del bloque (ej: Entrada en calor, Principal...)"
                            className="font-semibold"
                          />
                        </div>
                      </div>
                      {form.blocks.length > 1 && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          icon={Trash2}
                          onClick={() => removeBlock(idx)}
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>

                    {/* Tipo de Bloque */}
                    <Select
                      label="Tipo de Bloque"
                      value={block.type || 'regular'}
                      onChange={e => {
                        const newBlocks = [...form.blocks];
                        newBlocks[idx].type = e.target.value;
                        // Inicializar campos ESD si se selecciona
                        if (e.target.value === 'esd') {
                          newBlocks[idx].esdInterval = newBlocks[idx].esdInterval || 60;
                          newBlocks[idx].esdRounds = newBlocks[idx].esdRounds || 10;
                        }
                        setForm({ ...form, blocks: newBlocks });
                      }}
                      options={[
                        { value: 'regular', label: 'Regular' },
                        { value: 'fuerza', label: 'Fuerza' },
                        { value: 'potencia', label: 'Potencia' },
                        { value: 'zona_media', label: 'Zona Media / Core' },
                        { value: 'metcon', label: 'MetCon' },
                        { value: 'gimnasia', label: 'Gimnasia' },
                        { value: 'movilidad', label: 'Movilidad / Activación' },
                        { value: 'esd', label: 'ESD (Every X Seconds/Minutes)' }
                      ]}
                    />

                    {/* Configuración ESD */}
                    {block.type === 'esd' && (
                      <div className="grid grid-cols-2 gap-4">
                        <Select
                          label="Intervalo"
                          value={block.esdInterval || 60}
                          onChange={e => {
                            const newBlocks = [...form.blocks];
                            newBlocks[idx].esdInterval = parseInt(e.target.value);
                            setForm({ ...form, blocks: newBlocks });
                          }}
                          options={[
                            { value: 30, label: '30 segundos' },
                            { value: 45, label: '45 segundos' },
                            { value: 60, label: '1 minuto' },
                            { value: 90, label: '90 segundos' },
                            { value: 120, label: '2 minutos' },
                            { value: 150, label: '2:30 minutos' },
                            { value: 180, label: '3 minutos' },
                            { value: 240, label: '4 minutos' },
                            { value: 300, label: '5 minutos' }
                          ]}
                        />
                        <Input
                          label="Número de Rondas"
                          type="number"
                          min="1"
                          max="60"
                          value={block.esdRounds || 10}
                          onChange={e => {
                            const newBlocks = [...form.blocks];
                            newBlocks[idx].esdRounds = parseInt(e.target.value) || 1;
                            setForm({ ...form, blocks: newBlocks });
                          }}
                          placeholder="10"
                        />
                      </div>
                    )}

                    {block.type === 'esd' && (
                      <Card className="bg-blue-500/10 border-blue-500/30">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-blue-400" />
                          <p className="text-xs text-blue-400">
                            Los ejercicios de este bloque se realizarán cada {block.esdInterval === 60 ? '1 minuto' : `${block.esdInterval} segundos`} durante {block.esdRounds || 10} rondas
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Tabs para Ejercicios, WODs y ESDs dentro del bloque */}
                  <Tabs
                    tabs={[
                      { id: 'exercises', label: 'Ejercicios', icon: Dumbbell },
                      { id: 'wods', label: 'WODs', icon: Flame },
                      { id: 'esds', label: 'ESDs', icon: Clock }
                    ]}
                    activeTab={currentBlockIndex === idx ? activeTab : 'exercises'}
                    onChange={(tab) => {
                      setCurrentBlockIndex(idx);
                      setActiveTab(tab);
                    }}
                  />

                  {/* Ejercicios */}
                  {currentBlockIndex === idx && activeTab === 'exercises' && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-300">
                          Ejercicios ({block.exercises.length})
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
                        {block.exercises.map((ex, exIdx) => (
                          <div key={exIdx} className="p-3 bg-gray-700/50 rounded-xl space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-sm font-bold text-blue-400">
                                {exIdx + 1}
                              </div>
                              <Autocomplete
                                value={ex.exerciseId}
                                onChange={value => updateExercise(exIdx, 'exerciseId', value)}
                                options={exercises.map(e => ({ value: e.id, label: e.name }))}
                                placeholder="Buscar ejercicio..."
                                displayField="label"
                                valueField="value"
                                className="flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => removeExercise(exIdx)}
                                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              <div>
                                <label className="text-xs text-gray-400 mb-1 block">Series</label>
                                <Input
                                  type="number"
                                  value={ex.sets}
                                  onChange={e => updateExercise(exIdx, 'sets', e.target.value)}
                                  placeholder="3"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-400 mb-1 block">Reps</label>
                                <Input
                                  value={ex.reps}
                                  onChange={e => updateExercise(exIdx, 'reps', e.target.value)}
                                  placeholder="10"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-400 mb-1 block">Desc series (s)</label>
                                <Input
                                  type="number"
                                  value={ex.rest}
                                  onChange={e => updateExercise(exIdx, 'rest', e.target.value)}
                                  placeholder="60"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-400 mb-1 block">Intensidad %</label>
                                <Input
                                  type="number"
                                  value={ex.intensity || 100}
                                  onChange={e => updateExercise(exIdx, 'intensity', e.target.value)}
                                  placeholder="100"
                                  min="1"
                                  max="100"
                                />
                              </div>
                            </div>
                            {form.hasRestBetweenExercises && (
                              <div>
                                <label className="text-xs text-gray-400 mb-1 block">Descanso después del ejercicio (segundos)</label>
                                <Input
                                  type="number"
                                  value={ex.restDuration || 60}
                                  onChange={e => updateExercise(exIdx, 'restDuration', e.target.value)}
                                  placeholder="60"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Tiempo de descanso antes del siguiente ejercicio
                                </p>
                              </div>
                            )}
                            <Input
                              value={ex.notes || ''}
                              onChange={e => updateExercise(exIdx, 'notes', e.target.value)}
                              placeholder="Notas (opcional)"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* WODs */}
                  {currentBlockIndex === idx && activeTab === 'wods' && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-300">
                          WODs ({block.wods.length})
                        </label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={Clock}
                            onClick={() => window.open('/esds', '_blank')}
                            title="Abrir página de ESDs"
                          >
                            ESDs
                          </Button>
                          <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={addWod}>
                            Agregar
                          </Button>
                        </div>
                      </div>

                      {wods.length === 0 && (
                        <Card className="bg-yellow-500/10 border-yellow-500/30 mb-2">
                          <p className="text-yellow-400 text-sm">
                            No hay WODs cargados. Agregá WODs desde la sección correspondiente.
                          </p>
                        </Card>
                      )}

                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {block.wods.map((wod, wodIdx) => (
                          <div key={wodIdx} className="p-3 bg-gray-700/50 rounded-xl space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center text-sm font-bold text-orange-400">
                                {wodIdx + 1}
                              </div>
                              <Select
                                value={wod.wodId}
                                onChange={e => updateWod(wodIdx, 'wodId', e.target.value)}
                                options={[
                                  { value: '', label: 'Seleccionar WOD...' },
                                  ...wods.map(w => ({ value: w.id, label: w.name }))
                                ]}
                                className="flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => removeWod(wodIdx)}
                                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            {form.hasRestBetweenExercises && (
                              <div>
                                <label className="text-xs text-gray-400 mb-1 block">Descanso después del WOD (segundos)</label>
                                <Input
                                  type="number"
                                  value={wod.restDuration || 60}
                                  onChange={e => updateWod(wodIdx, 'restDuration', e.target.value)}
                                  placeholder="60"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Tiempo de descanso antes del siguiente elemento
                                </p>
                              </div>
                            )}
                            <Input
                              value={wod.notes || ''}
                              onChange={e => updateWod(wodIdx, 'notes', e.target.value)}
                              placeholder="Notas (opcional)"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ESDs */}
                  {currentBlockIndex === idx && activeTab === 'esds' && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-300">
                          ESDs ({(block.esds || []).length})
                        </label>
                        <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={addEsd}>
                          Agregar
                        </Button>
                      </div>

                      {wods.filter(w => w.type === 'esd').length === 0 && (
                        <Card className="bg-yellow-500/10 border-yellow-500/30 mb-2">
                          <p className="text-yellow-400 text-sm">
                            No hay ESDs cargados. Agregá ESDs desde la sección correspondiente.
                          </p>
                        </Card>
                      )}

                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {(block.esds || []).map((esd, esdIdx) => (
                          <div key={esdIdx} className="p-3 bg-gray-700/50 rounded-xl space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-sm font-bold text-purple-400">
                                {esdIdx + 1}
                              </div>
                              <Select
                                value={esd.esdId}
                                onChange={e => updateEsd(esdIdx, 'esdId', e.target.value)}
                                options={[
                                  { value: '', label: 'Seleccionar ESD...' },
                                  ...wods.filter(w => w.type === 'esd').map(w => ({ value: w.id, label: w.name }))
                                ]}
                                className="flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => removeEsd(esdIdx)}
                                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            {form.hasRestBetweenExercises && (
                              <div>
                                <label className="text-xs text-gray-400 mb-1 block">Descanso después del ESD (segundos)</label>
                                <Input
                                  type="number"
                                  value={esd.restDuration || 60}
                                  onChange={e => updateEsd(esdIdx, 'restDuration', e.target.value)}
                                  placeholder="60"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Tiempo de descanso antes del siguiente elemento
                                </p>
                              </div>
                            )}
                            <Input
                              value={esd.notes || ''}
                              onChange={e => updateEsd(esdIdx, 'notes', e.target.value)}
                              placeholder="Notas (opcional)"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
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

const ViewRoutineModal = ({ isOpen, onClose, routine, exercises, wods, getClassName, getMemberNames, members, onStartTimer }) => {
  const [showNoVideoWarning, setShowNoVideoWarning] = useState(false);

  if (!routine) return null;

  const getExerciseName = (id) => exercises.find(e => e.id === id)?.name || 'Ejercicio';
  const getExerciseData = (id) => exercises.find(e => e.id === id);
  const getWodName = (id) => wods.find(w => w.id === id)?.name || 'WOD';
  const assignedMembers = routine.memberIds?.map(id => members.find(m => m.id === id)).filter(Boolean) || [];

  // Soportar tanto formato antiguo como nuevo con bloques
  const blocks = routine.blocks || [
    {
      name: 'Rutina',
      type: 'regular',
      exercises: routine.exercises || [],
      wods: routine.wods || []
    }
  ];

  const hasContent = blocks.some(b => (b.exercises?.length > 0 || b.wods?.length > 0));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={routine.name} size="lg">
      <div className="space-y-4">
        {routine.description && (
          <p className="text-gray-400">{routine.description}</p>
        )}

        {/* Botón para iniciar con timer */}
        {hasContent && (
          <Button
            variant="primary"
            icon={Play}
            onClick={onStartTimer}
            className="w-full"
          >
            Iniciar Rutina con Timer
          </Button>
        )}

        {/* Bloques */}
        {blocks.map((block, blockIdx) => (
          <div key={blockIdx} className="space-y-3">
            {blocks.length > 1 && (
              <div className="flex items-center gap-2 pb-2 border-b border-gray-700">
                <div className="px-3 py-1 bg-primary/20 rounded-lg">
                  <p className="text-sm font-bold text-primary">{block.name}</p>
                </div>
              </div>
            )}

            {/* Ejercicios del bloque */}
            {block.exercises && block.exercises.length > 0 && (
              <div className="space-y-2">
                {blocks.length === 1 && (
                  <p className="text-sm font-medium text-gray-300">
                    <Dumbbell size={16} className="inline mr-2" />
                    Ejercicios ({block.exercises.length})
                  </p>
                )}
                {block.exercises.map((ex, idx) => {
                  const exerciseData = getExerciseData(ex.exerciseId);
                  return (
                    <div key={idx} className="p-3 bg-gray-800 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-sm font-bold text-blue-400">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{getExerciseName(ex.exerciseId)}</p>
                          <p className="text-sm text-gray-400">
                            {ex.sets} series × {ex.reps} reps • {ex.rest}s descanso
                            {ex.intensity && ex.intensity !== 100 && <span className="text-yellow-400"> • {ex.intensity}% intensidad</span>}
                          </p>
                          {ex.notes && <p className="text-xs text-gray-500 mt-1">{ex.notes}</p>}
                          {routine.hasRestBetweenExercises && ex.restDuration && (
                            <p className="text-xs text-yellow-400 mt-1">
                              Descanso después: {ex.restDuration}s
                            </p>
                          )}
                        </div>
                      </div>
                      {/* Botón de video */}
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        {exerciseData?.videoUrl ? (
                          <a
                            href={exerciseData.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary/20 text-primary hover:bg-primary/30 rounded-lg transition-colors text-sm font-medium"
                          >
                            <Video size={16} />
                            Ver Video del Ejercicio
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowNoVideoWarning(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-700/50 text-gray-400 hover:bg-gray-700 rounded-lg transition-colors text-sm w-full"
                          >
                            <Video size={16} />
                            Ver Video del Ejercicio
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* WODs del bloque */}
            {block.wods && block.wods.length > 0 && (
              <div className="space-y-2">
                {blocks.length === 1 && (
                  <p className="text-sm font-medium text-gray-300">
                    <Flame size={16} className="inline mr-2" />
                    WODs ({block.wods.length})
                  </p>
                )}
                {block.wods.map((wod, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-gray-800 rounded-xl">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center text-sm font-bold text-orange-400">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{getWodName(wod.wodId)}</p>
                      {wod.notes && <p className="text-xs text-gray-500 mt-1">{wod.notes}</p>}
                      {routine.hasRestBetweenExercises && wod.restDuration && (
                        <p className="text-xs text-yellow-400 mt-1">
                          Descanso después: {wod.restDuration}s
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

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

      {/* Modal de advertencia: Video no disponible */}
      <Modal isOpen={showNoVideoWarning} onClose={() => setShowNoVideoWarning(false)} title="Video no disponible" size="sm">
        <div className="space-y-4">
          <div className="w-20 h-20 mx-auto bg-gray-700/50 rounded-full flex items-center justify-center">
            <Video className="text-gray-400" size={40} />
          </div>
          <div className="text-center">
            <p className="text-gray-300 mb-2">
              Este ejercicio no tiene un video de demostración cargado.
            </p>
            <p className="text-sm text-gray-400">
              Contactá a tu entrenador para que agregue un enlace de video para este ejercicio.
            </p>
          </div>
          <Button onClick={() => setShowNoVideoWarning(false)} className="w-full">
            Entendido
          </Button>
        </div>
      </Modal>
    </Modal>
  );
};

const Routines = () => (<GymRequired><RoutinesContent /></GymRequired>);
export default Routines;
