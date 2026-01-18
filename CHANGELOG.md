# Changelog

Todas las notas de las versiones de FitPro se documentan en este archivo.

## [1.0.16] - 2025-01-18

### Añadido
- **Tab de ESDs en creación de rutinas**:
  - Tercer tab "ESDs" junto a "Ejercicios" y "WODs" en el modal de rutinas
  - CRUD completo para agregar/editar/eliminar ESDs en bloques de rutinas
  - Selector de ESDs desde la lista de ESDs creados (filtrados por type: 'esd')
  - Configuración de descanso después de cada ESD
  - Notas opcionales por ESD
  - Contador visual de ESDs agregados
  - Icono Clock para identificación del tab
- **Efecto neon blanco GLOBAL en todo el texto**:
  - Text-shadow blanco aplicado a TODO el texto de la aplicación
  - Incluye: títulos, párrafos, botones, labels, inputs, links, listas, tablas
  - Modo claro: text-shadow 15-30px con opacidad 0.6-0.3
  - Modo oscuro: text-shadow 20-35px con opacidad 0.7-0.4
  - Doble capa de glow para máxima visibilidad
  - Efecto visible en TODA la interfaz (sidebar, contenido, modales, cards)

### Técnico
- Modificado: src/pages/Routines.js - Tab ESDs + funciones addEsd/updateEsd/removeEsd (líneas 570-602, 836-840, 1072-1139)
- Modificado: src/styles/index.css - Text-shadow blanco global (líneas 252-260)
- Modificado: package.json - Versión actualizada a 1.0.16

## [1.0.15] - 2025-01-18

### Modificado
- **Efectos de text-shadow neon en sidebar DRÁSTICAMENTE aumentados**:
  - Blur aumentado de 8-10px a 20-50px para máxima visibilidad
  - Opacidad aumentada de 0.3-0.4 a 0.8-0.9 para impacto visual
  - Doble text-shadow para efecto de glow más pronunciado
  - Items no seleccionados: text-shadow 20px blur con opacidad 0.8
  - Items con hover: text-shadow 25-30px blur con opacidad 0.9-1
  - Items activos: text-shadow 30-35px blur con opacidad 1
  - Efecto neon ahora MUY visible en Dashboard, Gimnasios, Usuarios, Alumnos, Profesores, Clases, Ejercicios, etc.

### Añadido
- **Botón de acceso rápido a ESDs en rutinas**:
  - Nuevo botón "ESDs" en la sección de WODs del modal de rutinas
  - Abre la página de ESDs en nueva pestaña para facilitar acceso
  - Icono Clock para identificación visual
  - Ubicado junto al botón "Agregar" en cada bloque

### Técnico
- Modificado: src/styles/index.css - Text-shadow aumentado drásticamente (líneas 517-580)
- Modificado: src/pages/Routines.js - Botón de acceso a ESDs (línea 964-973)
- Modificado: package.json - Versión actualizada a 1.0.15

## [1.0.14] - 2025-01-18

### Modificado
- **Efectos de text-shadow neon en navegación del sidebar**:
  - Aplicado text-shadow a TODOS los enlaces y botones dentro del elemento aside (sidebar)
  - Items no seleccionados: text-shadow 8-10px con opacidad 0.3-0.4
  - Items con hover: text-shadow 12-14px con opacidad 0.5-0.6
  - Items activos: text-shadow 10-12px con opacidad 0.5-0.6
  - Selectores específicos: `aside nav a`, `aside nav button`, `aside a span`, `aside button span`
  - Efecto visible en Dashboard, Gimnasios, Usuarios, Alumnos, Profesores, Clases, Ejercicios, etc.

### Técnico
- Modificado: src/styles/index.css - Selectores más específicos para sidebar (líneas 517-547)
- Modificado: package.json - Versión actualizada a 1.0.14

## [1.0.13] - 2025-01-18

