// sw.js (Service Worker template for production)

import { registerRoute }            from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin }         from 'workbox-expiration';

/**
 * Versioned cache name — bump this on each release to purge old caches
 */
const CACHE_VERSION = 'v57';
const PRECACHE_CACHE = `game-cache-${CACHE_VERSION}`;

/**
 * The manifest array will be injected here by workbox-webpack-plugin's InjectManifest
 * It looks like: [ { url: '/index.html', revision: '...' }, … ]
 */
const PRECACHE_MANIFEST = self.__WB_MANIFEST;

/*——————————————————————————————————————————————————————————
  1) INSTALL EVENT: PRECACHE CRITICAL ASSETS + NOTIFY CLIENTS
——————————————————————————————————————————————————————————*/
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(PRECACHE_CACHE)
      .then(cache => cache.addAll(
        // Add all URLs from the injected precache manifest
        PRECACHE_MANIFEST.map(entry => entry.url)
      ))
      .then(() => self.clients.matchAll({ includeUncontrolled: true }))
      .then(clients => {
        // Broadcast to all clients that a new version is available
        clients.forEach(client =>
          client.postMessage({ type: 'NEW_VERSION_AVAILABLE', persistent: true })
        );
      })
  );
  // Note: we do NOT call skipWaiting() here — we wait for user confirmation
});

/*——————————————————————————————————————————————————————————
  2) ACTIVATE EVENT: CLEAN UP OLD CACHES
——————————————————————————————————————————————————————————*/
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            // Keep only our current caches; delete any others
            .filter(key =>
              ![
                PRECACHE_CACHE,
                'cache-libs',
                'cache-models',
                'cache-triads',
                'cache-statics',
                'cache-modules'
              ].includes(key)
            )
            .map(key => caches.delete(key))
        )
      )
  );
  // Note: we do NOT call clients.claim() here — we wait for explicit SKIP_WAITING
});

/*——————————————————————————————————————————————————————————
  3) MESSAGE HANDLER: SKIP_WAITING & CLEAR_CACHE
——————————————————————————————————————————————————————————*/
self.addEventListener('message', event => {
  const msg = event.data || {};

  if (msg.type === 'SKIP_WAITING') {
    // User confirmed update — activate new SW and take control immediately
    event.waitUntil(
      self.skipWaiting().then(() => self.clients.claim())
    );
    return;
  }

  if (msg.action === 'CLEAR_CACHE') {
    // Clear all caches and reload all clients
    event.waitUntil(
      caches.keys()
        .then(keys => Promise.all(keys.map(k => caches.delete(k))))
        .then(() => self.clients.matchAll())
        .then(clients => clients.forEach(client => client.navigate(client.url)))
    );
  }
});

/*——————————————————————————————————————————————————————————
  4) RUNTIME CACHING ROUTES — SUBDIVIDED BY RESOURCE TYPE
——————————————————————————————————————————————————————————*/

// 4.1 — Libraries (e.g., large JS & WASM files)
registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/libs/'),
  new CacheFirst({
    cacheName: 'cache-libs',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,              // keep up to 20 library files
        maxAgeSeconds: 30 * 24 * 60 * 60 // expire after 30 days
      })
    ]
  })
);

// 4.2 — Models (COCO-SSD shards & model.json)
registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/models/'),
  new CacheFirst({
    cacheName: 'cache-models',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 15,              // shard files + model.json
        maxAgeSeconds: 30 * 24 * 60 * 60
      })
    ]
  })
);

// 4.3 — Triads (game-specific data bundles)
registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/triads/'),
  new CacheFirst({
    cacheName: 'cache-triads',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,              // plenty for your sequence files
        maxAgeSeconds: 30 * 24 * 60 * 60
      })
    ]
  })
);

// 4.4 — Static assets (images, audio, JSON, HTML templates)
registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/assets/images/') ||
    /\.(?:png|jpe?g|webp|gif|svg|mp3|wav|ogg|json|html)$/.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'cache-statics',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,             // images & media
        maxAgeSeconds: 90 * 24 * 60 * 60 // expire after 90 days
      })
    ]
  })
);

// 4.5 — JavaScript modules and other scripts
registerRoute(
  ({ url }) => url.pathname.endsWith('.js'),
  new StaleWhileRevalidate({
    cacheName: 'cache-modules',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,              // core scripts & chunks
        maxAgeSeconds: 30 * 24 * 60 * 60
      })
    ]
  })
);

/*——————————————————————————————————————————————————————————
  5) FETCH EVENT: FALLBACK TO CACHE OR NETWORK, INDEX.HTML ON ERROR
——————————————————————————————————————————————————————————*/
self.addEventListener('fetch', event => {
  const { request } = event;

  // Bypass certain dynamic DB scripts entirely
  if (request.url.includes('DatabaseManager.js') || request.url.includes('SQLiteDataManager.js')) {
    return event.respondWith(fetch(request));
  }

  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return from any of the above caches
          return cachedResponse;
        }
        // Otherwise, fetch from network and optionally cache into PRECACHE_CACHE
        return fetch(request).then(networkResponse => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const clone = networkResponse.clone();
            caches.open(PRECACHE_CACHE).then(cache => cache.put(request, clone));
          }
          return networkResponse;
        });
      })
      .catch(() => {
        // On offline or error, serve index.html for SPA routing
        return caches.match('index.html');
      })
  );
});