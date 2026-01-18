# Changelog

Todas las notas de las versiones de FitPro se documentan en este archivo.

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
- **Efectos visuales de glow/brillo**:
  - .glow-card: Brillo sutil para tarjetas
  - .glow-moderate: Brillo moderado para elementos importantes
  - .glow-strong: Brillo fuerte para botones principales
  - .glow-border: Bordes con efecto de brillo interno/externo
  - Glow automático en bg-card y btn-primary
  - Variantes dark/light con diferentes intensidades
- **Librerías UI agregadas**:
  - Material UI (@mui/material) v7.3.7
  - Emotion (@emotion/react, @emotion/styled) para styled-components
  - Framer Motion v12.26.2 para animaciones

### Modificado
- **RoutineTimer**: Lógica mejorada del timer para diferenciar entre ejercicios regulares, ejercicios por tiempo, WODs y bloques ESD
- **Layout de bloques en rutinas**: Selector de tipo de bloque ocupa ancho completo para mejor UX
- **Visualización en timer**: Cada tipo de elemento (ejercicio, WOD, ESD) tiene su propia UI distintiva
- **Corrección de colores de fondo**: Body y bg-base ahora usan el mismo color (#F1F5F9) en modo claro
- **Interfaz minimalista para ESDs**: Diseño simple y limpio sin badges excesivas
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
- Modificado: src/styles/index.css - Efectos de glow y corrección de colores de fondo
- Nuevo: Estados esdCurrentRound y esdIntervalTime en RoutineTimer
- Nuevo: Función playBeep() para notificaciones de audio entre rondas
- Firebase: ESDs se almacenan en colección wods con campo type: esd
- Dependencias: +1486 paquetes agregados para Material UI y Framer Motion
