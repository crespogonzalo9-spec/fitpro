import React, { useState, useEffect } from 'react';
import { Plus, Target, MoreVertical, Edit, Trash2, Users, Lock, Clock, Globe, Dumbbell } from 'lucide-react';
import { Button, Card, Modal, Input, Select, Textarea, SearchInput, EmptyState, LoadingState, ConfirmDialog, Badge, Dropdown, DropdownItem, Avatar, GymRequired } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ESD_TYPES } from '../utils/constants';

const ESDsContent = () => {
  const { userData, canCreateRoutines, isOnlyAlumno } = useAuth();
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

  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selected, setSelected] = useState(null);

  const canEdit = canCreateRoutines();

  useEffect(() => {
    setEsds([]);
    setClasses([]);
    setMembers([]);
    setExercises([]);
    setMyEnrollments([]);
    setLoading(true);
    setSearch('');
    setFilter('all');
  }, [currentGym?.id]);

  useEffect(() => {
    if (!currentGym?.id) {
      setEsds([]);
      setLoading(false);
      return;
    }

    const esdsQuery = query(collection(db, 'esds'), where('gymId', '==', currentGym.id));
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

    const classesQuery = query(collection(db, 'classes'), where('gymId', '==', currentGym.id));
    const unsubClasses = onSnapshot(classesQuery, (snap) => {
      setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const exQuery = query(collection(db, 'exercises'), where('gymId', '==', currentGym.id));
    const unsubEx = onSnapshot(exQuery, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => a.name?.localeCompare(b.name));
      setExercises(items);
    });

    if (canEdit) {
      const membersQuery = query(collection(db, 'users'), where('gymId', '==', currentGym.id));
      const unsubMembers = onSnapshot(membersQuery, (snap) => {
        const allMembers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMembers(allMembers.filter(m => m.roles?.includes('alumno') || !m.roles || m.roles.length === 0));
      });
      return () => { unsubEsds(); unsubClasses(); unsubEx(); unsubMembers(); };
    }

    if (isOnlyAlumno() && userData?.id) {
      const enrollQuery = query(collection(db, 'enrollments'), where('userId', '==', userData.id));
      const unsubEnroll = onSnapshot(enrollQuery, (snap) => {
        setMyEnrollments(snap.docs.map(d => d.data().classId));
      });
      return () => { unsubEsds(); unsubClasses(); unsubEx(); unsubEnroll(); };
    }

    return () => { unsubEsds(); unsubClasses(); unsubEx(); };
  }, [currentGym, userData, canEdit, isOnlyAlumno]);

  const getVisibleEsds = () => {
    let visible = esds;

    if (isOnlyAlumno()) {
      visible = esds.filter(e => {
        if (e.assignmentType === 'individual' && e.memberIds?.includes(userData.id)) return true;
        if (e.assignmentType === 'class' && myEnrollments.includes(e.classId)) return true;
        if (!e.assignmentType || e.assignmentType === 'general') return true;
        return false;
      });
    }

    if (filter !== 'all') visible = visible.filter(e => e.assignmentType === filter);

    if (search) {
      const s = search.toLowerCase();
      visible = visible.filter(e =>
        e.name?.toLowerCase().includes(s) ||
        e.description?.toLowerCase().includes(s)
      );
    }

    return visible;
  };

  const handleSave = async (data) => {
    try {
      const esdData = { ...data, gymId: currentGym.id, updatedAt: serverTimestamp() };

      if (selected?.id) {
        await updateDoc(doc(db, 'esds', selected.id), esdData);
        success('ESD actualizado');
      } else {
        await addDoc(collection(db, 'esds'), {
          ...esdData,
          createdBy: userData.id,
          createdByName: userData.name,
          createdAt: serverTimestamp()
        });
        success('ESD creado');
      }
      setShowModal(false);
      setSelected(null);
    } catch (err) {
      console.error('Error saving ESD:', err);
      showError('Error al guardar');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'esds', selected.id));
      success('ESD eliminado');
      setShowDelete(false);
      setSelected(null);
    } catch (err) {
      showError('Error al eliminar');
    }
  };

  const getTypeName = (type) => ESD_TYPES.find(t => t.id === type)?.name || type;
  const getClassName = (classId) => classes.find(c => c.id === classId)?.name || 'Sin clase';
  const getMemberNames = (memberIds) => {
    if (!memberIds || memberIds.length === 0) return '';
    const names = memberIds.map(id => members.find(m => m.id === id)?.name).filter(Boolean);
    return names.length <= 2 ? names.join(', ') : `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  };

  const visibleEsds = getVisibleEsds();

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={Target} title="Sin gimnasio" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">ESDs - Entrenamiento Específico Dirigido</h1>
          <p className="text-gray-400">{visibleEsds.length} ESDs</p>
        </div>
        {canEdit && (
          <Button icon={Plus} onClick={() => { setSelected(null); setShowModal(true); }}>
            Nuevo ESD
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar ESD..." className="flex-1" />
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

      {canEdit && members.length === 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <p className="text-yellow-400 text-sm">
            No hay alumnos en este gimnasio. Los ESDs individuales requieren alumnos registrados.
          </p>
        </Card>
      )}

      {visibleEsds.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No hay ESDs"
          description={esds.length === 0 ? "Creá el primer ESD para tu gimnasio" : "No se encontraron ESDs con esos filtros"}
          action={canEdit && <Button icon={Plus} onClick={() => setShowModal(true)}>Crear ESD</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleEsds.map(esd => (
            <Card key={esd.id} className="hover:border-gray-600 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => { setSelected(esd); setShowView(true); }}
                >
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Target className="text-purple-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{esd.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <Badge className="bg-purple-500/20 text-purple-400">{getTypeName(esd.type)}</Badge>
                      {esd.timeLimit && (
                        <Badge className="bg-gray-500/20 text-gray-400">
                          <Clock size={10} className="mr-1" />{esd.timeLimit}'
                        </Badge>
                      )}
                      {esd.rounds && (
                        <Badge className="bg-gray-500/20 text-gray-400">
                          {esd.rounds} rounds
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {canEdit && (
                  <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                    <DropdownItem icon={Edit} onClick={() => { setSelected(esd); setShowModal(true); }}>Editar</DropdownItem>
                    <DropdownItem icon={Trash2} danger onClick={() => { setSelected(esd); setShowDelete(true); }}>Eliminar</DropdownItem>
                  </Dropdown>
                )}
              </div>

              {esd.description && (
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{esd.description}</p>
              )}

              {esd.exercises && esd.exercises.length > 0 && (
                <div className="text-xs text-gray-500 mb-3">
                  <Dumbbell size={12} className="inline mr-1" />
                  {esd.exercises.length} ejercicios
                </div>
              )}

              <div className="text-xs text-gray-500 flex items-center gap-1">
                {esd.assignmentType === 'individual' && (
                  <>
                    <Lock size={12} />
                    <span>{getMemberNames(esd.memberIds) || 'Sin asignar'}</span>
                  </>
                )}
                {esd.assignmentType === 'class' && (
                  <>
                    <Users size={12} />
                    <span>{getClassName(esd.classId)}</span>
                  </>
                )}
                {(!esd.assignmentType || esd.assignmentType === 'general') && (
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
        exercises={exercises}
        getTypeName={getTypeName}
        getClassName={getClassName}
        getMemberNames={getMemberNames}
        members={members}
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
    type: 'for_time',
    description: '',
    timeLimit: '',
    rounds: '',
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
        type: esd.type || 'for_time',
        description: esd.description || '',
        timeLimit: esd.timeLimit || '',
        rounds: esd.rounds || '',
        exercises: esd.exercises || [],
        assignmentType: esd.assignmentType || 'general',
        classId: esd.classId || '',
        memberIds: esd.memberIds || []
      });
    } else {
      setForm({
        name: '',
        type: 'for_time',
        description: '',
        timeLimit: '',
        rounds: '',
        exercises: [],
        assignmentType: 'general',
        classId: '',
        memberIds: []
      });
    }
    setMemberSearch('');
  }, [esd, isOpen]);

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
      exercises: [...prev.exercises, { exerciseId: '', reps: '10', notes: '' }]
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
    <Modal isOpen={isOpen} onClose={onClose} title={esd ? 'Editar ESD' : 'Nuevo ESD'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre *"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="Ej: Fuerza Piernas, Metcon Cardio..."
          required
        />

        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Tipo *"
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value })}
            options={ESD_TYPES.map(t => ({ value: t.id, label: t.name }))}
          />
          <Input
            label="Time Cap (min)"
            type="number"
            value={form.timeLimit}
            onChange={e => setForm({ ...form, timeLimit: e.target.value })}
            placeholder="20"
          />
          <Input
            label="Rondas"
            type="number"
            value={form.rounds}
            onChange={e => setForm({ ...form, rounds: e.target.value })}
            placeholder="5"
          />
        </div>

        <Textarea
          label="Descripción / Notas"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          rows={2}
          placeholder="Descripción opcional del ESD"
        />

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
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-sm font-bold text-purple-400">
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
                  <Input
                    value={ex.reps}
                    onChange={e => updateExercise(idx, 'reps', e.target.value)}
                    placeholder="Reps"
                    className="w-24"
                  />
                  <button
                    type="button"
                    onClick={() => removeExercise(idx)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <Input
                  value={ex.notes || ''}
                  onChange={e => updateExercise(idx, 'notes', e.target.value)}
                  placeholder="Notas (opcional)"
                />
              </div>
            ))}
          </div>
        </div>

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

const ViewESDModal = ({ isOpen, onClose, esd, exercises, getTypeName, getClassName, getMemberNames, members }) => {
  if (!esd) return null;

  const getExerciseName = (id) => exercises.find(e => e.id === id)?.name || 'Ejercicio';
  const assignedMembers = esd.memberIds?.map(id => members.find(m => m.id === id)).filter(Boolean) || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={esd.name} size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-purple-500/20 text-purple-400">{getTypeName(esd.type)}</Badge>
          {esd.timeLimit && <Badge className="bg-gray-500/20 text-gray-400">{esd.timeLimit} min</Badge>}
          {esd.rounds && <Badge className="bg-gray-500/20 text-gray-400">{esd.rounds} rounds</Badge>}
        </div>

        {esd.description && (
          <p className="text-gray-400">{esd.description}</p>
        )}

        {esd.exercises && esd.exercises.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-300">
              <Dumbbell size={16} className="inline mr-2" />
              Ejercicios ({esd.exercises.length})
            </p>
            {esd.exercises.map((ex, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-gray-800 rounded-xl">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-sm font-bold text-purple-400">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{getExerciseName(ex.exerciseId)}</p>
                  <p className="text-sm text-gray-400">{ex.reps} reps</p>
                  {ex.notes && <p className="text-xs text-gray-500 mt-1">{ex.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 mb-2">Asignación:</p>
          {esd.assignmentType === 'class' && (
            <div className="flex items-center gap-2">
              <Users size={14} className="text-gray-400" />
              <span className="text-sm">{getClassName(esd.classId)}</span>
            </div>
          )}
          {esd.assignmentType === 'individual' && assignedMembers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {assignedMembers.map(m => (
                <div key={m.id} className="flex items-center gap-2 px-2 py-1 bg-gray-800 rounded-lg">
                  <Avatar name={m.name} size="xs" />
                  <span className="text-sm">{m.name}</span>
                </div>
              ))}
            </div>
          )}
          {(!esd.assignmentType || esd.assignmentType === 'general') && (
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-gray-400" />
              <span className="text-sm">Visible para todos</span>
            </div>
          )}
        </div>

        {esd.createdByName && (
          <p className="text-xs text-gray-500">
            Creado por {esd.createdByName}
          </p>
        )}
      </div>
    </Modal>
  );
};

const ESDs = () => (<GymRequired><ESDsContent /></GymRequired>);
export default ESDs;
