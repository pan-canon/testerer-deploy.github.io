// sw.js

/**
 * Service Worker (sw.js) — Workbox‐powered with structured runtime caching
 *
 * Sections:
 * 0) Manual versioning & cache‐name override
 * 1) Precache + Cleanup outdated precaches
 * 1.5) Clients claim immediately upon activation
 * 2) Install event: notify clients about new version
 * 3) Activate event: cleanup old caches
 * 4) Message handler: SKIP_WAITING & CLEAR_CACHE
 * 5) Runtime caching routes (libs, models, triads, statics, modules, templates)
 * 6) Navigation fallback (SPA)
 */

////////////////////////////////////////////////////////////
// Load Workbox runtime in classic (non-ESM) mode
////////////////////////////////////////////////////////////
try {
  importScripts("https://storage.googleapis.com/workbox-cdn/releases/6.6.0/workbox-sw.js");
  console.log('[SW] importScripts succeeded, workbox loaded:', typeof workbox);
} catch (err) {
  console.error('[SW] importScripts failed:', err);
  // Rethrow to fail registration early
  throw err;
}

const {
  setCacheNameDetails,
  clientsClaim
} = workbox.core;
const {
  precacheAndRoute,
  cleanupOutdatedCaches
} = workbox.precaching;
const {
  registerRoute,
  createHandlerBoundToURL
} = workbox.routing;
const {
  CacheFirst,
  StaleWhileRevalidate
} = workbox.strategies;
const {
  ExpirationPlugin
} = workbox.expiration;

////////////////////////////////////////////////////////////
// 0) MANUAL VERSIONING — override Workbox generated names
////////////////////////////////////////////////////////////
const CACHE_VERSION = 'v60';
setCacheNameDetails({
  prefix:   '',                             // no default "workbox-" prefix
  suffix:   '',                             // no content hash suffix
  precache: `game-cache-${CACHE_VERSION}`,  // versioned precache name
  runtime:  ''                              // we name each runtime cache explicitly
});

////////////////////////////////////////////////////////////
// 1) PRECACHE: inject manifest & clean up outdated caches
////////////////////////////////////////////////////////////
console.log('[SW] self.__WB_MANIFEST =', self.__WB_MANIFEST);
precacheAndRoute(self.__WB_MANIFEST);

// optional: remove obsolete precaches automatically
cleanupOutdatedCaches();

////////////////////////////////////////////////////////////
// 1.5) CLIENTS CLAIM — take control of pages ASAP
////////////////////////////////////////////////////////////
clientsClaim();

////////////////////////////////////////////////////////////
// 2) INSTALL — notify all clients that a new version is available
////////////////////////////////////////////////////////////
self.addEventListener('install', event => {
  console.log('[SW] install → notifying clients of new version');
  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'NEW_VERSION_AVAILABLE',
          persistent: true
        });
      });
    })
  );
  // Note: we do NOT call skipWaiting() here.
  // We wait for the client to send SKIP_WAITING via message.
});

////////////////////////////////////////////////////////////
// 3) ACTIVATE — clean up any old caches beyond our allow-list
////////////////////////////////////////////////////////////
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
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => !ALLOWED_CACHES.includes(key))
          .map(key => {
            console.log(`[SW] deleting cache: ${key}`);
            return caches.delete(key);
          })
      ))
      .then(() => {
        console.log('[SW] claiming clients after cleanup');
        return self.clients.claim();
      })
  );
});

////////////////////////////////////////////////////////////
// 4) MESSAGE — handle SKIP_WAITING & CLEAR_CACHE commands
////////////////////////////////////////////////////////////
self.addEventListener('message', event => {
  const msg = event.data || {};

  // Skip waiting and immediately activate the new SW
  if (msg.type === 'SKIP_WAITING') {
    console.log('[SW] received SKIP_WAITING → skipping wait and activating');
    event.waitUntil(
      self.skipWaiting().then(() => self.clients.claim())
    );
    return;
  }

  // Clear all caches and reload all clients
  if (msg.action === 'CLEAR_CACHE') {
    console.log('[SW] received CLEAR_CACHE → purging all caches');
    event.waitUntil(
      caches.keys()
        .then(keys => Promise.all(
          keys.map(key => {
            console.log(`[SW] removing cache: ${key}`);
            return caches.delete(key);
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

////////////////////////////////////////////////////////////
// 5) RUNTIME CACHING ROUTES
////////////////////////////////////////////////////////////

// 5.1 — Libraries (.js, .wasm) under /assets/libs/
registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/libs/'),
  new CacheFirst({
    cacheName: 'cache-libs',
    plugins: [
      new ExpirationPlugin({
        maxEntries:    20,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      })
    ]
  })
);

// 5.2 — ML models under /assets/models/
registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/models/'),
  new CacheFirst({
    cacheName: 'cache-models',
    plugins: [
      new ExpirationPlugin({
        maxEntries:    15,
        maxAgeSeconds: 30 * 24 * 60 * 60
      })
    ]
  })
);

// 5.3 — Triads under /triads/
registerRoute(
  ({ url }) => url.pathname.startsWith('/triads/'),
  new CacheFirst({
    cacheName: 'cache-triads',
    plugins: [
      new ExpirationPlugin({
        maxEntries:    50,
        maxAgeSeconds: 30 * 24 * 60 * 60
      })
    ]
  })
);

// 5.4 — Static assets (images, audio, JSON)
registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/assets/images/') ||
    /\.(?:png|jpe?g|webp|gif|svg|mp3|wav|ogg|json)$/.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'cache-statics',
    plugins: [
      new ExpirationPlugin({
        maxEntries:    100,
        maxAgeSeconds: 90 * 24 * 60 * 60 // 90 days
      })
    ]
  })
);

// 5.5 — Other JavaScript modules (.js)
registerRoute(
  ({ url }) => url.pathname.endsWith('.js'),
  new StaleWhileRevalidate({
    cacheName: 'cache-modules',
    plugins: [
      new ExpirationPlugin({
        maxEntries:    30,
        maxAgeSeconds: 30 * 24 * 60 * 60
      })
    ]
  })
);

// 5.6 — HTML templates under /templates/
registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/templates/') && url.pathname.endsWith('.html'),
  new StaleWhileRevalidate({
    cacheName: 'cache-templates',
    plugins: [
      new ExpirationPlugin({
        maxEntries:    50,
        maxAgeSeconds: 30 * 24 * 60 * 60
      })
    ]
  })
);

////////////////////////////////////////////////////////////
// 6) Navigation fallback — serve index.html for SPA routes
////////////////////////////////////////////////////////////
registerRoute(
  ({ request }) => request.mode === 'navigate',
  createHandlerBoundToURL('/index.html')
);