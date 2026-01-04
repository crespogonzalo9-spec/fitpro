# Sistema de Invitaciones - Implementación Final

## Resumen

Se implementó un sistema completo de invitaciones de **uso único** con las siguientes características:

### ✅ Características Implementadas

1. **Invitaciones de Uso Único**
   - Cada invitación puede usarse **solo una vez**
   - Una vez registrado un usuario, la invitación se marca como `used: true`
   - No se pueden reutilizar enlaces después del registro

2. **Validez Limitada**
   - Todas las invitaciones tienen fecha de expiración
   - Opciones: 1 día, 7 días, 30 días, 90 días, 1 año
   - Por defecto: 7 días

3. **Visibilidad por Roles**
   - **Admin/Profesor**: Solo ven invitaciones activas (no usadas)
   - **Sysadmin**: Ve todas las invitaciones (activas y usadas)

4. **Información de Registro**
   - Cuando una invitación es usada, se guarda:
     - Nombre del usuario
     - Email del usuario
     - ID del usuario
     - Fecha de registro
     - Gimnasio al que se unió
   - Esta información **solo es visible para sysadmin**

5. **Seguridad**
   - Códigos generados criptográficamente con `crypto.getRandomValues()`
   - Detección de colisiones de códigos
   - Validación de invitación antes del registro
   - Firebase Security Rules actualizadas

## Estructura de Datos

### Invitación Nueva (Formato Actual)

```javascript
{
  code: "3B1J6E4O",
  description: "Invitación para Juan",
  email: null, // Opcional - si se especifica, solo ese email puede usar la invitación
  roles: ["alumno"],
  gymId: "xyz123",
  gymName: "Gimnasio CrossFit",
  used: false, // true después del registro
  usedBy: null,
  registeredUser: null, // Se llena después del registro
  createdBy: "userId123",
  createdByName: "Admin Nombre",
  createdAt: Timestamp,
  expiresAt: Timestamp
}
```

### Invitación Usada

```javascript
{
  // ... campos anteriores ...
  used: true,
  usedAt: Timestamp,
  registeredUser: {
    name: "Juan Pérez",
    email: "juan@example.com",
    userId: "abc123",
    registeredAt: Date,
    gymId: "xyz123",
    gymName: "Gimnasio CrossFit"
  }
}
```

## Flujo de Uso

### 1. Crear Invitación (Admin/Profesor)
1. Ir a "Invitaciones" → Click en "Nueva Invitación"
2. Completar formulario:
   - Descripción (opcional)
   - Email específico (opcional)
   - Roles a asignar
   - Validez (1-365 días)
3. Click en "Crear Invitación"
4. Copiar el link generado

### 2. Registro con Invitación (Usuario Nuevo)
1. Abrir el link de invitación
2. Ver mensaje verde: "Invitación válida - Te unirás a [Gimnasio]"
3. Completar formulario de registro
4. Automáticamente:
   - Se crea el usuario
   - Se asigna al gimnasio
   - Se asignan los roles
   - Se marca la invitación como usada

### 3. Verificación Post-Registro

**Como Admin/Profesor:**
- La invitación ya NO aparece en la lista (está oculta porque `used: true`)

**Como Sysadmin:**
- La invitación aparece con badge "✓ Usada"
- Muestra información del usuario registrado:
  - Usuario: [Nombre]
  - Email: [Email]
  - Fecha de registro

## Archivos Modificados

### Backend / Lógica
1. **`src/contexts/AuthContext.js`**
   - Función `registerWithInvite` ahora devuelve `userId`
   - Línea 195: `return { success: true, userId };`

2. **`src/components/Auth/Register.js`**
   - Validación de invitación con backward compatibility
   - Actualización automática de invitación después del registro
   - Manejo de errores mejorado

### Frontend / UI
3. **`src/pages/Invites.js`**
   - Migración automática de invitaciones antiguas
   - Filtrado por rol (sysadmin vs admin/profesor)
   - UI para mostrar información de usuario registrado
   - Deshabilitar botón "Copiar Link" en invitaciones usadas

### Configuración
4. **`firestore.rules`**
   - Nueva regla para colección `events`
   - Regla de invitaciones permite queries con `limit <= 1` sin autenticación

5. **`src/App.js`**
   - WODs, Calendario y Novedades accesibles para todos los usuarios autenticados

## Firebase Security Rules

```javascript
match /invites/{inviteId} {
  allow get: if true;
  allow list: if isAuthenticated() || request.query.limit <= 1;
  allow create, delete: if isAdmin();
  allow update: if isAuthenticated();
}

match /events/{docId} {
  allow read: if isAuthenticated();
  allow write: if isAdmin();
}
```

## Migración de Invitaciones Antiguas

El sistema detecta automáticamente invitaciones con formato antiguo (`usedCount`) y las convierte al nuevo formato (`used: boolean`) en segundo plano.

**Código de migración** (en `Invites.js` líneas 46-79):
- Detecta invitaciones con `usedCount !== undefined && used === undefined`
- Convierte `usedCount > 0` → `used: true`
- Actualiza Firebase automáticamente

## Validaciones Implementadas

1. **Código de invitación válido**: Existe en la base de datos
2. **No expirada**: `expiresAt` es mayor que la fecha actual
3. **No usada**: `used === false`
4. **Email coincide** (si se especificó): El email del registro coincide con `invite.email`
5. **Password seguro**: Mínimo 8 caracteres, incluye mayúscula, minúscula y número

## Testing

### Caso 1: Registro Exitoso
1. Crear invitación nueva
2. Copiar link
3. Abrir en modo incógnito
4. Registrarse
5. ✅ Usuario creado
6. ✅ Invitación marcada como usada
7. ✅ Invitación oculta para admin
8. ✅ Invitación visible para sysadmin con info del usuario

### Caso 2: Invitación Ya Usada
1. Intentar usar el mismo link nuevamente
2. ✅ Mensaje: "Esta invitación ya fue utilizada"
3. ✅ No permite registro

### Caso 3: Invitación Expirada
1. Crear invitación con 1 día de validez
2. Esperar 24+ horas
3. Intentar usar el link
4. ✅ Mensaje: "Esta invitación ha expirado"

## Próximos Pasos (Opcional)

Después de que todas las invitaciones antiguas se hayan migrado:

1. Verificar en Firebase Console que todas tienen el campo `used`
2. Remover código de migración (líneas 46-79 en `Invites.js`)
3. Simplificar validación en `Register.js` (remover check de `usedCount`)

---

**Fecha de implementación:** 2026-01-04
**Estado:** ✅ Completado y funcionando
