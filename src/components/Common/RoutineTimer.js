import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, X, Check, Timer, Coffee, Dumbbell, AlertCircle, CheckCircle2, Flame, StopCircle, FastForward, Video } from 'lucide-react';
import { Button, Modal, Card } from './index';

// Helper para obtener estilo del bloque según tipo
const getBlockStyle = (blockType) => {
  const styles = {
    fuerza: { bg: 'bg-red-500/10', border: 'border-red-500/30', iconBg: 'bg-red-500/20', iconColor: 'text-red-400', badge: 'bg-red-500/20 text-red-400' },
    potencia: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', iconBg: 'bg-yellow-500/20', iconColor: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-400' },
    zona_media: { bg: 'bg-green-500/10', border: 'border-green-500/30', iconBg: 'bg-green-500/20', iconColor: 'text-green-400', badge: 'bg-green-500/20 text-green-400' },
    metcon: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', iconBg: 'bg-orange-500/20', iconColor: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-400' },
    gimnasia: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', iconBg: 'bg-purple-500/20', iconColor: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-400' },
    movilidad: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', iconBg: 'bg-cyan-500/20', iconColor: 'text-cyan-400', badge: 'bg-cyan-500/20 text-cyan-400' },
    esd: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', iconBg: 'bg-purple-500/20', iconColor: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-400' },
    regular: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', iconBg: 'bg-blue-500/20', iconColor: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-400' }
  };
  return styles[blockType] || styles.regular;
};

