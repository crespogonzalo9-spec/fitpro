// =============================================
// FITPRO SERVICE WORKER - v1.0.0
// =============================================
const APP_VERSION = '1.0.0';
const CACHE_NAME = `fitpro-cache-v${APP_VERSION}`;

// Archivos críticos que SIEMPRE deben estar disponibles
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/offline.html'
];

// =============================================
// INSTALACIÓN
// =============================================
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing version ${APP_VERSION}`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching critical assets');
        return cache.addAll(CRITICAL_ASSETS);
      })
      .then(() => {
        // Forzar activación inmediata (no esperar a que cierren tabs)
        return self.skipWaiting();
      })
  );
});

// =============================================
// ACTIVACIÓN - Limpia cachés viejos
// =============================================
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating version ${APP_VERSION}`);
  
  event.waitUntil(
    Promise.all([
      // Limpiar cachés antiguos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('fitpro-cache-') && name !== CACHE_NAME)
            .map((name) => {
              console.log(`[SW] Deleting old cache: ${name}`);
              return caches.delete(name);
            })
        );
      }),
      // Tomar control de todos los clientes inmediatamente
      self.clients.claim()
    ]).then(() => {
      // Notificar a todos los clientes que hay una nueva versión
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: APP_VERSION
          });
        });
      });
    })
  );
});

// =============================================
// FETCH - Estrategia Network First con fallback
// =============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests a otros dominios (Firebase, etc.)
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // Ignorar requests de extensiones de Chrome
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Para navegación (HTML), siempre ir a la red primero
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Guardar en caché
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Si falla la red, intentar caché
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Si no hay caché, mostrar página offline
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }

  // Para assets estáticos (JS, CSS, imágenes)
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(
      // Network first, fallback to cache
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Para API requests, siempre ir a la red
  if (url.pathname.startsWith('/api') || url.hostname.includes('firebase')) {
    event.respondWith(fetch(request));
    return;
  }
});

// =============================================
// MESSAGE - Recibir mensajes de la app
// =============================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: APP_VERSION });
  }
  
  // Forzar limpieza de caché
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// =============================================
// PERIODIC SYNC - Verificar actualizaciones
// =============================================
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-updates') {
    event.waitUntil(checkForUpdates());
  }
});

async function checkForUpdates() {
  try {
    const response = await fetch('/version.json?t=' + Date.now());
    const data = await response.json();
    
    if (data.version !== APP_VERSION) {
      // Notificar que hay actualización
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'UPDATE_AVAILABLE',
            currentVersion: APP_VERSION,
            newVersion: data.version
          });
        });
      });
    }
  } catch (error) {
    console.log('[SW] Update check failed:', error);
  }
}
