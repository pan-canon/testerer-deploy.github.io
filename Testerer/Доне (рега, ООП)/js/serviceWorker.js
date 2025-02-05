const CACHE_NAME = "game-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css",
  "/js/main.js",
  "/js/sql-wasm.js",
  "/locales/locales.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});