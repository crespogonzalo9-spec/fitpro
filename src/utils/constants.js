// Roles del sistema
export const ROLES = [
  { id: 'sysadmin', name: 'Sysadmin', level: 4 },
  { id: 'admin', name: 'Administrador', level: 3 },
  { id: 'profesor', name: 'Profesor', level: 2 },
  { id: 'miembro', name: 'Miembro', level: 1 }
];

// Tipos de ejercicios
export const EXERCISE_TYPES = [
  { id: 'strength', name: 'Fuerza' },
  { id: 'olympic', name: 'Olímpico' },
  { id: 'crossfit', name: 'CrossFit' },
  { id: 'cardio', name: 'Cardio' },
  { id: 'gymnastics', name: 'Gimnasia' },
  { id: 'functional', name: 'Funcional' }
];

// Grupos musculares
export const MUSCLE_GROUPS = [
  { id: 'chest', name: 'Pecho' },
  { id: 'back', name: 'Espalda' },
  { id: 'shoulders', name: 'Hombros' },
  { id: 'biceps', name: 'Bíceps' },
  { id: 'triceps', name: 'Tríceps' },
  { id: 'core', name: 'Core' },
  { id: 'quadriceps', name: 'Cuádriceps' },
  { id: 'hamstrings', name: 'Isquiotibiales' },
  { id: 'glutes', name: 'Glúteos' },
  { id: 'calves', name: 'Gemelos' },
  { id: 'full_body', name: 'Cuerpo completo' }
];

// Días de la semana
export const DAYS_OF_WEEK = [
  { id: 0, name: 'Domingo', short: 'Dom' },
  { id: 1, name: 'Lunes', short: 'Lun' },
  { id: 2, name: 'Martes', short: 'Mar' },
  { id: 3, name: 'Miércoles', short: 'Mié' },
  { id: 4, name: 'Jueves', short: 'Jue' },
  { id: 5, name: 'Viernes', short: 'Vie' },
  { id: 6, name: 'Sábado', short: 'Sáb' }
];

// ESTRUCTURAS DE ENTRENAMIENTO (Contenedores de Tiempo)
export const WOD_TYPES = [
  {
    id: 'emom',
    name: 'EMOM',
    description: 'Every Minute on the Minute',
    fullDescription: 'Tarea específica al inicio del minuto; el tiempo sobrante es descanso',
    logic: 'Tiempo Fijo (60s) | Tarea Fija',
    measurement_unit: 'pass_fail', // Pass/Fail por ronda
    scoring_type: 'pass_fail',
    rest_protocol: 'remainder_of_minute'
  },
  {
    id: 'amrap',
    name: 'AMRAP',
    description: 'As Many Rounds/Reps As Possible',
    fullDescription: 'Maximizar volumen de trabajo en una ventana de tiempo inamovible',
    logic: 'Tiempo Fijo | Tarea Variable (Max)',
    measurement_unit: 'reps', // Suma total de Rondas + Repeticiones
    scoring_type: 'reps_higher_better',
    rest_protocol: 'continuous_self_regulated'
  },
  {
    id: 'for_time',
    name: 'For Time',
    description: 'Por Tiempo',
    fullDescription: 'Completar una carga de trabajo predefinida lo más rápido posible',
    logic: 'Tarea Fija | Tiempo Variable (Min)',
    measurement_unit: 'seconds', // Tiempo Total
    scoring_type: 'time_lower_better',
    rest_protocol: 'none_only_forced_pause'
  },
  {
    id: 'tabata',
    name: 'Tabata',
    description: '20s trabajo / 10s descanso',
    fullDescription: 'Protocolo interválico de muy alta intensidad (8 ciclos)',
    logic: 'Intervalo Fijo (20s/10s) | Rondas Fijas (8)',
    measurement_unit: 'reps', // Menor número de reps en el peor intervalo o Suma total
    scoring_type: 'reps_higher_better',
    rest_protocol: 'fixed_10s',
    work_time: 20,
    rest_time: 10,
    rounds: 8,
    ratio: '2:1'
  },
  {
    id: 'chipper',
    name: 'Chipper',
    description: 'Lista secuencial de ejercicios',
    fullDescription: 'Volumen alto de ejercicios variados ejecutados secuencialmente una sola vez',
    logic: 'Tarea Fija (Lineal) | Tiempo Variable',
    measurement_unit: 'seconds', // Tiempo Total
    scoring_type: 'time_lower_better',
    rest_protocol: 'self_regulated_for_time'
  },
  {
    id: 'ladder',
    name: 'Ladder',
    description: 'Escalera (incremento/decremento progresivo)',
    fullDescription: 'Incremento o descenso progresivo de carga o repeticiones (ej. 1-2-3-4...)',
    logic: 'Tarea Progresiva | Tiempo Fijo o Variable',
    measurement_unit: 'rounds', // Última ronda completada o Tiempo Total
    scoring_type: 'rounds_higher_better',
    rest_protocol: 'variable_by_fatigue'
  },
  {
    id: 'e2mom',
    name: 'E2MOM',
    description: 'Every 2 Minutes',
    fullDescription: 'Similar al EMOM pero con ventanas amplias (120s)',
    logic: 'Intervalo Fijo (120s) | Tarea Fija',
    measurement_unit: 'kg', // Carga levantada o Pass/Fail
    scoring_type: 'weight_higher_better',
    rest_protocol: 'remainder_of_2min',
    interval: 120,
    ratio: '1:3 o 1:4'
  },
  {
    id: 'e3mom',
    name: 'E3MOM',
    description: 'Every 3 Minutes',
    fullDescription: 'Similar al EMOM pero con ventanas amplias (180s)',
    logic: 'Intervalo Fijo (180s) | Tarea Fija',
    measurement_unit: 'kg', // Carga levantada o Pass/Fail
    scoring_type: 'weight_higher_better',
    rest_protocol: 'remainder_of_3min',
    interval: 180,
    ratio: '1:3 o 1:4'
  }
];

