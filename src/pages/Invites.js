import React, { useState, useEffect } from 'react';
import { Plus, Mail, Copy, Check, Trash2, Clock, UserPlus, Send, Infinity, Tag } from 'lucide-react';
import { Button, Card, Modal, Input, Select, EmptyState, LoadingState, Badge, ConfirmDialog , GymRequired } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { formatDate } from '../utils/helpers';

const InvitesContent = () => {
  const { userData, canManageInvites, isSysadmin } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const canEdit = canManageInvites();
  
  // Verificar si el usuario pertenece al gimnasio actual
  const userBelongsToGym = userData?.gymId === currentGym?.id || isSysadmin();

  // Reset estados cuando cambia el gimnasio
  useEffect(() => {
    setInvites([]);
    setLoading(true);
  }, [currentGym?.id]);

  useEffect(() => {
    if (!currentGym?.id) {
      setLoading(false);
      setInvites([]);
      return;
    }

    // Solo cargar invitaciones del gimnasio seleccionado
    const q = query(collection(db, 'invites'), where('gymId', '==', currentGym.id));
    const unsubscribe = onSnapshot(q, async (snap) => {
      let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // MIGRACIÓN: Convertir invitaciones antiguas a nuevo formato
      const migrationsNeeded = [];
      items = items.map(invite => {
        // Si tiene el formato antiguo (usedCount existe), migrarlo
        if (invite.usedCount !== undefined && invite.used === undefined) {
          const isUsed = invite.usedCount > 0;
          migrationsNeeded.push({
            id: invite.id,
            updates: {
              used: isUsed,
              usedBy: null,
              registeredUser: null
            }
          });
          return {
            ...invite,
            used: isUsed,
            usedBy: null,
            registeredUser: null
          };
        }
        return invite;
      });

      // Ejecutar migraciones en segundo plano
      if (migrationsNeeded.length > 0) {
        migrationsNeeded.forEach(async ({ id, updates }) => {
          try {
            await updateDoc(doc(db, 'invites', id), updates);
          } catch (err) {
            console.error('Error migrando invitación:', err);
          }
        });
      }

      // Si no es sysadmin, ocultar invitaciones usadas
      if (!isSysadmin()) {
        items = items.filter(invite => !invite.used);
      }

      items.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      setInvites(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentGym?.id, isSysadmin]);

  const generateCode = () => {
    // Generar código criptográficamente seguro usando UUID
    // Esto garantiza unicidad sin necesidad de leer la base de datos
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);

    // Convertir a base36 y tomar los primeros 10 caracteres para mayor unicidad
    const code = Array.from(array)
      .map(byte => byte.toString(36))
      .join('')
      .substring(0, 10)
      .toUpperCase();

    return code;
  };

  const handleCreate = async (data) => {
    // Verificar que el usuario pertenece al gimnasio
    if (!userBelongsToGym) {
      showError('Solo podés crear invitaciones para tu gimnasio');
      return;
    }

    try {
      const code = generateCode();
      
      let expiresAt = null;
      if (data.expiresInDays && data.expiresInDays > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);
      }

      const inviteData = {
        code,
        description: data.description?.trim() || code,
        email: data.email || null,
        roles: data.roles || ['alumno'],
        gymId: currentGym.id,
        gymName: currentGym.name,
        used: false,
        usedBy: null,
        registeredUser: null,
        createdBy: userData.id,
        createdByName: userData.name,
        createdAt: serverTimestamp()
      };

      if (expiresAt) {
        inviteData.expiresAt = expiresAt;
      }

      await addDoc(collection(db, 'invites'), inviteData);

      success('Invitación creada');
      setShowModal(false);
    } catch (err) {
      showError('Error al crear invitación');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'invites', selected.id));
      success('Invitación eliminada');
      setShowDelete(false);
      setSelected(null);
    } catch (err) {
      showError('Error al eliminar');
    }
  };

  const copyLink = (invite) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}?invite=${invite.code}`;
    navigator.clipboard.writeText(link);
    setCopiedId(invite.id);
    success('Link copiado al portapapeles');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (invite) => {
    if (invite.used) {
      return <Badge className="bg-green-500/20 text-green-400">✓ Usada</Badge>;
    }
    if (invite.expiresAt && invite.expiresAt?.toDate?.() < new Date()) {
      return <Badge className="bg-red-500/20 text-red-400">Expirada</Badge>;
    }
    return <Badge className="bg-yellow-500/20 text-yellow-400">Activa</Badge>;
  };

  const getRolesText = (roles) => {
    if (!roles || roles.length === 0) return 'Miembro';
    const roleNames = {
      sysadmin: 'Sysadmin',
      admin: 'Admin',
      profesor: 'Profesor',
      miembro: 'Miembro'
    };
    return roles.map(r => roleNames[r] || r).join(', ');
  };

  const isExpired = (invite) => {
    if (invite.permanent || !invite.expiresAt) return false;
    return invite.expiresAt?.toDate?.() < new Date();
  };

  if (loading) return <LoadingState />;
  
  if (!currentGym) {
    return (
      <EmptyState 
        icon={Mail} 
        title="Sin gimnasio seleccionado" 
        description="Seleccioná un gimnasio para ver sus invitaciones" 
      />
    );
  }

  // Verificar si el usuario puede ver/crear invitaciones para este gimnasio
  if (!userBelongsToGym) {
    return (
      <EmptyState 
        icon={Mail} 
        title="Sin acceso" 
        description={`No pertenecés a ${currentGym.name}. Solo podés gestionar invitaciones de tu gimnasio.`}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Invitaciones</h1>
          <p className="text-gray-400">
            {invites.filter(i => !isExpired(i)).length} activas en {currentGym.name}
          </p>
        </div>
        {canEdit && (
          <Button icon={Plus} onClick={() => setShowModal(true)}>
            Nueva Invitación
          </Button>
        )}
      </div>

      {/* Info */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <div className="flex items-start gap-3">
          <UserPlus className="text-blue-400 mt-1 flex-shrink-0" size={20} />
          <div>
            <p className="text-blue-400 font-medium">¿Cómo funcionan las invitaciones?</p>
            <p className="text-sm text-gray-400 mt-1">
              Cada invitación genera un link de <strong>uso único</strong> con validez limitada.
              Una vez que alguien se registre usando el link, la invitación quedará archivada automáticamente.
              {isSysadmin() && ' Como sysadmin, podés ver todas las invitaciones incluyendo las usadas.'}
            </p>
          </div>
        </div>
      </Card>

      {invites.length === 0 ? (
        <EmptyState 
          icon={Mail} 
          title="No hay invitaciones" 
          description={`Creá una invitación para sumar miembros a ${currentGym.name}`}
          action={canEdit && <Button icon={Plus} onClick={() => setShowModal(true)}>Crear Invitación</Button>}
        />
      ) : (
        <div className="space-y-3">
          {invites.map(invite => {
            return (
              <Card key={invite.id} className={isExpired(invite) || invite.used ? 'opacity-60' : ''}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    {/* Descripción y código */}
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <p className="font-medium text-white">
                          {invite.description !== invite.code ? invite.description : `Invitación ${invite.code}`}
                        </p>
                        <code className="text-xs px-2 py-0.5 bg-gray-800 rounded text-primary font-mono">
                          {invite.code}
                        </code>
                      </div>
                      {getStatusBadge(invite)}
                    </div>

                    <div className="text-sm text-gray-400 space-y-1">
                      {invite.email && (
                        <p className="flex items-center gap-2">
                          <Mail size={14} /> Para: {invite.email}
                        </p>
                      )}
                      <p>Roles: <strong className="text-gray-300">{getRolesText(invite.roles)}</strong></p>

                      {/* Info si fue usada */}
                      {invite.used && invite.registeredUser && (
                        <div className="p-2 bg-green-500/10 border border-green-500/30 rounded-lg mt-2">
                          <p className="flex items-center gap-2 text-green-400 text-sm font-medium">
                            <UserPlus size={14} />
                            Registrado
                          </p>
                          <p className="text-xs text-gray-300 mt-1">
                            Usuario: <strong>{invite.registeredUser.name}</strong>
                          </p>
                          <p className="text-xs text-gray-300">
                            Email: <strong>{invite.registeredUser.email}</strong>
                          </p>
                          {invite.registeredUser.registeredAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(invite.registeredUser.registeredAt)}
                            </p>
                          )}
                        </div>
                      )}

                      <p className="flex items-center gap-2">
                        <Clock size={14} />
                        {isExpired(invite)
                          ? 'Expirada'
                          : `Expira: ${formatDate(invite.expiresAt)}`
                        }
                      </p>
                      <p className="text-xs text-gray-500">
                        Creado por {invite.createdByName} • {formatDate(invite.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!isExpired(invite) && !invite.used && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={copiedId === invite.id ? Check : Copy}
                        onClick={() => copyLink(invite)}
                      >
                        {copiedId === invite.id ? 'Copiado!' : 'Copiar Link'}
                      </Button>
                    )}
                    {canEdit && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Trash2}
                        onClick={() => { setSelected(invite); setShowDelete(true); }}
                        className="text-red-400 hover:bg-red-500/20"
                      />
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <InviteModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onCreate={handleCreate} 
        gymName={currentGym?.name}
      />
      <ConfirmDialog 
        isOpen={showDelete} 
        onClose={() => setShowDelete(false)} 
        onConfirm={handleDelete} 
        title="Eliminar Invitación" 
        message={`¿Eliminar la invitación "${selected?.description || selected?.code}"?`}
        confirmText="Eliminar" 
      />
    </div>
  );
};

const InviteModal = ({ isOpen, onClose, onCreate, gymName }) => {
  const { isSysadmin } = useAuth();
  const [form, setForm] = useState({ description: '', email: '', roles: ['miembro'], expiresInDays: 0 });
  const [loading, setLoading] = useState(false);

  // Reset form cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setForm({ description: '', email: '', roles: ['miembro'], expiresInDays: 7 });
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onCreate(form);
    setLoading(false);
  };

  const toggleRole = (role) => {
    setForm(prev => {
      const hasRole = prev.roles.includes(role);
      let newRoles;

      if (hasRole) {
        if (role === 'miembro' && prev.roles.length === 1) return prev;
        newRoles = prev.roles.filter(r => r !== role);
      } else {
        newRoles = [...prev.roles, role];
      }

      if (!newRoles.includes('miembro')) {
        newRoles.push('miembro');
      }

      return { ...prev, roles: newRoles };
    });
  };

  const availableRoles = [
    { id: 'miembro', name: 'Miembro', description: 'Acceso básico', always: true },
    { id: 'profesor', name: 'Profesor', description: 'Crear rutinas, WODs, validar PRs' },
    { id: 'admin', name: 'Admin', description: 'Gestión completa del gimnasio' },
  ];

  if (isSysadmin()) {
    availableRoles.push({ id: 'sysadmin', name: 'Sysadmin', description: 'Poder absoluto' });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Invitación">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info del gimnasio */}
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-xl">
          <p className="text-sm text-gray-400">Gimnasio</p>
          <p className="font-medium text-primary">{gymName}</p>
        </div>

        {/* Descripción */}
        <Input 
          label="Descripción (opcional)" 
          value={form.description} 
          onChange={e => setForm({ ...form, description: e.target.value })} 
          placeholder="Ej: Invitación para Juan, Promo Enero, etc."
        />
        <p className="text-xs text-gray-500 -mt-2">
          Si no completás, se usará el código como identificador
        </p>

        <Input 
          label="Email (opcional)" 
          type="email"
          value={form.email} 
          onChange={e => setForm({ ...form, email: e.target.value })} 
          placeholder="Si lo dejás vacío, cualquiera puede usar el link"
        />

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Roles a asignar</label>
          <div className="space-y-2">
            {availableRoles.map(role => (
              <label 
                key={role.id}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                  form.roles.includes(role.id) ? 'bg-primary/20 border border-primary/50' : 'bg-gray-800/50 border border-gray-700 hover:bg-gray-700/50'
                } ${role.always ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input 
                  type="checkbox" 
                  checked={form.roles.includes(role.id)} 
                  onChange={() => !role.always && toggleRole(role.id)}
                  disabled={role.always}
                  className="w-4 h-4"
                />
                <div>
                  <p className="font-medium">{role.name}</p>
                  <p className="text-xs text-gray-400">{role.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Validez</label>
          <select
            value={form.expiresInDays}
            onChange={e => setForm({ ...form, expiresInDays: parseInt(e.target.value) })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary"
          >
            <option value={1}>1 día</option>
            <option value={7}>7 días</option>
            <option value={30}>30 días</option>
            <option value={90}>90 días</option>
            <option value={365}>1 año</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            La invitación expirará en {form.expiresInDays} día(s) y solo podrá ser usada 1 vez.
            Una vez que alguien se registre, la invitación quedará archivada.
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1" icon={Send}>Crear Invitación</Button>
        </div>
      </form>
    </Modal>
  );
};

const Invites = () => (<GymRequired><InvitesContent /></GymRequired>);
export default Invites;
