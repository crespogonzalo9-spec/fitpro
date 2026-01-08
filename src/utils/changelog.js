// Sistema de changelog con versiones
// Versión actual de la aplicación
export const CURRENT_VERSION = '1.0.14';

// Historial de versiones (más reciente primero)
export const CHANGELOG = [
  {
    version: '1.0.14',
    date: '2026-01-07',
    title: 'Release final: Sistema multi-tenant con slugs completamente funcional',
    changes: [
      'IMPORTANTE: Configurar REACT_APP_BASE_URL en Vercel Environment Variables',
      'IMPORTANTE: Actualizar Firebase Rules para permitir lectura pública de gyms e invites',
      'Sistema multi-tenant híbrido: /exercises Y /gym-slug/exercises funcionan',
      'Links de invitación generan URLs correctas con slug del gimnasio',
      'Login navega automáticamente con slug del usuario',
      'Migración automática de slugs para gimnasios existentes',
      'Firebase rules actualizadas para registro sin autenticación'
    ]
  },
  {
    version: '1.0.13',
    date: '2026-01-07',
    title: 'Fix crítico: Orden de rutas para registro con slug',
    changes: [
      'Arreglado routing: /:gymSlug/register ahora funciona correctamente',
      'Las rutas de auth con slug ahora tienen prioridad sobre rutas protegidas',
      'Links de invitación ahora redirigen correctamente a la página de registro',
      'Fix: React Router ya no confunde /pantera-cf/register con ruta protegida'
    ]
  },
  {
    version: '1.0.12',
    date: '2026-01-07',
    title: 'Fix: Links de invitación apuntan a URL de producción',
    changes: [
      'Links de invitación ahora usan REACT_APP_BASE_URL del .env',
      'Los links siempre apuntan al dominio de producción, no al de testing',
      'Agregada variable REACT_APP_BASE_URL a .env.example',
      'Fallback a window.location.origin si no está configurada la variable'
    ]
  },
  {
    version: '1.0.11',
    date: '2026-01-07',
    title: 'Fix crítico: Migración automática de slugs',
    changes: [
      'Login ahora navega correctamente con slug del gimnasio (/pantera-cf/dashboard)',
      'Migración automática: slugs se generan para gimnasios existentes sin slug',
      'Fix: GymContext detecta y crea slugs al cargar gimnasios',
      'Logs de consola para tracking de migración de slugs',
      'Sistema completamente funcional para multi-tenant con slugs'
    ]
  },
  {
    version: '1.0.10',
    date: '2026-01-07',
    title: 'Arquitectura multi-tenant híbrida con slugs',
    changes: [
      'Implementado sistema de slugs para gimnasios (ej: /pantera-cf/exercises)',
      'Soporte híbrido: URLs funcionan con y sin slug (/exercises O /gym-slug/exercises)',
      'Auto-generación de slugs al crear o editar gimnasios',
      'Detección automática de gimnasio por slug en la URL',
      'Links de invitación incluyen slug del gimnasio (ej: /gym-slug/register?invite=CODE)',
      'Navegación del sidebar mantiene el slug en todas las URLs',
      'Selector de gimnasios para sysadmin navega con slug automáticamente',
      'Mejora SEO: cada gimnasio tiene URLs únicas e indexables'
    ]
  },
  {
    version: '1.0.9',
    date: '2026-01-07',
    title: 'Corrección crítica en links de invitación',
    changes: [
      'Arreglado link de invitación que ahora lleva a /register directamente',
      'Los links ahora son: /register?invite=CODIGO en lugar de /?invite=CODIGO',
      'Los usuarios son dirigidos automáticamente a la página de registro'
    ]
  },
  {
    version: '1.0.8',
    date: '2026-01-07',
    title: 'Correcciones importantes y mejoras de SEO',
    changes: [
      'Arreglado contador de administradores en página de gimnasios',
      'Actualizado permisos Firebase para admins editar su gimnasio',
      'Agregados metadatos Open Graph y Twitter Cards',
      'Implementado Schema.org para mejor indexación en Google',
      'Actualizado robots.txt con configuración optimizada',
      'Creado sitemap.xml para bots de búsqueda',
      'Mejoradas descripciones SEO para IAs y motores de búsqueda',
      'Agregadas reglas Firebase para equipment y equipment_categories'
    ]
  },
  {
    version: '1.0.7',
    date: '2026-01-06',
    title: 'Sistema de categorías personalizables',
    changes: [
      'Nuevo gestor de categorías de equipamiento con creación personalizada',
      'Selector de emoji personalizable para cada categoría',
      'Selector de color con 12 opciones de paleta',
      'Botón "Gestionar Categorías" en el gestor de equipamiento',
      'Las categorías predeterminadas no se pueden editar ni eliminar',
      'Las categorías personalizadas se guardan por gimnasio en Firebase',
      'Integración completa con filtros de equipamiento en ejercicios'
    ]
  },
  {
    version: '1.0.6',
    date: '2026-01-06',
    title: 'Reorganización experta de equipamiento',
    changes: [
      'Reorganización completa del equipamiento por experto en gimnasios',
      'Ampliado a 200+ items de equipamiento predeterminado',
      'Nuevas categorías: Racks/Estructuras y Bancos/Plataformas',
      'Categorías renombradas para mayor claridad profesional',
      'Equipamiento organizado por disciplinas: Olímpico, PowerLifting, CrossFit, Calistenia',
      'Añadido equipamiento especializado: GHD, Reverse Hyper, Atlas Stones, Yoke'
    ]
  },
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
