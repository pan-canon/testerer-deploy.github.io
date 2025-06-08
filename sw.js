/**
 * Service Worker (sw.js) – Workbox-powered with structured runtime caching
 *
 * Sections:
 *   1) Load Workbox from CDN
 *   2) Precache + cleanup outdated precaches
 *   3) Install event: notify clients about new version
 *   4) Activate event: cleanup old runtime caches
 *   5) Message handler: SKIP_WAITING & CLEAR_CACHE
 *   6) Runtime caching routes (libs, models, triads, statics, modules, config, templates)
 *   7) Navigation fallback (SPA)
 */

// 1) Load Workbox core and plugins via importScripts
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (!workbox) {
  console.error('Workbox failed to load.');
}

// 2) Pull out the modules we need
const { precacheAndRoute, cleanupOutdatedCaches } = workbox.precaching;
const { registerRoute, createHandlerBoundToURL }  = workbox.routing;
const { CacheFirst, StaleWhileRevalidate }        = workbox.strategies;
const { ExpirationPlugin }                        = workbox.expiration;

// --- 2) PRECACHE: remove old precaches, then cache manifest entries ---
cleanupOutdatedCaches();
// `self.__WB_MANIFEST` will be replaced by your InjectManifest plugin at build time
precacheAndRoute(self.__WB_MANIFEST);

// --- 3) INSTALL: notify clients that a new version is available ---
self.addEventListener('install', event => {
  console.log('[SW] install → notifying clients of new version');
  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true }).then(clients =>
      clients.forEach(c =>
        c.postMessage({ type: 'NEW_VERSION_AVAILABLE', persistent: true })
      )
    )
  );
  // Note: we do NOT call skipWaiting() here; we wait for the client to request it
});

// --- 4) ACTIVATE: delete any non-runtime caches, then claim clients ---
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
          // remove any cache not in our runtime list or the precache prefix
          .filter(key => 
            !RUNTIME_CACHES.includes(key) && !key.startsWith('workbox-precache')
          )
          .map(key => caches.delete(key))
      )
    )
    .then(() => {
      console.log('[SW] claim clients');
      return self.clients.claim();
    })
  );
});

// --- 5) MESSAGE: handle skipWaiting & clear all caches on demand ---
self.addEventListener('message', event => {
  const msg = event.data || {};

  if (msg.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING received → activating new SW');
    return event.waitUntil(
      self.skipWaiting().then(() => self.clients.claim())
    );
  }

  if (msg.action === 'CLEAR_CACHE') {
    console.log('[SW] CLEAR_CACHE received → purging all caches');
    return event.waitUntil(
      caches.keys()
        .then(keys => Promise.all(keys.map(k => caches.delete(k))))
        .then(() => self.clients.matchAll())
        .then(clients =>
          clients.forEach(c => c.navigate(c.url))
        )
    );
  }
});

// --- 6) RUNTIME CACHING ROUTES ---

// 6.1 Libraries (.js, .wasm) under /assets/libs/
registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/libs/'),
  new CacheFirst({
    cacheName: 'cache-libs',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 })
    ]
  })
);

// 6.2 Models (COCO-SSD) under /assets/models/
registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/models/'),
  new CacheFirst({
    cacheName: 'cache-models',
    plugins: [
      new ExpirationPlugin({ maxEntries: 15, maxAgeSeconds: 30 * 24 * 60 * 60 })
    ]
  })
);

// 6.3 Triads under /triads/
registerRoute(
  ({ url }) => url.pathname.startsWith('/triads/'),
  new CacheFirst({
    cacheName: 'cache-triads',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 })
    ]
  })
);

// 6.4 Static media (images, audio)
registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/assets/images/') ||
    /\.(?:png|jpe?g|webp|gif|svg|mp3|wav|ogg)$/.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'cache-statics',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 90 * 24 * 60 * 60 })
    ]
  })
);

// 6.5 JavaScript modules (.js)
registerRoute(
  ({ url }) => url.pathname.endsWith('.js'),
  new StaleWhileRevalidate({
    cacheName: 'cache-modules',
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 })
    ]
  })
);

// 6.6 JSON/JS config under /config/
registerRoute(
  ({ url }) => 
    url.pathname.startsWith('/config/') &&
    /\.(?:json|js)$/.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'cache-config',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 })
    ]
  })
);

// 6.7 HTML templates under /templates/
registerRoute(
  ({ url }) => 
    url.pathname.startsWith('/templates/') &&
    url.pathname.endsWith('.html'),
  new StaleWhileRevalidate({
    cacheName: 'cache-templates',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 })
    ]
  })
);

// --- 7) Navigation fallback for SPA routing ---
registerRoute(
  ({ request }) => request.mode === 'navigate',
  createHandlerBoundToURL('/index.html')
);