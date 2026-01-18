# Changelog

Todas las notas de las versiones de FitPro se documentan en este archivo.

## [1.0.13] - 2025-01-18

### Añadido
- **Sistema ESD (Every X Seconds/Minutes Day)**: Nuevo tipo de bloque en rutinas para entrenamientos intervalados
  - Selector de tipo de bloque: Regular o ESD
  - Configuración de intervalo: 30s, 45s, 1min, 90s, 2min, 2:30min, 3min, 4min, 5min
  - Configuración de número de rondas: 1-60 rondas
  - Timer especial para bloques ESD con:
    - Contador de ronda actual con barra de progreso visual
    - Timer de intervalo con cuenta progresiva
    - Beep de audio automático entre rondas
    - Auto-avance a la siguiente ronda al completar intervalo
    - UI distintiva con tema púrpura/morado
  - Card informativo explicando la configuración del bloque ESD
  - Integración completa con sistema de pausar/reanudar rutina

### Modificado
- **RoutineTimer**: Lógica mejorada del timer para diferenciar entre ejercicios regulares, ejercicios por tiempo, WODs y bloques ESD
- **Layout de bloques en rutinas**: Selector de tipo de bloque ocupa ancho completo para mejor UX
- **Visualización en timer**: Cada tipo de elemento (ejercicio, WOD, ESD) tiene su propia UI distintiva

### Técnico
- Modificado: `src/pages/Routines.js` - Sistema de bloques con selector de tipo ESD
- Modificado: `src/components/Common/RoutineTimer.js` - Lógica de timer para ESD con estados separados
- Nuevo: Estados `esdCurrentRound` y `esdIntervalTime` en RoutineTimer
- Nuevo: Función `playBeep()` para notificaciones de audio entre rondas
- Modificado: `src/utils/constants.js` - Agregadas constantes ESD_INTERVALS

---

## [1.0.12] - 2025-01-16

### Añadido
- **Guardado automático de progreso en rutinas**: El progreso se guarda automáticamente con cada cambio de estado
- **Botón "Terminar Rutina Ahora"**: Permite finalizar la rutina anticipadamente guardando el progreso actual
- **Botón "Saltear Ejercicio"**: Opción para omitir ejercicios específicos durante la rutina
- **Tracking de ejercicios salteados**: Las estadísticas muestran cuántos ejercicios fueron salteados
- **Sistema completo de progreso del alumno**: Nueva página "Mi Progreso" con:
  - Gráfico interactivo de progreso con 7 métricas diferentes
  - Selector de período (última semana, 2 semanas, mes, 3 meses)
  - Tipos de gráfico: línea y barras
  - Estadísticas rápidas: rutinas, tiempo, ejercicios, promedio, salteados
  - Historial reciente de sesiones completadas

### Modificado
- **ServiceWorker deshabilitado en desarrollo**: Solo se activa en producción para evitar errores en localhost
- Restauración completa de estado al reanudar rutinas pausadas (incluye tiempo de descanso)
- Modales de confirmación mejorados para todas las acciones de rutinas

### Métricas disponibles en el gráfico
- Rutinas completadas
- Tiempo de entrenamiento (minutos)
- Ejercicios realizados
- Series completadas
- Repeticiones totales (estimadas)
- Peso levantado (estimado)
- Ejercicios salteados

### Técnico
- Nuevo: `src/components/Common/ProgressChart.js` - Componente de gráfico de progreso
- Modificado: `src/components/Common/RoutineTimer.js` - Sistema completo de guardado y control de rutinas
- Modificado: `src/pages/MemberProgress.js` - Implementación completa de página de progreso
- Modificado: `public/index.html` - ServiceWorker solo en producción

---

## [1.0.11] - 2025-01-15

### Modificado
- **Fondo del área de contenido en modo claro**: Agregada clase `bg-card` al main del Layout
- Reverted cambios incorrectos que afectaban sidebar y banner
- El área de contenido principal ahora usa el mismo color celeste que las tarjetas individuales

### Técnico
- Modificado: `src/components/Common/Layout.js` - Agregado `bg-card` al elemento main
- Modificado: `src/styles/index.css` - Revertidos cambios incorrectos a body y .bg-base

---

## [1.0.10] - 2025-01-15

