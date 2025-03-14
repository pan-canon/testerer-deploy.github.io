// Define BASE_PATH based on current URL.
// If the URL contains "/Testerer/", assume GitHub Pages environment and set BASE_PATH accordingly.
const BASE_PATH = self.location.pathname.includes("/Testerer/")
  ? "/Testerer/game"
  : "";

// Define the cache name. Update the version whenever any file changes.
const CACHE_NAME = "game-cache-v3";

// List of URLs to cache based on your current structure.
// Note: Files related to dynamic database management are excluded.
const urlsToCache = [
  // Root files (outside of /src and /assets)
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/main.js`,
  `${BASE_PATH}/manifest.json`,

  // CSS from CDN
  "https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css",

  // Source files in /src:
  
  // Managers (located in /src/managers/)
  `${BASE_PATH}/src/managers/ApartmentPlanManager.js`,
  `${BASE_PATH}/src/managers/CameraSectionManager.js`,
  `${BASE_PATH}/src/managers/EventManager.js`,
  `${BASE_PATH}/src/managers/GameEventManager.js`,
  `${BASE_PATH}/src/managers/GhostManager.js`,
  `${BASE_PATH}/src/managers/LanguageManager.js`,
  `${BASE_PATH}/src/managers/ProfileManager.js`,
  `${BASE_PATH}/src/managers/QuestManager.js`,
  `${BASE_PATH}/src/managers/ShowProfileModal.js`,
  `${BASE_PATH}/src/managers/ViewManager.js`,
  `${BASE_PATH}/src/managers/StateManager.js`,
  `${BASE_PATH}/src/managers/ErrorManager.js`,
  `${BASE_PATH}/src/managers/NotificationManager.js`,
  `${BASE_PATH}/src/managers/VisualEffectsManager.js`,
  // (Include any additional manager files if needed)

  // Events (located in /src/events/)
  `${BASE_PATH}/src/events/BaseEvent.js`,
  `${BASE_PATH}/src/events/WelcomeEvent.js`,
  `${BASE_PATH}/src/events/PostMirrorEvent.js`,
  `${BASE_PATH}/src/events/PostRepeatingEvent.js`,
  `${BASE_PATH}/src/events/FinalEvent.js`,

  // Quests (located in /src/quests/)
  `${BASE_PATH}/src/quests/BaseMirrorQuest.js`,
  `${BASE_PATH}/src/quests/BaseRepeatingQuest.js`,
  `${BASE_PATH}/src/quests/FinalQuest.js`,

  // Locales (located in /src/locales/)
  `${BASE_PATH}/src/locales/locales.js`,
  `${BASE_PATH}/src/locales/locales.json`,

  // Utilities (located in /src/utils/)
  `${BASE_PATH}/src/utils/ImageUtils.js`

  // Optionally, add any additional configuration files if needed.
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
  // Activate the new service worker immediately.
  self.skipWaiting();
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

self.addEventListener("message", (event) => {
  if (event.data) {
    if (event.data.type === "SKIP_WAITING") {
      console.log("Service Worker skipping waiting...");
      self.skipWaiting();
    }
    // Clear all caches upon receiving the CLEAR_CACHE command.
    if (event.data.action === "CLEAR_CACHE") {
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
        // Reload all clients to update the page.
        self.clients.matchAll().then((clients) => {
          clients.forEach(client => client.navigate(client.url));
        });
      });
    }
  }
});

self.addEventListener("fetch", (event) => {
  // Bypass caching for dynamic database management files.
  if (event.request.url.includes("DatabaseManager.js") ||
      event.request.url.includes("SQLiteDataManager.js")) {
    return event.respondWith(fetch(event.request));
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached file if found.
        if (response) {
          return response;
        }
        // Otherwise, fetch from network and cache the response.
        return fetch(event.request)
          .then((networkResponse) => {
            // Validate the network response.
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
              return networkResponse;
            }
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
            return networkResponse;
          });
      })
      // Fallback to index.html for navigation requests.
      .catch(() => caches.match(`${BASE_PATH}/index.html`))
  );
});