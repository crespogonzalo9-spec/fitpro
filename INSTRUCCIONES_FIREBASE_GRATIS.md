# 🆓 INSTRUCCIONES PARA FIREBASE - PLAN GRATUITO

**✅ TODO ESTO SE PUEDE HACER CON EL PLAN GRATUITO (SPARK)**
**❌ NO NECESITÁS PAGAR NADA**

---

## 📋 PASO 1: ACTUALIZAR LAS REGLAS DE FIRESTORE

### 1.1. Entrar a Firebase Console

1. Abrí tu navegador
2. Andá a: https://console.firebase.google.com/
3. Iniciá sesión con tu cuenta de Google
4. Hacé click en tu proyecto **"fitpro"** (o como lo hayas llamado)

### 1.2. Ir a Firestore Database

1. En el menú de la izquierda, buscá **"Firestore Database"**
2. Hacé click ahí
3. Vas a ver tus colecciones: `users`, `gyms`, `invites`, etc.

![Ejemplo Firestore](https://i.imgur.com/firestore-menu.png)

### 1.3. Abrir las Reglas

1. Arriba de todo, vas a ver varias pestañas: **Datos | Reglas | Índices | Uso**
2. Hacé click en **"Reglas"** (segunda pestaña)
3. Vas a ver un editor de texto con código que empieza con `rules_version = '2';`

### 1.4. Copiar las Nuevas Reglas

1. **Seleccioná TODO** el contenido del editor (puedes usar Ctrl+A)
2. **Borrá** todo
3. Abrí el archivo `firestore.rules` de tu proyecto en Visual Studio Code
4. **Copiá TODO** el contenido de ese archivo
5. **Pegá** en el editor de Firebase Console
6. Hacé click en el botón **"Publicar"** (arriba a la derecha)

**¡LISTO!** Las reglas de seguridad ya están actualizadas.

---

## 👤 PASO 2: CREAR TU PRIMER USUARIO SYSADMIN

### 2.1. Registrarte en la App

1. Abrí tu aplicación FitPro en el navegador (http://localhost:3000 si estás en desarrollo)
2. Hacé click en **"Crear cuenta"**
3. Completá el formulario:
   - **Nombre:** Tu nombre
   - **Email:** Tu email (el que vas a usar como sysadmin)
   - **Teléfono:** (opcional)
   - **Gimnasio:** Dejá "Sin gimnasio" por ahora
   - **Contraseña:** Elegí una contraseña segura (mínimo 8 caracteres, con mayúsculas, minúsculas y números)
4. Hacé click en **"Crear cuenta"**
5. ✅ Tu cuenta se crea como usuario normal (alumno)

### 2.2. Convertir tu Usuario en Sysadmin

Ahora vamos a darle permisos de sysadmin **MANUALMENTE** desde Firebase:

#### Opción A: Desde Firebase Console (Recomendado)

1. Andá a Firebase Console (https://console.firebase.google.com/)
2. Entrá en tu proyecto
3. Hacé click en **"Firestore Database"** en el menú lateral
4. Hacé click en la pestaña **"Datos"** (primera pestaña)
5. Vas a ver la lista de colecciones. Hacé click en **"users"**
6. Vas a ver todos los usuarios registrados
7. **Buscá tu usuario** (por el email que usaste)
8. Hacé click en el documento (la fila completa)
9. Se va a abrir una vista lateral con todos los datos del usuario
10. Buscá el campo **"roles"**
11. Vas a ver algo como: `["alumno"]`
12. Hacé click en el valor (el texto `["alumno"]`)
13. **Reemplazá** con: `["sysadmin","admin","profesor","alumno"]`
14. Hacé click en **"Actualizar"**

![Editar roles en Firestore](https://i.imgur.com/firestore-edit.png)

#### Opción B: Desde el Editor de Texto

Si preferís copiar y pegar:

1. Seguí los pasos 1-10 de la Opción A
2. Cuando veas el campo `roles`, hacé click en los tres puntos `...` al lado
3. Seleccioná **"Editar campo"**
4. Pegá esto exactamente:

```json
["sysadmin","admin","profesor","alumno"]
```

5. Hacé click en **"Actualizar"**

### 2.3. Verificar que Funciona

1. Volvé a tu aplicación FitPro
2. Si ya estás logueado, **cerrá sesión** (muy importante!)
3. **Iniciá sesión** de nuevo con el mismo email y contraseña
4. ✅ Ahora deberías ver en el menú:
   - **Gimnasios** (gestión de todos los gimnasios)
   - **Usuarios** (gestión de todos los usuarios)
   - Todas las opciones de admin/profesor

**¡LISTO!** Ya sos sysadmin.

---

## 🔍 VERIFICAR QUE LA SEGURIDAD FUNCIONA

### Test 1: Intentar Crear Otro Sysadmin desde la App

1. Cerrá sesión
2. Intentá registrarte con otro email
3. ✅ El nuevo usuario debería crearse solo como "alumno"
4. ❌ NO debería tener acceso a opciones de sysadmin
5. ✅ Esto significa que la seguridad está funcionando

### Test 2: Intentar Modificar Roles desde la Consola del Navegador

1. Iniciá sesión con el usuario nuevo (alumno)
2. Presioná **F12** para abrir la consola del navegador
3. Andá a la pestaña **"Console"**
4. Copiá y pegá este código:

```javascript
// Intentar hackear el sistema (esto DEBE fallar)
const userId = firebase.auth().currentUser.uid;
firebase.firestore().collection('users').doc(userId)
  .update({ roles: ['sysadmin', 'admin'] })
  .then(() => alert('¡PELIGRO! La seguridad está rota'))
  .catch(err => alert('✅ SEGURO: ' + err.message));
```

5. Presioná **Enter**
6. ✅ Debe aparecer un alert que diga algo como: **"✅ SEGURO: Missing or insufficient permissions"**
7. ✅ Esto significa que la seguridad está funcionando correctamente

### Test 3: Crear una Invitación

1. Iniciá sesión como sysadmin
2. Primero creá un gimnasio (Gimnasios → Nuevo Gimnasio)
3. Andá a **Invitaciones**
4. Hacé click en **"Nueva Invitación"**
5. Completá el formulario:
   - **Descripción:** "Invitación de prueba"
   - **Email:** (opcional) podés dejarlo vacío
   - **Roles:** Dejá solo "Alumno" marcado
   - **Validez:** 7 días
6. Hacé click en **"Crear Invitación"**
7. ✅ Debería generar un código de 10 caracteres (ejemplo: `A3F8K9M2P1`)
8. Hacé click en **"Copiar Link"**
9. Pegá el link en una pestaña de incógnito
10. Registrate con otro email
11. ✅ El nuevo usuario debería unirse al gimnasio automáticamente

---

## ❓ PREGUNTAS FRECUENTES

### ¿Por qué no puedo crear sysadmins desde la app?

**Por seguridad.** Si cualquiera pudiera crear un sysadmin desde la app, cualquier persona podría hackear el sistema simplemente conociendo un email o una contraseña especial.

Ahora, la única forma de crear un sysadmin es:
1. Tener acceso a Firebase Console (requiere estar logueado con la cuenta del dueño del proyecto)
2. Editar manualmente el campo `roles` en Firestore

Esto es **mucho más seguro** porque solo vos (el dueño del proyecto) podés hacerlo.

### ¿Necesito el plan de pago (Blaze) para esto?

**NO.** Todo lo que está en este documento es **100% gratis** con el plan Spark.

El plan de pago solo se necesita para:
- Cloud Functions (servidor backend)
- Envío de emails automáticos
- Procesamiento de imágenes server-side
- Etc.

Nada de eso es necesario para FitPro.

### ¿Puedo crear más sysadmins después?

**Sí.** Simplemente repetí el **Paso 2** (Crear Usuario Sysadmin) para cada persona que querés que sea sysadmin.

O también podés hacerlo desde la app:
1. Iniciá sesión como sysadmin
2. Andá a **Usuarios**
3. Buscá el usuario que querés promocionar
4. Hacé click en los tres puntos `...` → **"Editar"**
5. Activá el rol **"Sysadmin"**
6. Guardá los cambios

### ¿Qué pasa si borro un gimnasio?

Los usuarios de ese gimnasio NO se eliminan automáticamente. Quedan sin gimnasio asignado.

Como sysadmin, podés:
- Reasignarlos a otro gimnasio
- Eliminarlos manualmente desde **Usuarios**

### ¿Puedo suspender un gimnasio?

**Sí.** Esta funcionalidad ya está implementada:

1. Iniciá sesión como sysadmin
2. Andá a **Gimnasios**
3. Hacé click en los tres puntos `...` del gimnasio que querés suspender
4. Seleccioná **"Suspender"**
5. Opcionalmente, escribí un motivo (ej: "Falta de pago")
6. Hacé click en **"Suspender"**

Todos los usuarios de ese gimnasio (admin, profesores, alumnos) van a ver una pantalla de suspensión cuando intenten acceder.

Para reactivar:
1. Andá a **Gimnasios**
2. Hacé click en los tres puntos `...` del gimnasio suspendido
3. Seleccioná **"Reactivar"**

### ¿Cómo actualizo las reglas de Firebase si hago cambios en el código?

Cada vez que modifiques el archivo `firestore.rules` en tu proyecto, tenés que:

1. Ir a Firebase Console → Firestore Database → Reglas
2. Copiar TODO el contenido del archivo `firestore.rules`
3. Pegarlo en el editor de Firebase
4. Hacer click en **"Publicar"**

**IMPORTANTE:** Los cambios en `firestore.rules` locales NO se aplican automáticamente. Tenés que publicarlos manualmente en Firebase Console.

---

## 🆘 AYUDA - ERRORES COMUNES

### Error: "Missing or insufficient permissions"

**Causa:** Las reglas de Firebase no están actualizadas.

**Solución:**
1. Andá a Firebase Console → Firestore Database → Reglas
2. Copiá las reglas del archivo `firestore.rules`
3. Pegá en Firebase Console
4. Hacé click en **"Publicar"**

### Error: "Could not reach Cloud Firestore backend"

**Causa:** Problemas de conexión o Firebase no está configurado correctamente.

**Solución:**
1. Verificá que tu archivo `.env` tenga las credenciales correctas de Firebase
2. Verificá que estés conectado a internet
3. Probá cerrar y volver a abrir la app

### Error: "auth/weak-password"

**Causa:** La contraseña es muy corta.

**Solución:**
Usá una contraseña con:
- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 minúscula
- Al menos 1 número

### Error: "Syntax error" al publicar reglas

**Causa:** Copiaste mal el código o tiene caracteres especiales.

**Solución:**
1. Borrá todo el contenido del editor de Firebase
2. Volvé a copiar el archivo `firestore.rules` COMPLETO
3. Pegá sin modificar nada
4. Hacé click en **"Publicar"**

---

## 📝 RESUMEN

1. ✅ Actualizá las reglas en Firebase Console (GRATIS)
2. ✅ Registrate en la app normalmente
3. ✅ Editá tu usuario en Firebase Console para darle rol sysadmin (GRATIS)
4. ✅ Cerrá sesión y volvé a iniciar sesión
5. ✅ Listo! Ya sos sysadmin

**TODO ESTO ES GRATIS - NO NECESITÁS PLAN DE PAGO**

---

¿Necesitás más ayuda? Revisá la documentación oficial de Firebase:
- https://firebase.google.com/docs/firestore/security/get-started
- https://firebase.google.com/docs/firestore/manage-data/add-data
