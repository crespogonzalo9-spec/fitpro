import React, { useState, useEffect } from 'react';
import { Dumbbell, Plus, Search, Edit, Trash2, Filter, MoreVertical, Zap, Clock, Hash, Weight, Settings } from 'lucide-react';
import { Button, Card, Modal, Input, Textarea, Select, SearchInput, EmptyState, LoadingState, Badge, ConfirmDialog, Dropdown, DropdownItem , GymRequired } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';

const CATEGORIES = [
  { value: 'fuerza', label: 'Fuerza', icon: '💪', color: 'bg-red-500/20 text-red-400' },
  { value: 'cardio', label: 'Cardio', icon: '❤️', color: 'bg-pink-500/20 text-pink-400' },
  { value: 'olimpico', label: 'Olímpico', icon: '🏋️', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'gimnastico', label: 'Gimnástico', icon: '🤸', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'monostructural', label: 'Monostructural', icon: '🏃', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'accesorio', label: 'Accesorio', icon: '🔧', color: 'bg-gray-500/20 text-gray-400' },
  { value: 'movilidad', label: 'Movilidad', icon: '🧘', color: 'bg-green-500/20 text-green-400' },
  { value: 'otro', label: 'Otro', icon: '📦', color: 'bg-slate-500/20 text-slate-400' },
];

const MEASURE_TYPES = [
  { value: 'kg', label: 'Peso (kg)', icon: '🏋️', description: 'Para ejercicios de fuerza' },
  { value: 'reps', label: 'Repeticiones', icon: '🔢', description: 'Para ejercicios sin peso' },
  { value: 'time', label: 'Tiempo', icon: '⏱️', description: 'Para cardio o resistencia' },
  { value: 'distance', label: 'Distancia (m)', icon: '📏', description: 'Para running, remo, etc.' },
  { value: 'calories', label: 'Calorías', icon: '🔥', description: 'Para máquinas de cardio' },
];

const DEFAULT_EQUIPMENT = [
  // Barras
  'Barra olímpica 20kg',
  'Barra olímpica 15kg',
  'Barra EZ',
  'Barra hexagonal',
  'Barra recta corta',

  // Discos
  'Discos olímpicos 1.25kg',
  'Discos olímpicos 2.5kg',
  'Discos olímpicos 5kg',
  'Discos olímpicos 10kg',
  'Discos olímpicos 15kg',
  'Discos olímpicos 20kg',
  'Discos olímpicos 25kg',
  'Bumper plates 10kg',
  'Bumper plates 15kg',
  'Bumper plates 20kg',
  'Bumper plates 25kg',

  // Mancuernas
  'Mancuernas 2kg (par)',
  'Mancuernas 4kg (par)',
  'Mancuernas 6kg (par)',
  'Mancuernas 8kg (par)',
  'Mancuernas 10kg (par)',
  'Mancuernas 12kg (par)',
  'Mancuernas 14kg (par)',
  'Mancuernas 16kg (par)',
  'Mancuernas 18kg (par)',
  'Mancuernas 20kg (par)',
  'Mancuernas ajustables',

  // Kettlebells
  'Kettlebell 4kg',
  'Kettlebell 8kg',
  'Kettlebell 12kg',
  'Kettlebell 16kg',
  'Kettlebell 20kg',
  'Kettlebell 24kg',
  'Kettlebell 28kg',
  'Kettlebell 32kg',

  // Gimnasia
  'Barra fija',
  'Anillas',
  'Paralelas',
  'Cuerda para trepar',
  'Pegboard',

  // Cardio
  'Remo Concept2',
  'Bike',
  'Assault Bike',
  'SkiErg',
  'Cinta de correr',
  'Elíptica',

  // Pliometría
  'Box 50cm',
  'Box 60cm',
  'Box 75cm',
  'Cajón pliométrico',
  'Wall ball 6kg',
  'Wall ball 9kg',
  'Balón medicinal',
  'Slam ball 10kg',
  'Slam ball 15kg',

  // Funcional
  'Soga de saltar',
  'Soga de batalla',
  'Sled',
  'Trineo',
  'Neumático',
  'Sandbag',
  'D-Ball',

  // Bandas y suspensión
  'Banda elástica ligera',
  'Banda elástica media',
  'Banda elástica pesada',
  'Mini banda',
  'TRX',

  // Accesorios
  'Foam roller',
  'Pelota de lacrosse',
  'Abmat',
  'Colchoneta',
  'Barra para dominadas',
  'Dip station',
  'GHD',
  'Reverse hyper',

  // Otros
  'Peso corporal',
  'Chaleco con peso',
  'Cinturón de lastre',
  'Rueda abdominal',
  'Ninguno'
];

