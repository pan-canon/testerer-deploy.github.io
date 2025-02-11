import { App } from './app.js';

document.addEventListener("DOMContentLoaded", async () => {
  const app = new App();

/*  // Регистрация сервис-воркера (без дублирования)
  if ('serviceWorker' in navigator) {
    try {
      const BASE_PATH = window.location.pathname.includes("/Testerer/") 
        ? "/testerer-deploy.github.io/Testerer"
        : "";
      const registration = await navigator.serviceWorker.register(`${BASE_PATH}/serviceWorker.js`);
      console.log('✅ Service Worker зарегистрирован с областью:', registration.scope);
    } catch (error) {
      console.error('❌ Ошибка при регистрации Service Worker:', error);
    }
  }*/
});