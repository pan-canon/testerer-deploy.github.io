const BASE_PATH = self.location.pathname.includes("/Testerer/") 
  ? "/testerer-deploy.github.io/Testerer" 
  : "";

const CACHE_NAME = "game-cache-v1";
const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  "https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css",
  `${BASE_PATH}/js/main.js`,
  `${BASE_PATH}/js/sql-wasm.js`,
  `${BASE_PATH}/js/locales.js`,  // Добавляем локали
  `${BASE_PATH}/locales/locales.json`
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});


// Установка Service Worker и кеширование файлов
self.addEventListener("install", (event) => {
  console.log("🛠 Установка Service Worker...");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .catch((err) => console.error("❌ Ошибка кэширования:", err))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName)) // Удаляем все старые кеши!
      );
    }).then(() => self.clients.claim())
  );
});


// Обработчик запросов: сначала ищем в кэше, потом обновляем
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone()); // Обновляем кэш
          return networkResponse;
        });
      });
    }).catch(() => caches.match(`${BASE_PATH}/index.html`)) // Фоллбэк на index.html
  );
});