# 🏋️ FitPro - Sistema de Gestión de Gimnasios

## 🚀 Quick Start

```bash
npm install
npm start
```

## 🔧 Configurar Firebase (Paso a Paso)

### 1. Crear proyecto en Firebase Console

1. Ir a https://console.firebase.google.com/
2. Click "Agregar proyecto" → Nombre: `fitpro`
3. Crear proyecto

### 2. Configurar Authentication

1. Menú lateral → **Authentication** → "Comenzar"
2. Sign-in method → Habilitar **Email/Password**

### 3. Crear Firestore Database

1. Menú lateral → **Firestore Database** → "Crear base de datos"
2. Modo de prueba → Ubicación: `southamerica-east1`

### 4. Obtener credenciales

1. ⚙️ Configuración → Tus apps → Web (</>)
2. Registrar app: "FitPro Web"
3. Copiar el `firebaseConfig`

### 5. Crear archivo .env

```env
REACT_APP_FIREBASE_API_KEY=tu_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=tu_proyecto_id
REACT_APP_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123:web:abc
```

### 6. Reglas de Firestore

En Firebase Console → Firestore → Reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🚀 Deploy a Vercel

1. Subir a GitHub
2. Importar en Vercel
3. Agregar variables de entorno
4. Deploy

## 👤 Usuario Sysadmin

Registrarse con: `crespo.gonzalo9@gmail.com` (rol Sysadmin automático)

## 📁 Estructura

```
src/
├── components/     # UI components
├── contexts/       # Auth, Gym, Toast
├── utils/          # Helpers, Firebase utils
├── styles/         # CSS
└── App.js          # Routes
```

---
Desarrollado por Gonzalo Crespo
