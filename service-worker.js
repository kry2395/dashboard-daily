const CACHE_NAME = 'dashboard-v1';
const RUNTIME_CACHE = 'dashboard-runtime-v1';

const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './css/responsive.css',
  './js/app.js',
  './js/api-handler.js',
  './js/weather.js',
  './js/quotes.js',
  './js/movies.js',
  './js/tasks.js',
  './manifest.json'
];

// ============ INSTALACJA ============
self.addEventListener('install', event => {
  console.log('📦 Service Worker: Instalacja...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache zainstalowany');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// ============ AKTYWACJA ============
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: Aktywacja...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('🗑️ Usuwanie starego cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ============ FETCH ============
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Pomijaj nieHTTP żądania
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Strategia: CSS, JS, obrazki - cache first
  if (request.url.includes('.css') || 
      request.url.includes('.js') || 
      request.url.includes('.png') ||
      request.url.includes('.svg')) {
    event.respondWith(
      caches.match(request)
        .then(response => response || fetch(request))
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Strategia: API i dane - network first
  event.respondWith(
    fetch(request)
      .then(response => {
        if (!response || response.status !== 200 || request.method !== 'GET') {
          return response;
        }
        
        const responseClone = response.clone();
        caches.open(RUNTIME_CACHE).then(cache => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then(response => response || caches.match('./index.html'));
      })
  );
});

// ============ KOMUNIK
