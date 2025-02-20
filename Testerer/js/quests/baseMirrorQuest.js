import { BaseEvent } from '../events/baseEvent.js';

/**
 * BaseMirrorQuest – базовый класс для зеркального квеста.
 *
 * Этот класс реализует общую логику для квеста с зеркалом:
 * - Активация квеста (запись в дневнике и установка флага активации).
 * - Проверка статуса квеста через сравнение текущего кадра.
 * - Завершение квеста: добавление результатов (успех/неудача) в дневник, обновление состояния интерфейса.
 *
 * Класс интегрирован с EventManager для регистрации событий и с основным приложением (App)
 * для доступа к функциям, таким как compareCurrentFrame() и управление визуальными эффектами.
 */
export class BaseMirrorQuest {
  /**
   * Конструктор BaseMirrorQuest.
   * @param {EventManager} eventManager - Менеджер событий, отвечающий за работу с дневником.
   * @param {App} appInstance - Основной объект приложения для доступа к функциям камеры и другим модулям.
   */
  constructor(eventManager, appInstance) {
    // Сохраняем ссылку на менеджер событий.
    this.eventManager = eventManager;
    // Сохраняем ссылку на приложение.
    this.app = appInstance;
    // Уникальный ключ квеста с зеркалом, который используется для регистрации события в дневнике.
    this.key = "mirror_quest";
    // Ключ, который будет использоваться для регистрации записи о завершении квеста.
    this.doneKey = "mirror_done";

    // Регистрируем обработчики для дополнительных действий (если потребуется в будущем).
    // Сейчас метод registerEvents() пуст, но может быть расширен.
    this.registerEvents();
  }

  /**
   * registerEvents – регистрирует события для действий с элементами интерфейса.
   * В текущей реализации метод оставлен пустым, но предназначен для дальнейшего расширения.
   */
  registerEvents() {
    // Здесь можно добавить обработчики событий, если потребуется,
    // например, для кнопок внутри экрана квеста.
  }

  /**
   * activate – активирует зеркальный квест.
   *
   * Если событие с ключом mirror_quest еще не зарегистрировано в дневнике,
   * добавляет запись с этим ключом. Затем устанавливает флаг активации квеста
   * (mirrorQuestActive) в localStorage и запускает визуальный эффект.
   *
   * @returns {Promise<void>} Асинхронное выполнение метода.
   */
  async activate() {
    // Проверяем, зарегистрировано ли уже событие в дневнике.
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`Активируем событие: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key);
    }
    console.log("Зеркальный квест запущен по нажатию кнопки.");
    
    // Устанавливаем флаг, который сигнализирует о том, что зеркальный квест активен.
    localStorage.setItem("mirrorQuestActive", "true");
  }

  /**
   * checkStatus – проверяет статус зеркального квеста.
   *
   * Этот метод ждет 5 секунд (например, давая время на подготовку),
   * затем запускает сравнение текущего кадра с сохраненным селфи через метод compareCurrentFrame().
   *
   * @returns {Promise<boolean>} Результат сравнения: true, если условия выполнены, иначе false.
   */
  async checkStatus() {
    console.log("🪞 Зеркальный квест активно. Запускаем проверку...");
    console.log("⏱ Запуск сравнения текущего кадра (без задержки)...");
    const success = await this.app.compareCurrentFrame();
    console.log("⏱ Результат сравнения:", success);
    return success;
  }

// Внутри QuestManager
handleShootMirrorQuest() {
  // Завершаем зеркальный квест
  this.checkQuest("mirror_quest")
    .then(() => {
      // По завершении квеста – убираем UI
      // Останавливаем интервал, если он идёт
      clearInterval(this.app.mirrorCheckInterval);
      this.app.mirrorCheckInterval = null;

      // Прячем статус
      const statusDiv = document.getElementById("camera-status");
      if (statusDiv) {
        statusDiv.style.display = "none";
      }

      // Прячем кнопку
      const shootBtn = document.getElementById("btn_shoot");
      if (shootBtn) {
        shootBtn.style.display = "none";
      }
    })
    .catch(err => console.error(err));
}


  /**
   * finish – завершает зеркальный квест.
   *
   * Метод выполняет следующие шаги:
   * 1. Проверяет статус квеста (через checkStatus).
   * 2. Получает текущего призрака и выбирает случайную букву из его имени.
   * 3. Если квест выполнен, добавляет запись о успехе в дневник (с фото, если доступно),
   *    иначе – добавляет запись о неудаче.
   * 4. Удаляет флаг активации квеста (mirrorQuestActive) и обновляет состояние интерфейса.
   *
   * @returns {Promise<void>}
   */
  async finish() {
    // Выполняем проверку условий квеста.
    const success = await this.checkStatus();
    // Получаем текущего призрака и случайную букву из его имени.
    const ghost = this.app.ghostManager.getCurrentGhost();
    const randomLetter = this.getRandomLetter(ghost.name);

    if (success) {
      // Формируем строку с данными фото, если оно доступно.
      const photoData = this.app.lastMirrorPhoto ? ` [photo attached]\n${this.app.lastMirrorPhoto}` : "";
      // Добавляем запись о выполнении квеста в дневник, с результатом (буква и, возможно, фото).
      await this.eventManager.addDiaryEntry(`user_post_success: ${randomLetter}${photoData}`, false);
      alert("✅ Задание «подойти к зеркалу» выполнено!");
    } else {
      // Добавляем запись о неудачном выполнении квеста.
      await this.eventManager.addDiaryEntry(`user_post_failed: ${randomLetter}`, false);
      alert("❌ Квест проигнорирован!");
    }

    // Удаляем флаг активации квеста, чтобы интерфейс обновился.
    localStorage.removeItem("mirrorQuestActive");
    this.app.updatePostButtonState();

    // Убираем визуальный эффект (удаляем класс "glowing" с кнопки камеры).
    const cameraBtn = document.getElementById("toggle-camera");
    if (cameraBtn) {
      cameraBtn.classList.remove("glowing");
    }
  }

  /**
   * getRandomLetter – возвращает случайную букву из строки.
   *
   * Метод очищает строку от символов, отличных от букв (латинских и кириллических),
   * и возвращает случайный символ из оставшегося набора.
   *
   * @param {string} name - Строка, из которой выбирается буква.
   * @returns {string} Случайная буква или пустая строка, если буквы не найдены.
   */
  getRandomLetter(name) {
    // Удаляем все символы, кроме букв.
    const letters = name.replace(/[^A-Za-zА-Яа-яЁё]/g, '').split('');
    if (letters.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * letters.length);
    return letters[randomIndex];
  }
}