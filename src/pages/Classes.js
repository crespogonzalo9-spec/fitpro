import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Users, MoreVertical, Edit, Trash2, UserPlus } from 'lucide-react';
import { Button, Card, Modal, Input, Select, EmptyState, LoadingState, ConfirmDialog, Badge, Dropdown, DropdownItem, Checkbox , GymRequired } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { DAYS_OF_WEEK } from '../utils/constants';

const ClassesContent = () => {
  const { userData, canManageClasses, isProfesor } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  
  const [classes, setClasses] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);

  const canEdit = canManageClasses();

  useEffect(() => {
    if (!currentGym?.id) { setLoading(false); return; }

    const classesQuery = query(collection(db, 'classes'), where('gymId', '==', currentGym.id));
    const unsubClasses = onSnapshot(classesQuery, (snap) => {
      setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const profesQuery = query(collection(db, 'users'), where('gymId', '==', currentGym.id), where('role', 'in', ['profesor', 'admin', 'sysadmin']));
    const unsubProf = onSnapshot(profesQuery, (snap) => {
      setProfesores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubClasses(); unsubProf(); };
  }, [currentGym]);

  const handleSave = async (data) => {
    try {
      if (selected?.id) {
        await updateDoc(doc(db, 'classes', selected.id), { ...data, updatedAt: serverTimestamp() });
        success('Clase actualizada');
      } else {
        await addDoc(collection(db, 'classes'), { ...data, gymId: currentGym.id, enrolledCount: 0, createdAt: serverTimestamp() });
        success('Clase creada');
      }
      setShowModal(false);
      setSelected(null);
    } catch (err) {
      showError('Error al guardar');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'classes', selected.id));
      success('Clase eliminada');
      setShowDelete(false);
      setSelected(null);
    } catch (err) {
      showError('Error al eliminar');
    }
  };

  const getDayName = (dayId) => DAYS_OF_WEEK.find(d => d.id === parseInt(dayId))?.name || dayId;
  const getProfesorName = (profId) => profesores.find(p => p.id === profId)?.name || 'Sin asignar';

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={Calendar} title="Sin gimnasio" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clases</h1>
          <p className="text-gray-400">{classes.length} clases</p>
        </div>
        {canEdit && <Button icon={Plus} onClick={() => { setSelected(null); setShowModal(true); }}>Nueva Clase</Button>}
      </div>

      {classes.length === 0 ? (
        <EmptyState icon={Calendar} title="No hay clases" action={canEdit && <Button icon={Plus} onClick={() => setShowModal(true)}>Crear</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map(cls => (
            <Card key={cls.id}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{cls.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                    <Calendar size={14} /> {getDayName(cls.dayOfWeek)}
                    <Clock size={14} className="ml-2" /> {cls.startTime} - {cls.endTime}
                  </div>
                </div>
                {canEdit && (
                  <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                    <DropdownItem icon={Edit} onClick={() => { setSelected(cls); setShowModal(true); }}>Editar</DropdownItem>
                    <DropdownItem icon={Trash2} danger onClick={() => { setSelected(cls); setShowDelete(true); }}>Eliminar</DropdownItem>
                  </Dropdown>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Profesor: {getProfesorName(cls.profesorId)}</span>
                <Badge><Users size={12} className="mr-1" />{cls.enrolledCount || 0}/{cls.capacity || '∞'}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ClassModal isOpen={showModal} onClose={() => { setShowModal(false); setSelected(null); }} onSave={handleSave} classData={selected} profesores={profesores} />
      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Eliminar" message={`¿Eliminar "${selected?.name}"?`} confirmText="Eliminar" />
    </div>
  );
};

const ClassModal = ({ isOpen, onClose, onSave, classData, profesores }) => {
  const [form, setForm] = useState({ name: '', dayOfWeek: 1, startTime: '09:00', endTime: '10:00', capacity: '', profesorId: '', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (classData) {
      setForm({ name: classData.name || '', dayOfWeek: classData.dayOfWeek || 1, startTime: classData.startTime || '09:00', endTime: classData.endTime || '10:00', capacity: classData.capacity || '', profesorId: classData.profesorId || '', description: classData.description || '' });
    } else {
      setForm({ name: '', dayOfWeek: 1, startTime: '09:00', endTime: '10:00', capacity: '', profesorId: '', description: '' });
    }
  }, [classData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={classData ? 'Editar Clase' : 'Nueva Clase'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: CrossFit WOD" required />
        <Select label="Día" value={form.dayOfWeek} onChange={e => setForm({ ...form, dayOfWeek: parseInt(e.target.value) })} options={DAYS_OF_WEEK.map(d => ({ value: d.id, label: d.name }))} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Inicio" type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
          <Input label="Fin" type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Capacidad" type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="Sin límite" />
          <Select label="Profesor" value={form.profesorId} onChange={e => setForm({ ...form, profesorId: e.target.value })} options={[{ value: '', label: 'Sin asignar' }, ...profesores.map(p => ({ value: p.id, label: p.name }))]} />
        </div>
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
};

const Classes = () => (<GymRequired><ClassesContent /></GymRequired>);
export default Classes;
