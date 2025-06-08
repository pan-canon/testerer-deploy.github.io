// main.js

import { BASE_PATH, SQL_WASM_URL, TFJS_URL, COCO_SSD_URL } from './src/config/paths.js';
import { App } from './src/App.js';

/**
 * Dynamically load a script and return a Promise that resolves when it's loaded.
 * Ensures execution order by setting async = false.
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src     = src;
    script.async   = false;
    script.onload  = () => resolve(src);
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

// ----------------------------------------
// Application loading logic
// ----------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Immediately render visual loader/spinner
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'block';

  // ▶️ SERVICE WORKER REGISTRATION (does NOT block app initialization)
  // We try to register SW in parallel, but we catch errors so that SW failure
  // won't prevent the game from loading.
  let swReady = Promise.resolve();

  if ('serviceWorker' in navigator) {
    swReady = navigator.serviceWorker.register(`${BASE_PATH}/sw.js`)
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);

        // If there's already a waiting SW, prompt user to update
        if (registration.waiting) {
          promptUserToUpdate();
        }

        // Listen for new SW being installed
        registration.addEventListener('updatefound', () => {
          const newSW = registration.installing;
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              promptUserToUpdate();
            }
          });
        });

        return navigator.serviceWorker.ready;
      })
      .catch(err => {
        console.warn('Service Worker registration failed, continuing without it:', err);
        // Continue without SW
      });

    // Listen for runtime messages from SW
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data?.type === 'NEW_VERSION_AVAILABLE') {
        promptUserToUpdate();
      }
    });

    // Reload page upon new SW activation
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('New Service Worker activated; reloading page');
      window.location.reload();
    });
  }

  // ▶️ LOAD EXTERNAL LIBRARIES & INITIALIZE APP
  // Wait for both SW registration (success or silent failure) and library loads.
  Promise.all([
    swReady,
    loadScript(SQL_WASM_URL),
    loadScript(TFJS_URL),
    loadScript(COCO_SSD_URL)
  ])
    .then(() => {
      console.log('All external libraries loaded');

      // Initialize main application
      const app = new App();

      // Hide loader/spinner after initialization
      if (loader) loader.style.display = 'none';

      // ----------------------------------------
      // PWA: beforeinstallprompt handling
      // ----------------------------------------
      let deferredPrompt;
      window.addEventListener('beforeinstallprompt', event => {
        event.preventDefault();
        deferredPrompt = event;
        const installBtn = document.getElementById('install-btn');
        if (installBtn) {
          installBtn.style.display = 'block';
        }
      });

      const installBtn = document.getElementById('install-btn');
      if (installBtn) {
        installBtn.addEventListener('click', async () => {
          if (!deferredPrompt) return;
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`User response to the install prompt: ${outcome}`);
          installBtn.style.display = 'none';
          deferredPrompt = null;
        });
      }

      // ----------------------------------------
      // Profile “Update” button: clear caches via SW message
      // ----------------------------------------
      const updateBtn = document.getElementById('update-btn');
      if (updateBtn) {
        updateBtn.addEventListener('click', () => {
          console.log('Update button clicked; clearing caches');
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ action: 'CLEAR_CACHE' });
          }
        });
      }

      // Helper: prompt user to update when a new SW is waiting
      function promptUserToUpdate() {
        const message = '🔄 A new version of the game is available! Update now?';

        // If your App has a viewManager with notifications, use it:
        if (app.viewManager && typeof app.viewManager.showNotification === 'function') {
          app.viewManager.showNotification(message, {
            actionText: 'Update',
            onAction: () => {
              if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
              }
            }
          });
        }
        // Fallback to native confirm dialog
        else if (confirm(message)) {
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      }

      // Additional initialization logic here (if needed)
    })
    .catch(err => {
      // Initialization errors (e.g. failed to load a script)
      console.error('Initialization failed:', err);
      if (loader) loader.style.display = 'none';
    });
});