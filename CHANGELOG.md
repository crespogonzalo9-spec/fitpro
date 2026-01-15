# Changelog

Todas las notas de las versiones de FitPro se documentan en este archivo.

## [1.1.0] - 2025-01-15

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
