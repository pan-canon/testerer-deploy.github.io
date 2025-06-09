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
  let swReady = Promise.resolve();

  if ('serviceWorker' in navigator) {
    swReady = navigator.serviceWorker
      .register(`${BASE_PATH}/sw.js`)
      .then(registration => {
        console.log('✅ Service Worker registered with scope:', registration.scope);
      })
      .catch(err => {
        console.error('❌ SW registration failed:', err);
      });

    // When the new Service Worker takes control, reload once
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
      // Manually trigger activation of the new Service Worker
      function fullSWUpdate() {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
          console.log('🔄 Sent SKIP_WAITING to Service Worker');
        }
      }

      const updateBtn = document.getElementById('update-btn');
      if (updateBtn) {
        updateBtn.addEventListener('click', fullSWUpdate);
      }
    })
    .catch(err => {
      console.error('❌ Initialization failed:', err);
      if (loader) loader.style.display = 'none';
    });
});