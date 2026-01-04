# Sistema de Suspensión de Gimnasios

## Resumen

Se implementó un sistema completo para que el **sysadmin** pueda suspender gimnasios completos, bloqueando el acceso a todos sus usuarios hasta que se regularice la situación.

## ✅ Características Implementadas

### 1. **Suspensión/Reactivación (Solo Sysadmin)**
- Botón en la página `/gyms` para suspender o reactivar gimnasios
- Modal de confirmación con campo opcional para motivo de suspensión
- Acción reversible - se puede reactivar en cualquier momento

### 2. **Estructura de Datos**

```javascript
// Gimnasio Activo
{
  name: "CrossFit ABC",
  suspended: false,
  suspendedAt: null,
  suspendedReason: null,
  suspendedBy: null
}

// Gimnasio Suspendido
{
  name: "CrossFit ABC",
  suspended: true,
  suspendedAt: Timestamp,
  suspendedReason: "Motivo opcional visible para sysadmin y admin",
  suspendedBy: "sysadmin",
  reactivatedAt: null // Se llena cuando se reactive
}
```

### 3. **Mensajes por Rol**

**Alumno/Profesor:**
```
┌─────────────────────────────────┐
│      🚫 Gimnasio Suspendido     │
├─────────────────────────────────┤
│                                 │
│   GIMNASIO SUSPENDIDO           │
│   CONTACTARSE CON ADMINISTRADOR │
│                                 │
└─────────────────────────────────┘
```

**Admin del Gimnasio:**
```
┌─────────────────────────────────┐
│      🚫 Gimnasio Suspendido     │
├─────────────────────────────────┤
│ El gimnasio [Nombre] ha sido    │
│ suspendido temporalmente.       │
│                                 │
│ Motivo: [Razón opcional]        │
│                                 │
│ Por favor, contactá al soporte  │
│ de FitPro para regularizar.     │
│                                 │
│ soporte@fitpro.com              │
└─────────────────────────────────┘
```

**Sysadmin:**
- No ve pantalla de suspensión
- Puede acceder normalmente
- Ve badge "Suspendido" en lista de gimnasios
- Puede reactivar desde el menú desplegable

### 4. **Validación y Seguridad**

**Frontend:**
- `GymContext.isGymSuspended()` - Verifica si el gimnasio está suspendido
- `ProtectedRoute` - Intercepta acceso y muestra `SuspendedGymScreen`
- Sysadmin bypass automático

**Backend (Firebase Rules):**
```javascript
match /gyms/{gymId} {
  allow read: if true;
  allow create, delete: if isSysadmin();
  allow update: if isSysadmin() ||
                  (isAuthenticated() &&
                   request.resource.data.diff(resource.data).affectedKeys().hasOnly(['updatedAt']));
}
```

### 5. **UI/UX**

**En la Lista de Gimnasios:**
- Badge rojo "Suspendido" visible para sysadmin
- Ícono de candado en el card
- Opción de menú: "Suspender" / "Reactivar"

**Modal de Suspensión:**
- Advertencia clara del impacto
- Campo de texto opcional para motivo
- Confirmación requerida

**Modal de Reactivación:**
- Confirmación de reactivación
- Muestra motivo de suspensión previo (si existe)
- Botón verde para confirmar

## 📁 Archivos Modificados

### 1. **`src/components/Common/SuspendedGymScreen.js`** (NUEVO)
- Pantalla mostrada a usuarios de gimnasios suspendidos
- Mensajes diferenciados por rol (admin, profesor, alumno)
- Link de contacto a soporte

### 2. **`src/contexts/GymContext.js`**
- Función `isGymSuspended()` agregada
- Validación: sysadmin nunca está suspendido

### 3. **`src/App.js`**
- Validación de suspensión en `ProtectedRoute`
- Muestra `SuspendedGymScreen` si el gimnasio está suspendido

