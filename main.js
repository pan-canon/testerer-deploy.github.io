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

// Load external libraries in sequence before initializing the app
Promise.all([
  loadScript(SQL_WASM_URL),
  loadScript(TFJS_URL),
  loadScript(COCO_SSD_URL)
])
  .then(() => {
    console.log('All external libraries loaded');

    document.addEventListener('DOMContentLoaded', () => {
      const app = new App();

      // ----------------------------------------
      // PWA: beforeinstallprompt handling
      // ----------------------------------------
      let deferredPrompt;
      window.addEventListener('beforeinstallprompt', event => {
        // Prevent the mini-infobar from appearing on mobile
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
          if (!deferredPrompt) {
            return;
          }
          // Show the install prompt
          deferredPrompt.prompt();
          // Wait for the user's response
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`User response to the install prompt: ${outcome}`);
          // Hide the install button after prompt
          installBtn.style.display = 'none';
          deferredPrompt = null;
        });
      }

      // ----------------------------------------
      // PWA: Service Worker registration & update prompt
      // ----------------------------------------
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register(`${BASE_PATH}/sw.js`)
          .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);

            // 1) If there's already a waiting Service Worker from a previous session, prompt update
            if (registration.waiting) {
              promptUserToUpdate();
            }

            // 2) Listen for new SW installations
            registration.addEventListener('updatefound', () => {
              const newSW = registration.installing;
              newSW.addEventListener('statechange', () => {
                // When the new SW is installed and there is an active controller, prompt update
                if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
                  promptUserToUpdate();
                }
              });
            });
          })
          .catch(err => console.error('Service Worker registration error:', err));

        // Listen for messages from the Service Worker (e.g., NEW_VERSION_AVAILABLE)
        navigator.serviceWorker.addEventListener('message', event => {
          if (event.data?.type === 'NEW_VERSION_AVAILABLE') {
            promptUserToUpdate();
          }
        });

        // Reload the page when the new Service Worker activates
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('New Service Worker activated; reloading page');
          window.location.reload();
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

      // ----------------------------------------
      // Helper: show update notification and handle user action
      // ----------------------------------------
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
        } else {
          // Fallback to native confirm dialog if viewManager is unavailable
          if (confirm(message)) {
            if (navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
            }
          }
        }
      }

      // ... any additional application initialization logic can go here ...
    });
  })
  .catch(err => console.error('Loader error:', err));