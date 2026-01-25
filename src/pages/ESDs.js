import React, { useState, useEffect } from 'react';
import { Plus, Clock, MoreVertical, Edit, Trash2, Users, Lock, Globe, Dumbbell, X } from 'lucide-react';
import { Button, Card, Modal, Input, Select, Textarea, SearchInput, EmptyState, LoadingState, ConfirmDialog, Badge, Dropdown, DropdownItem, Avatar, GymRequired } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ESD_INTERVALS, WOD_TYPES } from '../utils/constants';

const ESDsContent = () => {
  const { userData, canCreateRoutines, isMiembro } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();

  const [esds, setEsds] = useState([]);
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selected, setSelected] = useState(null);

  const canEdit = canCreateRoutines();

  // Reset estados cuando cambia el gimnasio
  useEffect(() => {
    setEsds([]);
    setClasses([]);
    setMembers([]);
    setExercises([]);
    setMyEnrollments([]);
    setLoading(true);
    setSearch('');
    setFilter('all');
    setTypeFilter('all');
  }, [currentGym?.id]);

  useEffect(() => {
    if (!currentGym?.id) {
      setEsds([]);
      setLoading(false);
      return;
    }

    // Cargar ESDs (WODs de tipo esd)
    const esdsQuery = query(
      collection(db, 'wods'),
      where('gymId', '==', currentGym.id),
      where('type', '==', 'esd')
    );
    const unsubEsds = onSnapshot(esdsQuery, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      setEsds(items);
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

    // Cargar miembros (para profesores/admin que pueden asignar)
    if (canEdit) {
      const membersQuery = query(collection(db, 'users'), where('gymId', '==', currentGym.id));
      const unsubMembers = onSnapshot(membersQuery, (snap) => {
        // Filtrar solo alumnos
        const allMembers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMembers(allMembers.filter(m => m.roles?.includes('alumno') || !m.roles || m.roles.length === 0));
      });
      return () => { unsubEsds(); unsubClasses(); unsubEx(); unsubMembers(); };
    }

    // Para alumnos: cargar sus inscripciones
    if (isMiembro() && userData?.id) {
      const enrollQuery = query(collection(db, 'enrollments'), where('userId', '==', userData.id));
      const unsubEnroll = onSnapshot(enrollQuery, (snap) => {
        setMyEnrollments(snap.docs.map(d => d.data().classId));
      });
      return () => { unsubEsds(); unsubClasses(); unsubEx(); unsubEnroll(); };
    }

    return () => { unsubEsds(); unsubClasses(); unsubEx(); };
  }, [currentGym, userData, canEdit, isMiembro]);

  const getVisibleEsds = () => {
    let visible = esds;

    // Filtrar por visibilidad para alumnos
    if (isMiembro()) {
      visible = esds.filter(e => {
        if (e.assignmentType === 'individual' && e.memberIds?.includes(userData.id)) return true;
        if (e.assignmentType === 'class' && myEnrollments.includes(e.classId)) return true;
        if (!e.assignmentType || e.assignmentType === 'general') return true;
        return false;
      });
    }

    // Filtro de búsqueda
    if (search) {
      visible = visible.filter(e =>
        e.name?.toLowerCase().includes(search.toLowerCase()) ||
        e.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filtro de tipo de ESD
    if (typeFilter !== 'all') {
      visible = visible.filter(e => e.type === typeFilter);
    }

    // Filtro de asignación
    if (filter !== 'all') {
      if (filter === 'general') visible = visible.filter(e => !e.assignmentType || e.assignmentType === 'general');
      if (filter === 'class') visible = visible.filter(e => e.assignmentType === 'class');
      if (filter === 'individual') visible = visible.filter(e => e.assignmentType === 'individual');
    }

    return visible;
  };

  const handleSave = async (data) => {
    try {
      if (selected) {
        await updateDoc(doc(db, 'wods', selected.id), { ...data, updatedAt: serverTimestamp() });
        success('ESD actualizado');
      } else {
        await addDoc(collection(db, 'wods'), { ...data, type: 'esd', gymId: currentGym.id, createdAt: serverTimestamp() });
        success('ESD creado');
      }
      setShowModal(false);
      setSelected(null);
    } catch (err) {
      showError('Error al guardar el ESD');
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'wods', selected.id));
      success('ESD eliminado');
      setShowDelete(false);
      setSelected(null);
    } catch (err) {
      showError('Error al eliminar el ESD');
      console.error(err);
    }
  };

  const getClassName = (classId) => {
    return classes.find(c => c.id === classId)?.name || 'Sin clase';
  };

  const getMemberNames = (memberIds = []) => {
    if (!memberIds || memberIds.length === 0) return '';
    const names = memberIds.map(id => members.find(m => m.id === id)?.name).filter(Boolean);
    if (names.length === 0) return '';
    if (names.length <= 2) return names.join(', ');
    return `${names[0]} y ${names.length - 1} más`;
  };

  const formatInterval = (seconds) => {
    if (seconds < 60) return `${seconds} segundos`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')} minutos`;
  };

  const getTypeName = (typeId) => {
    return WOD_TYPES.find(t => t.id === typeId)?.name || typeId;
  };

  const visibleEsds = getVisibleEsds();

  if (loading) return <LoadingState />;
  if (!currentGym?.id) return <GymRequired />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">ESDs</h1>
          <p className="text-gray-400">Every Second/Minute Dedicated - Entrenamientos por intervalos</p>
        </div>
        {canEdit && (
          <Button icon={Plus} onClick={() => setShowModal(true)}>
            Crear ESD
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar ESDs..." className="flex-1" />
        <Select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todos los tipos' },
            ...WOD_TYPES.map(t => ({ value: t.id, label: t.name }))
          ]}
          className="sm:w-48"
        />
        <Select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todas las asignaciones' },
            { value: 'general', label: '🌐 Generales' },
            { value: 'class', label: '📅 Por Clase' },
            { value: 'individual', label: '👤 Individuales' }
          ]}
          className="sm:w-48"
        />
      </div>

      {/* Mensaje si no hay alumnos y el usuario quiere crear WOD individual */}
      {canEdit && members.length === 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <p className="text-sm text-yellow-400">
            No hay alumnos en este gimnasio. Los ESDs individuales requieren alumnos registrados.
          </p>
        </Card>
      )}

      {visibleEsds.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No hay ESDs"
          description={esds.length === 0 ? "Creá el primer ESD para tu gimnasio" : "No se encontraron ESDs con esos filtros"}
          action={canEdit && <Button icon={Plus} onClick={() => setShowModal(true)}>Crear ESD</Button>}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {visibleEsds.map(esd => (
            <Card
              key={esd.id}
              className="hover:border-gray-700 transition-colors cursor-pointer"
              onClick={() => { setSelected(esd); setShowView(true); }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-base mb-1">{esd.name}</h3>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {esd.type && (
                      <Badge className="bg-orange-500/20 text-orange-400">{getTypeName(esd.type)}</Badge>
                    )}
                    {esd.type === 'esd' && esd.esdInterval && esd.esdRounds && (
                      <Badge className="bg-blue-500/20 text-blue-400">
                        <Clock size={10} className="mr-1" />
                        {formatInterval(esd.esdInterval)} × {esd.esdRounds}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    {esd.exercises && esd.exercises.length > 0 && (
                      <span>{esd.exercises.length} ejercicios</span>
                    )}
                  </p>
                </div>
                {canEdit && (
                  <Dropdown trigger={<button type="button" className="p-1.5 hover:bg-gray-700 rounded"><MoreVertical size={16} /></button>}>
                    <DropdownItem icon={Edit} onClick={() => { setSelected(esd); setShowModal(true); }}>Editar</DropdownItem>
                    <DropdownItem icon={Trash2} danger onClick={() => { setSelected(esd); setShowDelete(true); }}>Eliminar</DropdownItem>
                  </Dropdown>
                )}
              </div>

              {esd.exercises && esd.exercises.length > 0 && (
                <div className="space-y-1 text-sm text-gray-300 mb-3">
                  {esd.exercises.slice(0, 3).map((ex, idx) => {
                    const exercise = exercises.find(e => e.id === ex.exerciseId);
                    return (
                      <div key={idx}>
                        {exercise?.name || 'Ejercicio'} {ex.reps && `× ${ex.reps}`}
                      </div>
                    );
                  })}
                  {esd.exercises.length > 3 && (
                    <span className="text-xs text-gray-500">+{esd.exercises.length - 3} más</span>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <ESDModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelected(null); }}
        onSave={handleSave}
        esd={selected}
        classes={classes}
        members={members}
        exercises={exercises}
      />
      <ViewESDModal
        isOpen={showView}
        onClose={() => { setShowView(false); setSelected(null); }}
        esd={selected}
        getClassName={getClassName}
        getMemberNames={getMemberNames}
        members={members}
        exercises={exercises}
        formatInterval={formatInterval}
      />
      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Eliminar ESD"
        message={`¿Eliminar "${selected?.name}"?`}
        confirmText="Eliminar"
      />
    </div>
  );
};

const ESDModal = ({ isOpen, onClose, onSave, esd, classes, members, exercises }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'esd',
    esdInterval: 60,
    esdRounds: 5,
    esdRest: 90,
    timeLimit: '',
    exercises: [],
    assignmentType: 'general',
    classId: '',
    memberIds: []
  });
  const [loading, setLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  useEffect(() => {
    if (esd) {
      setForm({
        name: esd.name || '',
        description: esd.description || '',
        type: esd.type || 'esd',
        esdInterval: esd.esdInterval || 60,
        esdRounds: esd.esdRounds || 5,
        esdRest: esd.esdRest || 90,
        timeLimit: esd.timeLimit || '',
        exercises: esd.exercises || [],
        assignmentType: esd.assignmentType || 'general',
        classId: esd.classId || '',
        memberIds: esd.memberIds || []
      });
    } else {
      setForm({
        name: '',
        description: '',
        type: 'esd',
        esdInterval: 60,
        esdRounds: 5,
        esdRest: 90,
        timeLimit: '',
        exercises: [],
        assignmentType: 'general',
        classId: '',
        memberIds: []
      });
    }
  }, [esd, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  const toggleMember = (memberId) => {
    setForm(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(memberId)
        ? prev.memberIds.filter(id => id !== memberId)
        : [...prev.memberIds, memberId]
    }));
  };

  const selectAllMembers = () => {
    setForm(prev => ({ ...prev, memberIds: members.map(m => m.id) }));
  };

  const clearMembers = () => {
    setForm(prev => ({ ...prev, memberIds: [] }));
  };

  // Funciones para manejar ejercicios
  const addExercise = () => {
    setForm(prev => ({
      ...prev,
      exercises: [...prev.exercises, { exerciseId: '', reps: '', weight: '', notes: '' }]
    }));
  };

  const updateExercise = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) =>
        i === index ? { ...ex, [field]: value } : ex
      )
    }));
  };

  const removeExercise = (index) => {
    setForm(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const filteredMembers = members.filter(m =>
    m.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={esd ? 'Editar ESD' : 'Nuevo ESD'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre *"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="E.g. E1MOM 10, E45S 12, etc."
          required
        />

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

        {/* Configuración ESD - Intervalos de Potencia/Capacidad */}
        {form.type === 'esd' && (
          <Card className="bg-cyan-500/10 border-cyan-500/30">
            <h4 className="text-sm font-medium text-cyan-400 mb-3 flex items-center gap-2">
              <Clock size={16} />
              ESD - Intervalos de Potencia/Capacidad
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Series/Sets *"
                type="number"
                min="1"
                max="20"
                value={form.esdRounds}
                onChange={e => setForm({ ...form, esdRounds: parseInt(e.target.value) || 1 })}
                placeholder="5"
                required
              />
              <Input
                label="Descanso entre series (seg) *"
                type="number"
                min="10"
                max="600"
                value={form.esdRest}
                onChange={e => setForm({ ...form, esdRest: parseInt(e.target.value) || 90 })}
                placeholder="90"
                required
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              ✓ Para carrera, remo, Wattbike, etc.<br/>
              ✓ Resultado esperado: Tiempos o distancias por serie
            </p>
          </Card>
        )}

        <Textarea
          label="Descripción / Movimientos *"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          rows={5}
          placeholder="Ejemplo:
5 Thrusters (43/30 kg)
10 Pull-ups
15 Air Squats"
          required
        />

        {/* Ejercicios */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Ejercicios ({form.exercises.length})</label>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              icon={Plus}
              onClick={addExercise}
              disabled={exercises.length === 0}
            >
              Agregar
            </Button>
          </div>

          {exercises.length === 0 && (
            <p className="text-sm text-yellow-500 mb-2">
              No hay ejercicios. Creá ejercicios primero.
            </p>
          )}

          <div className="space-y-2">
            {form.exercises.map((ex, idx) => (
              <div key={idx} className="flex gap-2 items-start p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                <span className="text-gray-500 text-sm mt-2">{idx + 1}.</span>
                <div className="flex-1 space-y-2">
                  <Select
                    value={ex.exerciseId}
                    onChange={e => updateExercise(idx, 'exerciseId', e.target.value)}
                    options={[
                      { value: '', label: 'Seleccionar ejercicio...' },
                      ...exercises.map(e => ({ value: e.id, label: e.name }))
                    ]}
                    required
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={ex.reps}
                      onChange={e => updateExercise(idx, 'reps', e.target.value)}
                      placeholder="Reps"
                    />
                    <Input
                      value={ex.weight}
                      onChange={e => updateExercise(idx, 'weight', e.target.value)}
                      placeholder="Peso"
                    />
                    <Input
                      value={ex.notes}
                      onChange={e => updateExercise(idx, 'notes', e.target.value)}
                      placeholder="Notas"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeExercise(idx)}
                  className="p-1.5 text-gray-500 hover:text-red-400 rounded mt-2"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <Textarea
          label="Descripción / Notas generales"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Información adicional sobre el ESD, escalas generales, etc."
          rows={3}
        />

        <Select
          label="Asignación"
          value={form.assignmentType}
          onChange={e => setForm({ ...form, assignmentType: e.target.value, classId: '', memberIds: [] })}
          options={[
            { value: 'general', label: 'General (todos pueden verlo)' },
            { value: 'class', label: 'Para una clase específica' },
            { value: 'individual', label: 'Para personas específicas' }
          ]}
        />

        {form.assignmentType === 'class' && (
          <Select
            label="Clase"
            value={form.classId}
            onChange={e => setForm({ ...form, classId: e.target.value })}
            options={classes.map(c => ({ value: c.id, label: c.name }))}
          />
        )}

        {form.assignmentType === 'individual' && (
          <div>
            <label className="block text-sm font-medium mb-2">Alumnos</label>
            <div className="flex gap-2 mb-2">
              <Button type="button" size="sm" variant="secondary" onClick={selectAllMembers}>Todos</Button>
              <Button type="button" size="sm" variant="secondary" onClick={clearMembers}>Ninguno</Button>
            </div>
            <SearchInput
              value={memberSearch}
              onChange={setMemberSearch}
              placeholder="Buscar alumno..."
              className="mb-2"
            />
            <div className="max-h-48 overflow-y-auto border border-gray-700 rounded-xl p-2 space-y-1">
              {filteredMembers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No se encontraron alumnos</p>
              ) : (
                filteredMembers.map(member => (
                  <label key={member.id} className="flex items-center gap-3 p-2 hover:bg-card rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.memberIds.includes(member.id)}
                      onChange={() => toggleMember(member.id)}
                      className="rounded border-gray-600 bg-gray-800 text-primary focus:ring-2 focus:ring-primary"
                    />
                    <Avatar name={member.name} src={member.photoURL} size="xs" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <p className="text-xs text-gray-500 truncate">{member.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
            {form.memberIds.length > 0 && (
              <p className="text-sm text-gray-400 mt-2">{form.memberIds.length} alumno(s) seleccionado(s)</p>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Guardando...' : (esd ? 'Actualizar' : 'Crear')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const ViewESDModal = ({ isOpen, onClose, esd, getClassName, getMemberNames, members, exercises, formatInterval }) => {
  if (!esd) return null;

  const getExerciseName = (exerciseId) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    return exercise?.name || 'Ejercicio';
  };

  const getTypeName = (typeId) => {
    return WOD_TYPES.find(t => t.id === typeId)?.name || typeId;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={esd.name} size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {esd.type && (
            <Badge className="bg-orange-500/20 text-orange-400">{getTypeName(esd.type)}</Badge>
          )}
          {esd.timeLimit && (
            <Badge className="bg-gray-500/20 text-gray-400">
              <Clock size={10} className="mr-1" />{esd.timeLimit}'
            </Badge>
          )}
          {esd.type === 'esd' && esd.esdInterval && esd.esdRounds && (
            <Badge className="bg-blue-500/20 text-blue-400">
              <Clock size={10} className="mr-1" />
              {formatInterval(esd.esdInterval)} × {esd.esdRounds} rondas
            </Badge>
          )}
        </div>

        {esd.description && (
          <div className="bg-gray-800 rounded-xl p-4 whitespace-pre-wrap font-mono text-sm">
            {esd.description}
          </div>
        )}

        {/* Ejercicios */}
        {esd.exercises && esd.exercises.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Ejercicios</h4>
            <div className="space-y-1.5">
              {esd.exercises.map((ex, idx) => (
                <div key={idx} className="flex gap-2 text-sm">
                  <span className="text-gray-500">{idx + 1}.</span>
                  <div>
                    <span>{getExerciseName(ex.exerciseId)}</span>
                    {ex.reps && <span className="text-gray-400"> × {ex.reps}</span>}
                    {ex.weight && <span className="text-gray-400"> @ {ex.weight}</span>}
                    {ex.notes && <span className="text-gray-500 text-xs"> ({ex.notes})</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Asignación</h4>
          {esd.assignmentType === 'individual' && (
            <div className="flex items-center gap-2">
              <Lock size={14} className="text-gray-500" />
              <span className="text-sm">{getMemberNames(esd.memberIds) || 'Sin asignar'}</span>
            </div>
          )}
          {esd.assignmentType === 'class' && (
            <div className="flex items-center gap-2">
              <Users size={14} className="text-gray-500" />
              <span className="text-sm">{getClassName(esd.classId)}</span>
            </div>
          )}
          {(!esd.assignmentType || esd.assignmentType === 'general') && (
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-gray-500" />
              <span className="text-sm">General (todos pueden ver)</span>
            </div>
          )}
        </div>

        {esd.assignmentType === 'individual' && esd.memberIds?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Alumnos asignados ({esd.memberIds.length})</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {esd.memberIds.map(memberId => {
                const member = members.find(m => m.id === memberId);
                if (!member) return null;
                return (
                  <div key={memberId} className="flex items-center gap-2 p-2 bg-card rounded-lg">
                    <Avatar name={member.name} src={member.photoURL} size="xs" />
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

const ESDs = () => {
  return <ESDsContent />;
};

export default ESDs;