const RoutineTimer = ({ routine, exercises, wods, onClose, onComplete }) => {
  // Soportar tanto formato antiguo (exercises/wods directos) como nuevo (bloques)
  const blocks = routine.blocks || [
    {
      name: 'Rutina',
      type: 'regular',
      exercises: routine.exercises || [],
      wods: routine.wods || []
    }
  ];

  // Combinar todos los ejercicios, WODs y ESDs de todos los bloques en un solo array
  const allElements = blocks.flatMap(block => [
    ...(block.exercises || []).map(ex => ({
      ...ex,
      type: 'exercise',
      blockName: block.name,
      blockType: block.type,
      esdInterval: block.esdInterval,
      esdRounds: block.esdRounds
    })),
    ...(block.wods || []).map(wod => ({
      ...wod,
      type: 'wod',
      blockName: block.name,
      blockType: block.type,
      esdInterval: block.esdInterval,
      esdRounds: block.esdRounds
    })),
    ...(block.esds || []).map(esd => ({
      ...esd,
      type: 'esd',
      blockName: block.name,
      blockType: block.type
    }))
  ]);

  const [currentElementIndex, setCurrentElementIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [elementTime, setElementTime] = useState(0); // Tiempo del elemento actual en segundos
  const [restTime, setRestTime] = useState(0); // Tiempo restante de descanso
  const [elementTimes, setElementTimes] = useState([]); // Tiempos de cada elemento
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showFinishEarlyConfirm, setShowFinishEarlyConfirm] = useState(false);
  const [completedSets, setCompletedSets] = useState([]); // Array de sets completados por ejercicio
  const [isPausedSession, setIsPausedSession] = useState(false); // Nueva: sesión pausada
  const [pausedData, setPausedData] = useState(null); // Datos de sesión pausada
  const [skippedElements, setSkippedElements] = useState([]); // Array de elementos salteados

  // Estados para ESD
  const [esdCurrentRound, setEsdCurrentRound] = useState(1); // Ronda actual de ESD
  const [esdIntervalTime, setEsdIntervalTime] = useState(0); // Tiempo dentro del intervalo actual
  const [showNoVideoWarning, setShowNoVideoWarning] = useState(false); // Advertencia sin video

  const timerRef = useRef(null);
  const currentElement = allElements[currentElementIndex];
  const isCurrentWod = currentElement?.type === 'wod';
  const isCurrentEsd = currentElement?.type === 'esd';
  const isEsdBlock = currentElement?.blockType === 'esd';
  const exerciseData = !isCurrentWod && !isCurrentEsd && currentElement ? exercises.find(e => e.id === currentElement.exerciseId) : null;
  const wodData = isCurrentWod && currentElement ? wods.find(w => w.id === currentElement.wodId) : null;
  const esdData = isCurrentEsd && currentElement ? wods.find(w => w.id === currentElement.esdId) : null;

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
    setSkippedElements([]);

    // Cargar sesión pausada si existe
    const savedSession = localStorage.getItem(`paused_routine_${routine.id}`);
    if (savedSession) {
      const parsed = JSON.parse(savedSession);
      setPausedData(parsed);
      setIsPausedSession(true);
    }
  }, [routine]);

  // Guardado automático del progreso (cada vez que cambia el estado)
  useEffect(() => {
    if (!isPausedSession && sessionStartTime && (currentElementIndex > 0 || elementTime > 0)) {
      const sessionData = {
        currentElementIndex,
        elementTime,
        elementTimes,
        completedSets,
        sessionStartTime,
        skippedElements,
        isResting,
        restTime,
        pausedAt: new Date().toISOString()
      };
      localStorage.setItem(`paused_routine_${routine.id}`, JSON.stringify(sessionData));
    }
  }, [currentElementIndex, elementTime, elementTimes, completedSets, skippedElements, isResting, restTime]);

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
      } else if (isEsdBlock) {
        // TIMER ESPECIAL PARA BLOQUES ESD
        setEsdIntervalTime(prev => {
          const newTime = prev + 1;
          const interval = currentElement.esdInterval || 60;

          if (newTime >= interval) {
            // Se completó un intervalo, pasar a la siguiente ronda
            if (esdCurrentRound >= (currentElement.esdRounds || 10)) {
              // Todas las rondas completadas, pasar al siguiente elemento
              handleCompleteElement();
              setEsdCurrentRound(1);
              setEsdIntervalTime(0);
              return 0;
            } else {
              // Siguiente ronda
              setEsdCurrentRound(r => r + 1);
              // Reproducir sonido/notificación
              playBeep();
              return 0;
            }
          }
          return newTime;
        });

        // También incrementar tiempo total del elemento
        setElementTime(prev => prev + 1);
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
  }, [isPaused, isResting, isTimeBasedExercise, exerciseDurationInSeconds, isEsdBlock, esdCurrentRound, currentElement]);

  // Función para reproducir beep
  const playBeep = () => {
    try {
      // Crear un contexto de audio y reproducir un beep
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Frecuencia del beep
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('No se pudo reproducir el beep:', error);
    }
  };

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

  const handleSkipElement = () => {
    // Marcar elemento como salteado
    const newSkippedElements = [...skippedElements, currentElementIndex];
    setSkippedElements(newSkippedElements);

    // Guardar tiempo 0 para el elemento actual
    const newTimes = [...elementTimes];
    newTimes[currentElementIndex] = 0;
    setElementTimes(newTimes);

    // Verificar si es el último elemento
    if (currentElementIndex >= allElements.length - 1) {
      handleCompleteRoutine(newTimes, newSkippedElements);
      return;
    }

    // Si hay descanso configurado, iniciar descanso
    if (routine.hasRestBetweenExercises && currentElement.restDuration > 0) {
      setIsResting(true);
      setRestTime(parseInt(currentElement.restDuration) || 60);
      setIsPaused(false);
    } else {
      // Si no hay descanso, pasar directamente al siguiente
      setCurrentElementIndex(idx => idx + 1);
      setElementTime(0);
      setIsPaused(true);
    }
  };

  const handleFinishEarly = () => {
    // Terminar rutina con el progreso actual
    handleCompleteRoutine(elementTimes, skippedElements, true);
  };

  const handleCompleteRoutine = (times, skipped = skippedElements, isEarlyFinish = false) => {
    const totalTime = times.reduce((sum, t) => sum + t, 0);
    const sessionData = {
      routineId: routine.id,
      routineName: routine.name,
      elementTimes: allElements.map((el, idx) => {
        const wasSkipped = skipped.includes(idx);
        if (el.type === 'exercise') {
          return {
            type: 'exercise',
            exerciseId: el.exerciseId,
            exerciseName: exercises.find(e => e.id === el.exerciseId)?.name || 'Ejercicio',
            timeInSeconds: times[idx] || 0,
            completedSets: completedSets[idx]?.completed || [],
            skipped: wasSkipped
          };
        } else if (el.type === 'esd') {
          return {
            type: 'esd',
            esdId: el.esdId,
            esdName: wods.find(w => w.id === el.esdId)?.name || 'ESD',
            timeInSeconds: times[idx] || 0,
            skipped: wasSkipped
          };
        } else {
          return {
            type: 'wod',
            wodId: el.wodId,
            wodName: wods.find(w => w.id === el.wodId)?.name || 'WOD',
            timeInSeconds: times[idx] || 0,
            skipped: wasSkipped
          };
        }
      }),
      totalTimeInSeconds: totalTime,
      completedAt: new Date(),
      sessionStartTime,
      skippedCount: skipped.length,
      completedCount: allElements.length - skipped.length,
      isEarlyFinish
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
      skippedElements,
      isResting,
      restTime,
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
    setCompletedSets(pausedData.completedSets || []);
    setSkippedElements(pausedData.skippedElements || []);
    setIsResting(pausedData.isResting || false);
    setRestTime(pausedData.restTime || 0);
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
              {isEsdBlock ? 'Bloque ESD' : isCurrentWod ? 'WOD' : 'Ejercicio'} {currentElementIndex + 1} de {allElements.length}
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
            {isEsdBlock ? (
              /* Bloque ESD - UI especial */
              <Card className="bg-purple-500/10 border-purple-500/30 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Timer className="text-purple-400" size={32} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-bold">
                        ESD
                      </span>
                      <h3 className="text-2xl font-bold">
                        {currentElement.blockName || 'Bloque ESD'}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm mb-3">
                      <span className="text-gray-400">
                        Intervalo: <strong className="text-white">{currentElement.esdInterval}s</strong>
                      </span>
                      <span className="text-gray-400">
                        Rondas: <strong className="text-white">{currentElement.esdRounds}</strong>
                      </span>
                    </div>
                    {currentElement.notes && (
                      <p className="text-sm text-gray-400 italic">{currentElement.notes}</p>
                    )}
                  </div>
                </div>
              </Card>
            ) : (
              /* Ejercicio o WOD normal */
              (() => {
                const blockStyle = getBlockStyle(currentElement?.blockType || 'regular');
                return (
                  <Card className={`${isCurrentWod ? 'bg-orange-500/10 border-orange-500/30' : `${blockStyle.bg} ${blockStyle.border}`} mb-6`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-16 h-16 ${isCurrentWod ? 'bg-orange-500/20' : blockStyle.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        {isCurrentWod ? (
                          <Flame className="text-orange-400" size={32} />
                        ) : (
                          <Dumbbell className={blockStyle.iconColor} size={32} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            {currentElement?.blockName && currentElement.blockType !== 'regular' && (
                              <span className={`px-3 py-1 ${blockStyle.badge} rounded-full text-xs font-bold mr-2`}>
                                {currentElement.blockName}
                              </span>
                            )}
                            <h3 className="text-2xl font-bold inline">
                              {isCurrentWod ? (wodData?.name || 'WOD') : isCurrentEsd ? (esdData?.name || 'ESD') : (exerciseData?.name || 'Ejercicio')}
                            </h3>
                          </div>
                      {!isCurrentWod && !isCurrentEsd && (
                        exerciseData?.videoUrl ? (
                          <a
                            href={exerciseData.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-sm font-medium transition-colors flex-shrink-0"
                          >
                            <Video size={16} />
                            Ver Video
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowNoVideoWarning(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-400 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
                          >
                            <Video size={16} />
                            Ver Video
                          </button>
                        )
                      )}
                    </div>
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
                );
              })()
            )}

            {/* Series checklist para ejercicios de reps */}
            {!isCurrentWod && !isCurrentEsd && !isTimeBasedExercise && parseInt(currentElement.sets) > 1 && (
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
              {isCurrentEsd ? (
                /* Timer especial para ESD */
                <>
                  <div className="mb-6">
                    <div className="text-sm text-gray-400 mb-2">Serie Actual</div>
                    <div className="text-5xl font-bold text-cyan-400 mb-4">
                      {esdCurrentRound} <span className="text-3xl text-gray-500">de</span> {esdData?.esdRounds || 5}
                    </div>
                    {/* Barra de progreso de series */}
                    <div className="max-w-md mx-auto">
                      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500"
                          style={{ width: `${(esdCurrentRound / (esdData?.esdRounds || 5)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-gray-400 mb-4">
                    <Timer size={24} />
                    <span>Tiempo total del ESD</span>
                  </div>
                  <div className="text-7xl font-bold mb-2 text-cyan-400">
                    {formatTime(elementTime)}
                  </div>
                  <div className="text-sm text-gray-500 mb-4">
                    Descanso entre series: {esdData?.esdRest || 90}s
                  </div>
                </>
              ) : (
                /* Timer normal para ejercicios y WODs */
                <>
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
                </>
              )}

              <div className="space-y-3">
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
                    {isEsdBlock ? 'Finalizar Bloque ESD' : isCurrentWod ? 'Finalizar WOD' : 'Completar Ejercicio'}
                  </Button>
                </div>

                <div className="flex gap-3 justify-center">
                  <Button
                    icon={FastForward}
                    onClick={handleSkipElement}
                    variant="secondary"
                    className="flex-1"
                    size="sm"
                  >
                    Saltear {isEsdBlock ? 'Bloque ESD' : isCurrentWod ? 'WOD' : 'Ejercicio'}
                  </Button>
                  <Button
                    icon={StopCircle}
                    onClick={() => setShowFinishEarlyConfirm(true)}
                    variant="secondary"
                    className="flex-1"
                    size="sm"
                  >
                    Terminar Ahora
                  </Button>
                </div>
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

      {/* Confirmación de terminar anticipadamente */}
      <Modal isOpen={showFinishEarlyConfirm} onClose={() => setShowFinishEarlyConfirm(false)} title="¿Terminar rutina ahora?" size="sm">
        <div className="space-y-4">
          <p className="text-gray-300">
            ¿Querés finalizar la rutina ahora con el progreso actual?
          </p>

          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Elementos completados:</span>
                <span className="font-medium text-yellow-400">
                  {currentElementIndex} de {allElements.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Elementos salteados:</span>
                <span className="font-medium text-yellow-400">
                  {skippedElements.length}
                </span>
              </div>
            </div>
          </Card>

          <p className="text-sm text-gray-400">
            Tu progreso será guardado y podrás ver las estadísticas de esta sesión.
          </p>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleFinishEarly}
              className="w-full bg-yellow-600 hover:bg-yellow-700"
            >
              Terminar Rutina
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowFinishEarlyConfirm(false)}
              className="w-full"
            >
              Volver
            </Button>
          </div>
        </div>
      </Modal>

      {/* Advertencia de video no disponible */}
      <Modal isOpen={showNoVideoWarning} onClose={() => setShowNoVideoWarning(false)} title="Video no disponible" size="sm">
        <div className="space-y-4">
          <div className="w-20 h-20 mx-auto bg-gray-700/50 rounded-full flex items-center justify-center">
            <Video className="text-gray-400" size={40} />
          </div>

          <div className="text-center">
            <p className="text-gray-300 mb-2">
              Este ejercicio no tiene un video de demostración cargado.
            </p>
            <p className="text-sm text-gray-400">
              Contactá a tu entrenador para que agregue un enlace de video para este ejercicio.
            </p>
          </div>

          <Button
            onClick={() => setShowNoVideoWarning(false)}
            className="w-full"
          >
            Entendido
          </Button>
        </div>
      </Modal>
    </Modal>
  );
};

export default RoutineTimer;
