// Sistema de changelog con versiones
// Versión actual de la aplicación
export const CURRENT_VERSION = '1.0.20';

// Historial de versiones (más reciente primero)
export const CHANGELOG = [
  {
    version: '1.0.20',
    date: '2025-01-18',
    title: 'Efecto neon ultra fino para máxima nitidez',
    changes: [
      'Reducción drástica de blur: de 5-20px a 2-7px para texto perfectamente nítido',
      'Texto global con blur de 2-4px (antes 5-13px) - completamente legible',
      'Sidebar con blur de 2-5px (antes 5-11px) - efecto sutil sin perder legibilidad',
      'Elementos activos y hover con blur de 3-7px (antes 8-20px) - definidos y claros',
      'Todos los textos de la app ahora son perfectamente legibles con efecto neon sutil',
      'Panel de ESDs y modales completamente nítidos'
    ]
  },
  {
    version: '1.0.19',
    date: '2025-01-18',
    title: 'Mejoras UI Usuarios + Sistema de tipos para ESDs',
    changes: [
      'Panel de Usuarios con mismo estilo que panel de Miembros',
      'Email movido al final de tarjetas con tooltip en panel de Usuarios',
      'Tarjetas de usuarios con mejor jerarquía visual y efecto hover',
      'Sistema de tipos para ESDs: EMOM, E2MOM, E3MOM, E4MOM, E30S, E45S, E90S, Personalizado',
      'Filtro por tipo de ESD en la lista principal',
      'Badge de tipo visible en tarjetas de ESDs',
      'ESDs ahora tienen la misma estructura de categorización que los WODs'
    ]
  },
  {
    version: '1.0.18',
    date: '2025-01-18',
    title: 'Efectos neon más finos + Alumno→Miembro',
    changes: [
      'Reducción de blur en efectos neon de 15-35px a 8-18px para mejor definición',
      'Efectos neon más finos que no se mezclan entre elementos',
      'Intensidad del brillo mantenida para máxima visibilidad',
      'Arreglado click en tarjetas de miembros para ver perfil',
      'Cambio de terminología: "Alumno" reemplazado por "Miembro" en toda la app',
      'Terminología más apropiada para contexto de gimnasio (13 archivos actualizados)'
    ]
  },
  {
    version: '1.0.17',
    date: '2025-01-18',
    title: 'Mejoras estéticas en panel de Miembros',
    changes: [
      'Email movido a la parte inferior de las tarjetas de miembros',
      'Email con fuente más pequeña y truncado automáticamente si es muy largo',
      'Tooltip con email completo al hacer hover sobre el email',
      'Tarjetas clickeables para ver perfil del miembro (solo profes, admins y sysadmin)',
      'Efecto hover mejorado en tarjetas con borde primary',
      'Mejorada la estructura visual y alineación de las tarjetas'
    ]
  },
  {
    version: '1.0.16',
    date: '2025-01-18',
    title: 'Tab ESDs en rutinas + efecto neon blanco GLOBAL',
    changes: [
      'Tercer tab "ESDs" en el modal de creación de rutinas junto a "Ejercicios" y "WODs"',
      'CRUD completo para agregar/editar/eliminar ESDs en bloques de rutinas',
      'Selector de ESDs desde la lista de ESDs creados',
      'Configuración de descanso y notas para cada ESD',
      'Efecto neon blanco aplicado a TODO el texto de la aplicación',
      'Text-shadow visible en sidebar, títulos, contenido, modales y cards',
      'Doble capa de glow para máxima visibilidad en modo claro y oscuro'
    ]
  },
  {
    version: '1.0.15',
    date: '2025-01-18',
    title: 'Efectos neon aumentados + acceso rápido a ESDs',
    changes: [
      'Efectos de text-shadow neon en sidebar drásticamente aumentados',
      'Blur aumentado de 8-10px a 20-50px para máxima visibilidad',
      'Opacidad aumentada de 0.3-0.4 a 0.8-0.9 para impacto visual',
      'Nuevo botón de acceso rápido a ESDs en la sección de WODs del modal de rutinas',
      'Botón "ESDs" con icono Clock abre la página de ESDs en nueva pestaña'
    ]
  },
  {
    version: '1.0.14',
    date: '2025-01-18',
    title: 'Efectos neon en navegación del sidebar',
    changes: [
      'Aplicado text-shadow a todos los enlaces y botones dentro del sidebar',
      'Items no seleccionados: text-shadow 8-10px con opacidad 0.3-0.4',
      'Items con hover: text-shadow 12-14px con opacidad 0.5-0.6',
      'Items activos: text-shadow 10-12px con opacidad 0.5-0.6',
      'Efecto visible en Dashboard, Gimnasios, Usuarios, Miembros, Profesores, Clases, Ejercicios'
    ]
  },
  {
    version: '1.0.13',
    date: '2025-01-18',
    title: 'Sistema ESD completo + efectos visuales mejorados',
    changes: [
      'Nueva sección completa de ESDs (Every X Seconds/Minutes Day)',
      'CRUD completo: crear, editar, eliminar y asignar ESDs',
      'Bloques ESD en rutinas con configuración de intervalo y rondas',
      'Timer especializado para bloques ESD con contador de rondas y beep automático',
      'Efectos visuales de glow/brillo visibles en toda la aplicación',
      'Control de posición de imagen de banner con 9 opciones de enfoque',
      'Corrección completa de colores de fondo en modo claro',
      'Librerías UI agregadas: Material UI, Emotion, Framer Motion',
      'ESDs se almacenan en colección wods con campo type: esd'
    ]
  },
  {
    version: '1.0.12',
    date: '2025-01-18',
    title: 'Mejoras masivas en rutinas y WODs',
    changes: [
      'Sistema de bloques en rutinas con selector de tipo',
      'Campo de intensidad para rutinas (Baja, Moderada, Alta, Muy Alta)',
      'Cada bloque en su propio cuadro editable con UI mejorada',
      'Mejorada la visualización y gestión de bloques',
      'Correcciones en el sistema de WODs'
    ]
  },
  {
    version: '1.0.11',
    date: '2026-01-15',
    title: 'Corrección Final de Fondo en Modo Claro',
    changes: [
      'El área de contenido principal ahora tiene el mismo color celeste que las tarjetas',
      'Uniformidad visual completa en modo claro'
    ]
  },
  {
    version: '1.0.10',
    date: '2026-01-15',
    title: 'Corrección de Fondo en Modo Claro',
    changes: [
      'El fondo principal ahora tiene el mismo color celeste que las tarjetas',
      'Experiencia visual completamente uniforme en modo claro'
    ]
  },
  {
    version: '1.0.9',
    date: '2026-01-15',
    title: 'Mejora Visual del Modo Claro',
    changes: [
      'Mejorada la uniformidad de colores en modo claro',
      'Las tarjetas y el fondo ahora tienen el mismo tono',
      'Experiencia visual más consistente y limpia'
    ]
  },
  {
    version: '1.0.8',
    date: '2026-01-15',
    title: 'Personalización de Tema Individual',
    changes: [
      'Cada usuario puede elegir modo oscuro o claro según su preferencia',
      'Nuevo botón de sol/luna en el header para cambiar el tema rápidamente',
      'Tu elección de tema se guarda automáticamente en tu dispositivo'
    ]
  },
  {
    version: '1.0.7',
    date: '2026-01-09',
    title: 'Simulador de Roles para Administradores',
    changes: [
      'Los administradores del sistema pueden simular vistas de otros roles',
      'Visualiza cómo ven la aplicación los profesores y alumnos',
      'Banner indicador cuando estás en modo simulación',
      'Botón para volver a tu vista normal fácilmente'
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
export const getVersionString = () => CURRENT_VERSION;

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
