import React, { useState, useEffect } from 'react';
import { CheckSquare, Calendar, Clock, MapPin, User, X, ArrowRight } from 'lucide-react';
import { Button, Card, EmptyState, LoadingState, Badge, ConfirmDialog, GymRequired } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { DAYS_OF_WEEK } from '../utils/constants';
import { useNavigate } from 'react-router-dom';

const MyClassesContent = () => {
  const { userData, isProfesor, isAdmin, isSysadmin } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  
  const [enrollments, setEnrollments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUnenroll, setShowUnenroll] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  // Determinar si es profesor/admin para mostrar clases a cargo
  const isStaff = isProfesor() || isAdmin() || isSysadmin();

  // Reset al cambiar gimnasio
  useEffect(() => {
    setEnrollments([]);
    setClasses([]);
    setLoading(true);
  }, [currentGym?.id]);

  useEffect(() => {
    if (!currentGym?.id || !userData?.id) {
      setLoading(false);
      return;
    }

    // Cargar clases del gimnasio
    const classesQuery = query(
      collection(db, 'classes'),
      where('gymId', '==', currentGym.id)
    );
    
    const unsubClasses = onSnapshot(classesQuery, (snap) => {
      setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Cargar inscripciones del usuario (filtrar localmente para evitar índice compuesto)
    const enrollQuery = query(
      collection(db, 'enrollments'),
      where('userId', '==', userData.id)
    );
    
    const unsubEnroll = onSnapshot(enrollQuery, (snap) => {
      // Filtrar por gymId localmente
      const userEnrollments = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(e => e.gymId === currentGym.id);
      setEnrollments(userEnrollments);
      setLoading(false);
    });

    return () => {
      unsubClasses();
      unsubEnroll();
    };
  }, [currentGym?.id, userData?.id]);

  // Obtener clases donde soy profesor
  const myTeachingClasses = isStaff 
    ? classes.filter(c => c.profesorId === userData?.id)
    : [];

  // Obtener datos de clase para una inscripción
  const getClassData = (enrollment) => {
    if (!enrollment) return null;
    return classes.find(c => c.id === enrollment.classId);
  };

  // Desinscribirse de una clase
  const handleUnenroll = async () => {
    if (!selectedEnrollment) return;
    
    try {
      await deleteDoc(doc(db, 'enrollments', selectedEnrollment.id));
      
      // Actualizar contador de inscriptos
      const classDoc = doc(db, 'classes', selectedEnrollment.classId);
      await updateDoc(classDoc, { enrolledCount: increment(-1) });
      
      success('Te desinscribiste de la clase');
      setShowUnenroll(false);
      setSelectedEnrollment(null);
    } catch (err) {
      console.error('Error:', err);
      showError('Error al desinscribirse');
    }
  };

  const getDayName = (dayId) => DAYS_OF_WEEK.find(d => d.id === dayId)?.name || '';

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold">Mis Clases</h1>
        <p className="text-gray-400">
          {isStaff ? 'Clases que tenés a cargo y clases a las que estás inscripto' : 'Clases a las que estás inscripto'}
        </p>
      </div>

      {/* Clases que enseño (solo para profesores) */}
      {isStaff && myTeachingClasses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <User size={20} className="text-primary" />
            Clases a mi cargo ({myTeachingClasses.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myTeachingClasses.map(cls => (
              <Card key={cls.id} className="border-primary/30">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{cls.name}</h3>
                    <Badge className="mt-1 bg-primary/20 text-primary">Profesor</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{cls.enrolledCount || 0}</p>
                    <p className="text-xs text-gray-400">/{cls.capacity} inscriptos</p>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2 text-sm text-gray-400">
                  {cls.dayOfWeek !== undefined && (
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>{getDayName(cls.dayOfWeek)}</span>
                    </div>
                  )}
                  {cls.startTime && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>{cls.startTime} - {cls.endTime}</span>
                    </div>
                  )}
                  {cls.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      <span>{cls.location}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Divisor si hay ambas secciones */}
      {isStaff && myTeachingClasses.length > 0 && enrollments.length > 0 && (
        <hr className="border-gray-700" />
      )}

      {/* Clases inscriptas */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CheckSquare size={20} className="text-green-500" />
          Mis inscripciones ({enrollments.length})
        </h2>

        {enrollments.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No estás inscripto en ninguna clase"
            description="Andá a Horarios para ver las clases disponibles e inscribirte"
            action={
              <Button icon={ArrowRight} onClick={() => navigate('/schedule')}>
                Ver Horarios
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {enrollments.map(enrollment => {
              const cls = getClassData(enrollment);
              if (!cls) {
                // La clase fue eliminada pero la inscripción sigue
                return (
                  <Card key={enrollment.id} className="bg-red-500/10 border-red-500/30">
                    <div className="text-center py-4">
                      <p className="text-red-400">Clase no disponible</p>
                      <p className="text-sm text-gray-500 mt-1">{enrollment.className || 'Clase eliminada'}</p>
                      <Button
                        variant="danger"
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          setSelectedEnrollment(enrollment);
                          setShowUnenroll(true);
                        }}
                      >
                        Eliminar inscripción
                      </Button>
                    </div>
                  </Card>
                );
              }
              
              return (
                <Card key={enrollment.id} className="hover:border-gray-600 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{cls.name}</h3>
                      {cls.profesorName && (
                        <p className="text-sm text-gray-400">Prof. {cls.profesorName}</p>
                      )}
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">Inscripto</Badge>
                  </div>
                  
                  <div className="mt-4 space-y-2 text-sm text-gray-400">
                    {cls.dayOfWeek !== undefined && (
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>{getDayName(cls.dayOfWeek)}</span>
                      </div>
                    )}
                    {cls.startTime && (
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span>{cls.startTime} - {cls.endTime}</span>
                      </div>
                    )}
                    {cls.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} />
                        <span>{cls.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <Button
                      variant="danger"
                      size="sm"
                      icon={X}
                      onClick={() => {
                        setSelectedEnrollment(enrollment);
                        setShowUnenroll(true);
                      }}
                      className="w-full"
                    >
                      Desinscribirme
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showUnenroll}
        onClose={() => { setShowUnenroll(false); setSelectedEnrollment(null); }}
        onConfirm={handleUnenroll}
        title="Desinscribirse"
        message={`¿Seguro que querés desinscribirte de ${getClassData(selectedEnrollment)?.name || 'esta clase'}?`}
        confirmText="Desinscribirme"
      />
    </div>
  );
};

const MyClasses = () => (
  <GymRequired>
    <MyClassesContent />
  </GymRequired>
);

export default MyClasses;