### Modificado
- **Fondo principal en modo claro**: Cambiado color de fondo del body para usar el mismo celeste que las tarjetas
- Clases `body` y `.bg-base` ahora usan `--color-bg-100` (241, 245, 249) en lugar de colores más claros
- Uniformidad completa entre fondo y tarjetas en modo claro

### Técnico
- Modificado: `src/styles/index.css` - Actualizado color de fondo del body y .bg-base en modo claro

---

## [1.0.9] - 2025-01-15

### Modificado
- **Uniformidad de colores en modo claro**: Removidos filtros CSS que causaban diferentes tonos de azul en las tarjetas
- Las clases `.bg-base`, `.bg-card`, `.bg-sidebar`, `.bg-input` ahora tienen colores consistentes sin filtros de saturación/brillo
- Experiencia visual más limpia y uniforme en modo claro, similar a modo oscuro

### Técnico
- Modificado: `src/styles/index.css` - Removidos todos los filtros de saturación y brillo de las clases de fondo en modo claro

---

## [1.0.8] - 2025-01-15

### Añadido
- **Modo oscuro individual por usuario**: Cada usuario puede activar/desactivar el modo oscuro independientemente
- **Switch de tema en header**: Botón de sol/luna al lado del número de versión para cambiar el tema rápidamente
- El tema se guarda en localStorage del navegador de cada usuario

### Modificado
- ThemeContext: Modo oscuro ya no se sincroniza desde gimnasio sino desde localStorage del usuario
- Header: Agregado switch de tema (sol/luna) al lado del número de versión

### Seguridad
- Archivo .env removido del repositorio público
- Creada documentación de seguridad (SECURITY.md)
- Configuradas restricciones de API Key en Google Cloud Console

---

## [1.0.7] - 2025-01-09

### Añadido
- **Simulador de Roles para Sysadmin**: Nueva funcionalidad que permite a los sysadmin ver la aplicación desde la perspectiva de otros roles (Admin, Profesor, Alumno)
  - Nuevo componente RoleSimulator en la página de Configuración
  - Banner flotante visible durante el modo simulación
  - Botón para volver a la vista normal desde cualquier página
  - Funciones en AuthContext para gestionar el estado de simulación
  - Todas las verificaciones de permisos respetan el rol simulado

### Modificado
- AuthContext: Agregado sistema de simulación de roles con funciones `startRoleSimulation()`, `stopRoleSimulation()`, `isSimulating()` y `getEffectiveRoles()`
- AuthContext: Modificadas todas las funciones de verificación de roles para respetar el rol simulado
- Sidebar: Actualizado para usar roles efectivos (simulados o reales)
- Layout: Integrado banner de simulación de roles con ajuste automático de padding

### Seguridad
- Actualizado Firebase de v10.7.0 a v12.8.0 (corrige vulnerabilidades de undici)
- Agregados overrides de npm para forzar versiones seguras:
  - nth-check ^2.1.1 (corrige CVE de complejidad regex)
  - postcss ^8.4.31 (corrige error de parsing)
  - webpack-dev-server ^5.2.1 (previene robo de código fuente en desarrollo)
- Resultado: 0 vulnerabilidades detectadas por npm audit

### Técnico
- Nuevo componente: `src/components/Common/RoleSimulationBanner.js`
- Modificados: `src/contexts/AuthContext.js`, `src/pages/Settings.js`, `src/components/Common/Layout.js`, `src/components/Common/Sidebar.js`
- El sistema de simulación está restringido exclusivamente a usuarios con rol sysadmin

---

## [1.0.0] - 2025-01-14

### Versión Inicial
- Sistema completo de gestión de gimnasios
- Gestión de usuarios con roles múltiples (Sysadmin, Admin, Profesor, Alumno)
- Gestión de clases y horarios
- Biblioteca de ejercicios
- Sistema de rutinas y WODs
- Timer integrado para rutinas con soporte para ejercicios y WODs
- Sistema de marcas personales (PRs)
- Rankings y leaderboards
- Sistema de invitaciones
- Calendario integrado
- Sistema de noticias y anuncios
- Personalización de colores y branding por gimnasio
- Modo oscuro/claro
- Soporte PWA (Progressive Web App)
- Diseño responsive