const ExercisesContent = () => {
  const { userData, isAdmin, isProfesor, isSysadmin, canManageExercises } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMeasure, setFilterMeasure] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const [equipmentList, setEquipmentList] = useState([]);
  const [showEquipmentManager, setShowEquipmentManager] = useState(false);

  // Solo admin, profesor o sysadmin pueden editar ejercicios
  const canEdit = canManageExercises();

  // Reset estados cuando cambia el gimnasio
  useEffect(() => {
    setExercises([]);
    setLoading(true);
    setSearch('');
    setFilterCategory('all');
    setFilterMeasure('all');
  }, [currentGym?.id]);

  useEffect(() => {
    if (!currentGym?.id) {
      setExercises([]);
      setEquipmentList([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'exercises'),
      where('gymId', '==', currentGym.id)
    );

    const unsubExercises = onSnapshot(q, (snap) => {
      setExercises(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error('Error loading exercises:', err);
      // Fallback sin orderBy si falla por índices
      const qFallback = query(collection(db, 'exercises'), where('gymId', '==', currentGym.id));
      onSnapshot(qFallback, (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => a.name?.localeCompare(b.name));
        setExercises(items);
        setLoading(false);
      });
    });

    // Cargar equipamiento del gimnasio
    const equipmentQuery = query(
      collection(db, 'equipment'),
      where('gymId', '==', currentGym.id)
    );

    const unsubEquipment = onSnapshot(equipmentQuery, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => a.name?.localeCompare(b.name));
      setEquipmentList(items);
    });

    return () => { unsubExercises(); unsubEquipment(); };
  }, [currentGym]);

  const handleSave = async (data) => {
    try {
      if (editMode && selected) {
        await updateDoc(doc(db, 'exercises', selected.id), {
          ...data,
          updatedAt: serverTimestamp(),
          updatedBy: userData.id
        });
        success('Ejercicio actualizado');
      } else {
        await addDoc(collection(db, 'exercises'), {
          ...data,
          gymId: currentGym.id,
          createdAt: serverTimestamp(),
          createdBy: userData.id,
          createdByName: userData.name
        });
        success('Ejercicio creado');
      }
      setShowModal(false);
      setSelected(null);
      setEditMode(false);
    } catch (err) {
      console.error('Error saving exercise:', err);
      showError('Error al guardar');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'exercises', selected.id));
      success('Ejercicio eliminado');
      setShowDelete(false);
      setSelected(null);
    } catch (err) {
      showError('Error al eliminar');
    }
  };

  const openEdit = (exercise) => {
    setSelected(exercise);
    setEditMode(true);
    setShowModal(true);
  };

  const openCreate = () => {
    setSelected(null);
    setEditMode(false);
    setShowModal(true);
  };

  const getFilteredExercises = () => {
    let filtered = exercises;
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(e => e.category === filterCategory);
    }
    
    if (filterMeasure !== 'all') {
      filtered = filtered.filter(e => e.measureType === filterMeasure);
    }
    
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(e => 
        e.name?.toLowerCase().includes(s) || 
        e.description?.toLowerCase().includes(s) ||
        e.equipment?.some(eq => eq.toLowerCase().includes(s))
      );
    }
    
    return filtered;
  };

  const getCategoryInfo = (categoryValue) => {
    return CATEGORIES.find(c => c.value === categoryValue) || CATEGORIES[CATEGORIES.length - 1];
  };

  const getMeasureInfo = (measureValue) => {
    return MEASURE_TYPES.find(m => m.value === measureValue) || MEASURE_TYPES[0];
  };

  const filteredExercises = getFilteredExercises();

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={Dumbbell} title="Sin gimnasio" description="Seleccioná un gimnasio" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ejercicios</h1>
          <p className="text-gray-400">{filteredExercises.length} ejercicios en {currentGym.name}</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button icon={Settings} variant="secondary" onClick={() => setShowEquipmentManager(true)}>
              Gestionar Equipamiento
            </Button>
            <Button icon={Plus} onClick={openCreate}>
              Nuevo Ejercicio
            </Button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput 
          value={search} 
          onChange={setSearch} 
          placeholder="Buscar por nombre, descripción o equipo..." 
          className="flex-1" 
        />
        <Select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          options={[
            { value: 'all', label: 'Todas las categorías' },
            ...CATEGORIES.map(c => ({ value: c.value, label: `${c.icon} ${c.label}` }))
          ]}
          className="w-full sm:w-48"
        />
        <Select
          value={filterMeasure}
          onChange={e => setFilterMeasure(e.target.value)}
          options={[
            { value: 'all', label: 'Todos los tipos' },
            ...MEASURE_TYPES.map(m => ({ value: m.value, label: `${m.icon} ${m.label}` }))
          ]}
          className="w-full sm:w-48"
        />
      </div>

      {filteredExercises.length === 0 ? (
        <EmptyState 
          icon={Dumbbell} 
          title="No hay ejercicios" 
          description={exercises.length === 0 ? "Agregá ejercicios para poder usarlos en rutinas y WODs" : "No se encontraron ejercicios con esos filtros"}
          action={canEdit && exercises.length === 0 && <Button icon={Plus} onClick={openCreate}>Crear Ejercicio</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredExercises.map(exercise => {
            const category = getCategoryInfo(exercise.category);
            const measure = getMeasureInfo(exercise.measureType);
            
            return (
              <Card key={exercise.id} className="hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{exercise.name}</h3>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={category.color}>
                        {category.icon} {category.label}
                      </Badge>
                      <Badge className="bg-slate-500/20 text-slate-300">
                        {measure.icon} {measure.label}
                      </Badge>
                    </div>
                    
                    {exercise.description && (
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">{exercise.description}</p>
                    )}
                    
                    {exercise.equipment && exercise.equipment.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {exercise.equipment.slice(0, 3).map((eq, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-gray-800 rounded text-gray-400">
                            {eq}
                          </span>
                        ))}
                        {exercise.equipment.length > 3 && (
                          <span className="text-xs px-2 py-0.5 bg-gray-800 rounded text-gray-500">
                            +{exercise.equipment.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {canEdit && (
                    <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                      <DropdownItem icon={Edit} onClick={() => openEdit(exercise)}>Editar</DropdownItem>
                      <DropdownItem icon={Trash2} danger onClick={() => { setSelected(exercise); setShowDelete(true); }}>Eliminar</DropdownItem>
                    </Dropdown>
                  )}
                </div>

                {/* Info adicional */}
                {(exercise.videoUrl || exercise.instructions) && (
                  <div className="mt-3 pt-3 border-t border-gray-700 flex gap-2">
                    {exercise.videoUrl && (
                      <a 
                        href={exercise.videoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        📹 Ver video
                      </a>
                    )}
                    {exercise.instructions && (
                      <span className="text-xs text-gray-500">📋 Con instrucciones</span>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <ExerciseModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelected(null); setEditMode(false); }}
        onSave={handleSave}
        exercise={editMode ? selected : null}
        equipmentList={equipmentList}
      />

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Eliminar Ejercicio"
        message={`¿Eliminar "${selected?.name}"? Los PRs asociados no se eliminarán.`}
        confirmText="Eliminar"
      />

      <EquipmentManager
        isOpen={showEquipmentManager}
        onClose={() => setShowEquipmentManager(false)}
        equipmentList={equipmentList}
        gymId={currentGym.id}
      />
    </div>
  );
};

const ExerciseModal = ({ isOpen, onClose, onSave, exercise, equipmentList }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'fuerza',
    measureType: 'kg',
    equipment: [],
    videoUrl: '',
    instructions: '',
    tips: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (exercise) {
      setForm({
        name: exercise.name || '',
        description: exercise.description || '',
        category: exercise.category || 'fuerza',
        measureType: exercise.measureType || 'kg',
        equipment: exercise.equipment || [],
        videoUrl: exercise.videoUrl || '',
        instructions: exercise.instructions || '',
        tips: exercise.tips || ''
      });
    } else {
      setForm({
        name: '',
        description: '',
        category: 'fuerza',
        measureType: 'kg',
        equipment: [],
        videoUrl: '',
        instructions: '',
        tips: ''
      });
    }
  }, [exercise, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  const toggleEquipment = (eq) => {
    setForm(prev => ({
      ...prev,
      equipment: prev.equipment.includes(eq)
        ? prev.equipment.filter(e => e !== eq)
        : [...prev.equipment, eq]
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={exercise ? 'Editar Ejercicio' : 'Nuevo Ejercicio'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
          label="Nombre *" 
          value={form.name} 
          onChange={e => setForm({ ...form, name: e.target.value })} 
          placeholder="Ej: Back Squat, Pull-ups, Row..."
          required
        />

        <Textarea 
          label="Descripción" 
          value={form.description} 
          onChange={e => setForm({ ...form, description: e.target.value })} 
          placeholder="Breve descripción del ejercicio"
          rows={2}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select 
            label="Categoría" 
            value={form.category} 
            onChange={e => setForm({ ...form, category: e.target.value })}
            options={CATEGORIES.map(c => ({ value: c.value, label: `${c.icon} ${c.label}` }))}
          />

          <Select 
            label="Tipo de medición" 
            value={form.measureType} 
            onChange={e => setForm({ ...form, measureType: e.target.value })}
            options={MEASURE_TYPES.map(m => ({ value: m.value, label: `${m.icon} ${m.label}` }))}
          />
        </div>

        <div className="p-3 bg-gray-800/50 rounded-xl">
          <p className="text-sm text-gray-400 mb-1">
            {MEASURE_TYPES.find(m => m.value === form.measureType)?.description}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Equipamiento</label>
          {equipmentList.length === 0 ? (
            <div className="p-4 bg-gray-800/50 rounded-lg text-center">
              <p className="text-sm text-gray-400">No hay equipamiento cargado.</p>
              <p className="text-xs text-gray-500 mt-1">Usá "Gestionar Equipamiento" para cargar equipos.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-gray-800/30 rounded-lg">
              {equipmentList.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleEquipment(item.name)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    form.equipment.includes(item.name)
                      ? 'bg-primary/20 border border-primary text-primary'
                      : 'bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <Input 
          label="URL de video (opcional)" 
          value={form.videoUrl} 
          onChange={e => setForm({ ...form, videoUrl: e.target.value })} 
          placeholder="https://youtube.com/watch?v=..."
        />

        <Textarea 
          label="Instrucciones (opcional)" 
          value={form.instructions} 
          onChange={e => setForm({ ...form, instructions: e.target.value })} 
          placeholder="Pasos para realizar el ejercicio correctamente..."
          rows={3}
        />

        <Textarea 
          label="Tips / Errores comunes (opcional)" 
          value={form.tips} 
          onChange={e => setForm({ ...form, tips: e.target.value })} 
          placeholder="Consejos y errores a evitar..."
          rows={2}
        />

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">
            {exercise ? 'Guardar Cambios' : 'Crear Ejercicio'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const EquipmentManager = ({ isOpen, onClose, equipmentList, gymId }) => {
  const { userData } = useAuth();
  const { success, error: showError } = useToast();
  const [newEquipmentName, setNewEquipmentName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  const handleAdd = async () => {
    if (!newEquipmentName.trim()) return;

    try {
      setLoading(true);
      await addDoc(collection(db, 'equipment'), {
        name: newEquipmentName.trim(),
        gymId,
        createdAt: serverTimestamp(),
        createdBy: userData.id
      });
      success('Equipamiento agregado');
      setNewEquipmentName('');
    } catch (err) {
      showError('Error al agregar equipamiento');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDefaults = async () => {
    if (!gymId || !userData?.id) {
      showError('No se pudo identificar el gimnasio o usuario');
      return;
    }

    try {
      setLoading(true);
      let loadedCount = 0;
      let errorCount = 0;

      // Cargar uno por uno para mejor control
      for (const name of DEFAULT_EQUIPMENT) {
        try {
          await addDoc(collection(db, 'equipment'), {
            name,
            gymId,
            createdAt: serverTimestamp(),
            createdBy: userData.id
          });
          loadedCount++;
        } catch (err) {
          console.error(`Error adding ${name}:`, err);
          errorCount++;
        }
      }

      if (loadedCount > 0) {
        success(`${loadedCount} equipos cargados correctamente${errorCount > 0 ? ` (${errorCount} errores)` : ''}`);
      } else {
        showError('No se pudo cargar ningún equipo. Verificá los permisos de Firebase.');
      }
    } catch (err) {
      console.error('Error loading default equipment:', err);
      showError('Error al cargar equipamiento: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id) => {
    if (!editingName.trim()) return;

    try {
      await updateDoc(doc(db, 'equipment', id), {
        name: editingName.trim(),
        updatedAt: serverTimestamp(),
        updatedBy: userData.id
      });
      success('Equipamiento actualizado');
      setEditingId(null);
      setEditingName('');
    } catch (err) {
      showError('Error al actualizar');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'equipment', selectedEquipment.id));
      success('Equipamiento eliminado');
      setShowDeleteConfirm(false);
      setSelectedEquipment(null);
    } catch (err) {
      showError('Error al eliminar');
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Gestionar Equipamiento" size="lg">
        <div className="space-y-4">
          {/* Agregar nuevo */}
          <div className="flex gap-2">
            <Input
              value={newEquipmentName}
              onChange={e => setNewEquipmentName(e.target.value)}
              placeholder="Nombre del nuevo equipamiento..."
              className="flex-1"
              onKeyPress={e => e.key === 'Enter' && handleAdd()}
            />
            <Button
              icon={Plus}
              onClick={handleAdd}
              disabled={!newEquipmentName.trim() || loading}
            >
              Agregar
            </Button>
          </div>

          {/* Lista de equipamiento */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {equipmentList.length === 0 ? (
              <div className="text-center py-8">
                <EmptyState
                  icon={Dumbbell}
                  title="Sin equipamiento"
                  description="Agregá el equipamiento disponible en tu gimnasio"
                />
                <Button
                  onClick={handleLoadDefaults}
                  loading={loading}
                  className="mt-4"
                >
                  Cargar {DEFAULT_EQUIPMENT.length} equipos predeterminados
                </Button>
              </div>
            ) : (
              equipmentList.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors"
                >
                  {editingId === item.id ? (
                    <>
                      <Input
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        className="flex-1"
                        onKeyPress={e => e.key === 'Enter' && handleUpdate(item.id)}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(item.id)}
                        disabled={!editingName.trim()}
                      >
                        Guardar
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={cancelEdit}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 font-medium">{item.name}</span>
                      <button
                        onClick={() => startEdit(item)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Edit size={16} className="text-gray-400" />
                      </button>
                      <button
                        onClick={() => { setSelectedEquipment(item); setShowDeleteConfirm(true); }}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-gray-700">
            <Button variant="secondary" onClick={onClose} className="w-full">
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setSelectedEquipment(null); }}
        onConfirm={handleDelete}
        title="Eliminar Equipamiento"
        message={`¿Eliminar "${selectedEquipment?.name}"? Los ejercicios que lo usan mantendrán el nombre pero no podrás seleccionarlo en nuevos ejercicios.`}
        confirmText="Eliminar"
      />
    </>
  );
};

const Exercises = () => (<GymRequired><ExercisesContent /></GymRequired>);
export default Exercises;
