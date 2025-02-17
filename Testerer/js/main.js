import { App } from './app.js';

// Ждем, пока DOM полностью загрузится, затем инициализируем приложение
document.addEventListener("DOMContentLoaded", async () => {
  // Создаем новый экземпляр приложения
  const app = new App();

  // Обработка события beforeinstallprompt для PWA
  // Это событие срабатывает, когда браузер определяет, что сайт соответствует требованиям PWA
  // и может быть установлен на рабочий стол.
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    // Предотвращаем автоматическое появление нативного запроса установки
    e.preventDefault();
    // Сохраняем событие для последующего использования
    deferredPrompt = e;
    // Показываем кнопку установки приложения (убедитесь, что элемент с id "install-btn" присутствует в HTML)
    const installBtn = document.getElementById("install-btn");
    if (installBtn) {
      installBtn.style.display = "block";
    }
  });

  // Добавляем обработчик клика по кнопке установки
  const installBtn = document.getElementById("install-btn");
  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (deferredPrompt) {
        // Показываем prompt установки пользователю
        deferredPrompt.prompt();
        // Ждем, пока пользователь не сделает выбор
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        // После выбора скрываем кнопку установки
        installBtn.style.display = "none";
        // Сбрасываем сохраненное событие
        deferredPrompt = null;
      }
    });
  }

  // Регистрируем сервис-воркер, если он поддерживается браузером
  if ('serviceWorker' in navigator) {
    try {
      // Определяем базовый путь в зависимости от URL.
      // Если URL содержит "/Testerer/", то используем соответствующий BASE_PATH, иначе оставляем пустой.
      const BASE_PATH = window.location.pathname.includes("/Testerer/") 
        ? "/testerer-deploy.github.io/Testerer"
        : "";

      // Регистрируем сервис-воркер с указанным путем
      const registration = await navigator.serviceWorker.register(`${BASE_PATH}/serviceWorker.js`);
      console.log('✅ Service Worker зарегистрирован с областью:', registration.scope);
    } catch (error) {
      // Если произошла ошибка при регистрации, выводим её в консоль
      console.error('❌ Ошибка при регистрации Service Worker:', error);
    }
  }
});
