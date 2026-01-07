import React, { useState, useEffect } from 'react';
import { Plus, Building2, MoreVertical, Edit, Trash2, Users, MapPin, Ban, CheckCircle } from 'lucide-react';
import { Button, Card, Modal, Input, Textarea, SearchInput, EmptyState, LoadingState, ConfirmDialog, Badge, Dropdown, DropdownItem } from '../components/Common';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { generateSlug, getUniqueSlug } from '../utils/slugUtils';

const Gyms = () => {
  const { success, error: showError } = useToast();
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showSuspend, setShowSuspend] = useState(false);
  const [selected, setSelected] = useState(null);
  const [adminCounts, setAdminCounts] = useState({});
  const [suspendReason, setSuspendReason] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'gyms'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const gymList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGyms(gymList);
      
      // Contar admins por gimnasio
      const counts = {};
      for (const gym of gymList) {
        const usersQuery = query(collection(db, 'users'), where('gymId', '==', gym.id), where('role', '==', 'admin'));
        const usersSnap = await getDocs(usersQuery);
        counts[gym.id] = usersSnap.size;
      }
      setAdminCounts(counts);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filtered = gyms.filter(g => g.name?.toLowerCase().includes(search.toLowerCase()));

  const handleSave = async (data) => {
    try {
      // Generar slug solo si no existe o si cambió el nombre
      let slug = selected?.slug;

      if (!slug || (selected && selected.name !== data.name)) {
        const baseSlug = generateSlug(data.name);
        const existingSlugs = gyms
          .filter(g => g.id !== selected?.id)
          .map(g => g.slug)
          .filter(Boolean);
        slug = getUniqueSlug(baseSlug, existingSlugs);
      }

      const gymData = { ...data, slug };

      if (selected) {
        await updateDoc(doc(db, 'gyms', selected.id), { ...gymData, updatedAt: serverTimestamp() });
        success('Gimnasio actualizado');
      } else {
        await addDoc(collection(db, 'gyms'), { ...gymData, isActive: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        success('Gimnasio creado');
      }
      setShowModal(false);
      setSelected(null);
    } catch (err) {
      showError('Error al guardar');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'gyms', selected.id));
      success('Gimnasio eliminado');
      setShowDelete(false);
      setSelected(null);
    } catch (err) {
      showError('Error al eliminar');
    }
  };

  const handleSuspendToggle = async () => {
    try {
      const isSuspended = selected.suspended === true;

      if (isSuspended) {
        // Reactivar
        await updateDoc(doc(db, 'gyms', selected.id), {
          suspended: false,
          suspendedAt: null,
          suspendedReason: null,
          suspendedBy: null,
          reactivatedAt: serverTimestamp()
        });
        success('Gimnasio reactivado');
      } else {
        // Suspender
        await updateDoc(doc(db, 'gyms', selected.id), {
          suspended: true,
          suspendedAt: serverTimestamp(),
          suspendedReason: suspendReason.trim() || null,
          suspendedBy: 'sysadmin' // Aquí podrías poner el userId del sysadmin
        });
        success('Gimnasio suspendido');
      }

      setShowSuspend(false);
      setSelected(null);
      setSuspendReason('');
    } catch (err) {
      showError('Error al actualizar gimnasio');
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gimnasios</h1>
          <p className="text-gray-400">{gyms.length} gimnasios registrados</p>
        </div>
        <Button icon={Plus} onClick={() => { setSelected(null); setShowModal(true); }}>Nuevo Gimnasio</Button>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar gimnasio..." />

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No hay gimnasios" description="Creá el primer gimnasio" action={<Button icon={Plus} onClick={() => setShowModal(true)}>Crear</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(gym => (
            <Card key={gym.id} className="hover:border-emerald-500/30">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <Building2 className="text-emerald-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{gym.name}</h3>
                    <div className="flex gap-2">
                      {gym.suspended ? (
                        <Badge variant="error">Suspendido</Badge>
                      ) : (
                        <Badge variant={gym.isActive ? 'success' : 'error'}>{gym.isActive ? 'Activo' : 'Inactivo'}</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                  <DropdownItem icon={Edit} onClick={() => { setSelected(gym); setShowModal(true); }}>Editar</DropdownItem>
                  <DropdownItem
                    icon={gym.suspended ? CheckCircle : Ban}
                    onClick={() => {
                      setSelected(gym);
                      setSuspendReason('');
                      setShowSuspend(true);
                    }}
                  >
                    {gym.suspended ? 'Reactivar' : 'Suspender'}
                  </DropdownItem>
                  <DropdownItem icon={Trash2} danger onClick={() => { setSelected(gym); setShowDelete(true); }}>Eliminar</DropdownItem>
                </Dropdown>
              </div>
              {gym.address && <p className="text-sm text-gray-400 flex items-center gap-1 mb-2"><MapPin size={14} />{gym.address}</p>}
              {gym.slug && <p className="text-xs text-gray-500 mb-2 font-mono">/{gym.slug}</p>}
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Users size={14} />
                <span>{adminCounts[gym.id] || 0} administradores</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <GymModal isOpen={showModal} onClose={() => { setShowModal(false); setSelected(null); }} onSave={handleSave} gym={selected} />
      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Eliminar Gimnasio" message={`¿Eliminar ${selected?.name}?`} confirmText="Eliminar" />

      <SuspendModal
        isOpen={showSuspend}
        onClose={() => { setShowSuspend(false); setSelected(null); setSuspendReason(''); }}
        onConfirm={handleSuspendToggle}
        gym={selected}
        reason={suspendReason}
        onReasonChange={setSuspendReason}
      />
    </div>
  );
};

const GymModal = ({ isOpen, onClose, onSave, gym }) => {
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(gym ? { name: gym.name || '', address: gym.address || '', phone: gym.phone || '', email: gym.email || '', description: gym.description || '' } : { name: '', address: '', phone: '', email: '', description: '' });
  }, [gym, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={gym ? 'Editar Gimnasio' : 'Nuevo Gimnasio'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <Input label="Dirección" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Teléfono" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <Textarea label="Descripción" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">{gym ? 'Guardar' : 'Crear'}</Button>
        </div>
      </form>
    </Modal>
  );
};

const SuspendModal = ({ isOpen, onClose, onConfirm, gym, reason, onReasonChange }) => {
  if (!gym) return null;

  const isSuspended = gym.suspended === true;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isSuspended ? 'Reactivar Gimnasio' : 'Suspender Gimnasio'} size="sm">
      <div className="space-y-4">
        {isSuspended ? (
          // Reactivar
          <>
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <p className="text-green-400 font-medium flex items-center gap-2">
                <CheckCircle size={20} />
                Reactivar {gym.name}
              </p>
              <p className="text-sm text-gray-300 mt-2">
                El gimnasio volverá a estar operativo y todos sus usuarios podrán acceder normalmente.
              </p>
            </div>

            {gym.suspendedReason && (
              <div className="p-3 bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-400">Motivo de suspensión:</p>
                <p className="text-sm text-gray-300 mt-1">{gym.suspendedReason}</p>
              </div>
            )}
          </>
        ) : (
          // Suspender
          <>
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 font-medium flex items-center gap-2">
                <Ban size={20} />
                Suspender {gym.name}
              </p>
              <p className="text-sm text-gray-300 mt-2">
                Todos los usuarios de este gimnasio perderán acceso al sistema hasta que sea reactivado.
              </p>
            </div>

            <Textarea
              label="Motivo de suspensión (opcional)"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              rows={3}
              placeholder="Ejemplo: Falta de pago, incumplimiento de contrato, etc."
            />

            <p className="text-xs text-gray-400">
              Este motivo solo será visible para ti (sysadmin) y para los administradores del gimnasio.
            </p>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            variant={isSuspended ? 'primary' : 'danger'}
            onClick={onConfirm}
            className="flex-1"
            icon={isSuspended ? CheckCircle : Ban}
          >
            {isSuspended ? 'Reactivar' : 'Suspender'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default Gyms;
