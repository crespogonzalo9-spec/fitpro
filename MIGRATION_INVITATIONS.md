# Migración del Sistema de Invitaciones

## Problema Detectado

Las invitaciones creadas antes de la actualización tenían una estructura diferente:

**Formato antiguo:**
```javascript
{
  code: "ABC123",
  usedCount: 0,
  usedBy: [],
  permanent: true/false,
  gymId: "xyz",
  // NO tenía: gymName, used, registeredUser
}
```

**Formato nuevo:**
```javascript
{
  code: "ABC123",
  used: false,
  usedBy: null,
  registeredUser: null,
  gymId: "xyz",
  gymName: "Nombre del Gym",
  // NO tiene: permanent, usedCount
}
```

## Solución Implementada

Se agregó **compatibilidad hacia atrás (backward compatibility)** para que el código funcione con ambos formatos.

### 1. Migración Automática en `src/pages/Invites.js`

Cuando se cargan las invitaciones, el sistema:
1. Detecta invitaciones con formato antiguo (tienen `usedCount` pero no `used`)
2. Las convierte automáticamente al formato nuevo en memoria
3. Actualiza la base de datos en segundo plano

**Código agregado (líneas 46-79):**
```javascript
// MIGRACIÓN: Convertir invitaciones antiguas a nuevo formato
const migrationsNeeded = [];
items = items.map(invite => {
  // Si tiene el formato antiguo (usedCount existe), migrarlo
  if (invite.usedCount !== undefined && invite.used === undefined) {
    const isUsed = invite.usedCount > 0;
    migrationsNeeded.push({
      id: invite.id,
      updates: {
        used: isUsed,
        usedBy: null,
        registeredUser: null
      }
    });
    return {
      ...invite,
      used: isUsed,
      usedBy: null,
      registeredUser: null
    };
  }
  return invite;
});

// Ejecutar migraciones en segundo plano
if (migrationsNeeded.length > 0) {
  migrationsNeeded.forEach(async ({ id, updates }) => {
    try {
      await updateDoc(doc(db, 'invites', id), updates);
    } catch (err) {
      console.error('Error migrando invitación:', err);
    }
  });
}
```

### 2. Detección de Uso en `src/components/Auth/Register.js`

**Líneas 72-73:**
```javascript
// BACKWARD COMPATIBILITY: Verificar formato antiguo y nuevo
const isUsed = foundInvite.used || (foundInvite.usedCount && foundInvite.usedCount > 0);
```

Ahora detecta si una invitación fue usada verificando AMBOS campos:
- `used === true` (formato nuevo)
- `usedCount > 0` (formato antiguo)

### 3. Recuperación del Nombre del Gimnasio en `src/components/Auth/Register.js`

**Líneas 90-97:**
```javascript
// BACKWARD COMPATIBILITY: Si no tiene gymName, buscarlo en la lista de gimnasios
let inviteWithGymName = { ...foundInvite };
if (!inviteWithGymName.gymName && inviteWithGymName.gymId) {
  const gym = gyms.find(g => g.id === inviteWithGymName.gymId);
  if (gym) {
    inviteWithGymName.gymName = gym.name;
  }
}
```

Si una invitación antigua no tiene `gymName`, lo busca en la lista de gimnasios cargados.

## Resultado

✅ **Las invitaciones antiguas ahora funcionan correctamente:**
- Se muestra el mensaje verde "Invitación válida - Te unirás a [Nombre del Gym]"
- Se detecta correctamente si ya fueron usadas
- Se migran automáticamente al nuevo formato en la base de datos

✅ **Las invitaciones nuevas se crean con el formato correcto:**
- Tienen todos los campos necesarios desde el inicio
- No requieren migración

## Próximos Pasos (Opcional)

Después de que todas las invitaciones antiguas se hayan migrado (puede tomar unos días o semanas dependiendo del uso), podés:

1. Verificar en Firebase Console que todas las invitaciones tienen `used: false` o `used: true`
2. Eliminar el código de migración de `Invites.js` (líneas 46-79)
3. Simplificar la verificación en `Register.js` a solo `foundInvite.used`

## Testing

Para verificar que funciona:

1. **Con invitación antigua:**
   - Usar el link de una invitación creada antes del cambio
   - ✅ Debe mostrar mensaje verde con nombre del gimnasio
   - ✅ Al registrarse, debe marcarse como usada
   - ✅ No debe ser visible para admin/profesor después de usarse

2. **Con invitación nueva:**
   - Crear una nueva invitación
   - ✅ Debe tener todos los campos correctos desde el inicio
   - ✅ Al usarse, debe guardar información del usuario registrado
   - ✅ Solo sysadmin debe verla después de usarse

---

**Fecha de implementación:** 2026-01-04
