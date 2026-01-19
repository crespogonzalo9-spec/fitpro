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

// Tipos de WOD
export const WOD_TYPES = [
  { id: 'for_time', name: 'For Time', description: 'Completar lo más rápido posible' },
  { id: 'amrap', name: 'AMRAP', description: 'Máximas rondas en tiempo' },
  { id: 'emom', name: 'EMOM', description: 'Every Minute On the Minute' },
  { id: 'esd', name: 'ESD', description: 'Every X Seconds/Minutes/Hours Day' },
  { id: 'tabata', name: 'Tabata', description: '20s trabajo / 10s descanso' },
  { id: 'chipper', name: 'Chipper', description: 'Lista secuencial de ejercicios' },
  { id: 'ladder', name: 'Ladder', description: 'Incremento/decremento progresivo' }
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
