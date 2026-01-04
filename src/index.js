import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';

// Ocultar el loader inicial
if (window.hideLoader) {
  window.hideLoader();
}

// Limpiar caché viejo al inicio (prevenir pantallas blancas)
const APP_VERSION = '1.0.0';
const storedVersion = localStorage.getItem('fitpro-version');

if (storedVersion !== APP_VERSION) {
  console.log(`[App] Version changed from ${storedVersion} to ${APP_VERSION}`);
  
  // Limpiar caché del Service Worker
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        if (name.startsWith('fitpro-cache-')) {
          caches.delete(name);
          console.log(`[App] Cleared cache: ${name}`);
        }
      });
    });
  }
  
  localStorage.setItem('fitpro-version', APP_VERSION);
}

// Manejo de errores global para prevenir pantallas blancas
window.addEventListener('error', (event) => {
  console.error('[App] Global error:', event.error);
  
  // Si es un error de chunk/módulo, intentar recargar
  if (event.message && (
    event.message.includes('Loading chunk') ||
    event.message.includes('Loading CSS chunk') ||
    event.message.includes('ChunkLoadError')
  )) {
    console.log('[App] Chunk load error detected, reloading...');
    
    // Limpiar caché y recargar
    if ('caches' in window) {
      caches.keys().then((names) => {
        return Promise.all(names.map((name) => caches.delete(name)));
      }).then(() => {
        window.location.reload(true);
      });
    } else {
      window.location.reload(true);
    }
  }
});

// Manejo de promesas rechazadas
window.addEventListener('unhandledrejection', (event) => {
  console.error('[App] Unhandled rejection:', event.reason);
});

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
