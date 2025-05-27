// sw.js
// Determine BASE_PATH in ServiceWorker context
const BASE_PATH = self.location.hostname.includes("github.io")
  ? "/testerer-deploy.github.io"
  : "";

const CACHE_VERSION = 'v21'; // bump this on each release
const CACHE_NAME    = `game-cache-${CACHE_VERSION}`;

const urlsToCache = [
  // Root
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/main.js`,
  `${BASE_PATH}/manifest.json`,

  // CSS
  "https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css",

  // Libraries
  `${BASE_PATH}/assets/libs/tf.min.js`,
  `${BASE_PATH}/assets/libs/tf.min.js.map`,
  `${BASE_PATH}/assets/libs/coco-ssd.min.js`,
  `${BASE_PATH}/assets/libs/three.js`,

  // SQLite WASM
  `${BASE_PATH}/assets/libs/db/sql-wasm.js`,
  `${BASE_PATH}/assets/libs/db/sql-wasm.wasm`,

  // Audio
  `${BASE_PATH}/assets/audio/ghost_effect.mp3`,
  `${BASE_PATH}/assets/audio/type_sound.mp3`,

  // Images
  `${BASE_PATH}/assets/images/pencil.png`,
  `${BASE_PATH}/assets/images/static-image.webp`,

  // Models (COCO-SSD)
  `${BASE_PATH}/assets/models/coco-ssd/model.json`,
  `${BASE_PATH}/assets/models/coco-ssd/group1-shard1of5`,
  `${BASE_PATH}/assets/models/coco-ssd/group1-shard2of5`,
  `${BASE_PATH}/assets/models/coco-ssd/group1-shard3of5`,
  `${BASE_PATH}/assets/models/coco-ssd/group1-shard4of5`,
  `${BASE_PATH}/assets/models/coco-ssd/group1-shard5of5`,

  // Config JSON
  `${BASE_PATH}/src/config/chatDialogueConfig.json`,
  `${BASE_PATH}/src/config/detectableItems.js`,
  `${BASE_PATH}/src/config/gameEntities.json`,
  `${BASE_PATH}/src/config/stateKeys.js`,

  // DI Container
  `${BASE_PATH}/src/container/DIContainer.js`,

  // Events
  `${BASE_PATH}/src/events/BaseEvent.js`,
  `${BASE_PATH}/src/events/FinalEvent.js`,
  `${BASE_PATH}/src/events/PostMirrorEvent.js`,
  `${BASE_PATH}/src/events/PostRepeatingEvent.js`,
  `${BASE_PATH}/src/events/WelcomeEvent.js`,

  // Locales
  `${BASE_PATH}/src/locales/chatLocales_en.js`,
  `${BASE_PATH}/src/locales/chatLocales_ru.js`,
  `${BASE_PATH}/src/locales/chatLocales_uk.js`,
  `${BASE_PATH}/src/locales/locales.js`,
  `${BASE_PATH}/src/locales/locales.json`,

  // Managers
  `${BASE_PATH}/src/managers/ApartmentPlanManager.js`,
  `${BASE_PATH}/src/managers/CameraSectionManager.js`,
  `${BASE_PATH}/src/managers/ChatManager.js`,
  `${BASE_PATH}/src/managers/ChatScenarioManager.js`,
  `${BASE_PATH}/src/managers/DatabaseManager.js`,
  `${BASE_PATH}/src/managers/ErrorManager.js`,
  `${BASE_PATH}/src/managers/EventManager.js`,
  `${BASE_PATH}/src/managers/GameEventManager.js`,
  `${BASE_PATH}/src/managers/GhostManager.js`,
  `${BASE_PATH}/src/managers/LanguageManager.js`,
  `${BASE_PATH}/src/managers/NotificationManager.js`,
  `${BASE_PATH}/src/managers/ProfileManager.js`,
  `${BASE_PATH}/src/managers/QuestManager.js`,
  `${BASE_PATH}/src/managers/ShowProfileModal.js`,
  `${BASE_PATH}/src/managers/SQLiteDataManager.js`,
  `${BASE_PATH}/src/managers/StateManager.js`,
  `${BASE_PATH}/src/managers/ViewManager.js`,
  `${BASE_PATH}/src/managers/VisualEffectsManager.js`,

  // Quests
  `${BASE_PATH}/src/quests/BaseMirrorQuest.js`,
  `${BASE_PATH}/src/quests/BaseRepeatingQuest.js`,
  `${BASE_PATH}/src/quests/FinalQuest.js`,

  // Templates
  `${BASE_PATH}/src/templates/apartment-plan-screen_template.html`,
  `${BASE_PATH}/src/templates/chat_template.html`,
  `${BASE_PATH}/src/templates/diaryentry_screen-template.html`,
  `${BASE_PATH}/src/templates/landing-screen_template.html`,
  `${BASE_PATH}/src/templates/main-screen_template.html`,
  `${BASE_PATH}/src/templates/registration-screen_template.html`,
  `${BASE_PATH}/src/templates/selfie-screen_template.html`,

  // Utils
  `${BASE_PATH}/src/utils/DeviceOrientationControls.js`,
  `${BASE_PATH}/src/utils/GameEntityLoader.js`,
  `${BASE_PATH}/src/utils/ImageUtils.js`,
  `${BASE_PATH}/src/utils/QuestControlUtils.js`,
  `${BASE_PATH}/src/utils/SequenceManager.js`,
  `${BASE_PATH}/src/utils/SpiritBoardUtils.js`,
  `${BASE_PATH}/src/utils/TemplateEngine.js`
];

self.addEventListener('install', event => {
  // Force this SW to become active immediately
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  console.log('✅ Activating Service Worker...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log(`🗑 Deleting old cache: ${key}`);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  const msg = event.data;
  if (!msg) return;

  if (msg.type === 'SKIP_WAITING') {
    console.log('SW received SKIP_WAITING, activating immediately');
    self.skipWaiting();
    return;
  }

  if (msg.action === 'CLEAR_CACHE') {
    console.log('SW received CLEAR_CACHE, deleting all caches');
    caches.keys()
      .then(keys => Promise.all(keys.map(key => caches.delete(key))))
      .then(() => {
        console.log('All caches cleared; reloading clients');
        return self.clients.matchAll();
      })
      .then(clients => {
        clients.forEach(client => client.navigate(client.url));
      });
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