// BLOQUES DE TRABAJO (Dominios Físicos)
export const BLOCK_TYPES = [
  {
    id: 'fuerza',
    name: 'Fuerza (Strength)',
    description: 'Cargas altas (>80% 1RM), pocas repeticiones',
    fullDescription: 'Busca adaptaciones neuronales y reclutamiento de fibras motoras',
    execution: 'Series x Repeticiones (ej. 5x5)',
    variable_key: 'weight', // Peso (Kg/Lbs)
    measurement_unit: 'kg',
    rest: 'Largo y Completo (2 a 5 minutos)',
    rest_min: 120,
    rest_max: 300
  },
  {
    id: 'potencia',
    name: 'Potencia (Power/Olympic)',
    description: 'Aplicación de fuerza a máxima velocidad',
    fullDescription: 'Movimientos técnicos complejos que requieren frescura neurológica',
    execution: 'Series x Repeticiones bajas (1-3)',
    variable_key: 'speed', // Velocidad de barra y Técnica
    measurement_unit: 'kg',
    rest: 'Completo (recuperación del SNC)',
    rest_min: 120,
    rest_max: 300
  },
  {
    id: 'metcon',
    name: 'MetCon (Metabolic Conditioning)',
    description: 'Acondicionamiento metabólico mixto',
    fullDescription: 'Eficiencia en vías glucolíticas y oxidativas bajo fatiga sistémica',
    execution: 'Estructuras variadas (AMRAP, For Time)',
    variable_key: 'intensity', // Intensidad (RPM, Watt, Ritmo)
    measurement_unit: 'seconds',
    rest: 'Incompleto o Nulo',
    rest_min: 0,
    rest_max: 60
  },
  {
    id: 'gimnasia',
    name: 'Gimnasia (Gymnastics)',
    description: 'Control del peso corporal en el espacio',
    fullDescription: 'Desarrolla fuerza relativa, propiocepción y estabilidad',
    execution: 'Repeticiones por calidad o tiempo bajo tensión',
    variable_key: 'difficulty', // Dificultad del movimiento (Progresiones)
    measurement_unit: 'reps',
    rest: 'Autoregulado para evitar fallo técnico',
    rest_min: 30,
    rest_max: 120
  },
  {
    id: 'zona_media',
    name: 'Core / Midline',
    description: 'Estabilización del tronco',
    fullDescription: 'Trabajo de anti-rotación, anti-extensión y flexión isométrica',
    execution: 'Tiempo (holds) o Repeticiones lentas',
    variable_key: 'tension', // Tensión y Calidad
    measurement_unit: 'seconds',
    rest: 'Corto (30-60s)',
    rest_min: 30,
    rest_max: 60
  },
  {
    id: 'movilidad',
    name: 'Movilidad / Activación',
    description: 'Preparación articular y liberación miofascial',
    fullDescription: 'Mejora el Rango de Movimiento (ROM) activo',
    execution: 'Tiempo por posición (ej. 2 min hold) o Pases dinámicos',
    variable_key: 'rom', // Rango de movimiento
    measurement_unit: 'seconds',
    rest: 'N/A (Flujo continuo)',
    rest_min: 0,
    rest_max: 0
  },
  {
    id: 'monostructural',
    name: 'Monoestructural (Cardio)',
    description: 'Esfuerzo cíclico repetitivo de baja complejidad',
    fullDescription: 'Desarrollo puro de la capacidad aeróbica y el umbral de lactato',
    execution: 'Distancia (m), Calorías (cal) o Tiempo (min)',
    variable_key: 'pace', // Pace (Ritmo por km/min)
    measurement_unit: 'meters', // o 'calories' o 'seconds'
    rest: 'Intervalado (ej. 1:1) o Continuo',
    rest_min: 0,
    rest_max: 300
  },
  {
    id: 'regular',
    name: 'Regular',
    description: 'Bloque estándar sin categorización específica',
    fullDescription: 'Bloque genérico para rutinas tradicionales',
    execution: 'Variable',
    variable_key: 'mixed',
    measurement_unit: 'reps',
    rest: 'Variable',
    rest_min: 60,
    rest_max: 180
  }
];

