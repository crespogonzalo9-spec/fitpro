import React, { useState, useEffect } from 'react';
import { Plus, Trophy, Crown, Medal, Award, MoreVertical, Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { Button, Card, Modal, Input, Select, Textarea, SearchInput, EmptyState, LoadingState, ConfirmDialog, Badge, Avatar, Dropdown, DropdownItem , GymRequired } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { RANKING_TYPES } from '../utils/constants';
import { formatDate } from '../utils/helpers';

const RankingsContent = () => {
  const { userData, canCreateRankings } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  
  const [rankings, setRankings] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [wods, setWods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selected, setSelected] = useState(null);
  const [rankingEntries, setRankingEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const canEdit = canCreateRankings();

  // Reset estados cuando cambia el gimnasio
  useEffect(() => {
    setRankings([]);
    setExercises([]);
    setWods([]);
    setLoading(true);
    setSearch('');
    setRankingEntries([]);
  }, [currentGym?.id]);

  useEffect(() => {
    if (!currentGym?.id) { 
      setRankings([]);
      setExercises([]);
      setWods([]);
      setLoading(false); 
      return; 
    }

    const rankingsQuery = query(collection(db, 'rankings'), where('gymId', '==', currentGym.id));
    const unsubRankings = onSnapshot(rankingsQuery, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => a.name?.localeCompare(b.name));
      setRankings(items);
      setLoading(false);
    });

    const exQuery = query(collection(db, 'exercises'), where('gymId', '==', currentGym.id));
    const unsubEx = onSnapshot(exQuery, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => a.name?.localeCompare(b.name));
      setExercises(items);
    });

    const wodQuery = query(collection(db, 'wods'), where('gymId', '==', currentGym.id));
    const unsubWod = onSnapshot(wodQuery, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => a.name?.localeCompare(b.name));
      setWods(items);
    });

    return () => { unsubRankings(); unsubEx(); unsubWod(); };
  }, [currentGym]);

  const handleSave = async (data) => {
    try {
      if (selected?.id) {
        await updateDoc(doc(db, 'rankings', selected.id), { ...data, updatedAt: serverTimestamp() });
        success('Ranking actualizado');
      } else {
        await addDoc(collection(db, 'rankings'), { 
          ...data, 
          gymId: currentGym.id, 
          createdBy: userData.id,
          createdAt: serverTimestamp() 
        });
        success('Ranking creado');
      }
      setShowModal(false);
      setSelected(null);
    } catch (err) {
      console.error('Error saving ranking:', err);
      showError('Error al guardar');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'rankings', selected.id));
      success('Ranking eliminado');
      setShowDelete(false);
      setSelected(null);
    } catch (err) {
      showError('Error al eliminar');
    }
  };

  const openEdit = (ranking) => {
    setSelected(ranking);
    setShowModal(true);
  };

  const openDelete = (ranking) => {
    setSelected(ranking);
    setShowDelete(true);
  };

  const loadRankingEntries = async (ranking) => {
    setSelected(ranking);
    setShowView(true);
    setLoadingEntries(true);
    setRankingEntries([]);
    
    try {
      // Buscar PRs validados para este ejercicio/wod
      const targetId = ranking.exerciseId || ranking.wodId;
      
      if (!targetId) {
        console.log('No target ID for ranking');
        setRankingEntries([]);
        setLoadingEntries(false);
        return;
      }

      // Query simple sin orderBy para evitar problemas de índices
      const prsQuery = query(
        collection(db, 'prs'),
        where('gymId', '==', currentGym.id),
        where('exerciseId', '==', targetId),
        where('status', '==', 'validated')
      );
      
      const snap = await getDocs(prsQuery);
      let entries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Agrupar por usuario y quedarse con el mejor valor de cada uno
      const bestByUser = {};
      entries.forEach(entry => {
        const existing = bestByUser[entry.userId];
        if (!existing) {
          bestByUser[entry.userId] = entry;
        } else {
          // Comparar según el orden del ranking
          if (ranking.sortOrder === 'asc') {
            // Menor es mejor (tiempo)
            if (entry.value < existing.value) {
              bestByUser[entry.userId] = entry;
            }
          } else {
            // Mayor es mejor (peso, reps)
            if (entry.value > existing.value) {
              bestByUser[entry.userId] = entry;
            }
          }
        }
      });
      
      // Convertir a array y ordenar
      let uniqueEntries = Object.values(bestByUser);
      uniqueEntries.sort((a, b) => {
        if (ranking.sortOrder === 'asc') {
          return a.value - b.value;
        }
        return b.value - a.value;
      });
      
      // Limitar a top 20
      setRankingEntries(uniqueEntries.slice(0, 20));
    } catch (err) {
      console.error('Error loading ranking entries:', err);
      setRankingEntries([]);
    }
    setLoadingEntries(false);
  };

  const getTypeName = (type) => RANKING_TYPES.find(t => t.id === type)?.name || type;
  const getExerciseName = (id) => exercises.find(e => e.id === id)?.name || '';
  const getWodName = (id) => wods.find(w => w.id === id)?.name || '';
  
  const filteredRankings = rankings.filter(r => !search || r.name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={Trophy} title="Sin gimnasio" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rankings</h1>
          <p className="text-gray-400">{filteredRankings.length} rankings en {currentGym.name}</p>
        </div>
        {canEdit && (
          <Button icon={Plus} onClick={() => { setSelected(null); setShowModal(true); }}>
            Nuevo Ranking
          </Button>
        )}
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar ranking..." />

      {/* Info */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <div className="flex items-start gap-3">
          <Trophy className="text-blue-400 mt-1 flex-shrink-0" size={20} />
          <div>
            <p className="text-blue-400 font-medium">¿Cómo funcionan los rankings?</p>
            <p className="text-sm text-gray-400 mt-1">
              Los rankings muestran las mejores marcas <strong>validadas</strong> de cada ejercicio. 
              Solo aparecen PRs que fueron aprobados por un profesor o admin.
            </p>
          </div>
        </div>
      </Card>

      {filteredRankings.length === 0 ? (
        <EmptyState 
          icon={Trophy} 
          title="No hay rankings" 
          description="Creá rankings para ver las mejores marcas de tus alumnos" 
          action={canEdit && <Button icon={Plus} onClick={() => setShowModal(true)}>Crear Ranking</Button>} 
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRankings.map(ranking => (
            <Card 
              key={ranking.id} 
              className="cursor-pointer hover:border-gray-600 transition-colors" 
              onClick={() => loadRankingEntries(ranking)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <Trophy className="text-yellow-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{ranking.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-gray-500/20 text-gray-400">{getTypeName(ranking.type)}</Badge>
                      {ranking.sortOrder === 'asc' ? (
                        <TrendingDown size={14} className="text-green-400" title="Menor es mejor" />
                      ) : (
                        <TrendingUp size={14} className="text-blue-400" title="Mayor es mejor" />
                      )}
                    </div>
                  </div>
                </div>
                {canEdit && (
                  <Dropdown
                    trigger={
                      <button
                        onClick={e => e.stopPropagation()}
                        className="p-2 hover:bg-gray-700 rounded-lg"
                      >
                        <MoreVertical size={18} />
                      </button>
                    }
                  >
                    <DropdownItem icon={Edit} onClick={() => openEdit(ranking)}>
                      Editar
                    </DropdownItem>
                    <DropdownItem icon={Trash2} danger onClick={() => openDelete(ranking)}>
                      Eliminar
                    </DropdownItem>
                  </Dropdown>
                )}
              </div>
              
              {/* Mostrar ejercicio/wod asociado */}
              <p className="mt-3 text-sm text-gray-500">
                {ranking.type === 'exercise' && getExerciseName(ranking.exerciseId)}
                {ranking.type === 'wod' && getWodName(ranking.wodId)}
              </p>
              
              {ranking.description && (
                <p className="mt-2 text-sm text-gray-400">{ranking.description}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      <RankingModal 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); setSelected(null); }} 
        onSave={handleSave} 
        ranking={selected} 
        exercises={exercises} 
        wods={wods} 
      />
      <ViewRankingModal 
        isOpen={showView} 
        onClose={() => { setShowView(false); setSelected(null); setRankingEntries([]); }} 
        ranking={selected} 
        entries={rankingEntries}
        loading={loadingEntries}
        exercises={exercises}
      />
      <ConfirmDialog 
        isOpen={showDelete} 
        onClose={() => setShowDelete(false)} 
        onConfirm={handleDelete} 
        title="Eliminar Ranking" 
        message={`¿Eliminar "${selected?.name}"?`} 
        confirmText="Eliminar" 
      />
    </div>
  );
};

const RankingModal = ({ isOpen, onClose, onSave, ranking, exercises, wods }) => {
  const [form, setForm] = useState({ 
    name: '', 
    type: 'exercise', 
    exerciseId: '', 
    wodId: '', 
    sortOrder: 'desc', 
    description: '' 
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ranking) {
      setForm({ 
        name: ranking.name || '', 
        type: ranking.type || 'exercise', 
        exerciseId: ranking.exerciseId || '', 
        wodId: ranking.wodId || '', 
        sortOrder: ranking.sortOrder || 'desc', 
        description: ranking.description || '' 
      });
    } else {
      setForm({ 
        name: '', 
        type: 'exercise', 
        exerciseId: '', 
        wodId: '', 
        sortOrder: 'desc', 
        description: '' 
      });
    }
  }, [ranking, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    if (form.type === 'exercise' && !form.exerciseId) {
      alert('Seleccioná un ejercicio');
      return;
    }
    if (form.type === 'wod' && !form.wodId) {
      alert('Seleccioná un WOD');
      return;
    }
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  // Auto-completar nombre si se selecciona ejercicio/wod
  const handleExerciseChange = (exerciseId) => {
    const ex = exercises.find(e => e.id === exerciseId);
    setForm(prev => ({ 
      ...prev, 
      exerciseId,
      name: prev.name || (ex ? `Ranking ${ex.name}` : ''),
      // Sugerir orden según tipo de ejercicio
      sortOrder: ex?.measureType === 'time' ? 'asc' : 'desc'
    }));
  };

  const handleWodChange = (wodId) => {
    const wod = wods.find(w => w.id === wodId);
    setForm(prev => ({ 
      ...prev, 
      wodId,
      name: prev.name || (wod ? `Ranking ${wod.name}` : ''),
      sortOrder: 'asc' // Para WODs generalmente menor tiempo es mejor
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={ranking ? 'Editar Ranking' : 'Nuevo Ranking'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select 
          label="Tipo de ranking" 
          value={form.type} 
          onChange={e => setForm({ ...form, type: e.target.value, exerciseId: '', wodId: '' })} 
          options={RANKING_TYPES.map(t => ({ value: t.id, label: t.name }))} 
        />
        
        {form.type === 'exercise' && (
          <Select 
            label="Ejercicio *" 
            value={form.exerciseId} 
            onChange={e => handleExerciseChange(e.target.value)} 
            options={[
              { value: '', label: 'Seleccionar ejercicio...' },
              ...exercises.map(ex => ({ value: ex.id, label: ex.name }))
            ]} 
          />
        )}
        
        {form.type === 'wod' && (
          <Select 
            label="WOD *" 
            value={form.wodId} 
            onChange={e => handleWodChange(e.target.value)} 
            options={[
              { value: '', label: 'Seleccionar WOD...' },
              ...wods.map(w => ({ value: w.id, label: w.name }))
            ]} 
          />
        )}

        <Input 
          label="Nombre del ranking *" 
          value={form.name} 
          onChange={e => setForm({ ...form, name: e.target.value })} 
          placeholder="Ej: Back Squat 1RM, Fran Time..." 
          required 
        />
        
        <Select 
          label="Orden" 
          value={form.sortOrder} 
          onChange={e => setForm({ ...form, sortOrder: e.target.value })} 
          options={[
            { value: 'desc', label: '📈 Mayor es mejor (peso, reps, calorías)' }, 
            { value: 'asc', label: '📉 Menor es mejor (tiempo)' }
          ]} 
        />
        
        <Textarea 
          label="Descripción (opcional)" 
          value={form.description} 
          onChange={e => setForm({ ...form, description: e.target.value })} 
          placeholder="Descripción opcional del ranking"
          rows={2}
        />
        
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
};

const ViewRankingModal = ({ isOpen, onClose, ranking, entries, loading, exercises }) => {
  if (!ranking) return null;
  
  const getMedalIcon = (pos) => {
    if (pos === 0) return <Crown className="text-yellow-500" size={24} />;
    if (pos === 1) return <Medal className="text-gray-400" size={24} />;
    if (pos === 2) return <Award className="text-orange-600" size={24} />;
    return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">{pos + 1}</span>;
  };

  const formatValue = (entry) => {
    const exercise = exercises.find(e => e.id === entry.exerciseId);
    const measureType = exercise?.measureType || entry.measureType || 'kg';
    
    if (measureType === 'time') {
      const totalSeconds = entry.value;
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
    
    const units = {
      kg: 'kg',
      reps: 'reps',
      distance: 'm',
      calories: 'cal'
    };
    
    return `${entry.value} ${units[measureType] || ''}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={ranking.name} size="lg">
      <div className="space-y-4">
        {/* Info del ranking */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          {ranking.sortOrder === 'asc' ? (
            <>
              <TrendingDown size={16} className="text-green-400" />
              <span>Menor valor = Mejor posición</span>
            </>
          ) : (
            <>
              <TrendingUp size={16} className="text-blue-400" />
              <span>Mayor valor = Mejor posición</span>
            </>
          )}
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="mx-auto mb-4 text-gray-600" size={48} />
            <p className="text-gray-400">No hay marcas validadas aún</p>
            <p className="text-sm text-gray-500 mt-2">
              Los PRs deben ser validados por un profesor para aparecer aquí
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, idx) => (
              <div 
                key={entry.id} 
                className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                  idx === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                  idx === 1 ? 'bg-gray-500/10 border border-gray-500/30' :
                  idx === 2 ? 'bg-orange-500/10 border border-orange-500/30' :
                  'bg-gray-800/50'
                }`}
              >
                <div className="w-8 flex justify-center">
                  {getMedalIcon(idx)}
                </div>
                <Avatar name={entry.userName} size="md" />
                <div className="flex-1">
                  <p className="font-medium">{entry.userName}</p>
                  <p className="text-xs text-gray-500">{formatDate(entry.date || entry.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl text-primary">{formatValue(entry)}</p>
                  {entry.notes && (
                    <p className="text-xs text-gray-500 max-w-[150px] truncate">{entry.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

const Rankings = () => (<GymRequired><RankingsContent /></GymRequired>);
export default Rankings;
