import { App } from './app.js';

// Wait until the DOM is fully loaded, then initialize the application
document.addEventListener("DOMContentLoaded", async () => {
  // Create a new instance of the application
  const app = new App();

  // Handle the beforeinstallprompt event for PWA
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById("install-btn");
    if (installBtn) {
      installBtn.style.display = "block";
    }
  });

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

  // Register the service worker if supported by the browser
  if ('serviceWorker' in navigator) {
    try {
      // Determine BASE_PATH based on the URL.
      const BASE_PATH = window.location.pathname.includes("/Testerer/") 
        ? "/testerer-deploy.github.io/Testerer"
        : "";
      const registration = await navigator.serviceWorker.register(`${BASE_PATH}/serviceWorker.js`);
      console.log('✅ Service Worker registered with scope:', registration.scope);
    } catch (error) {
      console.error('❌ Error during Service Worker registration:', error);
    }
  }

  // Update mechanism: Attach event listener to the update button.
  // This now calls the clearCache() method from the ViewManager.
  const updateBtn = document.getElementById("update-btn");
  if (updateBtn) {
    updateBtn.addEventListener("click", () => {
      console.log("Update button clicked.");
      app.viewManager.clearCache();
    });
  }
});

// New load event handler that hides the preloader after all resources are loaded
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