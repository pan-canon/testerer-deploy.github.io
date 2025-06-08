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

  // Register the Service Worker first to ensure it can intercept asset requests
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(`${BASE_PATH}/sw.js`)
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);

        // Check for waiting Service Worker from previous sessions
        if (registration.waiting) {
          promptUserToUpdate();
        }

        // Listen for updates to Service Worker
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
      .then(() => {
        // Load external libraries sequentially, then initialize the App
        return Promise.all([
          loadScript(SQL_WASM_URL),
          loadScript(TFJS_URL),
          loadScript(COCO_SSD_URL)
        ]);
      })
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

        // Listen for messages from the Service Worker
        navigator.serviceWorker.addEventListener('message', event => {
          if (event.data?.type === 'NEW_VERSION_AVAILABLE') {
            promptUserToUpdate();
          }
        });

        // Reload page upon new Service Worker activation
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('New Service Worker activated; reloading page');
          window.location.reload();
        });

        // Helper: prompt user to update
        function promptUserToUpdate() {
          const message = '🔄 A new version of the game is available! Update now?';

          if (app.viewManager && typeof app.viewManager.showNotification === 'function') {
            app.viewManager.showNotification(message, {
              actionText: 'Update',
              onAction: () => {
                if (navigator.serviceWorker.controller) {
                  navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
                }
              }
            });
          } else if (confirm(message)) {
            if (navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
            }
          }
        }

        // Additional initialization logic here (if needed)
      })
      .catch(err => {
        console.error('Initialization failed:', err);
        if (loader) loader.style.display = 'none';
      });
  }
});