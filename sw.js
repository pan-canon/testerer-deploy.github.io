/**
 * Service Worker (sw.js) - Workbox‐powered with structured runtime caching
 *
 * Sections:
 * 1) Precache + Cleanup outdated precaches
 * 2) Install event: notify clients about new version
 * 3) Activate event: cleanup old runtime caches
 * 4) Message handler: SKIP_WAITING & CLEAR_CACHE
 * 5) Runtime caching routes (libs, models, triads, statics, modules, templates)
 * 6) Navigation fallback (SPA)
 */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, createHandlerBoundToURL }  from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate }        from 'workbox-strategies';
import { ExpirationPlugin }                        from 'workbox-expiration';

// 1) PRECACHE: inject manifest & automatically remove old precaches
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// 2) INSTALL: notify clients of new version
self.addEventListener('install', event => {
  console.log('[SW] install → notifying clients of new version');
  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true }).then(clients =>
      clients.forEach(c =>
        c.postMessage({ type: 'NEW_VERSION_AVAILABLE', persistent: true })
      )
    )
  );
  // NOTE: no skipWaiting() here — we wait for the client to send SKIP_WAITING
});

// 3) ACTIVATE: delete any non-runtime caches
const RUNTIME_CACHES = [
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
          // remove anything that's not one of our runtime caches
          .filter(key => !RUNTIME_CACHES.includes(key) && !key.startsWith('workbox-precache'))
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
          clients.forEach(c => {
            console.log(`[SW] reloading client: ${c.url}`);
            c.navigate(c.url);
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
    plugins: [ new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 }) ]
  })
);

// 5.2 — Models (COCO-SSD) under /assets/models/
registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/models/'),
  new CacheFirst({
    cacheName: 'cache-models',
    plugins: [ new ExpirationPlugin({ maxEntries: 15, maxAgeSeconds: 30 * 24 * 60 * 60 }) ]
  })
);

// 5.3 — Triads under /triads/
registerRoute(
  ({ url }) => url.pathname.startsWith('/triads/'),
  new CacheFirst({
    cacheName: 'cache-triads',
    plugins: [ new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }) ]
  })
);

// 5.4 — Static media (images, audio)
registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/assets/images/') ||
    /\.(?:png|jpe?g|webp|gif|svg|mp3|wav|ogg)$/.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'cache-statics',
    plugins: [ new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 90 * 24 * 60 * 60 }) ]
  })
);

// 5.5 — JavaScript modules (.js)
registerRoute(
  ({ url }) => url.pathname.endsWith('.js'),
  new StaleWhileRevalidate({
    cacheName: 'cache-modules',
    plugins: [ new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 }) ]
  })
);

// 5.6 — JSON/JS config under /config/
registerRoute(
  ({ url }) => url.pathname.startsWith('/config/') &&
                /\.(?:json|js)$/.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'cache-config',
    plugins: [ new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 }) ]
  })
);

// 5.7 — HTML templates under /templates/
registerRoute(
  ({ url }) => url.pathname.startsWith('/templates/') &&
                url.pathname.endsWith('.html'),
  new StaleWhileRevalidate({
    cacheName: 'cache-templates',
    plugins: [ new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }) ]
  })
);

// 6) Navigation fallback for SPA routing
registerRoute(
  ({ request }) => request.mode === 'navigate',
  createHandlerBoundToURL('/index.html')
);