### Añadido
- **Sistema ESD completo (Every X Seconds/Minutes Day)**:
  - **Sección dedicada de ESDs**: Nueva página completa para gestión de entrenamientos ESD
    - Menú propio en sidebar con icono Clock
    - Acceso para roles: Sysadmin, Admin, Profesor
    - CRUD completo: crear, editar, eliminar y asignar ESDs
  - **Estructura CrossFit**: Los ESDs utilizan ejercicios de la base de datos
    - Ejercicios referenciados por exerciseId (no texto libre)
    - Selector de ejercicios desde la biblioteca existente
    - Soporte para repeticiones, peso y notas por ejercicio
  - **Bloques ESD en rutinas**: Nuevo tipo de bloque para entrenamientos intervalados
    - Selector de tipo de bloque: Regular o ESD
    - Configuración de intervalo: 30s, 45s, 1min, 90s, 2min, 2:30min, 3min, 4min, 5min
    - Configuración de número de rondas: 1-60 rondas
    - Card informativo explicando la configuración del bloque ESD
  - **Timer especializado para bloques ESD**:
    - Contador de ronda actual con barra de progreso visual
    - Timer de intervalo con cuenta progresiva
    - Beep de audio automático entre rondas
    - Auto-avance a la siguiente ronda al completar intervalo
    - UI distintiva con tema púrpura/morado
    - Integración completa con sistema de pausar/reanudar rutina
- **Efectos visuales de glow/brillo VISIBLES**:
  - .glow-card: Brillo visible para tarjetas con bordes luminosos
  - .glow-moderate: Brillo moderado para elementos importantes
  - .glow-strong: Brillo fuerte para botones principales (muy visible)
  - .glow-border: Bordes con efecto de brillo interno/externo intenso
  - Glow automático y MUY visible en bg-card y btn-primary
  - Variantes dark/light con diferentes intensidades
  - Efectos de neon inspirados en diseño moderno con sombras y bordes luminosos
  - Aumentada la intensidad de todos los efectos para máxima visibilidad
- **Librerías UI agregadas**:
  - Material UI (@mui/material) v7.3.7
  - Emotion (@emotion/react, @emotion/styled) para styled-components
  - Framer Motion v12.26.2 para animaciones
- **Control de posición de imagen de banner**:
  - Selector de posición de foco en Configuración > Identidad Visual
  - 9 opciones: Centro, Arriba, Abajo, Izquierda, Derecha, y combinaciones de esquinas
  - Vista previa en tiempo real del posicionamiento
  - Se aplica automáticamente en Dashboard y GymInfo

### Modificado
- **RoutineTimer**: Lógica mejorada del timer para diferenciar entre ejercicios regulares, ejercicios por tiempo, WODs y bloques ESD
- **Layout de bloques en rutinas**: Selector de tipo de bloque ocupa ancho completo para mejor UX
- **Visualización en timer**: Cada tipo de elemento (ejercicio, WOD, ESD) tiene su propia UI distintiva
- **Corrección COMPLETA de colores de fondo**:
  - Body y bg-base ahora usan el mismo color (#F1F5F9) en modo claro
  - Cards y inputs usan fondo blanco (#FFFFFF) para resaltar contra el fondo
  - Consistencia total: todos los paneles tienen el mismo color de fondo
  - Solo las cards destacan con fondo blanco y efectos de glow
- **Interfaz minimalista para ESDs**: Diseño simple y limpio sin badges excesivas
- **Efectos de text-shadow con neon en texto**:
  - Títulos h1, h2, h3 con glow visible
  - Clase .text-primary con efecto de brillo
  - Badges con text-shadow
  - Números y métricas destacadas (.font-bold, .font-semibold) con glow sutil
- Ruta /esds agregada con protección de roles
- Navegación actualizada en constants.js para todos los roles administrativos
- Iconografía de Sidebar extendida con icono Clock

### Técnico
- Nuevo: src/pages/ESDs.js - Página completa de gestión de ESDs (675 líneas)
- Modificado: src/App.js - Ruta y import de ESDs
- Modificado: src/pages/Routines.js - Sistema de bloques con selector de tipo ESD
- Modificado: src/components/Common/RoutineTimer.js - Lógica de timer para ESD con estados separados
- Modificado: src/components/Common/Sidebar.js - Icono Clock en iconMap
- Modificado: src/utils/constants.js - Entrada de menú y constantes ESD_INTERVALS
- Modificado: src/styles/index.css - Efectos de glow, text-shadow y corrección de colores de fondo
- Modificado: src/pages/Settings.js - Selector de posición de banner (bannerPosition) con 9 opciones
- Modificado: src/pages/Dashboard.js - Aplicar objectPosition desde currentGym.bannerPosition
- Modificado: src/pages/GymInfo.js - Aplicar objectPosition desde currentGym.bannerPosition
- Nuevo: Estados esdCurrentRound y esdIntervalTime en RoutineTimer
- Nuevo: Función playBeep() para notificaciones de audio entre rondas
- Firebase: ESDs se almacenan en colección wods con campo type: esd
- Firebase: Campo bannerPosition agregado a documento de gyms
- Dependencias: +1486 paquetes agregados para Material UI y Framer Motion
