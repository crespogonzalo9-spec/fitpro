import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, X, Check, Timer, Coffee, Dumbbell, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button, Modal, Card } from './index';

const RoutineTimer = ({ routine, exercises, onClose, onComplete }) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [exerciseTime, setExerciseTime] = useState(0); // Tiempo del ejercicio actual en segundos
  const [restTime, setRestTime] = useState(0); // Tiempo restante de descanso
  const [exerciseTimes, setExerciseTimes] = useState([]); // Tiempos de cada ejercicio
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [completedSets, setCompletedSets] = useState([]); // Array de sets completados por ejercicio
  const [isPausedSession, setIsPausedSession] = useState(false); // Nueva: sesión pausada
  const [pausedData, setPausedData] = useState(null); // Datos de sesión pausada

  const timerRef = useRef(null);
  const currentExercise = routine.exercises[currentExerciseIndex];
  const exerciseData = exercises.find(e => e.id === currentExercise?.exerciseId);

  // Verificar si el ejercicio actual es de tiempo
  const isTimeBasedExercise = exerciseData?.measureType === 'time';
  const exerciseDurationInSeconds = isTimeBasedExercise ? parseInt(currentExercise.reps) * 60 : 0;

  // Inicializar array de tiempos y sets completados
  useEffect(() => {
    setExerciseTimes(routine.exercises.map(() => 0));
    setCompletedSets(routine.exercises.map((ex) => ({
      total: parseInt(ex.sets) || 1,
      completed: []
    })));
    setSessionStartTime(new Date());

    // Cargar sesión pausada si existe
    const savedSession = localStorage.getItem(`paused_routine_${routine.id}`);
    if (savedSession) {
      const parsed = JSON.parse(savedSession);
      setPausedData(parsed);
      setIsPausedSession(true);
    }
  }, [routine]);

  // Timer principal
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      if (isResting) {
        // Cuenta regresiva del descanso
        setRestTime(prev => {
          if (prev <= 1) {
            // Fin del descanso, pasar al siguiente ejercicio
            setIsResting(false);
            setExerciseTime(0);
            setCurrentExerciseIndex(idx => idx + 1);
            return 0;
          }
          return prev - 1;
        });
      } else {
        // Para ejercicios de tiempo: cuenta regresiva
        if (isTimeBasedExercise && exerciseDurationInSeconds > 0) {
          setExerciseTime(prev => {
            if (prev >= exerciseDurationInSeconds) {
              // Tiempo cumplido, completar automáticamente
              handleCompleteExercise();
              return exerciseDurationInSeconds;
            }
            return prev + 1;
          });
        } else {
          // Para ejercicios de reps: cuenta progresiva
          setExerciseTime(prev => prev + 1);
        }
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isPaused, isResting, isTimeBasedExercise, exerciseDurationInSeconds]);

  const handleStart = () => {
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleToggleSet = (setNumber) => {
    const newCompletedSets = [...completedSets];
    const currentSets = newCompletedSets[currentExerciseIndex];

    if (currentSets.completed.includes(setNumber)) {
      // Desmarcar
      currentSets.completed = currentSets.completed.filter(s => s !== setNumber);
    } else {
      // Marcar como completado
      currentSets.completed = [...currentSets.completed, setNumber].sort();
    }

    setCompletedSets(newCompletedSets);
  };

  const handleCompleteExercise = () => {
    // Guardar tiempo del ejercicio actual
    const newTimes = [...exerciseTimes];
    newTimes[currentExerciseIndex] = exerciseTime;
    setExerciseTimes(newTimes);

    // Verificar si es el último ejercicio
    if (currentExerciseIndex >= routine.exercises.length - 1) {
      handleCompleteRoutine(newTimes);
      return;
    }

    // Si hay descanso configurado, iniciar descanso
    if (routine.hasRestBetweenExercises && currentExercise.restDuration > 0) {
      setIsResting(true);
      setRestTime(parseInt(currentExercise.restDuration) || 60);
      setIsPaused(false); // Auto-iniciar descanso
    } else {
      // Si no hay descanso, pasar directamente al siguiente
      setCurrentExerciseIndex(idx => idx + 1);
      setExerciseTime(0);
    }
  };

  const handleSkipRest = () => {
    setIsResting(false);
    setRestTime(0);
    setExerciseTime(0);
    setCurrentExerciseIndex(idx => idx + 1);
    setIsPaused(true); // Pausar al llegar al siguiente ejercicio
  };

  const handleCompleteRoutine = (times) => {
    const totalTime = times.reduce((sum, t) => sum + t, 0);
    const sessionData = {
      routineId: routine.id,
      routineName: routine.name,
      exerciseTimes: routine.exercises.map((ex, idx) => ({
        exerciseId: ex.exerciseId,
        exerciseName: exercises.find(e => e.id === ex.exerciseId)?.name || 'Ejercicio',
        timeInSeconds: times[idx] || 0,
        completedSets: completedSets[idx]?.completed || []
      })),
      totalTimeInSeconds: totalTime,
      completedAt: new Date(),
      sessionStartTime
    };

    // Limpiar sesión pausada
    localStorage.removeItem(`paused_routine_${routine.id}`);

    onComplete(sessionData);
    onClose();
  };

  const handlePauseSession = () => {
    // Guardar estado actual en localStorage
    const sessionData = {
      currentExerciseIndex,
      exerciseTime,
      exerciseTimes,
      completedSets,
      sessionStartTime,
      pausedAt: new Date().toISOString()
    };

    localStorage.setItem(`paused_routine_${routine.id}`, JSON.stringify(sessionData));
    onClose();
  };

  const handleResumeSession = () => {
    if (!pausedData) return;

    setCurrentExerciseIndex(pausedData.currentExerciseIndex);
    setExerciseTime(pausedData.exerciseTime);
    setExerciseTimes(pausedData.exerciseTimes);
    setCompletedSets(pausedData.completedSets);
    setSessionStartTime(new Date(pausedData.sessionStartTime));
    setIsPausedSession(false);
    setPausedData(null);
  };

  const handleDiscardSession = () => {
    localStorage.removeItem(`paused_routine_${routine.id}`);
    setIsPausedSession(false);
    setPausedData(null);
  };

  const handleExitClick = () => {
    // Si hay progreso, mostrar confirmación
    if (currentExerciseIndex > 0 || exerciseTime > 0) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  const handleExitConfirm = (shouldPause) => {
    setShowExitConfirm(false);
    if (shouldPause) {
      handlePauseSession();
    } else {
      localStorage.removeItem(`paused_routine_${routine.id}`);
      onClose();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeRemaining = (seconds) => {
    const remaining = exerciseDurationInSeconds - seconds;
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((currentExerciseIndex + 1) / routine.exercises.length) * 100;

  // Modal de sesión pausada
  if (isPausedSession && pausedData) {
    return (
      <Modal isOpen={true} onClose={() => handleDiscardSession()} title="Rutina Pausada" size="md">
        <div className="space-y-6 text-center">
          <div className="w-20 h-20 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center">
            <AlertCircle className="text-yellow-400" size={40} />
          </div>

          <div>
            <h3 className="text-xl font-bold mb-2">Continuar rutina pausada</h3>
            <p className="text-gray-400">
              Tenés una sesión pausada de esta rutina. ¿Querés continuar desde donde lo dejaste?
            </p>
          </div>

          <Card className="bg-gray-800/50 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Ejercicio actual:</span>
                <span className="font-medium">
                  {pausedData.currentExerciseIndex + 1} de {routine.exercises.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Pausado el:</span>
                <span className="font-medium">
                  {new Date(pausedData.pausedAt).toLocaleString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={handleDiscardSession}
              className="flex-1"
            >
              Empezar de nuevo
            </Button>
            <Button
              onClick={handleResumeSession}
              className="flex-1"
            >
              Continuar
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={handleExitClick} title={routine.name} size="lg">
      <div className="space-y-6">
        {/* Progreso */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">
              Ejercicio {currentExerciseIndex + 1} de {routine.exercises.length}
            </span>
            <span className="text-primary font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {isResting ? (
          /* Pantalla de Descanso */
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <Coffee className="text-yellow-400" size={48} />
            </div>
            <h3 className="text-3xl font-bold mb-2">Descanso</h3>
            <p className="text-gray-400 mb-6">Prepárate para el siguiente ejercicio</p>
            <div className="text-6xl font-bold text-yellow-400 mb-8">
              {formatTime(restTime)}
            </div>
            <Button
              variant="secondary"
              icon={SkipForward}
              onClick={handleSkipRest}
            >
              Saltar Descanso
            </Button>
          </div>
        ) : currentExerciseIndex < routine.exercises.length ? (
          /* Pantalla de Ejercicio */
          <div>
            <Card className="bg-blue-500/10 border-blue-500/30 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Dumbbell className="text-blue-400" size={32} />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">{exerciseData?.name || 'Ejercicio'}</h3>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {!isTimeBasedExercise && (
                      <>
                        <span className="text-gray-400">
                          <strong className="text-white">{currentExercise.sets}</strong> series
                        </span>
                        <span className="text-gray-400">
                          <strong className="text-white">{currentExercise.reps}</strong> reps
                        </span>
                        <span className="text-gray-400">
                          <strong className="text-white">{currentExercise.rest}s</strong> descanso entre series
                        </span>
                      </>
                    )}
                    {isTimeBasedExercise && (
                      <span className="text-gray-400">
                        <strong className="text-white">{currentExercise.reps}</strong> minutos
                      </span>
                    )}
                  </div>
                  {currentExercise.notes && (
                    <p className="text-sm text-gray-400 mt-2 italic">{currentExercise.notes}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Series checklist para ejercicios de reps */}
            {!isTimeBasedExercise && parseInt(currentExercise.sets) > 1 && (
              <Card className="mb-6 bg-gray-800/50">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Marcar series completadas</h4>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: parseInt(currentExercise.sets) }, (_, i) => i + 1).map((setNum) => {
                    const isCompleted = completedSets[currentExerciseIndex]?.completed.includes(setNum);
                    return (
                      <button
                        key={setNum}
                        onClick={() => handleToggleSet(setNum)}
                        className={`p-3 rounded-lg font-medium transition-all ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                      >
                        {isCompleted && <CheckCircle2 size={16} className="inline mr-1" />}
                        {setNum}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {completedSets[currentExerciseIndex]?.completed.length || 0} de {currentExercise.sets} series completadas
                </p>
              </Card>
            )}

            {/* Timer del ejercicio */}
            <div className="text-center py-8">
              <div className="flex items-center justify-center gap-2 text-gray-400 mb-4">
                <Timer size={24} />
                <span>
                  {isTimeBasedExercise ? 'Tiempo restante' : 'Tiempo de ejercicio'}
                </span>
              </div>
              <div className={`text-7xl font-bold mb-8 ${
                isTimeBasedExercise ? 'text-orange-400' : 'text-primary'
              }`}>
                {isTimeBasedExercise
                  ? formatTimeRemaining(exerciseTime)
                  : formatTime(exerciseTime)
                }
              </div>

              <div className="flex gap-3 justify-center">
                {isPaused ? (
                  <Button
                    icon={Play}
                    onClick={handleStart}
                    className="px-8"
                  >
                    {exerciseTime === 0 ? 'Comenzar' : 'Reanudar'}
                  </Button>
                ) : (
                  <Button
                    icon={Pause}
                    onClick={handlePause}
                    variant="secondary"
                    className="px-8"
                  >
                    Pausar
                  </Button>
                )}
                <Button
                  icon={Check}
                  onClick={handleCompleteExercise}
                  disabled={exerciseTime === 0}
                  className="px-8 bg-green-600 hover:bg-green-700"
                >
                  Completar Ejercicio
                </Button>
              </div>
            </div>

            {/* Lista de ejercicios */}
            <div className="mt-8">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Ejercicios de la rutina</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {routine.exercises.map((ex, idx) => {
                  const exData = exercises.find(e => e.id === ex.exerciseId);
                  const isCompleted = idx < currentExerciseIndex;
                  const isCurrent = idx === currentExerciseIndex;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        isCurrent ? 'bg-primary/20 border border-primary/50' :
                        isCompleted ? 'bg-green-500/10' :
                        'bg-gray-800/50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        isCurrent ? 'bg-primary text-white' :
                        isCompleted ? 'bg-green-500 text-white' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {isCompleted ? <Check size={16} /> : idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isCurrent ? 'text-white' : isCompleted ? 'text-green-400' : 'text-gray-400'}`}>
                          {exData?.name || 'Ejercicio'}
                        </p>
                      </div>
                      {isCompleted && exerciseTimes[idx] > 0 && (
                        <span className="text-xs text-green-400">
                          {formatTime(exerciseTimes[idx])}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {/* Botones de control */}
        <div className="pt-4 border-t border-gray-700 space-y-3">
          <div className="flex gap-3">
            <Button
              variant="secondary"
              icon={Pause}
              onClick={() => setShowExitConfirm(true)}
              className="flex-1"
            >
              Pausar Rutina
            </Button>
            <Button
              variant="danger"
              icon={X}
              onClick={handleExitClick}
              className="flex-1"
            >
              Salir
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmación de salida */}
      <Modal isOpen={showExitConfirm} onClose={() => setShowExitConfirm(false)} title="¿Salir de la rutina?" size="sm">
        <div className="space-y-4">
          <p className="text-gray-300">
            ¿Querés guardar tu progreso para continuar después o descartarlo?
          </p>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => handleExitConfirm(true)}
              className="w-full"
            >
              Guardar y Pausar
            </Button>
            <Button
              variant="danger"
              onClick={() => handleExitConfirm(false)}
              className="w-full"
            >
              Descartar Progreso
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowExitConfirm(false)}
              className="w-full"
            >
              Volver
            </Button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
};

export default RoutineTimer;
