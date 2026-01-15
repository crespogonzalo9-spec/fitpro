# Changelog

Todas las notas de las versiones de FitPro se documentan en este archivo.

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
