// src/main.js

import { BASE_PATH, SQL_WASM_URL, TFJS_URL, COCO_SSD_URL } from './config/paths.js';
import { App } from './App.js';

/**
 * Dynamically load an external script by injecting a <script> tag.
 * Returns a Promise that resolves when the script has loaded,
 * or rejects if it fails to load.
 *
 * @param {string} src - URL of the script to load
 * @returns {Promise<string>}
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src     = src;
    script.async   = false; // preserve execution order
    script.onload  = () => resolve(src);
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Show a loader/spinner while the app is initializing
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'block';

  // ─── SERVICE WORKER REGISTRATION ───────────────────────────────────────────
  // Register the Service Worker as soon as possible, but do not block app loading.
  let swReady = Promise.resolve();

  if ('serviceWorker' in navigator) {
    swReady = navigator.serviceWorker
      .register(`${BASE_PATH}/sw.js`)
      .then(registration => {
        console.log('✅ Service Worker registered with scope:', registration.scope);

        // If an update is already waiting, prompt the user immediately.
        if (registration.waiting) {
          promptUserToUpdate();
        }

        // Listen for updatefound → new installing SW → statechange to 'installed'
        registration.addEventListener('updatefound', () => {
          const newSW = registration.installing;
          newSW.addEventListener('statechange', () => {
            if (
              newSW.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // A new SW has been installed and will activate on next reload
              promptUserToUpdate();
            }
          });
        });

        // Wait until the SW is active
        return navigator.serviceWorker.ready;
      })
      .catch(err => {
        console.error('❌ SW registration failed:', err);
        // Continue without SW
      });

    // Listen for messages from the Service Worker (e.g. 'NEW_VERSION_AVAILABLE')
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data?.type === 'NEW_VERSION_AVAILABLE') {
        promptUserToUpdate();
      }
    });

    // On controller change (new SW took over), reload the page to use the new version
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 New Service Worker activated; reloading page');
      window.location.reload();
    });
  }

  // ─── LOAD EXTERNAL LIBRARIES & INITIALIZE APP ──────────────────────────────
  // Wait for SW registration (or its failure) and all external scripts.
  Promise.all([
    swReady,
    loadScript(SQL_WASM_URL),
    loadScript(TFJS_URL),
    loadScript(COCO_SSD_URL),
  ])
    .then(() => {
      console.log('⚙️  All external libraries loaded');

      // Instantiate and start the main application
      const app = new App();

      // Hide the loader/spinner once initialization is complete
      if (loader) loader.style.display = 'none';

      // ─── PWA: BEFOREINSTALLPROMPT HANDLING ────────────────────────────────
      let deferredPrompt = null;
      window.addEventListener('beforeinstallprompt', event => {
        event.preventDefault();
        deferredPrompt = event;
        const installBtn = document.getElementById('install-btn');
        if (installBtn) installBtn.style.display = 'block';
      });

      const installBtn = document.getElementById('install-btn');
      if (installBtn) {
        installBtn.addEventListener('click', async () => {
          if (!deferredPrompt) return;
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`User response to install prompt: ${outcome}`);
          installBtn.style.display = 'none';
          deferredPrompt = null;
        });
      }

      // ─── PROFILE UPDATE BUTTON ──────────────────────────────────────────────
      // Sends a message to the SW to clear its caches, then reloads.
      const updateBtn = document.getElementById('update-btn');
      if (updateBtn) {
        updateBtn.addEventListener('click', () => {
          console.log('🔄 Update button clicked; instructing SW to clear cache');
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'CLEAR_CACHE',
            });
          }
        });
      }

      /**
       * Show a UI prompt to the user indicating a new version is available.
       * If accepted, send 'SKIP_WAITING' to the Service Worker to immediately activate.
       */
      function promptUserToUpdate() {
        const message = '🔄 A new version is available! Update now?';

        // If the App has a viewManager that supports notifications:
        if (
          app.viewManager &&
          typeof app.viewManager.showNotification === 'function'
        ) {
          app.viewManager.showNotification(message, {
            actionText: 'Update',
            onAction: () => {
              if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                  type: 'SKIP_WAITING',
                });
              }
            },
          });
        }
        // Fallback to the built-in confirm dialog:
        else if (confirm(message)) {
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'SKIP_WAITING',
            });
          }
        }
      }

      // Further app-specific initialization can go here...
    })
    .catch(err => {
      console.error('❌ Initialization failed:', err);
      if (loader) loader.style.display = 'none';
    });
});