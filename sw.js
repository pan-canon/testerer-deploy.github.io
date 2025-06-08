// sw.js (Service Worker template for production)

// Versioned cache name — bump on each release
const CACHE_VERSION = 'v54';
const CACHE_NAME    = `game-cache-${CACHE_VERSION}`;

// The manifest array will be injected here by InjectManifest.
// It looks like: [{ url: '/index.html', revision: '...' }, …]
const PRECACHE_MANIFEST = self.__WB_MANIFEST;

// Install: pre-cache all assets + notify clients about new version
self.addEventListener('install', event => {
  event.waitUntil(
    // 1) Open our single cache and add all manifest URLs
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_MANIFEST.map(item => item.url)))
      // 2) Tell all clients that a new version is available
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
  // NOTE: no skipWaiting() here — we wait for explicit user action
});

// Activate: remove old caches (keep only CACHE_NAME)
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
  // NOTE: no clients.claim() here — we'll claim on SKIP_WAITING
});

// Handle messages from the page
self.addEventListener('message', event => {
  const msg = event.data || {};

  if (msg.type === 'SKIP_WAITING') {
    // User chose to update — activate new SW and take control
    event.waitUntil(
      self.skipWaiting()
        .then(() => self.clients.claim())
    );
    return;
  }

  if (msg.action === 'CLEAR_CACHE') {
    // Clear everything and reload clients
    event.waitUntil(
      caches.keys()
        .then(keys => Promise.all(keys.map(k => caches.delete(k))))
        .then(() => self.clients.matchAll())
        .then(clients =>
          clients.forEach(client => client.navigate(client.url))
        )
    );
  }
});

// Fetch: cache-first strategy using our single cache, with index.html fallback
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Bypass dynamic DB-management scripts
  if (url.includes('DatabaseManager.js') || url.includes('SQLiteDataManager.js')) {
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(networkResponse => {
          // Only cache valid GET responses
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
      .catch(() => {
        // On error (e.g. offline navigation), serve index.html
        return caches.match('index.html');
      })
  );
});