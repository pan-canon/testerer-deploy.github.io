/**
 * Service Worker (sw.js) - Workbox‐powered with structured runtime caching
 *
 * Sections:
 * 0) Manual versioning & cache‐name override
 * 1) Precache + Cleanup outdated precaches
 * 2) Install event: notify clients about new version
 * 3) Activate event: cleanup old caches
 * 4) Message handler: SKIP_WAITING & CLEAR_CACHE
 * 5) Runtime caching routes:
 *     5.1 libs, 5.2 models, 5.3 triads,
 *     5.4 statics (media only),
 *     5.5 modules,
 *     **5.6 config, 5.7 templates**
 * 6) Navigation fallback (SPA)
 */

import { setCacheNameDetails }                     from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, createHandlerBoundToURL }  from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate }        from 'workbox-strategies';
import { ExpirationPlugin }                        from 'workbox-expiration';

// 0) MANUAL VERSIONING — override all Workbox cache names
const CACHE_VERSION = 'v59';
setCacheNameDetails({
  prefix:   '',                            // drop "workbox-" prefix
  suffix:   '',                            // drop "-<hash>" suffix
  precache: `game-cache-${CACHE_VERSION}`, // your versioned precache
  runtime:  ''                             // unused: we name each group manually
});

// 1) PRECACHE: inject manifest & cleanup old precaches
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// 2) INSTALL: notify clients of new version
self.addEventListener('install', event => {
  console.log('[SW] install → notify clients of new version');
  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true }).then(clients =>
      clients.forEach(c =>
        c.postMessage({ type: 'NEW_VERSION_AVAILABLE', persistent: true })
      )
    )
  );
  // NOTE: no skipWaiting() yet
});

// 3) ACTIVATE: delete any caches not in our allow‐list
const ALLOWED = [
  `game-cache-${CACHE_VERSION}`,
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
          .filter(key => !ALLOWED.includes(key))
          .map(key => {
            console.log(`[SW] delete cache: ${key}`);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// 4) MESSAGE: SKIP_WAITING & CLEAR_CACHE
self.addEventListener('message', event => {
  const msg = event.data || {};

  if (msg.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING → activate immediately');
    event.waitUntil(self.skipWaiting().then(() => self.clients.claim()));
    return;
  }
  if (msg.action === 'CLEAR_CACHE') {
    console.log('[SW] CLEAR_CACHE → purging all caches');
    event.waitUntil(
      caches.keys()
        .then(keys => Promise.all(keys.map(k => caches.delete(k))))
        .then(() => self.clients.matchAll())
        .then(clients => clients.forEach(c => c.navigate(c.url)))
    );
    return;
  }
});

// 5) RUNTIME CACHING ROUTES

// 5.1 — libs
registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/libs/'),
  new CacheFirst({
    cacheName: 'cache-libs',
    plugins: [ new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 30*24*60*60 }) ]
  })
);

// 5.2 — models
registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/models/'),
  new CacheFirst({
    cacheName: 'cache-models',
    plugins: [ new ExpirationPlugin({ maxEntries: 15, maxAgeSeconds: 30*24*60*60 }) ]
  })
);

// 5.3 — triads
registerRoute(
  ({ url }) => url.pathname.startsWith('/triads/'),
  new CacheFirst({
    cacheName: 'cache-triads',
    plugins: [ new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30*24*60*60 }) ]
  })
);

// 5.4 — statics (media only: images/audio)
registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/assets/images/') ||
    /\.(?:png|jpe?g|webp|gif|svg|mp3|wav|ogg)$/.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'cache-statics',
    plugins: [ new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 90*24*60*60 }) ]
  })
);

// 5.5 — modules (.js)
registerRoute(
  ({ url }) => url.pathname.endsWith('.js'),
  new StaleWhileRevalidate({
    cacheName: 'cache-modules',
    plugins: [ new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 30*24*60*60 }) ]
  })
);

// 5.6 — config (JSON & JS under /config/)
registerRoute(
  ({ url }) => url.pathname.startsWith('/config/') &&
                /\.(?:json|js)$/.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'cache-config',
    plugins: [ new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 30*24*60*60 }) ]
  })
);

// 5.7 — templates (HTML under /templates/)
registerRoute(
  ({ url }) => url.pathname.startsWith('/templates/') &&
                url.pathname.endsWith('.html'),
  new StaleWhileRevalidate({
    cacheName: 'cache-templates',
    plugins: [ new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30*24*60*60 }) ]
  })
);

// 6) Navigation fallback for SPA
registerRoute(
  ({ request }) => request.mode === 'navigate',
  createHandlerBoundToURL('/index.html')
);