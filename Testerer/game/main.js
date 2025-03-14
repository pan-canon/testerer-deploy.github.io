import { App } from './src/App.js';

// Wait until the DOM is fully loaded, then initialize the application.
document.addEventListener("DOMContentLoaded", async () => {
  // Create a new instance of the application.
  const app = new App();

  // Handle the beforeinstallprompt event for PWA installation.
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById("install-btn");
    if (installBtn) {
      installBtn.style.display = "block";
    }
  });

  // When the install button is clicked, prompt the user to install the PWA.
  const installBtn = document.getElementById("install-btn");
  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        installBtn.style.display = "none";
        deferredPrompt = null;
      }
    });
  }

  // Register the Service Worker if supported by the browser.
  if ('ServiceWorker' in navigator) {
    try {
      // Determine BASE_PATH based on the URL.
      const BASE_PATH = window.location.hostname.includes("github.io")
        ? "/testerer-deploy.github.io/Testerer/game"
        : "";
      const registration = await navigator.ServiceWorker.register(`${BASE_PATH}/sw.js`);
      console.log('✅ Service Worker registered with scope:', registration.scope);
    } catch (error) {
      console.error('❌ Error during Service Worker registration:', error);
    }
  }

  // Update mechanism: attach an event listener to the update button.
  // This calls the clearCache() method on the ViewManager, which should trigger a cache clear in the Service Worker.
  const updateBtn = document.getElementById("update-btn");
  if (updateBtn) {
    updateBtn.addEventListener("click", () => {
      console.log("Update button clicked.");
      app.viewManager.clearCache();
    });
  }
});

// Hide the preloader after all resources have loaded.
window.addEventListener("load", () => {
  const preloader = document.getElementById("preloader");
  if (preloader) {
    preloader.style.opacity = 1;
    const fadeEffect = setInterval(() => {
      if (preloader.style.opacity > 0) {
        preloader.style.opacity -= 0.1;
      } else {
        clearInterval(fadeEffect);
        preloader.style.display = "none";
      }
    }, 50);
  }
});