# Reglas de Firestore para FitPro

Para que las invitaciones funcionen correctamente, necesitás configurar las reglas de Firestore.

## Opción 1: Reglas permisivas para desarrollo (NO USAR EN PRODUCCIÓN)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura de gimnasios a todos (para el registro)
    match /gyms/{gymId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Permitir lectura de invitaciones a todos (para verificar código)
    match /invites/{inviteId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Usuarios solo pueden leer/escribir su propio documento o si son admin
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Otras colecciones requieren autenticación
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Opción 2: Reglas más seguras (RECOMENDADO para producción)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función helper para verificar si es admin/sysadmin
    function isAdmin() {
      return request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny(['admin', 'sysadmin']);
    }
    
    function isSysadmin() {
      return request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny(['sysadmin']);
    }
    
    // Gimnasios: lectura pública, escritura solo sysadmin
    match /gyms/{gymId} {
      allow read: if true;
      allow create, update, delete: if isSysadmin();
    }
    
    // Invitaciones: lectura pública (para verificar código), escritura solo admin
    match /invites/{inviteId} {
      allow read: if true;
      allow create: if isAdmin();
      allow update: if request.auth != null; // Para marcar como usada
      allow delete: if isAdmin();
    }
    
    // Usuarios
    match /users/{userId} {
      // Cualquier autenticado puede leer usuarios (para listas)
      allow read: if request.auth != null;
      // Solo puede crear/editar su propio usuario o si es admin
      allow create: if request.auth.uid == userId;
      allow update: if request.auth.uid == userId || isAdmin();
      allow delete: if isSysadmin();
    }
    
    // Clases, ejercicios, etc - requieren autenticación
    match /classes/{docId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    
    match /exercises/{docId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    
    match /routines/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /wods/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /prs/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /rankings/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /news/{docId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    
    match /schedules/{docId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
  }
}
```

## Cómo aplicar las reglas:

1. Ir a Firebase Console: https://console.firebase.google.com
2. Seleccionar tu proyecto
3. Ir a **Firestore Database** → **Rules**
4. Pegar las reglas
5. Click en **Publish**

## Verificar que funciona:

1. Abrí la consola del navegador (F12)
2. Andá a la página de registro con un código de invitación
3. Deberías ver en consola:
   - `[Register] Found invite code in URL: XXXX`
   - `[Register] Total invites in DB: X`
   - `[Register] Found matching code: XXXX status: pending gymId: YYYY`
   - `[Register] Valid invite found: {...}`

Si ves "Error checking invite" con mensaje de permisos, las reglas no están bien configuradas.