// Intervalos de tiempo para ESD
export const ESD_INTERVALS = [
  { value: 30, label: '30 segundos', unit: 'seconds' },
  { value: 45, label: '45 segundos', unit: 'seconds' },
  { value: 60, label: '1 minuto', unit: 'seconds' },
  { value: 90, label: '90 segundos', unit: 'seconds' },
  { value: 120, label: '2 minutos', unit: 'seconds' },
  { value: 150, label: '2:30 minutos', unit: 'seconds' },
  { value: 180, label: '3 minutos', unit: 'seconds' },
  { value: 240, label: '4 minutos', unit: 'seconds' },
  { value: 300, label: '5 minutos', unit: 'seconds' }
];

// Tipos de ESD
export const ESD_TYPES = [
  { id: 'emom', name: 'EMOM', description: 'Every Minute On the Minute' },
  { id: 'e2mom', name: 'E2MOM', description: 'Every 2 Minutes On the Minute' },
  { id: 'e3mom', name: 'E3MOM', description: 'Every 3 Minutes On the Minute' },
  { id: 'e4mom', name: 'E4MOM', description: 'Every 4 Minutes On the Minute' },
  { id: 'e30s', name: 'E30S', description: 'Every 30 Seconds' },
  { id: 'e45s', name: 'E45S', description: 'Every 45 Seconds' },
  { id: 'e90s', name: 'E90S', description: 'Every 90 Seconds' },
  { id: 'custom', name: 'Personalizado', description: 'Intervalo personalizado' }
];

// Tipos de ranking
export const RANKING_TYPES = [
  { id: 'exercise', name: 'Por Ejercicio', description: 'Ranking de un ejercicio específico' },
  { id: 'wod', name: 'Por WOD', description: 'Ranking de un WOD específico' },
  { id: 'routine', name: 'Por Rutina', description: 'Ranking de una rutina completa' }
];

// Tipos de asignación de rutina/WOD
export const ASSIGNMENT_TYPES = [
  { id: 'class', name: 'Para una Clase', description: 'Asignar a todos los inscriptos de una clase' },
  { id: 'individual', name: 'Individual', description: 'Asignar a personas específicas' }
];

