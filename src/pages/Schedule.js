import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Check, X } from 'lucide-react';
import { Card, Button, Badge, LoadingState, EmptyState, Modal , GymRequired } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, getDocs, updateDoc, increment } from 'firebase/firestore';
import { DAYS_OF_WEEK } from '../utils/constants';

const ScheduleContent = () => {
  const { userData } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  const [classes, setClasses] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);

  // Reset estados cuando cambia el gimnasio
  useEffect(() => {
    setClasses([]);
    setMyEnrollments([]);
    setLoading(true);
  }, [currentGym?.id]);

  useEffect(() => {
    if (!currentGym?.id) { 
      setClasses([]);
      setLoading(false); 
      return; 
    }

    const unsubClasses = onSnapshot(query(collection(db, 'classes'), where('gymId', '==', currentGym.id)), (snap) => {
      setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const unsubEnrollments = onSnapshot(query(collection(db, 'enrollments'), where('userId', '==', userData.id)), (snap) => {
      setMyEnrollments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubClasses(); unsubEnrollments(); };
  }, [currentGym, userData]);

  const isEnrolled = (classId) => myEnrollments.some(e => e.classId === classId);

  const handleEnroll = async (cls) => {
    if (isEnrolled(cls.id)) {
      // Cancelar inscripción
      try {
        const enrollment = myEnrollments.find(e => e.classId === cls.id);
        await deleteDoc(doc(db, 'enrollments', enrollment.id));
        await updateDoc(doc(db, 'classes', cls.id), { enrolledCount: increment(-1) });
        success('Inscripción cancelada');
      } catch (err) {
        showError('Error al cancelar');
      }
    } else {
      // Inscribirse
      if ((cls.enrolledCount || 0) >= cls.capacity) {
        showError('No hay cupos disponibles');
        return;
      }
      setEnrolling(cls.id);
      try {
        await addDoc(collection(db, 'enrollments'), {
          userId: userData.id,
          userName: userData.name,
          classId: cls.id,
          className: cls.name,
          gymId: currentGym.id,
          createdAt: serverTimestamp()
        });
        await updateDoc(doc(db, 'classes', cls.id), { enrolledCount: increment(1) });
        success('¡Inscripción exitosa!');
      } catch (err) {
        showError('Error al inscribirse');
      }
      setEnrolling(null);
    }
  };

  const groupedClasses = DAYS_OF_WEEK.slice(1, 7).concat(DAYS_OF_WEEK[0]).map(day => ({
    ...day,
    classes: classes.filter(c => c.dayOfWeek === day.id).sort((a, b) => a.startTime?.localeCompare(b.startTime))
  }));

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={Calendar} title="Sin gimnasio" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold">Horarios de Clases</h1>
        <p className="text-gray-400">Inscribite a las clases disponibles</p>
      </div>

      {groupedClasses.map(day => (
        <Card key={day.id}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-emerald-500" />{day.name}
          </h3>
          {day.classes.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Sin clases</p>
          ) : (
            <div className="space-y-3">
              {day.classes.map(cls => {
                const enrolled = isEnrolled(cls.id);
                const full = (cls.enrolledCount || 0) >= cls.capacity;
                return (
                  <div key={cls.id} className={`flex items-center justify-between p-4 rounded-xl transition-colors ${enrolled ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-gray-800/50'}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
                        <Clock size={24} />
                      </div>
                      <div>
                        <h4 className="font-semibold">{cls.name}</h4>
                        <p className="text-sm text-gray-400">{cls.startTime} - {cls.endTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={`font-semibold ${full ? 'text-red-500' : 'text-emerald-500'}`}>
                          {cls.enrolledCount || 0}/{cls.capacity}
                        </span>
                        <p className="text-xs text-gray-400">cupos</p>
                      </div>
                      <Button
                        variant={enrolled ? 'danger' : 'primary'}
                        size="sm"
                        onClick={() => handleEnroll(cls)}
                        disabled={!enrolled && full}
                        loading={enrolling === cls.id}
                      >
                        {enrolled ? <><X size={16} /> Cancelar</> : <><Check size={16} /> Inscribirse</>}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

const Schedule = () => (<GymRequired><ScheduleContent /></GymRequired>);
export default Schedule;
