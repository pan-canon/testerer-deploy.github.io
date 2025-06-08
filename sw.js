// sw.js (Service Worker template for production)

// Import Workbox precaching utilities
import { precacheAndRoute } from 'workbox-precaching';

const CACHE_VERSION = 'v49'; // bump this on each release
const CACHE_NAME    = `game-cache-${CACHE_VERSION}`;

// Precache manifest will be injected here by InjectManifest
// self.__WB_MANIFEST is replaced at build time with an array of URLs and revisions
// This will include main bundle, triad chunks, and other assets.
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('install', event => {
  // Broadcast to all clients that a new version is available
  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'NEW_VERSION_AVAILABLE' });
      });
    })
  );
  // NOTE: do NOT call skipWaiting() here – we wait for explicit user action
});

self.addEventListener('activate', event => {
  console.log('✅ Activating Service Worker...');
  event.waitUntil(
    // Delete only old caches, keep the current CACHE_NAME
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  // NOTE: do NOT auto-claim clients here – we claim on SKIP_WAITING
});

self.addEventListener('message', event => {
  const msg = event.data;
  if (!msg) return;

  if (msg.type === 'SKIP_WAITING') {
    console.log('SW received SKIP_WAITING, activating immediately');
    // Activate this SW and take control of all clients
    event.waitUntil(
      self.skipWaiting()
        .then(() => self.clients.claim())
    );
    return;
  }

  if (msg.action === 'CLEAR_CACHE') {
    console.log('SW received CLEAR_CACHE, deleting all caches');
    event.waitUntil(
      caches.keys()
        .then(keys => Promise.all(keys.map(key => caches.delete(key))))
        .then(() => self.clients.matchAll())
        .then(clients => {
          clients.forEach(client => client.navigate(client.url));
        })
    );
  }
});

self.addEventListener('fetch', event => {
  // Bypass caching for dynamic database management files.
  if (event.request.url.includes('DatabaseManager.js') ||
      event.request.url.includes('SQLiteDataManager.js')) {
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached file if found.
        if (response) {
          return response;
        }
        // Otherwise, fetch from network and cache the response.
        return fetch(event.request)
          .then(networkResponse => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
            return networkResponse;
          });
      })
      // Fallback to index.html for navigation requests.
      .catch(() => caches.match('index.html'))
  );
});