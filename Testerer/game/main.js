import { BASE_PATH, SQL_WASM_URL, TFJS_URL, COCO_SSD_URL } from './src/config/paths.js';
import { App } from './src/App.js';

// Function to dynamically load a script and return a Promise
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src     = src;
    script.async   = false;           // preserve execution order
    script.onload  = () => resolve(src);
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

// 1. Load SQL.js, TF.js and COCO-SSD in sequence before doing anything else
Promise.all([
  loadScript(SQL_WASM_URL),
  loadScript(TFJS_URL),
  loadScript(COCO_SSD_URL)
])
  .then(() => {
    console.log('All external libraries loaded');

    // 2. Wait for DOM, then initialize App and PWA logic
    document.addEventListener('DOMContentLoaded', () => {
      const app = new App();

      // PWA installation prompt handling
      let deferredPrompt;
      window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferredPrompt = e;
        const btn = document.getElementById('install-btn');
        if (btn) btn.style.display = 'block';
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

      // 3. Service Worker registration with auto-update hooks
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register(`${BASE_PATH}/sw.js`, { type: 'module' })
          .then(reg => {
            console.log('Service Worker registered with scope:', reg.scope);

            // If there's an update ready, tell it to skip waiting
            if (reg.waiting) {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }

            // Listen for new SW installations
            reg.addEventListener('updatefound', () => {
              const newSW = reg.installing;
              newSW.addEventListener('statechange', () => {
                if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
                  newSW.postMessage({ type: 'SKIP_WAITING' });
                }
              });
            });
          })
          .catch(err => console.error('Error during Service Worker registration:', err));

        // When the new SW takes control, reload the page
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('New Service Worker activated, reloading page');
          window.location.reload();
        });
      }

      // 4. “Update” button clears caches via SW message
      const updateBtn = document.getElementById('update-btn');
      if (updateBtn) {
        updateBtn.addEventListener('click', () => {
          console.log('Update button clicked; clearing caches');
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ action: 'CLEAR_CACHE' });
          }
        });
      }
    });
  })
  .catch(err => console.error('Loader error:', err));

// 5. Preloader fade-out after full load
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;
  preloader.style.opacity = '1';
  const fade = setInterval(() => {
    const current = parseFloat(preloader.style.opacity);
    if (current > 0) {
      preloader.style.opacity = (current - 0.1).toString();
    } else {
      clearInterval(fade);
      preloader.style.display = 'none';
    }
  }, 50);
});