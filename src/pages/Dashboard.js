import React, { useState, useEffect } from 'react';
import { Users, Calendar, Dumbbell, TrendingUp, Clock, ChevronRight, Flame, Award, Building2, Mail, UserPlus, Globe } from 'lucide-react';
import { Card, Badge, Avatar, EmptyState, LoadingState, Button } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { getRoleName, getRolesNames, formatRelativeDate, formatDate } from '../utils/helpers';

const Dashboard = () => {
  const { userData, isSysadmin, isAdmin, isProfesor, isAlumno } = useAuth();
  const { currentGym, availableGyms, selectGym, viewAllGyms } = useGym();
  
  const [stats, setStats] = useState({ members: 0, classes: 0, wods: 0, prs: 0, gyms: 0 });
  const [recentWods, setRecentWods] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentRoutineSessions, setRecentRoutineSessions] = useState([]);
  const [routineStats, setRoutineStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Modo "Todos los gimnasios" para sysadmin
    if (viewAllGyms && isSysadmin()) {
      loadAllGymsStats();
      return;
    }

    if (!currentGym?.id) {
      setLoading(false);
      return;
    }

    // Cargar estadísticas del gimnasio seleccionado
    const membersQuery = query(collection(db, 'users'), where('gymId', '==', currentGym.id));
    const classesQuery = query(collection(db, 'classes'), where('gymId', '==', currentGym.id));
    const wodsQuery = query(collection(db, 'wods'), where('gymId', '==', currentGym.id));
    const prsQuery = query(collection(db, 'prs'), where('gymId', '==', currentGym.id), where('status', '==', 'validated'));

    const unsubs = [];

    unsubs.push(onSnapshot(membersQuery, snap => setStats(prev => ({ ...prev, members: snap.size }))));
    unsubs.push(onSnapshot(classesQuery, snap => setStats(prev => ({ ...prev, classes: snap.size }))));
    unsubs.push(onSnapshot(wodsQuery, snap => {
      setStats(prev => ({ ...prev, wods: snap.size }));
      const wods = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      wods.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
      setRecentWods(wods.slice(0, 3));
    }));
    unsubs.push(onSnapshot(prsQuery, snap => setStats(prev => ({ ...prev, prs: snap.size }))));

    // Cargar sesiones de rutinas del usuario
    const routineSessionsQuery = query(
      collection(db, 'routine_sessions'),
      where('userId', '==', userData.id),
      where('gymId', '==', currentGym.id)
    );
    unsubs.push(onSnapshot(routineSessionsQuery, snap => {
      const sessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      sessions.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
      setRecentRoutineSessions(sessions.slice(0, 5));

      // Calcular estadísticas
      if (sessions.length > 0) {
        const lastSession = sessions[0];
        const lastRoutineId = lastSession.routineId;

        // Sesiones del último mes
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const monthlySessions = sessions.filter(s => {
          const date = s.createdAt?.toDate?.() || new Date(0);
          return date >= oneMonthAgo;
        });

        // Tiempos promedio por rutina (último mes)
        const routineTimes = {};
        monthlySessions.forEach(s => {
          if (!routineTimes[s.routineId]) {
            routineTimes[s.routineId] = { times: [], name: s.routineName };
          }
          routineTimes[s.routineId].times.push(s.totalTimeInSeconds);
        });

        const routineAverages = Object.keys(routineTimes).map(routineId => ({
          routineId,
          routineName: routineTimes[routineId].name,
          avgTime: routineTimes[routineId].times.reduce((a, b) => a + b, 0) / routineTimes[routineId].times.length,
          count: routineTimes[routineId].times.length
        }));

        // Tiempos promedio por ejercicio (último mes)
        const exerciseTimes = {};
        monthlySessions.forEach(s => {
          s.exerciseTimes?.forEach(ex => {
            if (!exerciseTimes[ex.exerciseId]) {
              exerciseTimes[ex.exerciseId] = { times: [], name: ex.exerciseName };
            }
            exerciseTimes[ex.exerciseId].times.push(ex.timeInSeconds);
          });
        });

        const exerciseAverages = Object.keys(exerciseTimes).map(exerciseId => ({
          exerciseId,
          exerciseName: exerciseTimes[exerciseId].name,
          avgTime: exerciseTimes[exerciseId].times.reduce((a, b) => a + b, 0) / exerciseTimes[exerciseId].times.length,
          count: exerciseTimes[exerciseId].times.length
        }));

        setRoutineStats({
          lastRoutineTime: lastSession.totalTimeInSeconds,
          lastRoutineName: lastSession.routineName,
          routineAverages,
          exerciseAverages
        });
      }
    }));

    // Próximos eventos
    const eventsQuery = query(collection(db, 'events'), where('gymId', '==', currentGym.id));
    unsubs.push(onSnapshot(eventsQuery, snap => {
      const events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const upcoming = events.filter(e => {
        const date = e.date?.toDate ? e.date.toDate() : new Date(e.date);
        return date >= new Date();
      }).sort((a, b) => {
        const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const db = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return da - db;
      });
      setUpcomingEvents(upcoming.slice(0, 3));
    }));

    setLoading(false);

    return () => unsubs.forEach(u => u());
  }, [currentGym, viewAllGyms, isSysadmin]);

  const loadAllGymsStats = async () => {
    try {
      const [usersSnap, classesSnap, wodsSnap, prsSnap, gymsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'classes')),
        getDocs(collection(db, 'wods')),
        getDocs(query(collection(db, 'prs'), where('status', '==', 'validated'))),
        getDocs(collection(db, 'gyms'))
      ]);

      setStats({
        members: usersSnap.size,
        classes: classesSnap.size,
        wods: wodsSnap.size,
        prs: prsSnap.size,
        gyms: gymsSnap.size
      });

      // WODs recientes de todos los gimnasios
      const wods = wodsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      wods.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
      setRecentWods(wods.slice(0, 5));

      setLoading(false);
    } catch (err) {
      console.error('Error loading all gyms stats:', err);
      setLoading(false);
    }
  };

  // Sysadmin viendo todos los gimnasios
  if (viewAllGyms && isSysadmin()) {
    if (loading) return <LoadingState />;
    
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Hola, {userData?.name} 👑</h1>
            <p className="text-gray-400 flex items-center gap-2">
              <Globe size={16} className="text-blue-400" />
              Vista global - Todos los gimnasios
            </p>
          </div>
          <Badge className="bg-blue-500/20 text-blue-400">Sysadmin</Badge>
        </div>

        {/* Stats globales */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={Building2} label="Gimnasios" value={stats.gyms} color="yellow" />
          <StatCard icon={Users} label="Usuarios" value={stats.members} color="blue" />
          <StatCard icon={Calendar} label="Clases" value={stats.classes} color="green" />
          <StatCard icon={Flame} label="WODs" value={stats.wods} color="orange" />
          <StatCard icon={Award} label="PRs Validados" value={stats.prs} color="purple" />
        </div>

        {/* Lista de gimnasios */}
        <Card>
          <h3 className="font-semibold mb-4">Gimnasios ({availableGyms.length})</h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {availableGyms.map(gym => (
              <div 
                key={gym.id}
                onClick={() => selectGym(gym.id)}
                className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-xl cursor-pointer hover:bg-gray-700/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-700 flex items-center justify-center overflow-hidden">
                  {gym.logo ? (
                    <img src={gym.logo} alt={gym.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="text-gray-400" size={20} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{gym.name}</p>
                  <p className="text-xs text-gray-500 truncate">{gym.address || 'Sin dirección'}</p>
                </div>
                <ChevronRight size={16} className="text-gray-500" />
              </div>
            ))}
          </div>
        </Card>

        {/* WODs Recientes globales */}
        <Card>
          <h3 className="font-semibold mb-4">WODs Recientes (Global)</h3>
          {recentWods.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay WODs</p>
          ) : (
            <div className="space-y-3">
              {recentWods.map(wod => (
                <div key={wod.id} className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-xl">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Flame className="text-orange-500" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{wod.name}</p>
                    <p className="text-xs text-gray-500">
                      {availableGyms.find(g => g.id === wod.gymId)?.name || 'Gimnasio'} • {formatRelativeDate(wod.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Sysadmin sin gimnasio seleccionado (y sin viewAllGyms)
  if (isSysadmin() && !currentGym && !viewAllGyms) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-bold">Hola, {userData?.name} 👑</h1>
          <p className="text-gray-400">Panel de Sysadmin</p>
        </div>

        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-center gap-4">
            <Building2 className="text-yellow-500" size={32} />
            <div>
              <h3 className="font-semibold text-yellow-400">Seleccioná un gimnasio</h3>
              <p className="text-gray-400 text-sm">Como Sysadmin, podés acceder a cualquier gimnasio o ver todos</p>
            </div>
          </div>
        </Card>

        {availableGyms.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableGyms.map(gym => (
              <Card 
                key={gym.id} 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => selectGym(gym.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gray-700 flex items-center justify-center overflow-hidden">
                    {gym.logo ? (
                      <img src={gym.logo} alt={gym.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="text-gray-400" size={24} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{gym.name}</h3>
                    <p className="text-sm text-gray-400">{gym.address || 'Sin dirección'}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState 
              icon={Building2} 
              title="No hay gimnasios" 
              description="Creá el primer gimnasio desde la sección Gimnasios"
              action={<Link to="/gyms"><Button icon={Building2}>Ir a Gimnasios</Button></Link>}
            />
          </Card>
        )}
      </div>
    );
  }

  // Usuario sin gimnasio asignado
  if (!currentGym) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-bold">Hola, {userData?.name}</h1>
          <p className="text-gray-400">{getRolesNames(userData?.roles)}</p>
        </div>

        <Card className="bg-blue-500/10 border-blue-500/30">
          <div className="flex flex-col items-center text-center py-8">
            <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
              <Building2 className="text-blue-400" size={40} />
            </div>
            <h3 className="text-xl font-semibold text-blue-400 mb-2">Sin gimnasio asignado</h3>
            <p className="text-gray-400 mb-6 max-w-md">
              Todavía no estás asociado a ningún gimnasio. Necesitás una invitación de un 
              gimnasio para poder acceder a todas las funciones.
            </p>
            <div className="flex flex-col gap-3 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Mail size={16} />
                <span>Pedile al administrador de tu gimnasio que te envíe una invitación</span>
              </div>
              <div className="flex items-center gap-2">
                <UserPlus size={16} />
                <span>O usá un link de invitación si ya tenés uno</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold mb-4">Tu cuenta</h3>
          <div className="flex items-center gap-4">
            <Avatar name={userData?.name} size="lg" />
            <div>
              <p className="font-medium">{userData?.name}</p>
              <p className="text-sm text-gray-400">{userData?.email}</p>
              <div className="mt-1">
                {userData?.roles?.map(role => (
                  <Badge key={role} className="mr-1 bg-gray-500/20 text-gray-400">
                    {getRoleName(role)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Dashboard normal con gimnasio
  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Hola, {userData?.name}</h1>
          <p className="text-gray-400">{currentGym?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {userData?.roles?.filter(r => r !== 'alumno').map(role => (
            <Badge key={role} className={
              role === 'sysadmin' ? 'bg-yellow-500/20 text-yellow-400' :
              role === 'admin' ? 'bg-blue-500/20 text-blue-400' :
              'bg-purple-500/20 text-purple-400'
            }>
              {getRoleName(role)}
            </Badge>
          ))}
        </div>
      </div>

      {/* Stats */}
      {(isAdmin() || isProfesor() || isSysadmin()) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Miembros" value={stats.members} color="blue" />
          <StatCard icon={Calendar} label="Clases" value={stats.classes} color="green" />
          <StatCard icon={Flame} label="WODs" value={stats.wods} color="orange" />
          <StatCard icon={Award} label="PRs Validados" value={stats.prs} color="purple" />
        </div>
      )}

      {/* Estadísticas de rutinas personales */}
      {isAlumno() && recentRoutineSessions.length > 0 && routineStats && (
        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock size={20} className="text-blue-400" />
            Tus Estadísticas de Rutinas
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-800/50 rounded-xl">
              <p className="text-sm text-gray-400 mb-1">Última rutina</p>
              <p className="text-xl font-bold text-primary">
                {Math.floor(routineStats.lastRoutineTime / 60)}:{(routineStats.lastRoutineTime % 60).toString().padStart(2, '0')}
              </p>
              <p className="text-xs text-gray-500 mt-1">{routineStats.lastRoutineName}</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-xl">
              <p className="text-sm text-gray-400 mb-1">Rutinas este mes</p>
              <p className="text-xl font-bold text-green-400">{recentRoutineSessions.length}</p>
              <p className="text-xs text-gray-500 mt-1">Sesiones completadas</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-xl">
              <p className="text-sm text-gray-400 mb-1">Tiempo total</p>
              <p className="text-xl font-bold text-purple-400">
                {Math.floor(recentRoutineSessions.reduce((sum, s) => sum + (s.totalTimeInSeconds || 0), 0) / 60)} min
              </p>
              <p className="text-xs text-gray-500 mt-1">Este mes</p>
            </div>
          </div>
          <Link to="/profile" className="text-primary text-sm hover:underline flex items-center gap-1 mt-4">
            Ver estadísticas completas <ChevronRight size={16} />
          </Link>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Rutinas Recientes */}
        {isAlumno() && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Rutinas Recientes</h3>
              <Link to="/routines" className="text-primary text-sm hover:underline flex items-center gap-1">
                Ver todas <ChevronRight size={16} />
              </Link>
            </div>
            {recentRoutineSessions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aún no completaste ninguna rutina</p>
            ) : (
              <div className="space-y-3">
                {recentRoutineSessions.map(session => (
                  <div key={session.id} className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Dumbbell className="text-blue-500" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{session.routineName}</p>
                      <p className="text-xs text-gray-500">
                        {formatRelativeDate(session.createdAt)} • {Math.floor(session.totalTimeInSeconds / 60)}:{(session.totalTimeInSeconds % 60).toString().padStart(2, '0')} min
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-400">{session.exerciseTimes?.length || 0}</p>
                      <p className="text-xs text-gray-500">ejercicios</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* WODs Recientes */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">WODs Recientes</h3>
            <Link to="/wods" className="text-primary text-sm hover:underline flex items-center gap-1">
              Ver todos <ChevronRight size={16} />
            </Link>
          </div>
          {recentWods.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay WODs</p>
          ) : (
            <div className="space-y-3">
              {recentWods.map(wod => (
                <div key={wod.id} className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-xl">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Flame className="text-orange-500" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{wod.name}</p>
                    <p className="text-xs text-gray-500">{formatRelativeDate(wod.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Próximos Eventos */}
        {!isAlumno() || recentRoutineSessions.length === 0 ? (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Próximos Eventos</h3>
              <Link to="/calendar" className="text-primary text-sm hover:underline flex items-center gap-1">
                Ver calendario <ChevronRight size={16} />
              </Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay eventos próximos</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-xl">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Calendar className="text-primary" size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{event.title}</p>
                      <p className="text-xs text-gray-500">{formatDate(event.date)} {event.time && `• ${event.time}`}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ) : null}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue: 'bg-blue-500/20 text-blue-500',
    green: 'bg-green-500/20 text-green-500',
    orange: 'bg-orange-500/20 text-orange-500',
    purple: 'bg-purple-500/20 text-purple-500',
    yellow: 'bg-yellow-500/20 text-yellow-500',
  };

  return (
    <Card className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
      </div>
    </Card>
  );
};

export default Dashboard;
