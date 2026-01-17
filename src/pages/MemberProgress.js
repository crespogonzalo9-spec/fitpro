import React, { useState, useEffect } from 'react';
import { Card, LoadingState, EmptyState, ProgressChart } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { TrendingUp } from 'lucide-react';

const MemberProgress = () => {
  const { userData } = useAuth();
  const { currentGym } = useGym();
  const [sessions, setSessions] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.id || !currentGym?.id) return;

    const loadData = async () => {
      try {
        // Cargar sesiones de rutinas del usuario actual
        const sessionsQuery = query(
          collection(db, 'routine_sessions'),
          where('userId', '==', userData.id),
          where('gymId', '==', currentGym.id),
          orderBy('completedAt', 'desc')
        );
        const sessionsSnap = await getDocs(sessionsQuery);
        const sessionsData = sessionsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Cargar ejercicios
        const exercisesQuery = query(
          collection(db, 'exercises'),
          where('gymId', '==', currentGym.id)
        );
        const exercisesSnap = await getDocs(exercisesQuery);
        const exercisesData = exercisesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setSessions(sessionsData);
        setExercises(exercisesData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userData?.id, currentGym?.id]);

  if (loading) {
    return <LoadingState message="Cargando tu progreso..." />;
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Mi Progreso</h1>
          <p className="text-gray-400">Seguimiento de tu evolución en el entrenamiento</p>
        </div>

        <EmptyState
          icon={TrendingUp}
          title="Aún no tenés datos de progreso"
          description="Completá tu primera rutina para comenzar a ver tus estadísticas de progreso"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Mi Progreso</h1>
        <p className="text-gray-400">
          Seguimiento de tu evolución en el entrenamiento ({sessions.length} sesiones completadas)
        </p>
      </div>

      <ProgressChart sessions={sessions} exercises={exercises} />

      {/* Historial reciente */}
      <Card>
        <h3 className="text-lg font-bold mb-4">Historial Reciente</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sessions.slice(0, 10).map(session => {
            const date = session.completedAt?.toDate
              ? session.completedAt.toDate()
              : new Date(session.completedAt);
            const duration = Math.floor(session.totalTimeInSeconds / 60);
            const completedExercises = session.elementTimes?.filter(
              et => !et.skipped && et.timeInSeconds > 0
            ).length || 0;

            return (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{session.routineName}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                    <span>{date.toLocaleDateString('es-AR')}</span>
                    <span>{duration} min</span>
                    <span>{completedExercises} ejercicios</span>
                    {session.skippedCount > 0 && (
                      <span className="text-yellow-400">
                        {session.skippedCount} salteados
                      </span>
                    )}
                    {session.isEarlyFinish && (
                      <span className="text-orange-400">Finalizado anticipadamente</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default MemberProgress;
