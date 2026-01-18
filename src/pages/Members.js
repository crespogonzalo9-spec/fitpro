import React, { useState, useEffect } from 'react';
import { Users, MoreVertical, Phone, Shield, ShieldX, ShieldCheck, TrendingUp, Trophy, ArrowUp, ArrowDown, Calendar, KeyRound, AlertCircle } from 'lucide-react';
import { Button, Card, Modal, Select, SearchInput, EmptyState, LoadingState, Badge, Avatar, Dropdown, DropdownItem, ConfirmDialog , GymRequired } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getRoleName, formatDate } from '../utils/helpers';

const MembersContent = () => {
  const { userData, isAdmin, canAssignRole, canRemoveRole, canBlockUsers } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [selected, setSelected] = useState(null);

  const [prs, setPrs] = useState([]);
  const [routineSessions, setRoutineSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [wods, setWods] = useState([]);

  const canEdit = isAdmin();
  const canBlock = canBlockUsers();

  useEffect(() => {
    if (!currentGym?.id) { setLoading(false); return; }

    const q = query(collection(db, 'users'), where('gymId', '==', currentGym.id));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    // Cargar todos los PRs del gimnasio
    const prsQuery = query(collection(db, 'prs'), where('gymId', '==', currentGym.id));
    const unsubPRs = onSnapshot(prsQuery, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => {
        const dateA = a.date?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.date?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      setPrs(items);
    });

    // Cargar sesiones de rutinas
    const sessionsQuery = query(collection(db, 'routine_sessions'), where('gymId', '==', currentGym.id));
    const unsubSessions = onSnapshot(sessionsQuery, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      setRoutineSessions(items);
    });

    // Cargar clases
    const classesQuery = query(collection(db, 'classes'), where('gymId', '==', currentGym.id));
    const unsubClasses = onSnapshot(classesQuery, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setClasses(items);
    });

    // Cargar WODs
    const wodsQuery = query(collection(db, 'wods'), where('gymId', '==', currentGym.id));
    const unsubWods = onSnapshot(wodsQuery, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setWods(items);
    });

    return () => { unsubscribe(); unsubPRs(); unsubSessions(); unsubClasses(); unsubWods(); };
  }, [currentGym]);

  const getFilteredMembers = () => {
    let filtered = members;
    
    if (filterRole !== 'all') {
      filtered = filtered.filter(m => m.roles?.includes(filterRole));
    }

    if (filterStatus !== 'all') {
      if (filterStatus === 'blocked') {
        filtered = filtered.filter(m => m.isBlocked === true);
      } else if (filterStatus === 'active') {
        filtered = filtered.filter(m => m.isBlocked !== true);
      }
    }
    
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(m => 
        m.name?.toLowerCase().includes(s) || 
        m.email?.toLowerCase().includes(s)
      );
    }
    
    // Ordenar: bloqueados al final, luego por roles
    const roleOrder = { sysadmin: 0, admin: 1, profesor: 2, alumno: 3 };
    filtered.sort((a, b) => {
      // Bloqueados al final
      if (a.isBlocked && !b.isBlocked) return 1;
      if (!a.isBlocked && b.isBlocked) return -1;
      
      const aTop = Math.min(...(a.roles || ['alumno']).map(r => roleOrder[r] ?? 4));
      const bTop = Math.min(...(b.roles || ['alumno']).map(r => roleOrder[r] ?? 4));
      return aTop - bTop;
    });
    
    return filtered;
  };

  const handleSaveRoles = async (data) => {
    try {
      let roles = data.roles;
      if (!roles.includes('alumno')) roles.push('alumno');
      
      await updateDoc(doc(db, 'users', selected.id), {
        roles,
        updatedAt: serverTimestamp()
      });
      success('Roles actualizados');
      setShowModal(false);
      setSelected(null);
    } catch (err) {
      showError('Error al actualizar');
    }
  };

  const handleBlockToggle = async () => {
    try {
      const newBlockedStatus = !selected.isBlocked;
      await updateDoc(doc(db, 'users', selected.id), {
        isBlocked: newBlockedStatus,
        blockedAt: newBlockedStatus ? serverTimestamp() : null,
        blockedBy: newBlockedStatus ? userData.id : null,
        updatedAt: serverTimestamp()
      });
      success(newBlockedStatus ? 'Usuario bloqueado' : 'Usuario desbloqueado');
      setShowBlockConfirm(false);
      setSelected(null);
    } catch (err) {
      showError('Error al cambiar estado');
    }
  };

  const handleResetPassword = async () => {
    try {
      // Generar contraseña temporal de 8 caracteres
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();

      // Marcar que el usuario necesita cambiar su contraseña
      await updateDoc(doc(db, 'users', selected.id), {
        requiresPasswordChange: true,
        temporaryPassword: tempPassword,
        passwordResetBy: userData.id,
        passwordResetAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Mostrar la contraseña temporal al admin
      success(`Contraseña temporal generada: ${tempPassword}`);
      alert(`Contraseña temporal para ${selected.name}:\n\n${tempPassword}\n\nGuardá esta contraseña y enviásela al usuario de forma segura. El usuario deberá cambiarla al iniciar sesión.`);

      setShowResetPassword(false);
      setSelected(null);
    } catch (err) {
      console.error('Error resetting password:', err);
      showError('Error al resetear la contraseña');
    }
  };

  const getRoleBadges = (roles) => {
    if (!roles || roles.length === 0) return <Badge className="bg-gray-500/20 text-gray-400">Alumno</Badge>;
    
    const roleConfig = {
      sysadmin: { color: 'bg-yellow-500/20 text-yellow-400', icon: '👑' },
      admin: { color: 'bg-blue-500/20 text-blue-400', icon: '🔧' },
      profesor: { color: 'bg-purple-500/20 text-purple-400', icon: '👨‍🏫' },
      alumno: { color: 'bg-gray-500/20 text-gray-400', icon: '👤' }
    };

    return (
      <div className="flex flex-wrap gap-1">
        {roles.map(role => (
          <Badge key={role} className={roleConfig[role]?.color || 'bg-gray-500/20'}>
            {roleConfig[role]?.icon} {getRoleName(role)}
          </Badge>
        ))}
      </div>
    );
  };

  const filteredMembers = getFilteredMembers();
  const blockedCount = members.filter(m => m.isBlocked).length;

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={Users} title="Sin gimnasio" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Miembros</h1>
          <p className="text-gray-400">
            {filteredMembers.length} miembros en {currentGym.name}
            {blockedCount > 0 && <span className="text-red-400 ml-2">({blockedCount} bloqueados)</span>}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o email..." className="flex-1" />
        <Select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          options={[
            { value: 'all', label: 'Todos los roles' },
            { value: 'admin', label: '🔧 Admins' },
            { value: 'profesor', label: '👨‍🏫 Profesores' },
            { value: 'alumno', label: '👤 Alumnos' }
          ]}
          className="w-full sm:w-40"
        />
        <Select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'active', label: '✓ Activos' },
            { value: 'blocked', label: '🚫 Bloqueados' }
          ]}
          className="w-full sm:w-40"
        />
      </div>

      {filteredMembers.length === 0 ? (
        <EmptyState icon={Users} title="No hay miembros" description="Invitá personas a tu gimnasio" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map(member => {
            const canViewProfile = userData?.roles?.includes('sysadmin') || userData?.roles?.includes('admin') || userData?.roles?.includes('profesor');

            return (
              <Card
                key={member.id}
                className={`${member.isBlocked ? 'border-red-500/30 bg-red-500/5' : ''} ${canViewProfile ? 'cursor-pointer hover:border-primary/50 transition-all' : ''}`}
                onClick={() => canViewProfile && setSelected(member) && setShowProgress(true)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      <Avatar name={member.name} size="lg" />
                      {member.isBlocked && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <ShieldX size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{member.name}</h3>
                        {member.id === userData.id && <Badge className="bg-blue-500/20 text-blue-400 flex-shrink-0">Vos</Badge>}
                      </div>
                      <div className="mt-1">
                        {getRoleBadges(member.roles)}
                      </div>
                      {member.isBlocked && (
                        <Badge className="mt-1 bg-red-500/20 text-red-400">🚫 Bloqueado</Badge>
                      )}
                    </div>
                  </div>

                  {/* Menú de acciones */}
                  {(canEdit || canBlock) && member.id !== userData.id && !member.roles?.includes('sysadmin') && (
                    <Dropdown trigger={
                      <button
                        className="p-2 hover:bg-gray-700 rounded-lg flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical size={18} />
                      </button>
                    }>
                      <DropdownItem icon={TrendingUp} onClick={(e) => { e.stopPropagation(); setSelected(member); setShowProgress(true); }}>
                        Ver progreso
                      </DropdownItem>
                      {canEdit && !member.roles?.includes('admin') && (
                        <DropdownItem icon={Shield} onClick={(e) => { e.stopPropagation(); setSelected(member); setShowModal(true); }}>
                          Gestionar roles
                        </DropdownItem>
                      )}
                      {canEdit && (
                        <DropdownItem icon={KeyRound} onClick={(e) => { e.stopPropagation(); setSelected(member); setShowResetPassword(true); }}>
                          Resetear contraseña
                        </DropdownItem>
                      )}
                      {canBlock && !member.roles?.includes('admin') && (
                        <DropdownItem
                          icon={member.isBlocked ? ShieldCheck : ShieldX}
                          danger={!member.isBlocked}
                          onClick={(e) => { e.stopPropagation(); setSelected(member); setShowBlockConfirm(true); }}
                        >
                          {member.isBlocked ? 'Desbloquear' : 'Bloquear'}
                        </DropdownItem>
                      )}
                    </Dropdown>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-700">
                  {member.phone && (
                    <p className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                      <Phone size={14} /> {member.phone}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mb-1">Desde: {formatDate(member.createdAt)}</p>
                  <p className="text-xs text-gray-400 truncate" title={member.email}>
                    {member.email}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de roles */}
      <RolesModal 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); setSelected(null); }} 
        onSave={handleSaveRoles} 
        member={selected}
        canAssignRole={canAssignRole}
        canRemoveRole={canRemoveRole}
      />

      {/* Confirmación de bloqueo */}
      <ConfirmDialog
        isOpen={showBlockConfirm}
        onClose={() => { setShowBlockConfirm(false); setSelected(null); }}
        onConfirm={handleBlockToggle}
        title={selected?.isBlocked ? 'Desbloquear Usuario' : 'Bloquear Usuario'}
        message={selected?.isBlocked
          ? `¿Desbloquear a "${selected?.name}"? Podrá volver a acceder a la app.`
          : `¿Bloquear a "${selected?.name}"? No podrá acceder a la app hasta que lo desbloquees.`
        }
        confirmText={selected?.isBlocked ? 'Desbloquear' : 'Bloquear'}
        confirmVariant={selected?.isBlocked ? 'primary' : 'danger'}
      />

      {/* Confirmación de reseteo de contraseña */}
      <ConfirmDialog
        isOpen={showResetPassword}
        onClose={() => { setShowResetPassword(false); setSelected(null); }}
        onConfirm={handleResetPassword}
        title="Resetear Contraseña"
        message={`¿Resetear la contraseña de "${selected?.name}"? Se generará una contraseña temporal y el usuario deberá cambiarla al iniciar sesión.`}
        confirmText="Resetear Contraseña"
        confirmVariant="primary"
      />

      {/* Modal de progreso */}
      <ProgressModal
        isOpen={showProgress}
        onClose={() => { setShowProgress(false); setSelected(null); }}
        member={selected}
        prs={prs}
        routineSessions={routineSessions}
        classes={classes}
        wods={wods}
      />
    </div>
  );
};

const RolesModal = ({ isOpen, onClose, onSave, member, canAssignRole, canRemoveRole }) => {
  const [roles, setRoles] = useState(['alumno']);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (member) {
      setRoles(member.roles || ['alumno']);
    }
  }, [member, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave({ roles });
    setLoading(false);
  };

  const toggleRole = (role) => {
    const hasRole = roles.includes(role);
    
    if (hasRole) {
      if (!canRemoveRole(role)) return;
      if (role === 'alumno') return;
      setRoles(prev => prev.filter(r => r !== role));
    } else {
      if (!canAssignRole(role)) return;
      setRoles(prev => [...prev, role]);
    }
  };

  const availableRoles = [
    { id: 'profesor', name: 'Profesor', desc: 'Crear rutinas, WODs, validar PRs', icon: '👨‍🏫' },
    { id: 'admin', name: 'Admin', desc: 'Gestión completa del gimnasio', icon: '🔧' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Roles de ${member?.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          {availableRoles.map(role => {
            const hasRole = roles.includes(role.id);
            const canToggle = hasRole ? canRemoveRole(role.id) : canAssignRole(role.id);

            return (
              <label 
                key={role.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  hasRole ? 'bg-primary/20 border border-primary/50' : 'bg-gray-800/50 border border-gray-700'
                } ${!canToggle ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-700/50'}`}
              >
                <input 
                  type="checkbox" 
                  checked={hasRole} 
                  onChange={() => canToggle && toggleRole(role.id)}
                  disabled={!canToggle}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <p className="font-medium">{role.icon} {role.name}</p>
                  <p className="text-xs text-gray-400">{role.desc}</p>
                </div>
                {!canToggle && (
                  <span className="text-xs text-gray-500">Sin permiso</span>
                )}
              </label>
            );
          })}
        </div>

        <p className="text-xs text-gray-500">
          El rol de Alumno siempre está incluido.
        </p>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
};

const ProgressModal = ({ isOpen, onClose, member, prs, routineSessions, classes, wods }) => {
  const [filterPRStatus, setFilterPRStatus] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterWod, setFilterWod] = useState('all');

  if (!member) return null;

  const getMemberPRs = () => {
    let memberPRs = prs.filter(pr => pr.userId === member.id);

    if (filterPRStatus !== 'all') {
      memberPRs = memberPRs.filter(pr => pr.status === filterPRStatus);
    }

    // Filtrar por clase si hay un classId en el PR
    if (filterClass !== 'all') {
      memberPRs = memberPRs.filter(pr => pr.classId === filterClass);
    }

    // Filtrar por WOD si hay un wodId en el PR
    if (filterWod !== 'all') {
      memberPRs = memberPRs.filter(pr => pr.wodId === filterWod);
    }

    return memberPRs;
  };

  const getMemberSessions = () => {
    return routineSessions.filter(s => s.userId === member.id);
  };

  const getMemberStats = () => {
    const memberPRs = prs.filter(pr => pr.userId === member.id);
    const memberSessions = routineSessions.filter(s => s.userId === member.id);

    const validated = memberPRs.filter(pr => pr.status === 'validated').length;
    const pending = memberPRs.filter(pr => pr.status === 'pending').length;
    const improved = memberPRs.filter(pr => pr.improvement && pr.improvement > 0).length;

    return {
      totalPRs: memberPRs.length,
      validatedPRs: validated,
      pendingPRs: pending,
      improvedPRs: improved,
      totalSessions: memberSessions.length,
      lastActivity: memberPRs.length > 0 || memberSessions.length > 0
        ? formatDate(
            [...memberPRs, ...memberSessions]
              .map(item => item.date?.toDate?.() || item.createdAt?.toDate?.())
              .sort((a, b) => b - a)[0]
          )
        : 'Sin actividad'
    };
  };

  const stats = getMemberStats();
  const memberPRs = getMemberPRs();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Progreso de ${member.name}`}>
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <Trophy size={14} />
              <span>PRs Totales</span>
            </div>
            <p className="text-2xl font-bold text-primary">{stats.totalPRs}</p>
            <p className="text-xs text-gray-500">
              {stats.validatedPRs} validados, {stats.pendingPRs} pendientes
            </p>
          </div>

          <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <TrendingUp size={14} />
              <span>Mejoras</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.improvedPRs}</p>
            <p className="text-xs text-gray-500">
              {stats.totalSessions} sesiones completadas
            </p>
          </div>
        </div>

        <div className="p-3 bg-gray-800/30 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar size={14} />
              <span>Última actividad:</span>
            </div>
            <span className="font-medium text-gray-300">{stats.lastActivity}</span>
          </div>
        </div>

        {/* Contacto de emergencia */}
        {(member.emergencyContact || member.emergencyPhone) && (
          <Card className="bg-red-500/10 border-red-500/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-red-400" size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-400 mb-2">Contacto de Emergencia</h4>
                {member.emergencyContact && (
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <Users size={14} className="text-gray-400" />
                    <span className="text-gray-300">{member.emergencyContact}</span>
                  </div>
                )}
                {member.emergencyPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={14} className="text-gray-400" />
                    <a href={`tel:${member.emergencyPhone}`} className="text-primary hover:underline">
                      {member.emergencyPhone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            value={filterPRStatus}
            onChange={e => setFilterPRStatus(e.target.value)}
            options={[
              { value: 'all', label: 'Todos los PRs' },
              { value: 'validated', label: 'Solo validados' },
              { value: 'pending', label: 'Solo pendientes' },
              { value: 'rejected', label: 'Solo rechazados' }
            ]}
            className="w-full"
          />

          <Select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            options={[
              { value: 'all', label: 'Todas las clases' },
              ...classes.map(c => ({ value: c.id, label: c.name || 'Sin nombre' }))
            ]}
            className="w-full"
          />

          <Select
            value={filterWod}
            onChange={e => setFilterWod(e.target.value)}
            options={[
              { value: 'all', label: 'Todos los WODs' },
              ...wods.map(w => ({ value: w.id, label: w.name || 'Sin nombre' }))
            ]}
            className="w-full"
          />
        </div>

        {/* Lista de PRs */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {memberPRs.length === 0 ? (
            <EmptyState icon={Trophy} title="Sin PRs" description="Este alumno no tiene PRs registrados" />
          ) : (
            memberPRs.map(pr => (
              <div key={pr.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                <div className="flex-1">
                  <p className="font-medium">{pr.exerciseName}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <span>{formatDate(pr.date || pr.createdAt)}</span>
                    <Badge className={
                      pr.status === 'validated' ? 'bg-green-500/20 text-green-400' :
                      pr.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }>
                      {pr.status === 'validated' ? 'Validado' : pr.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">
                    {pr.measureType === 'time' ? (() => {
                      const mins = Math.floor(pr.value / 60);
                      const secs = pr.value % 60;
                      return `${mins}:${secs.toString().padStart(2, '0')}`;
                    })() : pr.value}
                  </p>
                  {pr.improvement != null && (
                    <p className={`text-xs font-semibold ${pr.improvement > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pr.improvement > 0 ? <ArrowUp size={10} className="inline" /> : <ArrowDown size={10} className="inline" />}
                      {Math.abs(pr.improvement).toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

const Members = () => (<GymRequired><MembersContent /></GymRequired>);
export default Members;
