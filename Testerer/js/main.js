import { App } from './app.js';

// Wait until the DOM is fully loaded, then initialize the application
document.addEventListener("DOMContentLoaded", async () => {
  // Create a new instance of the application
  const app = new App();

  // Handle the beforeinstallprompt event for PWA
  // This event fires when the browser detects that the site meets PWA requirements
  // and can be installed on the desktop.
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the native install prompt from showing automatically
    e.preventDefault();
    // Save the event for later use
    deferredPrompt = e;
    // Show the install button (ensure that an element with id "install-btn" exists in HTML)
    const installBtn = document.getElementById("install-btn");
    if (installBtn) {
      installBtn.style.display = "block";
    }
  });

  // Add a click event handler for the install button
  const installBtn = document.getElementById("install-btn");
  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (deferredPrompt) {
        // Show the install prompt to the user
        deferredPrompt.prompt();
        // Wait for the user's choice
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        // Hide the install button after the choice is made
        installBtn.style.display = "none";
        // Reset the saved event
        deferredPrompt = null;
      }
    });
  }

  // Register the service worker if supported by the browser
  if ('serviceWorker' in navigator) {
    try {
      // Determine the base path depending on the URL.
      // If the URL contains "/Testerer/", use the corresponding BASE_PATH, otherwise leave it empty.
      const BASE_PATH = window.location.pathname.includes("/Testerer/") 
        ? "/testerer-deploy.github.io/Testerer"
        : "";

      // Register the service worker with the specified path
      const registration = await navigator.serviceWorker.register(`${BASE_PATH}/serviceWorker.js`);
      console.log('✅ Service Worker registered with scope:', registration.scope);
    } catch (error) {
      // Log any errors during service worker registration
      console.error('❌ Error during Service Worker registration:', error);
    }
  }
});

// New load event handler that hides the preloader after all resources are loaded
window.addEventListener("load", () => {
  // Get the preloader element from the DOM (ensure there is an element with id="preloader" in your index.html)
  const preloader = document.getElementById("preloader");
  if (preloader) {
    // Gradually decrease the preloader's opacity for a smooth effect
    preloader.style.opacity = 1;
    const fadeEffect = setInterval(() => {
      if (preloader.style.opacity > 0) {
        preloader.style.opacity -= 0.1;
      } else {
        // Once opacity reaches 0, clear the interval and hide the preloader
        clearInterval(fadeEffect);
        preloader.style.display = "none";
      }
    }, 50); // 50ms interval for a smooth fade effect
  }
});