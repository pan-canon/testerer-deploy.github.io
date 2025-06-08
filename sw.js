/**
 * Service Worker (sw.js) - Workbox-powered with structured runtime caching
 *
 * Sections:
 * 1) Precache + Cleanup outdated precaches
 * 2) Install event: notify clients about new version
 * 3) Activate event: cleanup old runtime caches
 * 4) Message handler: SKIP_WAITING & CLEAR_CACHE
 * 5) Runtime caching routes (libs, models, triads, statics, modules, templates)
 * 6) Navigation fallback for SPA
 */

//----------------------------------------------------------------------
// Import the Workbox library from the Google CDN
//----------------------------------------------------------------------
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

//----------------------------------------------------------------------
// Extract Workbox modules from the global workbox object
//----------------------------------------------------------------------
const { precacheAndRoute, cleanupOutdatedCaches } = workbox.precaching;
const { registerRoute, createHandlerBoundToURL }  = workbox.routing;
const { CacheFirst, StaleWhileRevalidate }        = workbox.strategies;
const { ExpirationPlugin }                        = workbox.expiration;

//----------------------------------------------------------------------
// 1) PRECACHE: clear outdated caches and serve precached assets
//----------------------------------------------------------------------
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

//----------------------------------------------------------------------
// 2) INSTALL: notify clients when a new version is available
//----------------------------------------------------------------------
self.addEventListener('install', event => {
  console.log('[SW] install → notifying clients of new version');
  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true }).then(clients =>
      clients.forEach(client =>
        client.postMessage({ type: 'NEW_VERSION_AVAILABLE', persistent: true })
      )
    )
  );
  // NOTE: skipWaiting is triggered by client via SKIP_WAITING message
});

//----------------------------------------------------------------------
// 3) ACTIVATE: remove any caches not managed by runtime caching
//----------------------------------------------------------------------
const RUNTIME_CACHES = [
  'cache-libs',
  'cache-models',
  'cache-triads',
  'cache-statics',
  'cache-modules',
  'cache-config',
  'cache-templates'
];

self.addEventListener('activate', event => {
  console.log('[SW] activate → cleaning up old caches');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => !RUNTIME_CACHES.includes(key) && !key.startsWith('workbox-precache'))
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

//----------------------------------------------------------------------
// 4) MESSAGE: handle SKIP_WAITING and CLEAR_CACHE commands from clients
//----------------------------------------------------------------------
self.addEventListener('message', event => {
  const msg = event.data || {};

  if (msg.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING received → activating new SW');
    event.waitUntil(
      self.skipWaiting().then(() => self.clients.claim())
    );
    return;
  }

  if (msg.action === 'CLEAR_CACHE') {
    console.log('[SW] CLEAR_CACHE received → purging all caches');
    event.waitUntil(
      caches.keys()
        .then(keys => Promise.all(keys.map(key => caches.delete(key))))
        .then(() => self.clients.matchAll())
        .then(clients => {
          clients.forEach(client => client.navigate(client.url));
        })
    );
    return;
  }
});

//----------------------------------------------------------------------
// 5) RUNTIME CACHING ROUTES
//----------------------------------------------------------------------

// 5.1 — Cache JS/WASM libraries under /assets/libs/ using CacheFirst strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/libs/'),
  new CacheFirst({
    cacheName: 'cache-libs',
    plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 })]
  })
);

// 5.2 — Cache ML models under /assets/models/ using CacheFirst strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/models/'),
  new CacheFirst({
    cacheName: 'cache-models',
    plugins: [new ExpirationPlugin({ maxEntries: 15, maxAgeSeconds: 30 * 24 * 60 * 60 })]
  })
);

// 5.3 — Cache game triads under /triads/ using CacheFirst strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/triads/'),
  new CacheFirst({
    cacheName: 'cache-triads',
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 })]
  })
);

// 5.4 — Cache static media (images/audio) using StaleWhileRevalidate
registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/assets/images/') ||
    /\.(?:png|jpe?g|webp|gif|svg|mp3|wav|ogg)$/.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'cache-statics',
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 90 * 24 * 60 * 60 })]
  })
);

// 5.5 — Cache all .js modules using StaleWhileRevalidate
registerRoute(
  ({ url }) => url.pathname.endsWith('.js'),
  new StaleWhileRevalidate({
    cacheName: 'cache-modules',
    plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 })]
  })
);

// 5.6 — Cache JSON and JS configs under /config/ using StaleWhileRevalidate
registerRoute(
  ({ url }) => url.pathname.startsWith('/config/') && /\.(?:json|js)$/.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'cache-config',
    plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 })]
  })
);

// 5.7 — Cache HTML templates under /templates/ using StaleWhileRevalidate
registerRoute(
  ({ url }) => url.pathname.startsWith('/templates/') && url.pathname.endsWith('.html'),
  new StaleWhileRevalidate({
    cacheName: 'cache-templates',
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 })]
  })
);

//----------------------------------------------------------------------
// 6) Navigation fallback for SPA routing
//----------------------------------------------------------------------
registerRoute(
  ({ request }) => request.mode === 'navigate',
  createHandlerBoundToURL('/index.html')
);