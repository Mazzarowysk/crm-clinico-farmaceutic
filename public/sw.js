/**
 * CRM Clínico Farmacêutico - Service Worker de Alta Resiliência Hospitalar & Push Notifications
 * Versão: 3.15.0
 */

const CACHE_NAME = 'crm-clinico-farmaceutico-v3.15.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/crm-logo.png?v=2',
  '/manual_do_usuario.html',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Falha não-bloqueante ao pré-carregar assets:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignora requisições locais em desenvolvimento, não-GET, APIs e banco externo
  if (
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.port === '5175' ||
    url.port === '3001' ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    event.request.method !== 'GET' ||
    url.pathname.includes('/api/') ||
    url.hostname.includes('turso.io')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          const indexCached = await caches.match('/index.html') || await caches.match('/');
          if (indexCached) return indexCached;
        }
        return new Response('<html><body style="background:#080c14;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="text-align:center;"><h2>Modo Offline</h2><p>Verifique sua conexão ou recarregue a página.</p><button onclick="location.reload()" style="background:#14b8a6;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;">Recarregar</button></div></body></html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      })
  );
});

// Suporte a Notificações Push para Médicos de Sobreaviso e Alertas de Pacientes Críticos
self.addEventListener('push', (event) => {
  let data = { title: 'CRM Clínico Farmacêutico Hospitalar', body: 'Novo alerta assistencial de plantão.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/assets/crm-logo.png?v=2',
    badge: '/assets/crm-logo.png?v=2',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Abrir Prontuário' },
      { action: 'dismiss', title: 'Dispensar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url || '/');
      }
    })
  );
});
