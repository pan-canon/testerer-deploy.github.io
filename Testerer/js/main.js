import { App } from './app.js';

// Ждем, пока DOM полностью загрузится, затем инициализируем приложение
document.addEventListener("DOMContentLoaded", async () => {
  // Создаем новый экземпляр приложения
  const app = new App();

  // Регистрируем сервис-воркер, если он поддерживается браузером
  if ('serviceWorker' in navigator) {
    try {
      // Определяем базовый путь в зависимости от URL
      // Если URL содержит "/Testerer/", то используем соответствующий BASE_PATH, иначе оставляем пустой
      const BASE_PATH = window.location.pathname.includes("/Testerer/") 
        ? "/testerer-deploy.github.io/Testerer"
        : "";

      // Регистрируем serviceWorker с указанным путем
      const registration = await navigator.serviceWorker.register(`${BASE_PATH}/serviceWorker.js`);
      console.log('✅ Service Worker зарегистрирован с областью:', registration.scope);
    } catch (error) {
      // Если произошла ошибка при регистрации, выводим ее в консоль
      console.error('❌ Ошибка при регистрации Service Worker:', error);
    }
  }
});