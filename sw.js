// sw.js
/**
 * Service Worker (sw.js) - Workbox‐powered with structured runtime caching
 *
 * Sections:
 * 0) Manual versioning & cache‐name override
 * 1) Precache + Cleanup outdated precaches
 * 2) Install event: notify clients about new version
 * 3) Activate event: cleanup old caches
 * 4) Message handler: SKIP_WAITING & CLEAR_CACHE
 * 5) Runtime caching routes (libs, models, triads, statics, modules, templates)
 * 6) Navigation fallback (SPA)
 */

// 🔄 Use importScripts to pull in Workbox from the CDN instead of ES imports:
importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-core.prod.js',
  'https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-precaching.prod.js',
  'https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-routing.prod.js',
  'https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-strategies.prod.js',
  'https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-expiration.prod.js'
);
// Pull modules off the global workbox namespace
const { setCacheNameDetails }                             = workbox.core;
const { precacheAndRoute, cleanupOutdatedCaches }         = workbox.precaching;
const { registerRoute, createHandlerBoundToURL }          = workbox.routing;
const { CacheFirst, StaleWhileRevalidate }                = workbox.strategies;
const { ExpirationPlugin }                                = workbox.expiration;

// 0) MANUAL VERSIONING — override all Workbox cache names
const CACHE_VERSION = 'v58';
setCacheNameDetails({
  prefix:    '',                             // remove "workbox-" prefix
  suffix:    '',                             // remove "-<hash>" suffix
  precache:  `game-cache-${CACHE_VERSION}`,  // your versioned precache
  runtime:   ''                              // unused (we name each runtime group explicitly)
});

// 1) PRECACHE: inject manifest & remove outdated precaches
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// 2) INSTALL: notify clients of new version
self.addEventListener('install', event => {
  console.log('[SW] install → notifying clients about new version');
  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
      clients.forEach(client =>
        client.postMessage({
          type: 'NEW_VERSION_AVAILABLE',
          persistent: true
        })
      );
    })
  );
  // NOTE: no skipWaiting() here — wait for SKIP_WAITING from client
});

// 3) ACTIVATE: delete any caches not in our allow‐list
const ALLOWED_CACHES = [
  `game-cache-${CACHE_VERSION}`, 
  'cache-libs',
  'cache-models',
  'cache-triads',
  'cache-statics',
  'cache-modules',
  'cache-templates'
];
self.addEventListener('activate', event => {
  console.log('[SW] activate → cleaning up old caches');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => !ALLOWED_CACHES.includes(key))
          .map(key => {
            console.log(`[SW] deleting cache: ${key}`);
            return caches.delete(key);
          })
      )
    ).then(() => {
      console.log('[SW] claim clients');
      return self.clients.claim();
    })
  );
});

// 4) MESSAGE: SKIP_WAITING & CLEAR_CACHE
self.addEventListener('message', event => {
  const msg = event.data || {};

  if (msg.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING received → activating new SW');
    event.waitUntil(self.skipWaiting().then(() => self.clients.claim()));
    return;
  }

  if (msg.action === 'CLEAR_CACHE') {
    console.log('[SW] CLEAR_CACHE received → purging all caches');
    event.waitUntil(
      caches.keys()
        .then(keys => Promise.all(
          keys.map(k => {
            console.log(`[SW] removing cache: ${k}`);
            return caches.delete(k);
          })
        ))
        .then(() => self.clients.matchAll())
        .then(clients => {
          clients.forEach(client => {
            console.log(`[SW] reloading client: ${client.url}`);
            client.navigate(client.url);
          });
        })
    );
    return;
  }
});

// 5) RUNTIME CACHING ROUTES

// 5.1 — Libraries (.js, .wasm) under /assets/libs/
registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/libs/'),
  new CacheFirst({
    cacheName: 'cache-libs',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 })
    ]
  })
);

// 5.2 — Models (COCO-SSD) under /assets/models/
registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/models/'),
  new CacheFirst({
    cacheName: 'cache-models',
    plugins: [
      new ExpirationPlugin({ maxEntries: 15, maxAgeSeconds: 30 * 24 * 60 * 60 })
    ]
  })
);

// 5.3 — Triads under /triads/
registerRoute(
  ({ url }) => url.pathname.startsWith('/triads/'),
  new CacheFirst({
    cacheName: 'cache-triads',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 })
    ]
  })
);

// 5.4 — Static assets (images, audio, JSON) — **no HTML here**
registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/assets/images/') ||
    /\.(?:png|jpe?g|webp|gif|svg|mp3|wav|ogg|json)$/.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'cache-statics',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 90 * 24 * 60 * 60 })
    ]
  })
);

// 5.5 — JavaScript modules (.js) not under /assets/libs/
registerRoute(
  ({ url }) => url.pathname.endsWith('.js'),
  new StaleWhileRevalidate({
    cacheName: 'cache-modules',
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 })
    ]
  })
);

// 5.6 — HTML templates under /templates/
registerRoute(
  ({ url }) => url.pathname.startsWith('/templates/') && url.pathname.endsWith('.html'),
  new StaleWhileRevalidate({
    cacheName: 'cache-templates',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 })
    ]
  })
);

// 6) Navigation fallback for SPA routing
registerRoute(
  ({ request }) => request.mode === 'navigate',
  createHandlerBoundToURL('/index.html')
);