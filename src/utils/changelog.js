// Sistema de changelog con versiones
// Versión actual de la aplicación
export const CURRENT_VERSION = '1.0.5';

// Historial de versiones (más reciente primero)
export const CHANGELOG = [
  {
    version: '1.0.5',
    date: '2026-01-06',
    title: 'Categorización de equipamiento y filtros',
    changes: [
      'Sistema de categorías para equipamiento (11 categorías con íconos)',
      'Filtros por categoría y búsqueda en gestor de equipamiento',
      'Filtros en la selección de equipamiento al crear ejercicios',
      'Badges visuales con íconos para identificar categorías rápidamente',
      'Equipamiento ordenado automáticamente por categoría y nombre',
      'Confirmado: equipamiento específico por gimnasio (no se comparte entre gyms)'
    ]
  },
  {
    version: '1.0.4',
    date: '2026-01-06',
    title: 'Sistema de actualizaciones y mejoras visuales',
    changes: [
      'Agregado botón de información con historial de actualizaciones en el header',
      'Nuevo sistema de versionado con changelog completo y detallado',
      'Agregada firma "by Gonzalo Crespo" al final del dashboard',
      'Los ejercicios ahora son específicos por gimnasio (no se comparten entre gyms)',
      'Confirmada categorización de ejercicios con 8 categorías y agrupamiento visual'
    ]
  },
  {
    version: '1.0.3',
    date: '2026-01-06',
    title: 'Correcciones de funcionalidad',
    changes: [
      'Corregido el botón de menú (3 puntos) en Rutinas y WODs que no funcionaba correctamente',
      'Mejorada la captura de clicks en todos los menús desplegables',
      'Optimizado el sistema de equipamiento con mejor manejo de errores'
    ]
  },
  {
    version: '1.0.2',
    date: '2026-01-06',
    title: 'Sistema de Equipamiento',
    changes: [
      'Agregado gestor de equipamiento con más de 87 items predeterminados',
      'Nueva funcionalidad para cargar equipamiento personalizado',
      'Integración del equipamiento en la creación de ejercicios',
      'Vista de progreso de miembros integrada en la página de Miembros'
    ]
  },
  {
    version: '1.0.1',
    date: '2026-01-05',
    title: 'Correcciones de seguridad',
    changes: [
      'Corregidos problemas de permisos en Firebase',
      'Mejorada la validación de roles de usuario',
      'Optimizadas las reglas de seguridad de la base de datos',
      'Correcciones en el sistema de invitaciones'
    ]
  },
  {
    version: '1.0.0',
    date: '2026-01-04',
    title: 'Lanzamiento inicial',
    changes: [
      'Sistema completo de gestión de gimnasios',
      'Gestión de miembros, profesores y clases',
      'Sistema de rutinas y WODs',
      'Registro de personal records (PRs)',
      'Sistema de rankings y leaderboards',
      'Calendario integrado',
      'Sistema de noticias y anuncios',
      'Soporte para modo oscuro',
      'Aplicación web progresiva (PWA)'
    ]
  }
];

// Obtener versión formateada
export const getVersionString = () => `v${CURRENT_VERSION}`;

// Obtener último changelog
export const getLatestChangelog = () => CHANGELOG[0];

// Formatear fecha
export const formatChangelogDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
