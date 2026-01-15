# Política de Seguridad - FitPro

## Reporte de Vulnerabilidades

Si descubrís una vulnerabilidad de seguridad en FitPro, por favor reportala responsablemente:

1. **NO** abras un issue público
2. Enviá un email a: crespo.gonzalo9@gmail.com
3. Incluí detalles sobre la vulnerabilidad y pasos para reproducirla

## Configuración Segura de Firebase

### Variables de Entorno

Las credenciales de Firebase deben configurarse mediante variables de entorno y **NUNCA** deben commitearse al repositorio.

### Archivo .env

1. Copiá `.env.example` a `.env`
2. Completá con tus credenciales reales de Firebase
3. El archivo `.env` está en `.gitignore` y no debe ser commiteado

### Restricciones de API Key

La Firebase API Key debe estar restringida en Google Cloud Console:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Seleccioná tu proyecto
3. Ve a **APIs & Services** → **Credentials**
4. Editá tu Browser API Key
5. Configurá las restricciones:

   **Application restrictions:**
   - HTTP referrers (web sites)
   - Agregá tus dominios permitidos:
     ```
     https://tu-dominio.com/*
     https://tu-dominio.vercel.app/*
     http://localhost:3000/*
     ```

   **API restrictions:**
   - Restrict key
   - Habilitar solo:
     - Identity Toolkit API
     - Token Service API
     - Cloud Firestore API
     - Firebase Storage API

### Reglas de Seguridad de Firestore

Las reglas de Firestore están configuradas para requerir autenticación en todas las operaciones. Ver `FIREBASE_RULES.md` para más detalles.

## Incidentes de Seguridad Pasados

### 2026-01-15: Exposición de API Key

**Problema:** La API Key de Firebase fue accidentalmente commiteada al repositorio público.

**Acciones tomadas:**
1. ✅ API Key removida del repositorio
2. ✅ Configuradas restricciones de dominio en Google Cloud Console
3. ✅ Archivo .env agregado a .gitignore
4. ✅ Documentación de seguridad creada
5. 🔄 Limpieza del historial de Git en proceso

**Recomendación:** Si clonaste el repositorio antes de 2026-01-15, actualizá tu configuración con las nuevas credenciales.

## Mejores Prácticas

### Para Desarrolladores

- ❌ **NUNCA** commitear archivos `.env` o credenciales
- ✅ Usar `.env.example` como plantilla
- ✅ Configurar restricciones de API en Google Cloud
- ✅ Revisar el código antes de hacer push
- ✅ Usar herramientas como `git-secrets` para prevenir leaks

### Para Deployment

- ✅ Usar variables de entorno del proveedor de hosting
- ✅ No exponer API keys en el cliente si no es necesario
- ✅ Monitorear logs de acceso a APIs
- ✅ Rotar credenciales periódicamente

## Auditorías de Seguridad

- **Última auditoría de dependencias:** 2026-01-15
- **Resultado:** 0 vulnerabilidades encontradas
- **Próxima auditoría programada:** Mensual

## Contacto

Para consultas de seguridad: crespo.gonzalo9@gmail.com
