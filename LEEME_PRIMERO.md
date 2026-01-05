# 🚀 LEEME PRIMERO - CONFIGURACIÓN INICIAL

## ✅ PLAN GRATUITO DE FIREBASE - TODO LO QUE NECESITÁS SABER

**BUENAS NOTICIAS:** Todo lo que necesitás hacer se puede hacer con el **plan gratuito (Spark)** de Firebase.

**NO NECESITÁS PAGAR NADA.**

---

## 📁 ARCHIVOS IMPORTANTES

En tu proyecto hay 3 archivos importantes de documentación:

1. **LEEME_PRIMERO.md** ← Estás acá (guía rápida)
2. **INSTRUCCIONES_FIREBASE_GRATIS.md** ← Instrucciones paso a paso con capturas
3. **SECURITY_FIXES.md** ← Detalles técnicos de las correcciones de seguridad

---

## 🎯 LO QUE TENÉS QUE HACER (5 MINUTOS)

### 1️⃣ ACTUALIZAR LAS REGLAS DE FIREBASE (OBLIGATORIO)

**¿Por qué?** Las reglas de seguridad se corrigieron. Si no las actualizás, la app no va a funcionar correctamente.

**¿Cómo?**

1. Andá a https://console.firebase.google.com/
2. Entrá en tu proyecto FitPro
3. Hacé click en **"Firestore Database"** (menú lateral izquierdo)
4. Hacé click en la pestaña **"Reglas"** (arriba)
5. **Borrá TODO** el contenido del editor
6. **Copiá TODO** el contenido del archivo `firestore.rules` de tu proyecto
7. **Pegá** en el editor de Firebase
8. Hacé click en **"Publicar"**

✅ **Listo!** Las reglas están actualizadas.

---

### 2️⃣ CREAR TU USUARIO SYSADMIN (OBLIGATORIO)

**¿Por qué?** Ya no podés crear sysadmins automáticamente desde la app (por seguridad).

**¿Cómo?**

#### Paso A: Registrate en la app

1. Abrí tu app FitPro (http://localhost:3000 si estás en desarrollo)
2. Hacé click en **"Crear cuenta"**
3. Completá el formulario:
   - Nombre: Tu nombre
   - Email: Tu email
   - Contraseña: Mínimo 8 caracteres con mayúsculas, minúsculas y números
4. Hacé click en **"Crear cuenta"**

Tu cuenta se crea como usuario normal (alumno).

#### Paso B: Convertirlo en Sysadmin desde Firebase

1. Andá a https://console.firebase.google.com/
2. Entrá en tu proyecto
3. Hacé click en **"Firestore Database"**
4. Hacé click en la pestaña **"Datos"**
5. Hacé click en la colección **"users"**
6. Buscá tu usuario (por el email)
7. Hacé click en el documento (la fila completa)
8. Buscá el campo **"roles"**
9. Vas a ver: `["alumno"]`
10. Hacé click en el valor
11. **Reemplazá** con: `["sysadmin","admin","profesor","alumno"]`
12. Hacé click en **"Actualizar"**

#### Paso C: Volver a iniciar sesión

1. Volvé a tu app FitPro
2. Cerrá sesión
3. Iniciá sesión de nuevo con el mismo email y contraseña
4. ✅ Ahora deberías ver opciones de **Gimnasios** y **Usuarios** en el menú

---

## 🔐 ¿QUÉ SE CORRIGIÓ?

Se corrigieron **6 vulnerabilidades críticas** de seguridad:

1. ❌ **ANTES:** Cualquiera podía hacerse sysadmin si conocía el email secreto
   ✅ **AHORA:** Los sysadmins se crean manualmente desde Firebase Console

2. ❌ **ANTES:** Los códigos de invitación eran fáciles de adivinar
   ✅ **AHORA:** Códigos criptográficamente seguros de 10 caracteres

3. ❌ **ANTES:** Cualquiera podía leer todas las invitaciones
   ✅ **AHORA:** Solo usuarios del gimnasio pueden ver sus invitaciones

4. ❌ **ANTES:** Usuarios podían modificar sus propios roles desde la consola del navegador
   ✅ **AHORA:** Los roles solo se pueden modificar desde Firebase Console o por un admin

5. ❌ **ANTES:** Invitaciones con email específico podían ser usadas por cualquiera
   ✅ **AHORA:** Si una invitación tiene email, solo ese email puede registrarse

6. ❌ **ANTES:** Cualquiera (sin autenticación) podía leer la lista de gimnasios
   ✅ **AHORA:** Solo usuarios autenticados pueden ver gimnasios

---

## 📚 MÁS INFORMACIÓN

- **Instrucciones detalladas con imágenes:** `INSTRUCCIONES_FIREBASE_GRATIS.md`
- **Detalles técnicos de las correcciones:** `SECURITY_FIXES.md`
- **Sistema de suspensión de gimnasios:** `GYM_SUSPENSION_SYSTEM.md`
- **Sistema de invitaciones:** `INVITATION_SYSTEM_FINAL.md`

---

## ❓ PREGUNTAS FRECUENTES

### ¿Necesito pagar para usar Firebase?

**NO.** Todo lo que hace FitPro funciona con el plan gratuito (Spark).

### ¿Cómo creo más sysadmins después?

Opción 1: Repetir el Paso 2 (registrar usuario + editar en Firebase Console)

Opción 2: Desde la app (una vez que ya sos sysadmin):
1. Andá a **Usuarios**
2. Buscá el usuario
3. Click en `...` → **"Editar"**
4. Activá el rol **"Sysadmin"**
5. Guardá

### ¿Qué pasa si no actualizo las reglas de Firebase?

La app va a dar errores de **"Missing or insufficient permissions"** en varias partes.

**Solución:** Seguir el Paso 1 de esta guía.

### ¿Puedo revertir estos cambios si algo sale mal?

Sí. Todos los cambios están documentados en `SECURITY_FIXES.md`.

Pero **no deberías** revertir porque las vulnerabilidades anteriores eran muy peligrosas.

---

## 🆘 ¿NECESITÁS AYUDA?

1. Leé el archivo `INSTRUCCIONES_FIREBASE_GRATIS.md` - tiene instrucciones paso a paso muy detalladas
2. Revisá la sección de "Errores Comunes" en ese mismo archivo
3. Si seguís con problemas, revisá la consola del navegador (F12) para ver el error exacto

---

**¡Éxito con tu app FitPro!** 💪
