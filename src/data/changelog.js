// Historial de actualizaciones de FitPro
// Formato: versión correlativa, fecha, descripción en lenguaje común

export const changelog = [
  {
    version: '1.5.0',
    date: '2026-01-06',
    title: 'Sistema de Actualizaciones',
    updates: [
      'Agregado botón de información para ver las últimas actualizaciones',
      'Nuevo sistema de versiones correlativas',
      'Créditos del desarrollador en el dashboard'
    ]
  },
  {
    version: '1.4.0',
    date: '2025-12-15',
    title: 'Mejoras de Seguridad y Funcionalidad',
    updates: [
      'Corregidos problemas de permisos en rutinas para alumnos',
      'Mejorada la seguridad general del sistema',
      'Optimizaciones de rendimiento'
    ]
  },
  {
    version: '1.3.0',
    date: '2025-11-20',
    title: 'Rutinas con Timer',
    updates: [
      'Nuevo timer integrado para rutinas',
      'Seguimiento de tiempo por ejercicio',
      'Estadísticas de rutinas completadas',
      'Descanso automático entre ejercicios'
    ]
  },
  {
    version: '1.2.0',
    date: '2025-10-15',
    title: 'Sistema de Rutinas',
    updates: [
      'Creación y gestión de rutinas personalizadas',
      'Asignación de rutinas a alumnos o clases',
      'Vista de ejercicios por rutina',
      'Configuración de series, repeticiones y descansos'
    ]
  },
  {
    version: '1.1.0',
    date: '2025-09-01',
    title: 'Gestión de Clases y WODs',
    updates: [
      'Sistema de clases con horarios',
      'WODs (Workout of the Day)',
      'Rankings y marcas personales',
      'Sistema de invitaciones mejorado'
    ]
  },
  {
    version: '1.0.0',
    date: '2025-08-01',
    title: 'Lanzamiento Inicial',
    updates: [
      'Sistema de gestión de gimnasios',
      'Gestión de usuarios (Admin, Profesores, Alumnos)',
      'Sistema de ejercicios',
      'Dashboard con estadísticas',
      'Perfil de usuario'
    ]
  }
];

export const getLatestVersion = () => {
  return changelog[0];
};

export const getCurrentVersion = () => {
  return changelog[0].version;
};
