import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, MapPin, Save, Camera, Shield, Building2, Award, TrendingUp, Clock, Dumbbell } from 'lucide-react';
import { Button, Card, Input, Textarea, Avatar, Badge, LoadingState, Modal } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { formatDate, getRoleName } from '../utils/helpers';
import { compressImage } from '../utils/imageUtils';

const Profile = () => {
  const { userData, refreshUserData } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ prs: 0, validatedPrs: 0 });
  const [routineStats, setRoutineStats] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    phone: '',
    birthDate: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    bio: '',
    photoURL: ''
  });

  useEffect(() => {
    if (userData) {
      setForm({
        name: userData.name || '',
        phone: userData.phone || '',
        birthDate: userData.birthDate || '',
        address: userData.address || '',
        emergencyContact: userData.emergencyContact || '',
        emergencyPhone: userData.emergencyPhone || '',
        bio: userData.bio || '',
        photoURL: userData.photoURL || ''
      });
    }
  }, [userData]);

  // Cargar estadísticas del usuario
  useEffect(() => {
    const loadStats = async () => {
      if (!userData?.id || !currentGym?.id) return;

      try {
        // PRs
        const prsQuery = query(
          collection(db, 'prs'),
          where('gymId', '==', currentGym.id),
          where('userId', '==', userData.id)
        );
        const prsSnap = await getDocs(prsQuery);
        const allPrs = prsSnap.docs.map(d => d.data());

        setStats({
          prs: allPrs.length,
          validatedPrs: allPrs.filter(pr => pr.status === 'validated').length
        });

        // Estadísticas de rutinas
        const routineSessionsQuery = query(
          collection(db, 'routine_sessions'),
          where('userId', '==', userData.id),
          where('gymId', '==', currentGym.id)
        );
        const routineSessionsSnap = await getDocs(routineSessionsQuery);
        const sessions = routineSessionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        if (sessions.length > 0) {
          // Última sesión
          sessions.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
          const lastSession = sessions[0];

          // Sesiones del último mes
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          const monthlySessions = sessions.filter(s => {
            const date = s.createdAt?.toDate?.() || new Date(0);
            return date >= oneMonthAgo;
          });

          // Tiempos promedio por rutina
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
          })).sort((a, b) => b.count - a.count);

          // Tiempos promedio por ejercicio
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
          })).sort((a, b) => b.count - a.count);

          setRoutineStats({
            totalSessions: sessions.length,
            monthlySessions: monthlySessions.length,
            lastRoutineTime: lastSession.totalTimeInSeconds,
            lastRoutineName: lastSession.routineName,
            lastRoutineDate: lastSession.createdAt,
            routineAverages,
            exerciseAverages
          });
        }
      } catch (err) {
        console.error('Error loading stats:', err);
      }
    };

    loadStats();
  }, [userData, currentGym]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      showError('El nombre es obligatorio');
      return;
    }
    
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', userData.id), {
        name: form.name.trim(),
        phone: form.phone || null,
        birthDate: form.birthDate || null,
        address: form.address || null,
        emergencyContact: form.emergencyContact || null,
        emergencyPhone: form.emergencyPhone || null,
        bio: form.bio || null,
        photoURL: form.photoURL || null,
        updatedAt: serverTimestamp()
      });
      
      if (refreshUserData) await refreshUserData();
      success('Perfil actualizado');
    } catch (err) {
      console.error('Error updating profile:', err);
      showError('Error al guardar');
    }
    setSaving(false);
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const compressed = await compressImage(file, 256, 256, 0.8);
      setForm({ ...form, photoURL: compressed });
      setShowPhotoModal(false);
    } catch (err) {
      showError('Error al procesar la imagen');
    }
  };

  if (!userData) return <LoadingState />;

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="relative">
          <div 
            className="w-24 h-24 rounded-2xl bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-gray-700 cursor-pointer hover:border-primary transition-colors"
            onClick={() => setShowPhotoModal(true)}
          >
            {form.photoURL ? (
              <img src={form.photoURL} alt={form.name} className="w-full h-full object-cover" />
            ) : (
              <Avatar name={form.name} size="lg" className="w-full h-full text-3xl" />
            )}
          </div>
          <button 
            onClick={() => setShowPhotoModal(true)}
            className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/80 transition-colors"
          >
            <Camera size={16} className="text-white" />
          </button>
        </div>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{userData.name}</h1>
          <p className="text-gray-400">{userData.email}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {userData.roles?.map(role => (
              <Badge 
                key={role} 
                className={
                  role === 'sysadmin' ? 'bg-yellow-500/20 text-yellow-400' :
                  role === 'admin' ? 'bg-blue-500/20 text-blue-400' :
                  role === 'profesor' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-gray-500/20 text-gray-400'
                }
              >
                {getRoleName(role)}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Stats rápidas */}
      {currentGym && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="text-center">
            <Building2 size={24} className="mx-auto mb-2 text-primary" />
            <p className="text-sm text-gray-400">Gimnasio</p>
            <p className="font-semibold truncate">{currentGym.name}</p>
          </Card>
          <Card className="text-center">
            <Award size={24} className="mx-auto mb-2 text-yellow-500" />
            <p className="text-sm text-gray-400">PRs Totales</p>
            <p className="font-semibold text-xl">{stats.prs}</p>
          </Card>
          <Card className="text-center">
            <TrendingUp size={24} className="mx-auto mb-2 text-green-500" />
            <p className="text-sm text-gray-400">PRs Validados</p>
            <p className="font-semibold text-xl">{stats.validatedPrs}</p>
          </Card>
          <Card className="text-center">
            <Calendar size={24} className="mx-auto mb-2 text-blue-500" />
            <p className="text-sm text-gray-400">Miembro desde</p>
            <p className="font-semibold text-sm">{formatDate(userData.createdAt)}</p>
          </Card>
        </div>
      )}

      {/* Estadísticas de rutinas */}
      {routineStats && (
        <>
          <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock size={20} className="text-blue-400" />
              Estadísticas de Rutinas
            </h2>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-gray-800/50 rounded-xl">
                <p className="text-sm text-gray-400 mb-1">Última rutina completada</p>
                <p className="text-2xl font-bold text-primary">
                  {Math.floor(routineStats.lastRoutineTime / 60)}:{(routineStats.lastRoutineTime % 60).toString().padStart(2, '0')}
                </p>
                <p className="text-xs text-gray-500 mt-1">{routineStats.lastRoutineName}</p>
                <p className="text-xs text-gray-600 mt-1">{formatDate(routineStats.lastRoutineDate)}</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-xl">
                <p className="text-sm text-gray-400 mb-1">Rutinas este mes</p>
                <p className="text-2xl font-bold text-green-400">{routineStats.monthlySessions}</p>
                <p className="text-xs text-gray-500 mt-1">Total histórico: {routineStats.totalSessions}</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-xl">
                <p className="text-sm text-gray-400 mb-1">Rutinas registradas</p>
                <p className="text-2xl font-bold text-purple-400">{routineStats.routineAverages.length}</p>
                <p className="text-xs text-gray-500 mt-1">Diferentes rutinas completadas</p>
              </div>
            </div>
          </Card>

          {/* Promedio por rutina */}
          <Card>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Dumbbell size={20} className="text-blue-400" />
              Tiempo Promedio por Rutina (Último Mes)
            </h2>
            {routineStats.routineAverages.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay datos del último mes</p>
            ) : (
              <div className="space-y-3">
                {routineStats.routineAverages.map((routine, idx) => (
                  <div key={routine.routineId} className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-sm font-bold text-blue-400">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{routine.routineName}</p>
                      <p className="text-xs text-gray-500">{routine.count} sesiones completadas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        {Math.floor(routine.avgTime / 60)}:{Math.round(routine.avgTime % 60).toString().padStart(2, '0')}
                      </p>
                      <p className="text-xs text-gray-500">promedio</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Promedio por ejercicio */}
          <Card>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-green-400" />
              Tiempo Promedio por Ejercicio (Último Mes)
            </h2>
            {routineStats.exerciseAverages.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay datos del último mes</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {routineStats.exerciseAverages.map((exercise, idx) => (
                  <div key={exercise.exerciseId} className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-xl">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center text-sm font-bold text-green-400">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{exercise.exerciseName}</p>
                      <p className="text-xs text-gray-500">{exercise.count} veces realizado</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400">
                        {Math.floor(exercise.avgTime / 60)}:{Math.round(exercise.avgTime % 60).toString().padStart(2, '0')}
                      </p>
                      <p className="text-xs text-gray-500">promedio</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Formulario de edición */}
      <Card>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User size={20} className="text-primary" />
          Información Personal
        </h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Nombre completo *"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Tu nombre"
          />
          
          <Input
            label="Teléfono"
            type="tel"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            placeholder="+54 11 1234-5678"
          />
          
          <Input
            label="Fecha de nacimiento"
            type="date"
            value={form.birthDate}
            onChange={e => setForm({ ...form, birthDate: e.target.value })}
          />
          
          <Input
            label="Dirección"
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
            placeholder="Tu dirección"
          />
        </div>
      </Card>

      {/* Contacto de emergencia */}
      <Card>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield size={20} className="text-red-400" />
          Contacto de Emergencia
        </h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Nombre del contacto"
            value={form.emergencyContact}
            onChange={e => setForm({ ...form, emergencyContact: e.target.value })}
            placeholder="Nombre de familiar o amigo"
          />
          
          <Input
            label="Teléfono de emergencia"
            type="tel"
            value={form.emergencyPhone}
            onChange={e => setForm({ ...form, emergencyPhone: e.target.value })}
            placeholder="+54 11 1234-5678"
          />
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Esta información solo será visible para los administradores del gimnasio en caso de emergencia.
        </p>
      </Card>

      {/* Bio */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Sobre mí</h2>
        <Textarea
          value={form.bio}
          onChange={e => setForm({ ...form, bio: e.target.value })}
          placeholder="Contanos un poco sobre vos, tus objetivos de entrenamiento, etc."
          rows={4}
        />
      </Card>

      {/* Información de cuenta (solo lectura) */}
      <Card className="bg-gray-800/50">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Mail size={20} className="text-gray-400" />
          Información de Cuenta
        </h2>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Email</span>
            <span>{userData.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">ID de usuario</span>
            <span className="font-mono text-xs">{userData.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Registrado</span>
            <span>{formatDate(userData.createdAt)}</span>
          </div>
          {userData.lastLogin && (
            <div className="flex justify-between">
              <span className="text-gray-400">Último acceso</span>
              <span>{formatDate(userData.lastLogin)}</span>
            </div>
          )}
        </div>
        
        <p className="text-xs text-gray-500 mt-4">
          El email no puede ser modificado. Si necesitás cambiarlo, contactá con un administrador.
        </p>
      </Card>

      {/* Botón guardar */}
      <div className="flex justify-end">
        <Button 
          icon={Save} 
          onClick={handleSave} 
          loading={saving}
          size="lg"
        >
          Guardar Cambios
        </Button>
      </div>

      {/* Modal de foto */}
      <Modal isOpen={showPhotoModal} onClose={() => setShowPhotoModal(false)} title="Cambiar foto de perfil">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-2xl bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-gray-700">
              {form.photoURL ? (
                <img src={form.photoURL} alt={form.name} className="w-full h-full object-cover" />
              ) : (
                <Avatar name={form.name} size="lg" className="w-full h-full text-4xl" />
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <label className="w-full">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <div className="w-full py-3 bg-primary hover:bg-primary/80 text-white font-medium rounded-xl text-center cursor-pointer transition-colors">
                📷 Subir nueva foto
              </div>
            </label>
            
            {form.photoURL && (
              <Button 
                variant="danger" 
                onClick={() => setForm({ ...form, photoURL: '' })}
                className="w-full"
              >
                Eliminar foto
              </Button>
            )}
            
            <Button 
              variant="secondary" 
              onClick={() => setShowPhotoModal(false)}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
