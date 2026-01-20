import React, { useState, useEffect } from 'react';
import { Users, MoreVertical, Edit, Shield, Building2, Crown, Trash2, Globe } from 'lucide-react';
import { Button, Card, Modal, Select, SearchInput, EmptyState, LoadingState, Badge, Avatar, Dropdown, DropdownItem, ConfirmDialog } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { formatDate } from '../utils/helpers';

const UsersPage = () => {
  const { userData, isSysadmin, canAssignRole, canRemoveRole } = useAuth();
  const { currentGym, viewAllGyms, availableGyms } = useGym();
  const { success, error: showError } = useToast();
  
  const [users, setUsers] = useState([]);
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    // Cargar gimnasios siempre
    const unsubGyms = onSnapshot(collection(db, 'gyms'), (snap) => {
      setGyms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Cargar usuarios según contexto
    let usersQuery;
    
    if (viewAllGyms) {
      // Ver todos los usuarios (modo global)
      usersQuery = collection(db, 'users');
    } else if (currentGym?.id) {
      // Ver solo usuarios del gimnasio seleccionado
      usersQuery = query(collection(db, 'users'), where('gymId', '==', currentGym.id));
    } else {
      // Sin gimnasio seleccionado
      setUsers([]);
      setLoading(false);
      return () => unsubGyms();
    }

    const unsubUsers = onSnapshot(usersQuery, (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => { unsubUsers(); unsubGyms(); };
  }, [currentGym, viewAllGyms]);

  const getFilteredUsers = () => {
    let filtered = users;
    
    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.roles?.includes(filterRole));
    }
    
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(u => 
        u.name?.toLowerCase().includes(s) || 
        u.email?.toLowerCase().includes(s)
      );
    }
    
    // Ordenar por roles (sysadmin primero)
    const roleOrder = { sysadmin: 0, admin: 1, profesor: 2, miembro: 3 };
    filtered.sort((a, b) => {
      const aTop = Math.min(...(a.roles || ['miembro']).map(r => roleOrder[r] ?? 4));
      const bTop = Math.min(...(b.roles || ['miembro']).map(r => roleOrder[r] ?? 4));
      return aTop - bTop;
    });
    
    return filtered;
  };

  const handleSave = async (data) => {
    try {
      await updateDoc(doc(db, 'users', selected.id), {
        roles: data.roles,
        gymId: data.gymId || null,
        isActive: data.isActive,
        updatedAt: serverTimestamp()
      });
      success('Usuario actualizado');
      setShowModal(false);
      setSelected(null);
    } catch (err) {
      showError('Error al actualizar');
    }
  };

  const handleDelete = async () => {
    try {
      if (selected.id === userData.id) {
        showError('No podés eliminarte a vos mismo');
        return;
      }
      await deleteDoc(doc(db, 'users', selected.id));
      success('Usuario eliminado');
      setShowDelete(false);
      setSelected(null);
    } catch (err) {
      showError('Error al eliminar');
    }
  };

  const getGymName = (gymId) => gyms.find(g => g.id === gymId)?.name || 'Sin gimnasio';

  const getRoleBadges = (roles) => {
    if (!roles || roles.length === 0) return <Badge className="bg-gray-500/20 text-gray-400">Miembro</Badge>;

    const roleConfig = {
      sysadmin: { color: 'bg-yellow-500/20 text-yellow-400', icon: '👑' },
      admin: { color: 'bg-blue-500/20 text-blue-400', icon: '🔧' },
      profesor: { color: 'bg-purple-500/20 text-purple-400', icon: '👨‍🏫' },
      miembro: { color: 'bg-gray-500/20 text-gray-400', icon: '👤' }
    };

    return (
      <div className="flex flex-wrap gap-1">
        {roles.filter(r => r !== 'miembro').map(role => (
          <Badge key={role} className={roleConfig[role]?.color || 'bg-gray-500/20'}>
            {roleConfig[role]?.icon} {role.charAt(0).toUpperCase() + role.slice(1)}
          </Badge>
        ))}
        {roles.length === 1 && roles[0] === 'miembro' && (
          <Badge className="bg-gray-500/20 text-gray-400">👤 Miembro</Badge>
        )}
      </div>
    );
  };

  const filteredUsers = getFilteredUsers();

  if (!isSysadmin()) {
    return <EmptyState icon={Shield} title="Acceso denegado" description="Solo sysadmin puede ver esta página" />;
  }

  if (loading) return <LoadingState />;

  // Mostrar contexto actual
  const getContextLabel = () => {
    if (viewAllGyms) {
      return (
        <span className="flex items-center gap-2 text-blue-400">
          <Globe size={16} />
          Todos los gimnasios
        </span>
      );
    }
    if (currentGym) {
      return (
        <span className="flex items-center gap-2">
          <Building2 size={16} />
          {currentGym.name}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-gray-400">
            {filteredUsers.length} usuarios {viewAllGyms ? 'en el sistema' : `en ${currentGym?.name || 'el gimnasio'}`}
          </p>
        </div>
        {getContextLabel()}
      </div>

      {/* Info del contexto */}
      {viewAllGyms && (
        <Card className="bg-blue-500/10 border-blue-500/30">
          <div className="flex items-start gap-3">
            <Globe className="text-blue-400 mt-1 flex-shrink-0" size={20} />
            <div>
              <p className="text-blue-400 font-medium">Vista global</p>
              <p className="text-sm text-gray-400">
                Estás viendo usuarios de todos los gimnasios. Seleccioná un gimnasio específico 
                en el menú lateral para ver solo sus usuarios.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o email..." className="flex-1" />
        <Select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          options={[
            { value: 'all', label: 'Todos los roles' },
            { value: 'sysadmin', label: '👑 Sysadmin' },
            { value: 'admin', label: '🔧 Admin' },
            { value: 'profesor', label: '👨‍🏫 Profesor' },
            { value: 'miembro', label: '👤 Miembro' }
          ]}
          className="w-full sm:w-48"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <EmptyState icon={Users} title="No hay usuarios" description={currentGym ? `No hay usuarios en ${currentGym.name}` : 'No hay usuarios'} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map(user => (
            <Card key={user.id} className="cursor-pointer hover:border-primary/50 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar name={user.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{user.name}</h3>
                      {user.roles?.includes('sysadmin') && <Crown size={16} className="text-yellow-500 flex-shrink-0" />}
                    </div>
                    <div className="mt-1">
                      {getRoleBadges(user.roles)}
                    </div>
                    {user.id === userData.id && <Badge className="mt-1 bg-blue-500/20 text-blue-400">Vos</Badge>}
                  </div>
                </div>
                <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg flex-shrink-0"><MoreVertical size={18} /></button>}>
                  <DropdownItem icon={Edit} onClick={(e) => { e.stopPropagation(); setSelected(user); setShowModal(true); }}>Editar</DropdownItem>
                  {user.id !== userData.id && (
                    <DropdownItem icon={Trash2} danger onClick={(e) => { e.stopPropagation(); setSelected(user); setShowDelete(true); }}>Eliminar</DropdownItem>
                  )}
                </Dropdown>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-700 text-sm text-gray-400">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 size={14} />
                  <span>{getGymName(user.gymId)}</span>
                </div>
                <p className="text-xs mb-1">Registrado: {formatDate(user.createdAt)}</p>
                {!user.isActive && <Badge className="mt-1 bg-red-500/20 text-red-400">Inactivo</Badge>}
                <p className="text-xs text-gray-400 truncate mt-2" title={user.email}>
                  {user.email}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <UserModal 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); setSelected(null); }} 
        onSave={handleSave} 
        user={selected}
        gyms={gyms}
        currentGym={currentGym}
        viewAllGyms={viewAllGyms}
        currentUserId={userData?.id}
        canAssignRole={canAssignRole}
        canRemoveRole={canRemoveRole}
        isSysadmin={isSysadmin()}
      />

      <ConfirmDialog 
        isOpen={showDelete} 
        onClose={() => setShowDelete(false)} 
        onConfirm={handleDelete} 
        title="Eliminar Usuario" 
        message={`¿Eliminar a "${selected?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar" 
      />
    </div>
  );
};

const UserModal = ({ isOpen, onClose, onSave, user, gyms, currentGym, viewAllGyms, currentUserId, canAssignRole, canRemoveRole, isSysadmin }) => {
  const [form, setForm] = useState({ roles: ['miembro'], gymId: '', isActive: true });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        roles: user.roles || ['miembro'],
        gymId: user.gymId || '',
        isActive: user.isActive !== false
      });
    } else {
      // Si hay un gym seleccionado, usarlo por defecto
      setForm({
        roles: ['miembro'],
        gymId: currentGym?.id || '',
        isActive: true
      });
    }
  }, [user, isOpen, currentGym]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Asegurar que siempre tenga al menos miembro
    const roles = form.roles.length > 0 ? form.roles : ['miembro'];
    if (!roles.includes('miembro')) roles.push('miembro');
    setLoading(true);
    await onSave({ ...form, roles });
    setLoading(false);
  };

  const toggleRole = (role) => {
    const hasRole = form.roles.includes(role);
    
    if (hasRole) {
      // Verificar si puede quitar el rol
      if (!canRemoveRole(role)) return;
      if (role === 'miembro') return; // No se puede quitar miembro
      setForm(prev => ({ ...prev, roles: prev.roles.filter(r => r !== role) }));
    } else {
      // Verificar si puede asignar el rol
      if (!canAssignRole(role)) return;
      setForm(prev => ({ ...prev, roles: [...prev.roles, role] }));
    }
  };

  // Sysadmin puede editarse a sí mismo (pero con advertencia)
  const isEditingSelf = user?.id === currentUserId;

  const allRoles = [
    { id: 'sysadmin', name: 'Sysadmin', desc: 'Poder absoluto en toda la app', icon: '👑' },
    { id: 'admin', name: 'Admin', desc: 'Gestión completa del gimnasio', icon: '🔧' },
    { id: 'profesor', name: 'Profesor', desc: 'Crear rutinas, WODs, validar PRs', icon: '👨‍🏫' },
    { id: 'miembro', name: 'Miembro', desc: 'Acceso básico (siempre incluido)', icon: '👤', locked: true },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editar: ${user?.name}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-gray-800/50 rounded-xl">
          <p className="text-sm text-gray-400">Email</p>
          <p className="font-medium">{user?.email}</p>
        </div>

        {isEditingSelf && (
          <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-xl">
            <p className="text-yellow-400 text-sm">
              ⚠️ Estás editando tu propio usuario. Tené cuidado al modificar tus roles.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Roles</label>
          <div className="space-y-2">
            {allRoles.map(role => {
              const hasRole = form.roles.includes(role.id);
              const canToggle = role.locked ? false : (hasRole ? canRemoveRole(role.id) : canAssignRole(role.id));
              const disabled = role.locked || !canToggle;

              return (
                <label 
                  key={role.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    hasRole ? 'bg-primary/20 border border-primary/50' : 'bg-gray-800/50 border border-gray-700'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-700/50'}`}
                >
                  <input 
                    type="checkbox" 
                    checked={hasRole} 
                    onChange={() => !disabled && toggleRole(role.id)}
                    disabled={disabled}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{role.icon} {role.name}</p>
                    <p className="text-xs text-gray-400">{role.desc}</p>
                  </div>
                  {!canToggle && !role.locked && (
                    <span className="text-xs text-gray-500">Sin permiso</span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        <Select 
          label="Gimnasio" 
          value={form.gymId} 
          onChange={e => setForm({ ...form, gymId: e.target.value })}
          options={[
            { value: '', label: 'Sin gimnasio' },
            ...gyms.map(g => ({ value: g.id, label: g.name }))
          ]}
        />

        {/* Advertencia si cambia de gimnasio */}
        {user && user.gymId !== form.gymId && form.gymId && (
          <div className="p-3 bg-orange-500/20 border border-orange-500/30 rounded-xl">
            <p className="text-orange-400 text-sm">
              ⚠️ Al cambiar el gimnasio, el usuario perderá acceso a los datos del gimnasio anterior.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
          <div>
            <span className="font-medium">Usuario Activo</span>
            <p className="text-xs text-gray-400">Los usuarios inactivos no pueden acceder</p>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...form, isActive: !form.isActive })}
            className={`relative w-12 h-6 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-600'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.isActive ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
};

export default UsersPage;
