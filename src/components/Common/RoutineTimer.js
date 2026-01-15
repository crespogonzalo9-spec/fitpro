import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, X, Check, Timer, Coffee, Dumbbell, AlertCircle, CheckCircle2, Flame } from 'lucide-react';
import { Button, Modal, Card } from './index';

const RoutineTimer = ({ routine, exercises, wods, onClose, onComplete }) => {
  // Combinar ejercicios y WODs en un solo array de elementos
  const allElements = [
    ...(routine.exercises || []).map(ex => ({ ...ex, type: 'exercise' })),
    ...(routine.wods || []).map(wod => ({ ...wod, type: 'wod' }))
  ];

  const [currentElementIndex, setCurrentElementIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [elementTime, setElementTime] = useState(0); // Tiempo del elemento actual en segundos
  const [restTime, setRestTime] = useState(0); // Tiempo restante de descanso
  const [elementTimes, setElementTimes] = useState([]); // Tiempos de cada elemento
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [completedSets, setCompletedSets] = useState([]); // Array de sets completados por ejercicio
  const [isPausedSession, setIsPausedSession] = useState(false); // Nueva: sesión pausada
  const [pausedData, setPausedData] = useState(null); // Datos de sesión pausada

  const timerRef = useRef(null);
  const currentElement = allElements[currentElementIndex];
  const isCurrentWod = currentElement?.type === 'wod';
  const exerciseData = !isCurrentWod && currentElement ? exercises.find(e => e.id === currentElement.exerciseId) : null;
  const wodData = isCurrentWod && currentElement ? wods.find(w => w.id === currentElement.wodId) : null;

  // Verificar si el ejercicio actual es de tiempo
  const isTimeBasedExercise = exerciseData?.measureType === 'time';
  const exerciseDurationInSeconds = isTimeBasedExercise && currentElement?.reps ? parseInt(currentElement.reps) * 60 : 0;

  // Inicializar array de tiempos y sets completados
  useEffect(() => {
    setElementTimes(allElements.map(() => 0));
    setCompletedSets(allElements.map((el) => ({
      total: el.type === 'exercise' ? (parseInt(el.sets) || 1) : 1,
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
            // Fin del descanso, pasar al siguiente elemento
            setIsResting(false);
            setElementTime(0);
            setCurrentElementIndex(idx => idx + 1);
            return 0;
          }
          return prev - 1;
        });
      } else {
        // Para ejercicios de tiempo: cuenta regresiva
        if (isTimeBasedExercise && exerciseDurationInSeconds > 0) {
          setElementTime(prev => {
            if (prev >= exerciseDurationInSeconds) {
              // Tiempo cumplido, completar automáticamente
              handleCompleteElement();
              return exerciseDurationInSeconds;
            }
            return prev + 1;
          });
        } else {
          // Para ejercicios de reps y WODs: cuenta progresiva
          setElementTime(prev => prev + 1);
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
    const currentSets = newCompletedSets[currentElementIndex];

    if (currentSets.completed.includes(setNumber)) {
      // Desmarcar
      currentSets.completed = currentSets.completed.filter(s => s !== setNumber);
    } else {
      // Marcar como completado
      currentSets.completed = [...currentSets.completed, setNumber].sort();
    }

    setCompletedSets(newCompletedSets);
  };

  const handleCompleteElement = () => {
    // Guardar tiempo del elemento actual
    const newTimes = [...elementTimes];
    newTimes[currentElementIndex] = elementTime;
    setElementTimes(newTimes);

    // Verificar si es el último elemento
    if (currentElementIndex >= allElements.length - 1) {
      handleCompleteRoutine(newTimes);
      return;
    }

    // Si hay descanso configurado, iniciar descanso
    if (routine.hasRestBetweenExercises && currentElement.restDuration > 0) {
      setIsResting(true);
      setRestTime(parseInt(currentElement.restDuration) || 60);
      setIsPaused(false); // Auto-iniciar descanso
    } else {
      // Si no hay descanso, pasar directamente al siguiente
      setCurrentElementIndex(idx => idx + 1);
      setElementTime(0);
    }
  };

  const handleSkipRest = () => {
    setIsResting(false);
    setRestTime(0);
    setElementTime(0);
    setCurrentElementIndex(idx => idx + 1);
    setIsPaused(true); // Pausar al llegar al siguiente elemento
  };

  const handleCompleteRoutine = (times) => {
    const totalTime = times.reduce((sum, t) => sum + t, 0);
    const sessionData = {
      routineId: routine.id,
      routineName: routine.name,
      elementTimes: allElements.map((el, idx) => {
        if (el.type === 'exercise') {
          return {
            type: 'exercise',
            exerciseId: el.exerciseId,
            exerciseName: exercises.find(e => e.id === el.exerciseId)?.name || 'Ejercicio',
            timeInSeconds: times[idx] || 0,
            completedSets: completedSets[idx]?.completed || []
          };
        } else {
          return {
            type: 'wod',
            wodId: el.wodId,
            wodName: wods.find(w => w.id === el.wodId)?.name || 'WOD',
            timeInSeconds: times[idx] || 0
          };
        }
      }),
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
      currentElementIndex,
      elementTime,
      elementTimes,
      completedSets,
      sessionStartTime,
      pausedAt: new Date().toISOString()
    };

    localStorage.setItem(`paused_routine_${routine.id}`, JSON.stringify(sessionData));
    onClose();
  };

  const handleResumeSession = () => {
    if (!pausedData) return;

    setCurrentElementIndex(pausedData.currentElementIndex || pausedData.currentExerciseIndex || 0);
    setElementTime(pausedData.elementTime || pausedData.exerciseTime || 0);
    setElementTimes(pausedData.elementTimes || pausedData.exerciseTimes || []);
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
    if (currentElementIndex > 0 || elementTime > 0) {
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

  const progress = ((currentElementIndex + 1) / allElements.length) * 100;

  // Modal de sesión pausada
  if (isPausedSession && pausedData) {
    const pausedElementIndex = pausedData.currentElementIndex || pausedData.currentExerciseIndex || 0;
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
                <span className="text-gray-400">Elemento actual:</span>
                <span className="font-medium">
                  {pausedElementIndex + 1} de {allElements.length}
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
              {isCurrentWod ? 'WOD' : 'Ejercicio'} {currentElementIndex + 1} de {allElements.length}
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
            <p className="text-gray-400 mb-6">Prepárate para el siguiente {allElements[currentElementIndex + 1]?.type === 'wod' ? 'WOD' : 'ejercicio'}</p>
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
        ) : currentElementIndex < allElements.length ? (
          /* Pantalla de Ejercicio o WOD */
          <div>
            <Card className={`${isCurrentWod ? 'bg-orange-500/10 border-orange-500/30' : 'bg-blue-500/10 border-blue-500/30'} mb-6`}>
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 ${isCurrentWod ? 'bg-orange-500/20' : 'bg-blue-500/20'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  {isCurrentWod ? (
                    <Flame className="text-orange-400" size={32} />
                  ) : (
                    <Dumbbell className="text-blue-400" size={32} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">
                    {isCurrentWod ? (wodData?.name || 'WOD') : (exerciseData?.name || 'Ejercicio')}
                  </h3>
                  {!isCurrentWod && (
                    <div className="flex flex-wrap gap-4 text-sm">
                      {!isTimeBasedExercise && (
                        <>
                          <span className="text-gray-400">
                            <strong className="text-white">{currentElement.sets}</strong> series
                          </span>
                          <span className="text-gray-400">
                            <strong className="text-white">{currentElement.reps}</strong> reps
                          </span>
                          <span className="text-gray-400">
                            <strong className="text-white">{currentElement.rest}s</strong> descanso entre series
                          </span>
                        </>
                      )}
                      {isTimeBasedExercise && (
                        <span className="text-gray-400">
                          <strong className="text-white">{currentElement.reps}</strong> minutos
                        </span>
                      )}
                    </div>
                  )}
                  {isCurrentWod && wodData?.description && (
                    <p className="text-sm text-gray-400 mt-2">{wodData.description}</p>
                  )}
                  {currentElement.notes && (
                    <p className="text-sm text-gray-400 mt-2 italic">{currentElement.notes}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Series checklist para ejercicios de reps */}
            {!isCurrentWod && !isTimeBasedExercise && parseInt(currentElement.sets) > 1 && (
              <Card className="mb-6 bg-gray-800/50">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Marcar series completadas</h4>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: parseInt(currentElement.sets) }, (_, i) => i + 1).map((setNum) => {
                    const isCompleted = completedSets[currentElementIndex]?.completed.includes(setNum);
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
                  {completedSets[currentElementIndex]?.completed.length || 0} de {currentElement.sets} series completadas
                </p>
              </Card>
            )}

            {/* Timer del elemento */}
            <div className="text-center py-8">
              <div className="flex items-center justify-center gap-2 text-gray-400 mb-4">
                <Timer size={24} />
                <span>
                  {isTimeBasedExercise ? 'Tiempo restante' : isCurrentWod ? 'Tiempo del WOD' : 'Tiempo de ejercicio'}
                </span>
              </div>
              <div className={`text-7xl font-bold mb-8 ${
                isCurrentWod ? 'text-orange-400' : isTimeBasedExercise ? 'text-orange-400' : 'text-primary'
              }`}>
                {isTimeBasedExercise
                  ? formatTimeRemaining(elementTime)
                  : formatTime(elementTime)
                }
              </div>

              <div className="flex gap-3 justify-center">
                {isPaused ? (
                  <Button
                    icon={Play}
                    onClick={handleStart}
                    className="px-8"
                  >
                    {elementTime === 0 ? 'Comenzar' : 'Reanudar'}
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
                  onClick={handleCompleteElement}
                  disabled={elementTime === 0}
                  className="px-8 bg-green-600 hover:bg-green-700"
                >
                  {isCurrentWod ? 'Finalizar WOD' : 'Completar Ejercicio'}
                </Button>
              </div>
            </div>

            {/* Lista de elementos */}
            <div className="mt-8">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Elementos de la rutina</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {allElements.map((el, idx) => {
                  const elData = el.type === 'exercise'
                    ? exercises.find(e => e.id === el.exerciseId)
                    : wods.find(w => w.id === el.wodId);
                  const isCompleted = idx < currentElementIndex;
                  const isCurrent = idx === currentElementIndex;

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
                        {isCompleted ? <Check size={16} /> : el.type === 'wod' ? <Flame size={16} /> : idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isCurrent ? 'text-white' : isCompleted ? 'text-green-400' : 'text-gray-400'}`}>
                          {elData?.name || (el.type === 'wod' ? 'WOD' : 'Ejercicio')}
                        </p>
                      </div>
                      {isCompleted && elementTimes[idx] > 0 && (
                        <span className="text-xs text-green-400">
                          {formatTime(elementTimes[idx])}
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
