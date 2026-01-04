# Instrucciones para Configurar Firebase Security Rules

## Paso 1: Copiar las Reglas

1. Abrir el archivo: **`firestore.rules`** (en la raíz del proyecto)
2. Copiar TODO el contenido (Ctrl+A, Ctrl+C)

## Paso 2: Ir a Firebase Console

1. Abrir: https://console.firebase.google.com
2. Seleccionar proyecto: **fitpro-gym-84932**
3. Menú lateral → **Firestore Database**
4. Click en pestaña **"Rules"** (arriba)

## Paso 3: Pegar las Reglas

1. **Borrar** todo el contenido actual
2. **Pegar** el contenido del archivo `firestore.rules`
3. Click en **"Publish"** (botón azul arriba a la derecha)
4. Confirmar

## Paso 4: Crear Índice para Invitaciones

Hay 2 formas:

### Opción A - Automática (Recomendada)

1. Después de publicar las reglas, ir a tu app
2. Crear una invitación en `/invites`
3. Intentar usarla (registrarse con el código)
4. Si aparece error, abrir consola del navegador (F12)
5. Firebase mostrará un link azul como:
   ```
   https://console.firebase.google.com/...createIndex...
   ```
6. Hacer click en ese link
7. Firebase creará el índice automáticamente
8. Esperar 1-2 minutos

### Opción B - Manual

1. Firebase Console → **Firestore Database** → **Indexes** (pestaña)
2. Click en **"Create Index"**
3. Llenar el formulario:
   - **Collection ID:** `invites`
   - **Fields:**
     - Field path: `code`
     - Order: Ascending
   - **Query scopes:** Collection
4. Click **"Create"**
5. Esperar 1-2 minutos hasta que diga "Enabled"

## Verificación

### Test 1: Registro con Invitación
1. Crear una invitación en la app
2. Copiar el link de invitación
3. Abrir ventana incógnito
4. Pegar el link
5. ✅ Debería funcionar correctamente

### Test 2: Seguridad
1. Abrir consola del navegador (F12)
2. En la consola, escribir:
   ```javascript
   getDocs(collection(db, 'invites'))
   ```
3. ❌ Debería dar error de permisos

### Test 3: Roles
- Login como alumno → NO debería poder acceder a `/members`
- Login como profesor → SÍ debería poder acceder a `/members`
- Login como admin → SÍ debería poder acceder a todo

## Si hay problemas

Si después de publicar las reglas algo no funciona:

1. Revisar la consola del navegador (F12) para ver errores
2. Verificar que el índice esté creado (Firebase Console → Indexes)
3. Esperar 1-2 minutos después de crear el índice
4. Refrescar la página de la aplicación

## Colecciones Protegidas

Las siguientes colecciones están protegidas correctamente:

- ✅ **gyms** - Lectura pública, solo sysadmin puede modificar
- ✅ **invites** - Query específica pública, list requiere autenticación
- ✅ **users** - Solo autenticados pueden leer, cada usuario edita el suyo
- ✅ **routines** - Solo profesores/admins pueden crear
- ✅ **wods** - Control de acceso por gimnasio y asignación
- ✅ **prs** - Cada usuario solo ve/edita los suyos
- ✅ **exercises** - Solo profesores/admins pueden crear
- ✅ **classes** - Solo admins pueden gestionar
- ✅ **rankings** - Solo profesores pueden crear
- ✅ **news** - Solo admins pueden publicar
