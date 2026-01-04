import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, X, Check, Timer, Coffee, Dumbbell } from 'lucide-react';
import { Button, Modal, Card } from './index';

const RoutineTimer = ({ routine, exercises, onClose, onComplete }) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [exerciseTime, setExerciseTime] = useState(0); // Tiempo del ejercicio actual en segundos
  const [restTime, setRestTime] = useState(0); // Tiempo restante de descanso
  const [exerciseTimes, setExerciseTimes] = useState([]); // Tiempos de cada ejercicio
  const [sessionStartTime, setSessionStartTime] = useState(null);

  const timerRef = useRef(null);
  const currentExercise = routine.exercises[currentExerciseIndex];
  const exerciseData = exercises.find(e => e.id === currentExercise?.exerciseId);

  // Inicializar array de tiempos
  useEffect(() => {
    setExerciseTimes(routine.exercises.map(() => 0));
    setSessionStartTime(new Date());
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
        // Incrementar tiempo del ejercicio
        setExerciseTime(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isPaused, isResting]);

  const handleStart = () => {
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
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
  };

  const handleCompleteRoutine = (times) => {
    const totalTime = times.reduce((sum, t) => sum + t, 0);
    const sessionData = {
      routineId: routine.id,
      routineName: routine.name,
      exerciseTimes: routine.exercises.map((ex, idx) => ({
        exerciseId: ex.exerciseId,
        exerciseName: exercises.find(e => e.id === ex.exerciseId)?.name || 'Ejercicio',
        timeInSeconds: times[idx] || 0
      })),
      totalTimeInSeconds: totalTime,
      completedAt: new Date(),
      sessionStartTime
    };

    onComplete(sessionData);
    onClose();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((currentExerciseIndex + 1) / routine.exercises.length) * 100;

  return (
    <Modal isOpen={true} onClose={onClose} title={routine.name} size="lg">
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
                    <span className="text-gray-400">
                      <strong className="text-white">{currentExercise.sets}</strong> series
                    </span>
                    <span className="text-gray-400">
                      <strong className="text-white">{currentExercise.reps}</strong> reps
                    </span>
                    <span className="text-gray-400">
                      <strong className="text-white">{currentExercise.rest}s</strong> descanso entre series
                    </span>
                  </div>
                  {currentExercise.notes && (
                    <p className="text-sm text-gray-400 mt-2 italic">{currentExercise.notes}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Timer del ejercicio */}
            <div className="text-center py-8">
              <div className="flex items-center justify-center gap-2 text-gray-400 mb-4">
                <Timer size={24} />
                <span>Tiempo de ejercicio</span>
              </div>
              <div className="text-7xl font-bold text-primary mb-8">
                {formatTime(exerciseTime)}
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

        {/* Botón cerrar */}
        <div className="pt-4 border-t border-gray-700">
          <Button
            variant="secondary"
            icon={X}
            onClick={onClose}
            className="w-full"
          >
            Cancelar Rutina
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RoutineTimer;
