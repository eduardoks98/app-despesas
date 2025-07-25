const CACHE_NAME = 'app-despesas-v1.0.0';
const STATIC_CACHE = 'static-v1.0.0';
const DYNAMIC_CACHE = 'dynamic-v1.0.0';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/transactions',
  '/categories',
  '/auth/login',
  '/auth/register',
  '/offline',
  '/manifest.json',
  // Icons
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
];

// API endpoints that can work offline
const OFFLINE_ENDPOINTS = [
  '/api/auth/session',
  '/api/auth/csrf',
  '/api/transactions',
  '/api/categories',
  '/api/users/profile',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with cache-first strategy for specific endpoints
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first for API requests
    const networkResponse = await fetch(request);
    
    // Cache successful responses for offline endpoints
    if (networkResponse.ok && OFFLINE_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint))) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache:', url.pathname);
    
    // Try cache if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline message for API requests
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'Esta funcionalidade não está disponível offline',
        offline: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// Handle navigation requests with cache-first strategy
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful navigation responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for navigation, trying cache:', request.url);
    
    // Try cache if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    const offlineResponse = await caches.match('/offline');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Fallback offline response
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>App Despesas - Offline</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              margin: 0; 
              padding: 2rem; 
              text-align: center;
              background: #f9fafb;
              color: #374151;
            }
            .container { 
              max-width: 400px; 
              margin: 4rem auto; 
              padding: 2rem;
              background: white;
              border-radius: 0.5rem;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .icon { 
              font-size: 4rem; 
              margin-bottom: 1rem; 
            }
            h1 { 
              color: #1f2937; 
              margin: 0 0 1rem 0; 
            }
            p { 
              margin: 0 0 1.5rem 0; 
              line-height: 1.5;
            }
            button {
              background: #8b5cf6;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 0.375rem;
              cursor: pointer;
              font-weight: 500;
            }
            button:hover {
              background: #7c3aed;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">=ñ</div>
            <h1>Você está offline</h1>
            <p>Conecte-se à internet para acessar todas as funcionalidades do App Despesas.</p>
            <button onclick="window.location.reload()">Tentar novamente</button>
          </div>
        </body>
      </html>
    `, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
}

// Handle static asset requests with cache-first strategy
async function handleStaticRequest(request) {
  // Try cache first for static assets
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Try network if not in cache
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch static asset:', request.url);
    
    // Return a fallback response for failed requests
    return new Response('Recurso não disponível offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
});

// Sync transactions when online
async function syncTransactions() {
  try {
    console.log('[SW] Syncing transactions...');
    
    // Get pending transactions from IndexedDB or cache
    // This would integrate with the app's offline storage
    const pendingTransactions = await getPendingTransactions();
    
    if (pendingTransactions.length > 0) {
      // Send to server
      for (const transaction of pendingTransactions) {
        try {
          await fetch('/api/transactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(transaction),
          });
          
          // Remove from pending list
          await removePendingTransaction(transaction.id);
        } catch (error) {
          console.error('[SW] Failed to sync transaction:', error);
        }
      }
      
      console.log('[SW] Transactions synced successfully');
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Helper functions for offline data management
async function getPendingTransactions() {
  // This would integrate with IndexedDB or other storage
  // For now, return empty array
  return [];
}

async function removePendingTransaction(id) {
  // This would remove from IndexedDB
  console.log('[SW] Removing pending transaction:', id);
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'Você tem atualizações em suas finanças',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalhes',
        icon: '/icons/icon-96x96.png',
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/icon-96x96.png',
      },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification('App Despesas', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

console.log('[SW] Service worker script loaded');