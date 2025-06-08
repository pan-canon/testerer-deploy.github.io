// sw.js (Service Worker template for production)

import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Versioned cache name — bump on each release
const CACHE_VERSION = 'v55';
const CACHE_NAME    = `game-cache-${CACHE_VERSION}`;

// The manifest array injected by InjectManifest
const PRECACHE_MANIFEST = self.__WB_MANIFEST;

// Install: pre-cache critical assets + notify clients about new version
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_MANIFEST.map(item => item.url)))
      .then(() => self.clients.matchAll({ includeUncontrolled: true }))
      .then(clients => {
        clients.forEach(client =>
          client.postMessage({
            type: 'NEW_VERSION_AVAILABLE',
            persistent: true
          })
        );
      })
  );
});

// Activate: remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
  );
});

// Handle messages from the page
self.addEventListener('message', event => {
  const msg = event.data || {};

  if (msg.type === 'SKIP_WAITING') {
    event.waitUntil(
      self.skipWaiting().then(() => self.clients.claim())
    );
    return;
  }

  if (msg.action === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys()
        .then(keys => Promise.all(keys.map(k => caches.delete(k))))
        .then(() => self.clients.matchAll())
        .then(clients => clients.forEach(client => client.navigate(client.url)))
    );
  }
});

// ----------------------------------------
// Runtime caching routes
// ----------------------------------------

// Libraries (e.g., large JS and WASM files)
registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/libs/'),
  new CacheFirst({
    cacheName: 'cache-libs',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 })
    ],
  })
);

// Models (heavy assets like COCO-SSD shards)
registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/models/'),
  new CacheFirst({
    cacheName: 'cache-models',
    plugins: [
      new ExpirationPlugin({ maxEntries: 15, maxAgeSeconds: 60 * 60 * 24 * 30 })
    ],
  })
);

// Triads (game-specific data files)
registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/triads/'),
  new CacheFirst({
    cacheName: 'cache-triads',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 })
    ],
  })
);

// Static assets (images, audio)
registerRoute(
  ({ request, url }) =>
    url.pathname.startsWith('/assets/images/') ||
    /\.(?:png|jpg|jpeg|webp|gif|svg|mp3|wav|ogg)$/.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'cache-statics',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 90 })
    ],
  })
);

// Modules & scripts (other JS files)
registerRoute(
  ({ url }) => url.pathname.endsWith('.js'),
  new StaleWhileRevalidate({
    cacheName: 'cache-modules',
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30 })
    ],
  })
);

// Fallback fetch handler (cache-first, index.html fallback)
self.addEventListener('fetch', event => {
  const url = event.request.url;

  if (url.includes('DatabaseManager.js') || url.includes('SQLiteDataManager.js')) {
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(networkResponse => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return networkResponse;
        });
      })
      .catch(() => caches.match('index.html'))
  );
});