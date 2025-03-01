// Define BASE_PATH based on current URL.
// If the URL contains "/Testerer/", assume a specific environment (e.g. GitHub Pages),
// and set BASE_PATH accordingly; otherwise, use an empty string.
const BASE_PATH = self.location.pathname.includes("/Testerer/") 
  ? "/testerer-deploy.github.io/Testerer" 
  : "";

// Define the cache name. Update the version (e.g., "game-cache-v2") when files change.
const CACHE_NAME = "game-cache-v1";

// List of URLs to cache. Exclude dynamic database management files to prevent issues with table updates.
const urlsToCache = [
  // Root page and index.html
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  
  // CSS from CDN
  "https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css",
  
  // Main application scripts
  `${BASE_PATH}/js/main.js`,
  `${BASE_PATH}/js/app.js`,
  `${BASE_PATH}/js/apartmentPlanManager.js`,
  `${BASE_PATH}/js/cameraSectionManager.js`,
  // Exclude databaseManager.js due to dynamic table operations:
  // `${BASE_PATH}/js/databaseManager.js`,
  `${BASE_PATH}/js/eventManager.js`,
  `${BASE_PATH}/js/gameEventManager.js`,
  `${BASE_PATH}/js/ghostManager.js`,
  `${BASE_PATH}/js/languageManager.js`,
  `${BASE_PATH}/js/profileManager.js`,
  `${BASE_PATH}/js/questManager.js`,
  `${BASE_PATH}/js/showProfileModal.js`,
  
  // Modules related to events and quests
  `${BASE_PATH}/js/baseEvent.js`,
  `${BASE_PATH}/js/welcomeEvent.js`,
  `${BASE_PATH}/js/ghostEvent1.js`,
  
  // Configuration files for ghosts and quests
  `${BASE_PATH}/js/ghostQuestsConfig.js`,
  `${BASE_PATH}/js/ghostTextManager.js`,
  `${BASE_PATH}/js/ghostTextsConfig.js`,
  
  // Utilities for image processing and visual effects
  `${BASE_PATH}/js/visualEffectsManager.js`,
  `${BASE_PATH}/js/imageUtils.js`,
  
  // Localization file
  `${BASE_PATH}/locales/locales.json`
];

self.addEventListener("install", (event) => {
  console.log("🛠 Installing Service Worker...");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("Caching files:", urlsToCache);
        return cache.addAll(urlsToCache);
      })
      .catch((err) => console.error("❌ Error during caching:", err))
  );
});

self.addEventListener("activate", (event) => {
  console.log("✅ Activating Service Worker...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log(`🗑 Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Listen for messages from the client (e.g., update command)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("Service Worker skipping waiting...");
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  // Bypass caching for dynamic database management files to avoid interfering with table updates.
  if (event.request.url.includes("databaseManager.js")) {
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return the cached resource if found.
        if (response) {
          return response;
        }
        // Otherwise, perform a network request and cache the response.
        return fetch(event.request)
          .then((networkResponse) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          });
      })
      // If both cache and network fail, return the cached index.html as a fallback.
      .catch(() => caches.match(`${BASE_PATH}/index.html`))
  );
});