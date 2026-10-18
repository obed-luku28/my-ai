// NORA AI Assistant — Service Worker PWA (Production)
const CACHE_NAME = 'nora-pwa-v1.0.1';

const STATIC_PRECACHE = [
  '/',
  '/index.html',
  '/signup.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/apple-touch-icon-180x180.png',
  '/icons/apple-touch-icon-152x152.png',
  '/icons/favicon-32x32.png',
  '/icons/favicon-16x16.png'
];

// Installation : pré-mise en cache des ressources critiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch((err) => {
        console.warn('Pré-cache partiel:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie de requête (Fetch)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ne pas intercepter les requêtes API externes (Gemini, Supabase, etc.)
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('unsplash.com') ||
    url.hostname.includes('pollinations.ai')
  ) {
    return;
  }

  // Ne pas intercepter les méthodes autres que GET
  if (event.request.method !== 'GET') {
    return;
  }

  // 1. Navigation : Network First avec secours sur le cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          if (url.pathname.includes('signup')) {
            return caches.match('/signup.html');
          }
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 2. Fichiers statiques et assets : Cache First avec Network Fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Mettre à jour discrètement en arrière-plan
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
