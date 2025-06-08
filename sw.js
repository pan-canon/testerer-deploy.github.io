/**
 * Service Worker (sw.js) – Workbox (classic) + debug logs + immediate activation
 *
 * Sections:
 *   0) Debug startup
 *   1) Load Workbox via importScripts()
 *   2) Precache + cleanup outdated precaches
 *   3) Install: notify & skipWaiting immediately (for testing)
 *   4) Activate: cleanup old runtime caches + claim clients
 *   5) Message handler: SKIP_WAITING & CLEAR_CACHE
 *   6) Runtime caching routes
 *   7) Navigation fallback (SPA)
 */

// 0) DEBUG STARTUP
console.log('[SW] → executing script');

// 1) Load Workbox from CDN
let wb = null;
try {
  importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');
  wb = workbox;
  console.log('[SW] ✔ workbox loaded', wb);
} catch (err) {
  console.error('[SW] ✖ importScripts(workbox) failed:', err);
}

// Bail out if Workbox didn’t load
if (!wb) {
  throw new Error('Workbox didn’t load, aborting SW.');
}

// 2) Pull modules off the global `workbox`
const { precacheAndRoute, cleanupOutdatedCaches } = wb.precaching;
const { registerRoute, createHandlerBoundToURL }  = wb.routing;
const { CacheFirst, StaleWhileRevalidate }        = wb.strategies;
const { ExpirationPlugin }                        = wb.expiration;

// --- 2) PRECACHE ---
cleanupOutdatedCaches();
console.log('[SW] precache manifest (raw):', self.__WB_MANIFEST);
precacheAndRoute(self.__WB_MANIFEST);

// 3) INSTALL: notify clients & skip waiting immediately (testing only!)
self.addEventListener('install', event => {
  console.log('[SW] install → notifying clients; forcing skipWaiting');
  event.waitUntil(
    Promise.all([
      self.skipWaiting(),
      self.clients.matchAll({ includeUncontrolled: true }).then(clients =>
        clients.forEach(c =>
          c.postMessage({ type: 'NEW_VERSION_AVAILABLE', persistent: true })
        )
      )
    ])
  );
});

// 4) ACTIVATE: cleanup non-runtime caches, then claim()
const RUNTIME_CACHES = [
  'cache-libs','cache-models','cache-triads',
  'cache-statics','cache-modules','cache-config','cache-templates'
];
self.addEventListener('activate', event => {
  console.log('[SW] activate → cleaning old caches');
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(k => !RUNTIME_CACHES.includes(k) && !k.startsWith('workbox-precache'))
            .map(k => {
              console.log('[SW] deleting cache:', k);
              return caches.delete(k);
            })
        )
      )
      .then(() => {
        console.log('[SW] claim clients now');
        return self.clients.claim();
      })
  );
});

// 5) MESSAGE handler: SKIP_WAITING & CLEAR_CACHE
self.addEventListener('message', event => {
  const msg = event.data || {};
  if (msg.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING → skipWaiting & claim()');
    event.waitUntil(self.skipWaiting().then(() => self.clients.claim()));
  }
  if (msg.action === 'CLEAR_CACHE') {
    console.log('[SW] CLEAR_CACHE → purging all caches');
    event.waitUntil(
      caches.keys()
        .then(keys => Promise.all(keys.map(k => caches.delete(k))))
        .then(() => self.clients.matchAll())
        .then(clients => clients.forEach(c => c.navigate(c.url)))
    );
  }
});

// 6) RUNTIME CACHING ROUTES

// 6.1 Libraries under /assets/libs/
registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/libs/'),
  new CacheFirst({
    cacheName: 'cache-libs',
    plugins: [ new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 30*24*60*60 }) ]
  })
);

// 6.2 Models under /assets/models/
registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/models/'),
  new CacheFirst({
    cacheName: 'cache-models',
    plugins: [ new ExpirationPlugin({ maxEntries: 15, maxAgeSeconds: 30*24*60*60 }) ]
  })
);

// 6.3 Triads under /triads/
registerRoute(
  ({ url }) => url.pathname.startsWith('/triads/'),
  new CacheFirst({
    cacheName: 'cache-triads',
    plugins: [ new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30*24*60*60 }) ]
  })
);

// 6.4 Static media (images/audio)
registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/assets/images/') ||
    /\.(?:png|jpe?g|webp|gif|svg|mp3|wav|ogg)$/.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'cache-statics',
    plugins: [ new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 90*24*60*60 }) ]
  })
);

// 6.5 JS modules
registerRoute(
  ({ url }) => url.pathname.endsWith('.js'),
  new StaleWhileRevalidate({
    cacheName: 'cache-modules',
    plugins: [ new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 30*24*60*60 }) ]
  })
);

// 6.6 JSON/JS config
registerRoute(
  ({ url }) => url.pathname.startsWith('/config/') && /\.(?:json|js)$/.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'cache-config',
    plugins: [ new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 30*24*60*60 }) ]
  })
);

// 6.7 HTML templates
registerRoute(
  ({ url }) => url.pathname.startsWith('/templates/') && url.pathname.endsWith('.html'),
  new StaleWhileRevalidate({
    cacheName: 'cache-templates',
    plugins: [ new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30*24*60*60 }) ]
  })
);

// 7) Navigation fallback for SPA routing
registerRoute(
  ({ request }) => request.mode === 'navigate',
  createHandlerBoundToURL('/index.html')
);

