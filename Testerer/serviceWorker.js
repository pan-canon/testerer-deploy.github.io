// Define BASE_PATH based on current URL.
// If the URL contains "/Testerer/", assume a specific environment (e.g., GitHub Pages),
// and set BASE_PATH accordingly; otherwise, use an empty string.
const BASE_PATH = self.location.pathname.includes("/Testerer/") 
  ? "/testerer-deploy.github.io/Testerer" 
  : "";

// Define the cache name. Update the version when files change.
const CACHE_NAME = "game-cache-v2";

// List of URLs to cache. Database-related files are excluded to prevent conflicts.
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
  // Exclude databaseManager.js and SQLiteDataManager.js to avoid dynamic DB issues
  // `${BASE_PATH}/js/databaseManager.js`,
  // `${BASE_PATH}/js/SQLiteDataManager.js`,
  `${BASE_PATH}/js/eventManager.js`,
  `${BASE_PATH}/js/gameEventManager.js`,
  `${BASE_PATH}/js/ghostManager.js`,
  `${BASE_PATH}/js/languageManager.js`,
  `${BASE_PATH}/js/profileManager.js`,
  `${BASE_PATH}/js/questManager.js`,
  `${BASE_PATH}/js/showProfileModal.js`,
  
  // UI and state management modules
  `${BASE_PATH}/js/viewManager.js`,
  `${BASE_PATH}/js/stateManager.js`,
  `${BASE_PATH}/js/errorManager.js`,
  `${BASE_PATH}/js/notificationManager.js`,
  
  // Modules related to events and quests
  `${BASE_PATH}/js/baseEvent.js`,
  `${BASE_PATH}/js/welcomeEvent.js`,
  `${BASE_PATH}/js/postMirrorEvent.js`,
  `${BASE_PATH}/js/postRepeatingEvent.js`,
  `${BASE_PATH}/js/finalEvent.js`,
  
  // Quest modules
  `${BASE_PATH}/js/baseMirrorQuest.js`,
  `${BASE_PATH}/js/baseRepeatingQuest.js`,
  `${BASE_PATH}/js/finalQuest.js`,
  
  // Additional configuration and utility files
  `${BASE_PATH}/js/ghostQuestsConfig.js`,
  `${BASE_PATH}/js/ghostTextManager.js`,
  `${BASE_PATH}/js/ghostTextsConfig.js`,
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
      .catch((err) => console.error("❌ Caching error:", err))
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
    }).then(() => self.clients.claim())
  );
});

// Listen for messages from the client.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("Service Worker skipping waiting...");
    self.skipWaiting();
  }
  // Clear all caches when receiving the CLEAR_CACHE command.
  if (event.data && event.data.action === "CLEAR_CACHE") {
    console.log("Received CLEAR_CACHE command.");
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log(`🗑 Deleting cache: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log("All caches cleared.");
    });
  }
});

self.addEventListener("fetch", (event) => {
  // Bypass caching for dynamic database management files.
  if (event.request.url.includes("databaseManager.js") ||
      event.request.url.includes("SQLiteDataManager.js")) {
    return event.respondWith(fetch(event.request));
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request)
          .then((networkResponse) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          });
      })
      .catch(() => caches.match(`${BASE_PATH}/index.html`))
  );
});