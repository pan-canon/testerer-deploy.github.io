// Определяем BASE_PATH в зависимости от текущего URL. 
// Если путь содержит "/Testerer/", то мы находимся в определенном окружении (например, GitHub Pages),
// и BASE_PATH устанавливается соответствующим образом. Иначе – пустая строка.
const BASE_PATH = self.location.pathname.includes("/Testerer/") 
  ? "/testerer-deploy.github.io/Testerer" 
  : "";

// Имя кэша. При необходимости при обновлении кода меняйте версию (например, game-cache-v2).
const CACHE_NAME = "game-cache-v1";

// Список URL для кэширования. Здесь включены все основные файлы, необходимые для работы приложения в офлайн-режиме.
const urlsToCache = [
  // Корневая страница и index.html
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,

  // Стили (например, bulma.css из CDN)
  "https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css",

  // Основной скрипт приложения
  `${BASE_PATH}/js/main.js`,

  // Модули приложения
  `${BASE_PATH}/js/app.js`,
  `${BASE_PATH}/js/apartmentPlanManager.js`,
  `${BASE_PATH}/js/cameraSectionManager.js`,
  `${BASE_PATH}/js/databaseManager.js`,
  `${BASE_PATH}/js/eventManager.js`,
  `${BASE_PATH}/js/gameEventManager.js`,
  `${BASE_PATH}/js/ghostManager.js`,
  `${BASE_PATH}/js/languageManager.js`,
  `${BASE_PATH}/js/profileManager.js`,
  `${BASE_PATH}/js/questManager.js`,
  `${BASE_PATH}/js/showProfileModal.js`,

  // Модули, связанные с событиями и квестами
  `${BASE_PATH}/js/baseEvent.js`,
  `${BASE_PATH}/js/welcomeEvent.js`,
  `${BASE_PATH}/js/ghostEvent1.js`,

  // Конфигурационные файлы для призраков и квестов
  `${BASE_PATH}/js/ghostQuestsConfig.js`,
  `${BASE_PATH}/js/ghostTextManager.js`,
  `${BASE_PATH}/js/ghostTextsConfig.js`,

  // Утилиты для обработки изображений и визуальных эффектов
  `${BASE_PATH}/js/visualEffectsManager.js`,
  `${BASE_PATH}/js/imageUtils.js`,

  // Файл локализации
  `${BASE_PATH}/locales/locales.json`
];

// Обработчик события "install" для установки сервис-воркера и предварительного кэширования файлов.
self.addEventListener("install", (event) => {
  console.log("🛠 Установка Service Worker...");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("Кэширование файлов:", urlsToCache);
        return cache.addAll(urlsToCache);
      })
      .catch((err) => console.error("❌ Ошибка кэширования:", err))
  );
});

// Обработчик события "activate" для активации сервис-воркера и удаления старых кэшей.
self.addEventListener("activate", (event) => {
  console.log("✅ Активация Service Worker...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Удаляем все кэши, имя которых отличается от текущего CACHE_NAME.
          if (cacheName !== CACHE_NAME) {
            console.log(`🗑 Удаление старого кеша: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Обработчик события "fetch" для перехвата сетевых запросов и выдачи кэшированного ответа.
// Если запрашиваемый ресурс не найден в кэше, выполняется сетевой запрос и ответ добавляется в кэш.
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Если ресурс найден в кэше, возвращаем его.
        if (response) {
          return response;
        }
        // Иначе, выполняем сетевой запрос.
        return fetch(event.request)
          .then((networkResponse) => {
            // Открываем кэш и сохраняем ответ для будущих запросов.
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          });
      })
      // Если ни кэш, ни сеть не доступны, используем index.html как фолбэк.
      .catch(() => caches.match(`${BASE_PATH}/index.html`))
  );
});