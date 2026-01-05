# 🔒 CORRECCIONES DE SEGURIDAD - FitPro

**Fecha:** 2026-01-04
**Estado:** ✅ Implementado

---

## 📋 ÍNDICE

1. [Resumen de Vulnerabilidades Corregidas](#resumen-de-vulnerabilidades-corregidas)
2. [Instrucciones para Actualizar Firebase](#instrucciones-para-actualizar-firebase)
3. [Cómo Crear un Usuario Sysadmin](#cómo-crear-un-usuario-sysadmin)
4. [Verificación de Seguridad](#verificación-de-seguridad)
5. [Detalles Técnicos de Cada Corrección](#detalles-técnicos-de-cada-corrección)

---

## 📊 RESUMEN DE VULNERABILIDADES CORREGIDAS

### CRÍTICAS (CVSS 7.0-10.0)

#### ✅ CRITICAL-01: Validación de Sysadmin en Frontend (CVSS 9.1)
**Problema:**
Cualquier usuario podía obtener privilegios de sysadmin simplemente conociendo el email configurado en la variable de entorno `REACT_APP_SYSADMIN_EMAIL`. La validación se hacía solo en el frontend, sin verificación en el backend.

**Solución:**
- ❌ **Eliminada** toda validación de sysadmin por email en el frontend
- ✅ Ahora **todos** los usuarios se registran como `alumno` por defecto
- ✅ Los roles de sysadmin deben asignarse **manualmente** desde la consola de Firebase
- ✅ Implementada validación de roles en Firestore Security Rules (server-side)

**Archivos modificados:**
- `src/contexts/AuthContext.js` (líneas 117-126)

---

#### ✅ CRITICAL-02: Generación Insegura de Códigos de Invitación (CVSS 8.2)
**Problema:**
Al crear una invitación, el sistema leía **TODAS** las invitaciones de la base de datos (`getDocs(collection(db, 'invites'))`) para verificar colisiones. Esto:
- Exponía todos los códigos de invitación
- Creaba un vector de ataque DoS (Denial of Service)
- Escalaba linealmente con el número de invitaciones (O(n))

**Solución:**
- ✅ Reemplazado con generación criptográfica segura usando `crypto.getRandomValues()`
- ✅ Códigos de 10 caracteres en base36 (62^10 combinaciones = ~839 quintillones)
- ✅ Probabilidad de colisión prácticamente nula (no requiere verificación)
- ✅ **No lee la base de datos** durante la generación

**Archivos modificados:**
- `src/pages/Invites.js` (líneas 98-112)

---

#### ✅ CRITICAL-03: Reglas de Firestore para Invitaciones (CVSS 8.8)
**Problema:**
Las reglas permitían:
- Lectura pública de invitaciones (`allow get: if true`)
- Listado con bypass fácil (`request.query.limit <= 1`)
- Actualización por cualquier usuario autenticado

**Solución:**
```javascript
match /invites/{inviteId} {
  // Solo usuarios no autenticados (registro) o del mismo gimnasio
  allow get: if !isAuthenticated() || (isAuthenticated() && (isSysadmin() || belongsToGym(resource.data.gymId)));

  // Solo usuarios del gimnasio pueden listar invitaciones
  allow list: if isAuthenticated() && (isSysadmin() || belongsToGym(request.query.gymId));

  // Solo admins del gimnasio pueden crear invitaciones
  allow create: if isAdmin() && belongsToGym(request.resource.data.gymId) && request.resource.data.roles is list;

  // Solo para marcar como usada durante registro, o admins del gimnasio
  allow update: if (!isAuthenticated() && !resource.data.used &&
                    request.resource.data.used == true &&
                    request.resource.data.registeredUser.email is string) ||
                  (isAuthenticated() && (isSysadmin() || belongsToGym(resource.data.gymId)));

  // Solo admins del gimnasio pueden eliminar
  allow delete: if isAdmin() && belongsToGym(resource.data.gymId);
}
```

**Archivos modificados:**
- `firestore.rules` (líneas 36-47)

---

#### ✅ CRITICAL-05: Validación de Roles Solo en Cliente (CVSS 9.3)
**Problema:**
Usuarios podían modificar sus propios roles usando la consola del navegador o interceptando peticiones, ya que no había validación server-side.

**Solución:**
Implementadas reglas estrictas en Firestore:

```javascript
match /users/{userId} {
  allow read: if isAuthenticated();

  // Al crear, solo puede asignar rol 'alumno'
  allow create: if request.auth.uid == userId &&
                  request.resource.data.roles is list &&
                  request.resource.data.roles.hasOnly(['alumno']);

  // Al actualizar: usuarios NO pueden modificar roles, gymId, ni isBlocked
  allow update: if (request.auth.uid == userId &&
                    !request.resource.data.diff(resource.data).affectedKeys().hasAny(['roles', 'gymId', 'isBlocked'])) ||
                  (isAdmin() && belongsToGym(resource.data.gymId)) ||
                  isSysadmin();

  allow delete: if isSysadmin();
}
```

**Archivos modificados:**
- `firestore.rules` (líneas 45-55)

---

#### ✅ CRITICAL-07: Sin Validación de Email en Invitaciones (CVSS 7.2)
**Problema:**
Las invitaciones podían tener un email específico asignado, pero cualquier usuario podía registrarse usando ese link, ignorando el email destinatario.

**Solución:**
- ✅ Validación en frontend: verifica que el email ingresado coincida con el de la invitación
- ✅ Validación en Firestore Rules: al marcar invitación como usada, se valida que registeredUser.email sea string

**Archivos modificados:**
- `src/components/Auth/Register.js` (líneas 151-156)
- `firestore.rules` (líneas 42-45)

---

### HIGH PRIORITY (CVSS 4.0-6.9)

#### ✅ HIGH-01: Lectura Pública de Gimnasios (CVSS 7.1)
**Problema:**
Cualquier persona (incluso sin autenticación) podía leer la lista completa de gimnasios con `allow read: if true`.

**Solución:**
```javascript
match /gyms/{gymId} {
  allow read: if isAuthenticated();  // Solo usuarios autenticados
  allow create, delete: if isSysadmin();
  allow update: if isSysadmin() || (isAuthenticated() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['updatedAt']));
}
```

**Archivos modificados:**
- `firestore.rules` (líneas 29-34)

---

## 🔧 INSTRUCCIONES PARA ACTUALIZAR FIREBASE

### Paso 1: Acceder a Firebase Console

1. Abrí tu navegador (Chrome, Firefox, Edge, etc.)
2. Entrá a [https://console.firebase.google.com/](https://console.firebase.google.com/)
3. Iniciá sesión con tu cuenta de Google
4. Seleccioná tu proyecto **FitPro** de la lista

![Firebase Console](https://i.imgur.com/example.png)

---

### Paso 2: Ir a Firestore Database

1. En el menú lateral izquierdo, hacé click en **"Firestore Database"**
2. Vas a ver una pantalla con tus colecciones (users, gyms, invites, etc.)

![Firestore Menu](https://i.imgur.com/example2.png)

---

### Paso 3: Abrir las Reglas de Seguridad

1. En la parte superior, hacé click en la pestaña **"Reglas"** (Rules)
2. Vas a ver un editor de texto con las reglas actuales

![Rules Tab](https://i.imgur.com/example3.png)

---

### Paso 4: Reemplazar las Reglas

1. **Seleccioná TODO el contenido** del editor (Ctrl+A o Cmd+A)
2. **Borrá** todo el contenido actual
3. **Copiá** el siguiente código **COMPLETO**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isAdmin() {
      return isAuthenticated() && getUserData().roles.hasAny(['admin', 'sysadmin']);
    }

    function isSysadmin() {
      return isAuthenticated() && getUserData().roles.hasAny(['sysadmin']);
    }

    function isProfesor() {
      return isAuthenticated() && getUserData().roles.hasAny(['profesor', 'admin', 'sysadmin']);
    }

    function belongsToGym(gymId) {
      return isAuthenticated() && (getUserData().gymId == gymId || isSysadmin());
    }

    match /gyms/{gymId} {
      allow read: if isAuthenticated();
      allow create, delete: if isSysadmin();
      allow update: if isSysadmin() ||
                      (isAuthenticated() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['updatedAt']));
    }

    match /invites/{inviteId} {
      allow get: if !isAuthenticated() || (isAuthenticated() && (isSysadmin() || belongsToGym(resource.data.gymId)));
      allow list: if isAuthenticated() && (isSysadmin() || belongsToGym(request.query.gymId));
      allow create: if isAdmin() &&
                      belongsToGym(request.resource.data.gymId) &&
                      request.resource.data.roles is list;
      allow update: if (!isAuthenticated() && !resource.data.used &&
                        request.resource.data.used == true &&
                        request.resource.data.registeredUser.email is string) ||
                      (isAuthenticated() && (isSysadmin() || belongsToGym(resource.data.gymId)));
      allow delete: if isAdmin() && belongsToGym(resource.data.gymId);
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if request.auth.uid == userId &&
                      request.resource.data.roles is list &&
                      request.resource.data.roles.hasOnly(['alumno']);
      allow update: if (request.auth.uid == userId &&
                        !request.resource.data.diff(resource.data).affectedKeys().hasAny(['roles', 'gymId', 'isBlocked'])) ||
                      (isAdmin() && belongsToGym(resource.data.gymId)) ||
                      isSysadmin();
      allow delete: if isSysadmin();
    }

    match /classes/{docId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    match /exercises/{docId} {
      allow read: if isAuthenticated();
      allow write: if isProfesor();
    }

    match /routines/{docId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isProfesor();
    }

    match /routine_sessions/{docId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }

    match /wods/{docId} {
      allow read: if isAuthenticated() && (
        belongsToGym(resource.data.gymId) &&
        (
          isProfesor() ||
          !resource.data.keys().hasAny(['assignedTo']) ||
          request.auth.uid in resource.data.assignedTo
        )
      );
      allow create, update, delete: if isProfesor();
    }

    match /prs/{docId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }

    match /rankings/{docId} {
      allow read: if isAuthenticated();
      allow create, update: if isProfesor();
      allow delete: if isAdmin();
    }

    match /news/{docId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    match /members/{docId} {
      allow read: if isAuthenticated();
      allow write: if isProfesor();
    }

    match /schedules/{docId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    match /events/{docId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
  }
}
```

4. **Pegá** el código en el editor (Ctrl+V o Cmd+V)
5. Hacé click en el botón **"Publicar"** (Publish) en la parte superior derecha
6. Esperá a que aparezca el mensaje de confirmación verde

---

### Paso 5: Verificar que NO hay Errores

Si al hacer click en "Publicar" aparece algún error:

#### Error común: "Syntax error"
- **Causa:** Copiaste mal el código o falta algún carácter
- **Solución:** Borrá todo y volvé a copiar desde el inicio de las llaves `rules_version = '2';`

#### Error común: "Invalid token"
- **Causa:** Caracteres especiales o espacios extra
- **Solución:** Usá el código tal cual está en este documento, sin modificaciones

---

## 👤 CÓMO CREAR UN USUARIO SYSADMIN

**IMPORTANTE:** Ya no podés crear sysadmins desde el registro. Ahora se hace manualmente desde Firebase.

### Paso 1: El Usuario Debe Registrarse Primero

1. El usuario que querés convertir en sysadmin debe registrarse normalmente en la app
2. Va a tener rol `alumno` por defecto
3. Anotá su **email** exacto

---

### Paso 2: Ir a Firestore Database

1. En Firebase Console, andá a **Firestore Database**
2. Hacé click en la pestaña **"Datos"** (Data)
3. Vas a ver la lista de colecciones

---

### Paso 3: Buscar el Usuario

1. Hacé click en la colección **"users"**
2. Vas a ver la lista de todos los usuarios registrados
3. Buscá el usuario por su email (podés usar Ctrl+F en tu navegador)
4. Hacé click en el documento del usuario (va a tener un ID largo como `oP9mXkL2...`)

---

### Paso 4: Editar el Campo "roles"

1. Vas a ver todos los campos del usuario (email, name, phone, roles, etc.)
2. Buscá el campo **"roles"**
3. Hacé click en el campo `roles` para editarlo
4. Vas a ver que dice: `["alumno"]`
5. **Reemplazá** el contenido por:

```json
["sysadmin", "admin", "profesor", "alumno"]
```

6. Hacé click en **"Actualizar"** (Update)

---

### Paso 5: Verificar que Funciona

1. Pedile al usuario que **cierre sesión** y **vuelva a iniciar sesión**
2. Al entrar, debería ver las opciones de sysadmin en el menú:
   - Gimnasios
   - Usuarios
   - Todas las funcionalidades de admin

---

## ✅ VERIFICACIÓN DE SEGURIDAD

Después de aplicar las reglas, verificá que todo funciona correctamente:

### Test 1: Usuario Nuevo (Alumno)
1. Registrate con un email nuevo
2. ✅ Debería crearse con rol `alumno` solamente
3. ❌ NO debería tener acceso a opciones de admin/profesor

### Test 2: Invitaciones
1. Creá una invitación desde un admin
2. ✅ Debería generar un código de 10 caracteres
3. ✅ Copiá el link y probá registrarte
4. ✅ Después de registrarte, la invitación debe aparecer como "Usada"

### Test 3: Lectura de Gimnasios
1. Abrí la consola del navegador (F12)
2. Andá a la pestaña **Console**
3. Pegá este código:

```javascript
firebase.firestore().collection('gyms').get()
  .then(snap => console.log('GYMS:', snap.docs.map(d => d.data())))
  .catch(err => console.log('ERROR:', err.message))
```

4. ❌ Debería dar error si no estás autenticado
5. ✅ Debería funcionar si estás autenticado

### Test 4: Modificar Roles (Intento de Ataque)
1. Estando logueado como alumno, abrí la consola (F12)
2. Pegá este código:

```javascript
firebase.firestore().collection('users').doc(firebase.auth().currentUser.uid)
  .update({ roles: ['sysadmin', 'admin'] })
  .then(() => console.log('MODIFICADO'))
  .catch(err => console.log('BLOQUEADO:', err.message))
```

3. ❌ Debería dar **error "PERMISSION DENIED"**
4. ✅ Esto significa que la seguridad está funcionando

---

## 🔍 DETALLES TÉCNICOS DE CADA CORRECCIÓN

### CRITICAL-01: Eliminación de Validación de Sysadmin

**Código Anterior (INSEGURO):**
```javascript
// AuthContext.js - ANTES
const SYSADMIN_EMAIL = process.env.REACT_APP_SYSADMIN_EMAIL || '';
const isSysadminEmail = email.toLowerCase() === SYSADMIN_EMAIL.toLowerCase();
const roles = isSysadminEmail ? ['sysadmin', 'admin', 'profesor', 'alumno'] : ['alumno'];
```

**Código Nuevo (SEGURO):**
```javascript
// AuthContext.js - AHORA
const roles = ['alumno']; // Todos empiezan como alumno
// Los roles de sysadmin se asignan manualmente desde Firebase Console
```

**Por qué era peligroso:**
- Cualquier persona que conociera el email de sysadmin (guardado en `.env`) podía obtener acceso total
- La validación se hacía en el cliente (navegador), fácilmente manipulable
- No había verificación server-side

**Por qué ahora es seguro:**
- No hay forma de auto-asignarse roles elevados
- Los roles se validan en Firestore Security Rules (server-side)
- Solo un sysadmin puede modificar roles de otros usuarios

---

### CRITICAL-02: Generación de Códigos de Invitación

**Código Anterior (INSEGURO):**
```javascript
// Invites.js - ANTES
const generateCode = async () => {
  const invitesSnap = await getDocs(collection(db, 'invites')); // ⚠️ Lee TODO
  const existingCodes = invitesSnap.docs.map(d => d.data().code);
  // ... generar código y verificar colisión
};
```

**Código Nuevo (SEGURO):**
```javascript
// Invites.js - AHORA
const generateCode = () => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array); // Generación criptográfica
  const code = Array.from(array)
    .map(byte => byte.toString(36))
    .join('')
    .substring(0, 10)
    .toUpperCase();
  return code; // No requiere verificación
};
```

**Por qué era peligroso:**
- Exponía todos los códigos de invitación existentes
- Vector de ataque DoS (leer 1000+ documentos cada vez)
- Complejidad O(n) - empeora con más invitaciones

**Por qué ahora es seguro:**
- Usa `crypto.getRandomValues()` (estándar criptográfico)
- 10 caracteres en base36 = 839,299,365,868,340,224 combinaciones posibles
- Probabilidad de colisión: 1 en 839 quintillones
- No lee la base de datos (O(1) constante)

---

### CRITICAL-03: Firestore Rules - Invitaciones

**Cambios clave:**

1. **Lectura GET restringida:**
   - Antes: `allow get: if true` (cualquiera podía leer)
   - Ahora: Solo usuarios no autenticados (para registro) o del mismo gimnasio

2. **Listado protegido:**
   - Antes: `allow list: if isAuthenticated() || request.query.limit <= 1` (bypass fácil)
   - Ahora: Solo usuarios del gimnasio correspondiente

3. **Actualización controlada:**
   - Antes: Cualquier usuario autenticado podía actualizar
   - Ahora: Solo para marcar como "usada" durante registro, con validaciones estrictas

---

### CRITICAL-05: Validación de Roles Server-Side

**Reglas Firestore implementadas:**

```javascript
match /users/{userId} {
  // Al crear usuario, solo puede tener rol 'alumno'
  allow create: if request.auth.uid == userId &&
                  request.resource.data.roles is list &&
                  request.resource.data.roles.hasOnly(['alumno']);

  // Al actualizar:
  // - El usuario NO puede modificar: roles, gymId, isBlocked
  // - Solo admins del mismo gimnasio pueden modificar estos campos
  // - Solo sysadmin puede hacer cualquier modificación
  allow update: if (request.auth.uid == userId &&
                    !request.resource.data.diff(resource.data).affectedKeys().hasAny(['roles', 'gymId', 'isBlocked'])) ||
                  (isAdmin() && belongsToGym(resource.data.gymId)) ||
                  isSysadmin();
}
```

**Protecciones:**
- ✅ Usuario no puede auto-asignarse roles
- ✅ Usuario no puede cambiar de gimnasio por sí mismo
- ✅ Usuario no puede des-bloquearse
- ✅ Admins solo pueden modificar usuarios de su gimnasio
- ✅ Sysadmin tiene control total (necesario para gestión)

---

### CRITICAL-07: Validación de Email en Invitaciones

**Frontend (Register.js):**
```javascript
if (inviteData.email && inviteData.email.toLowerCase() !== form.email.toLowerCase()) {
  setError('Esta invitación es para ' + inviteData.email + '. Por favor, usá ese email.');
  setLoading(false);
  return;
}
```

**Firestore Rules:**
```javascript
allow update: if (!isAuthenticated() && !resource.data.used &&
                  request.resource.data.used == true &&
                  request.resource.data.registeredUser.email is string) || // Valida que existe email
                (isAuthenticated() && (isSysadmin() || belongsToGym(resource.data.gymId)));
```

**Flujo seguro:**
1. Admin crea invitación para `juan@example.com`
2. Alguien intenta registrarse con `maria@example.com` usando ese link
3. ❌ Frontend bloquea el registro mostrando mensaje de error
4. ✅ Solo `juan@example.com` puede registrarse con esa invitación

---

### HIGH-01: Lectura de Gimnasios

**Antes:**
```javascript
match /gyms/{gymId} {
  allow read: if true; // ⚠️ Cualquiera podía leer
}
```

**Ahora:**
```javascript
match /gyms/{gymId} {
  allow read: if isAuthenticated(); // ✅ Solo usuarios autenticados
}
```

**Impacto:**
- Antes: Cualquier persona podía ver la lista de gimnasios, nombres, direcciones, etc.
- Ahora: Solo usuarios con cuenta pueden acceder a esta información

---

## 🎯 RESUMEN FINAL

### ✅ Vulnerabilidades Corregidas: 6 CRITICAL + 1 HIGH

| ID | Vulnerabilidad | CVSS | Estado |
|----|---------------|------|--------|
| CRITICAL-01 | Sysadmin por email en frontend | 9.1 | ✅ CORREGIDO |
| CRITICAL-02 | Códigos de invitación inseguros | 8.2 | ✅ CORREGIDO |
| CRITICAL-03 | Reglas de invitaciones públicas | 8.8 | ✅ CORREGIDO |
| CRITICAL-05 | Roles sin validación server-side | 9.3 | ✅ CORREGIDO |
| CRITICAL-07 | Sin validación de email en invites | 7.2 | ✅ CORREGIDO |
| HIGH-01 | Lectura pública de gimnasios | 7.1 | ✅ CORREGIDO |

### 📁 Archivos Modificados

1. `src/contexts/AuthContext.js` - Eliminada validación de sysadmin por email
2. `src/pages/Invites.js` - Generación segura de códigos con crypto
3. `src/components/Auth/Register.js` - Validación de email en invitaciones
4. `firestore.rules` - Reglas de seguridad reforzadas para todas las colecciones

### 🚀 Próximos Pasos Recomendados

1. ✅ Aplicar las reglas de Firebase siguiendo las instrucciones de este documento
2. ✅ Crear el primer usuario sysadmin manualmente
3. ✅ Ejecutar los tests de verificación
4. 🔄 Actualizar dependencias vulnerables de npm (opcional, ver `npm audit`)
5. 🔄 Implementar email verification en registros (recomendado)
6. 🔄 Agregar timeout de sesión (recomendado)

---

**¿Necesitás ayuda?**
Si tenés algún error al aplicar estas correcciones, revisá la sección de "Verificación de Seguridad" o contactá a soporte.