### 4. **`src/pages/Gyms.js`**
- Botón "Suspender" / "Reactivar" en dropdown
- Modal `SuspendModal` para confirmación
- Función `handleSuspendToggle` para suspender/reactivar
- Badge "Suspendido" en lista de gimnasios

### 5. **`firestore.rules`**
- Regla actualizada para gimnasios
- Solo sysadmin puede modificar campos de suspensión

### 6. **`src/components/Common/index.js`**
- Export de `SuspendedGymScreen`

## 🔄 Flujo de Uso

### Suspender un Gimnasio

1. **Sysadmin** inicia sesión
2. Va a `/gyms`
3. Click en menú (⋮) del gimnasio → **"Suspender"**
4. Modal se abre con:
   - Advertencia del impacto
   - Campo opcional "Motivo de suspensión"
5. Click en **"Suspender"**
6. Gimnasio se marca como `suspended: true`
7. Todos los usuarios del gimnasio (admin, profesor, alumno) pierden acceso
8. Badge "Suspendido" aparece en la lista

### Reactivar un Gimnasio

1. **Sysadmin** va a `/gyms`
2. Click en menú (⋮) del gimnasio suspendido → **"Reactivar"**
3. Modal muestra:
   - Confirmación de reactivación
   - Motivo de suspensión previo (si existe)
4. Click en **"Reactivar"**
5. Gimnasio se marca como `suspended: false`
6. Todos los usuarios recuperan acceso inmediatamente

## 🎯 Comportamiento

| Rol | Gimnasio Normal | Gimnasio Suspendido |
|-----|----------------|---------------------|
| **Sysadmin** | Acceso completo | Acceso completo (puede reactivar) |
| **Admin** | Acceso completo | Pantalla de suspensión con motivo + contacto |
| **Profesor** | Acceso según permisos | Pantalla "GIMNASIO SUSPENDIDO - CONTACTAR ADMIN" |
| **Alumno** | Acceso según permisos | Pantalla "GIMNASIO SUSPENDIDO - CONTACTAR ADMIN" |

## 🔒 Seguridad

✅ **Solo sysadmin puede suspender/reactivar** - Validado en frontend y backend
✅ **No elimina datos** - Solo cambia flags, datos intactos
✅ **Afecta solo un gimnasio** - Otros gimnasios no se ven afectados
✅ **Reversible** - Se puede reactivar en cualquier momento
✅ **Auditoria** - Registra quién suspendió, cuándo y por qué

## ⚠️ Importante

1. **No confundir con bloqueo de usuario individual** - Esta función bloquea el gimnasio completo
2. **Sysadmin siempre tiene acceso** - Necesario para poder reactivar
3. **El motivo es opcional** - Puede suspenderse sin especificar razón
4. **Firebase Rules deben estar publicadas** - Copiar `firestore.rules` a Firebase Console

## 🚀 Testing

### Caso 1: Suspender Gimnasio
1. Login como sysadmin
2. Ir a `/gyms`
3. Suspender gimnasio "Test Gym" con motivo "Prueba"
4. Cerrar sesión
5. Login como admin de "Test Gym"
6. ✅ Debe ver pantalla de suspensión con motivo

### Caso 2: Reactivar Gimnasio
1. Login como sysadmin
2. Ir a `/gyms`
3. Reactivar gimnasio "Test Gym"
4. Cerrar sesión
5. Login como admin de "Test Gym"
6. ✅ Debe acceder normalmente

### Caso 3: Múltiples Gimnasios
1. Suspender solo "Gym A"
2. Login como usuario de "Gym B"
3. ✅ Debe acceder normalmente (no afectado)

## 📝 Notas Adicionales

- Email de soporte hardcodeado: `soporte@fitpro.com` (cambiar si es necesario)
- El campo `suspendedBy` actualmente dice "sysadmin" - podría mejorarse para guardar el userId específico
- No se envían notificaciones automáticas - los admins deben enterarse cuando intenten acceder
- Historial de suspensiones no implementado (opcional para futuro)

---

**Fecha de implementación:** 2026-01-04
**Estado:** ✅ Completado y funcionando
