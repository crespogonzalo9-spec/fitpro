import React, { useState, useEffect } from 'react';
import { TrendingUp, User, Trophy, Calendar, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, Select, SearchInput, EmptyState, LoadingState, Badge, Avatar, GymRequired } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { formatDate } from '../utils/helpers';

const MemberProgressContent = () => {
  const { userData, isProfesor, isSysadmin } = useAuth();
  const { currentGym } = useGym();

  const [members, setMembers] = useState([]);
  const [prs, setPrs] = useState([]);
  const [routineSessions, setRoutineSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [filterPRStatus, setFilterPRStatus] = useState('all');

  const canView = isProfesor() || isSysadmin();

  useEffect(() => {
    if (!currentGym?.id || !canView) {
      setLoading(false);
      return;
    }

    // Cargar alumnos
    const membersQuery = query(collection(db, 'users'), where('gymId', '==', currentGym.id));
    const unsubMembers = onSnapshot(membersQuery, (snap) => {
      const allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filtrar solo alumnos
      const alums = allUsers.filter(u =>
        u.roles?.includes('alumno') || !u.roles || u.roles.length === 0
      );
      setMembers(alums);
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

    return () => { unsubMembers(); unsubPRs(); unsubSessions(); };
  }, [currentGym, canView]);

  const getFilteredMembers = () => {
    if (!search) return members;
    const s = search.toLowerCase();
    return members.filter(m =>
      m.name?.toLowerCase().includes(s) ||
      m.email?.toLowerCase().includes(s)
    );
  };

  const getMemberPRs = (memberId) => {
    let memberPRs = prs.filter(pr => pr.userId === memberId);

    if (filterPRStatus !== 'all') {
      memberPRs = memberPRs.filter(pr => pr.status === filterPRStatus);
    }

    return memberPRs;
  };

  const getMemberSessions = (memberId) => {
    return routineSessions.filter(s => s.userId === memberId);
  };

  const getMemberStats = (memberId) => {
    const memberPRs = prs.filter(pr => pr.userId === memberId);
    const memberSessions = routineSessions.filter(s => s.userId === memberId);

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

  const filteredMembers = getFilteredMembers();

  if (loading) return <LoadingState />;
  if (!canView) return <EmptyState icon={TrendingUp} title="Sin permisos" description="Solo profesores y admins pueden ver esta sección" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Progreso de Alumnos</h1>
          <p className="text-gray-400">{filteredMembers.length} alumnos en {currentGym?.name}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar alumno..."
          className="flex-1"
        />
        <Select
          value={filterPRStatus}
          onChange={e => setFilterPRStatus(e.target.value)}
          options={[
            { value: 'all', label: 'Todos los PRs' },
            { value: 'validated', label: 'Solo validados' },
            { value: 'pending', label: 'Solo pendientes' }
          ]}
          className="w-full sm:w-48"
        />
      </div>

      {/* Lista de alumnos */}
      {filteredMembers.length === 0 ? (
        <EmptyState
          icon={User}
          title="No hay alumnos"
          description={members.length === 0 ? "No hay alumnos registrados en este gimnasio" : "No se encontraron alumnos con esos filtros"}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map(member => {
            const stats = getMemberStats(member.id);
            const memberPRs = getMemberPRs(member.id);
            const isExpanded = selectedMember === member.id;

            return (
              <Card
                key={member.id}
                className={`hover:border-primary/30 transition-all cursor-pointer ${isExpanded ? 'border-primary' : ''}`}
                onClick={() => setSelectedMember(isExpanded ? null : member.id)}
              >
                <div className="flex items-start gap-3 mb-4">
                  <Avatar name={member.name} size="lg" />
                  <div className="flex-1">
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-sm text-gray-400">{member.email}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="p-2 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                      <Trophy size={12} />
                      <span>PRs</span>
                    </div>
                    <p className="text-lg font-bold text-primary">{stats.totalPRs}</p>
                    <p className="text-xs text-gray-500">
                      {stats.validatedPRs} validados
                    </p>
                  </div>

                  <div className="p-2 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                      <TrendingUp size={12} />
                      <span>Mejoras</span>
                    </div>
                    <p className="text-lg font-bold text-green-400">{stats.improvedPRs}</p>
                    <p className="text-xs text-gray-500">
                      {stats.totalSessions} sesiones
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-700">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>Última actividad:</span>
                    </div>
                    <span className="font-medium">{stats.lastActivity}</span>
                  </div>
                </div>

                {/* PRs expandidos */}
                {isExpanded && memberPRs.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700 space-y-2">
                    <p className="text-sm font-medium text-gray-300">PRs recientes:</p>
                    {memberPRs.slice(0, 5).map(pr => (
                      <div key={pr.id} className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{pr.exerciseName}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
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
                          <p className="text-sm font-bold text-primary">
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
                    ))}
                    {memberPRs.length > 5 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{memberPRs.length - 5} PRs más
                      </p>
                    )}
                  </div>
                )}

                {isExpanded && memberPRs.length === 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-sm text-gray-500 text-center">Sin PRs registrados</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MemberProgress = () => (<GymRequired><MemberProgressContent /></GymRequired>);
export default MemberProgress;
