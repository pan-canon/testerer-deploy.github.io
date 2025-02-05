import { App } from './app.js';

document.addEventListener("DOMContentLoaded", () => {
  const app = new App();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => console.log('Service Worker зарегистрирован:', registration.scope))
      .catch(error => console.error('Ошибка регистрации Service Worker:', error));
  }
});

// Инициализация приложения
document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  
  // Регистрация сервис-воркера
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./serviceWorker.js')
      .then(function(registration) {
         console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(function(error) {
         console.error('Service Worker registration failed:', error);
      });
  }
});