// Estados de suscripción
export const SUBSCRIPTION_STATUS = [
  { id: 'active', name: 'Activa', color: 'success' },
  { id: 'pending', name: 'Pendiente', color: 'warning' },
  { id: 'expired', name: 'Vencida', color: 'error' },
  { id: 'cancelled', name: 'Cancelada', color: 'neutral' }
];

// Estados de marca personal
export const PR_STATUS = [
  { id: 'pending', name: 'Pendiente', color: 'warning' },
  { id: 'validated', name: 'Validada', color: 'success' },
  { id: 'rejected', name: 'Rechazada', color: 'error' }
];

// Unidades de medida
export const MEASUREMENT_UNITS = [
  { id: 'kg', name: 'Kilogramos', type: 'weight' },
  { id: 'lb', name: 'Libras', type: 'weight' },
  { id: 'reps', name: 'Repeticiones', type: 'count' },
  { id: 'rounds', name: 'Rondas', type: 'count' },
  { id: 'seconds', name: 'Segundos', type: 'time' },
  { id: 'minutes', name: 'Minutos', type: 'time' },
  { id: 'meters', name: 'Metros', type: 'distance' },
  { id: 'calories', name: 'Calorías', type: 'energy' }
];

// Rutas de navegación por rol
export const NAV_ROUTES = {
  sysadmin: [
    { path: '/dashboard', name: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/gyms', name: 'Gimnasios', icon: 'Building2' },
    { path: '/users', name: 'Usuarios', icon: 'Users' },
    { path: '/members', name: 'Miembros', icon: 'Users' },
    { path: '/profesores', name: 'Profesores', icon: 'UserCheck' },
    { path: '/classes', name: 'Clases', icon: 'Calendar' },
    { path: '/exercises', name: 'Ejercicios', icon: 'Dumbbell' },
    { path: '/routines', name: 'Rutinas', icon: 'ClipboardList' },
    { path: '/wods', name: 'WODs', icon: 'Flame' },
    { path: '/esds', name: 'ESDs', icon: 'Clock' },
    { path: '/calendar', name: 'Calendario', icon: 'CalendarDays' },
    { path: '/news', name: 'Novedades', icon: 'Megaphone' },
    { path: '/rankings', name: 'Rankings', icon: 'Trophy' },
    { path: '/prs', name: 'Marcas Personales', icon: 'CheckCircle' },
    { path: '/invites', name: 'Invitaciones', icon: 'Link' },
    { path: '/gym-info', name: 'Info Gimnasio', icon: 'Building2' },
    { path: '/settings', name: 'Configuración', icon: 'Settings' }
  ],
  admin: [
    { path: '/dashboard', name: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/members', name: 'Miembros', icon: 'Users' },
    { path: '/profesores', name: 'Profesores', icon: 'UserCheck' },
    { path: '/classes', name: 'Clases', icon: 'Calendar' },
    { path: '/exercises', name: 'Ejercicios', icon: 'Dumbbell' },
    { path: '/routines', name: 'Rutinas', icon: 'ClipboardList' },
    { path: '/wods', name: 'WODs', icon: 'Flame' },
    { path: '/esds', name: 'ESDs', icon: 'Clock' },
    { path: '/calendar', name: 'Calendario', icon: 'CalendarDays' },
    { path: '/news', name: 'Novedades', icon: 'Megaphone' },
    { path: '/rankings', name: 'Rankings', icon: 'Trophy' },
    { path: '/prs', name: 'Marcas Personales', icon: 'CheckCircle' },
    { path: '/invites', name: 'Invitaciones', icon: 'Link' },
    { path: '/gym-info', name: 'Info Gimnasio', icon: 'Building2' },
    { path: '/settings', name: 'Configuración', icon: 'Settings' }
  ],
  profesor: [
    { path: '/dashboard', name: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/my-classes', name: 'Mis Clases', icon: 'Calendar' },
    { path: '/members', name: 'Miembros', icon: 'Users' },
    { path: '/exercises', name: 'Ejercicios', icon: 'Dumbbell' },
    { path: '/routines', name: 'Rutinas', icon: 'ClipboardList' },
    { path: '/wods', name: 'WODs', icon: 'Flame' },
    { path: '/esds', name: 'ESDs', icon: 'Clock' },
    { path: '/calendar', name: 'Calendario', icon: 'CalendarDays' },
    { path: '/news', name: 'Novedades', icon: 'Megaphone' },
    { path: '/prs', name: 'Validar PRs', icon: 'CheckCircle' },
    { path: '/rankings', name: 'Rankings', icon: 'Trophy' },
    { path: '/gym-info', name: 'Info Gimnasio', icon: 'Building2' }
  ],
  miembro: [
    { path: '/dashboard', name: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/schedule', name: 'Horarios', icon: 'Calendar' },
    { path: '/my-classes', name: 'Mis Clases', icon: 'CheckSquare' },
    { path: '/my-routines', name: 'Mis Rutinas', icon: 'ClipboardList' },
    { path: '/calendar', name: 'Calendario', icon: 'CalendarDays' },
    { path: '/news', name: 'Novedades', icon: 'Megaphone' },
    { path: '/my-prs', name: 'Mis PRs', icon: 'TrendingUp' },
    { path: '/rankings', name: 'Rankings', icon: 'Trophy' },
    { path: '/gym-info', name: 'Info Gimnasio', icon: 'Building2' }
  ]
};

// Ejercicios predefinidos
export const DEFAULT_EXERCISES = [
  { name: 'Back Squat', type: 'strength', muscles: ['quadriceps', 'glutes'], unit: 'kg' },
  { name: 'Front Squat', type: 'strength', muscles: ['quadriceps', 'core'], unit: 'kg' },
  { name: 'Deadlift', type: 'strength', muscles: ['back', 'hamstrings', 'glutes'], unit: 'kg' },
  { name: 'Bench Press', type: 'strength', muscles: ['chest', 'triceps'], unit: 'kg' },
  { name: 'Overhead Press', type: 'strength', muscles: ['shoulders', 'triceps'], unit: 'kg' },
  { name: 'Clean', type: 'olympic', muscles: ['full_body'], unit: 'kg' },
  { name: 'Clean & Jerk', type: 'olympic', muscles: ['full_body'], unit: 'kg' },
  { name: 'Snatch', type: 'olympic', muscles: ['full_body'], unit: 'kg' },
  { name: 'Thruster', type: 'crossfit', muscles: ['quadriceps', 'shoulders'], unit: 'kg' },
  { name: 'Wall Ball', type: 'crossfit', muscles: ['quadriceps', 'shoulders'], unit: 'reps' },
  { name: 'Burpee', type: 'crossfit', muscles: ['full_body'], unit: 'reps' },
  { name: 'Box Jump', type: 'crossfit', muscles: ['quadriceps', 'glutes'], unit: 'reps' },
  { name: 'Pull Up', type: 'gymnastics', muscles: ['back', 'biceps'], unit: 'reps' },
  { name: 'Muscle Up', type: 'gymnastics', muscles: ['back', 'chest'], unit: 'reps' },
  { name: 'Double Under', type: 'crossfit', muscles: ['calves'], unit: 'reps' },
  { name: 'Row', type: 'cardio', muscles: ['full_body'], unit: 'calories' },
  { name: 'Run', type: 'cardio', muscles: ['quadriceps', 'calves'], unit: 'meters' }
];

// WODs Benchmark
export const BENCHMARK_WODS = [
  { name: 'Fran', type: 'for_time', description: '21-15-9: Thrusters (43/30kg) + Pull-ups' },
  { name: 'Grace', type: 'for_time', description: '30 Clean & Jerk (61/43kg)' },
  { name: 'Isabel', type: 'for_time', description: '30 Snatch (61/43kg)' },
  { name: 'Helen', type: 'for_time', description: '3 rounds: 400m Run + 21 KB Swings + 12 Pull-ups' },
  { name: 'Cindy', type: 'amrap', description: '20 min: 5 Pull-ups + 10 Push-ups + 15 Squats' },
  { name: 'Murph', type: 'for_time', description: '1 mile + 100 Pull-ups + 200 Push-ups + 300 Squats + 1 mile' },
  { name: 'Annie', type: 'for_time', description: '50-40-30-20-10: Double Unders + Sit-ups' },
  { name: 'Diane', type: 'for_time', description: '21-15-9: Deadlift (102/70kg) + HSPU' }
];
