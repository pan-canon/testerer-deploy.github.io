import { BaseEvent } from '../events/baseEvent.js';

/**
 * BaseMirrorQuest – базовый класс для зеркального квеста.
 *
 * Этот класс:
 *  - Активируется (activate), устанавливая флаг mirrorQuestActive в localStorage
 *  - Запускает непрерывную проверку совпадения (startCheckLoop), 
 *    показывая блок статуса (#mirror-quest-status) и кнопку «Заснять» (#btn_shoot)
 *  - При достаточном совпадении кнопка «Заснять» разблокируется
 *  - По нажатию «Заснять» происходит finish() (либо через QuestManager),
 *    при этом проверка останавливается, UI скрывается, запись о квесте добавляется в дневник
 */
export class BaseMirrorQuest extends BaseEvent {
  /**
   * @param {EventManager} eventManager - Менеджер событий (работа с дневником)
   * @param {App} appInstance - Основной объект приложения (для compareCurrentFrame и прочего)
   */
  constructor(eventManager, appInstance) {
    super(eventManager); // если BaseEvent требует вызова super()

    this.app = appInstance;
    this.key = "mirror_quest";      // Уникальный ключ квеста
    this.doneKey = "mirror_done";   // Ключ для отметки завершённого квеста

    // Храним id интервала проверки, если нужно
    this.checkInterval = null;

    // Регистрируем события UI, если нужно
    this.registerEvents();
  }

  /**
   * registerEvents – регистрирует обработчики для элементов UI (по желанию).
   * Здесь можно навешивать клики на кнопку «Заснять», но зачастую
   * удобнее делать это внутри startCheckLoop(), когда квест точно запущен.
   */
  registerEvents() {
    // Пример: ничего не делаем, оставляем для расширения
  }

  /**
   * activate – активирует зеркальный квест:
   *  1) Добавляет запись "mirror_quest" в дневник (если её нет).
   *  2) Ставит флаг mirrorQuestActive в localStorage
   *  3) Запускает постоянную проверку (startCheckLoop)
   */
  async activate() {
    // Если событие ещё не логировали, логируем
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`Активируем событие: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key);
    }
    console.log("Зеркальный квест запущен по нажатию кнопки.");

    // Ставим флаг в localStorage
    localStorage.setItem("mirrorQuestActive", "true");

    // Запускаем постоянную проверку совпадения
    this.startCheckLoop();
  }

  /**
   * startCheckLoop – запускает постоянную проверку совпадения 
   * (каждые 2 секунды вызываем compareCurrentFrame),
   * обновляет текст статуса (#mirror-quest-status) и 
   * управляет кнопкой «Заснять» (#btn_shoot).
   */
  startCheckLoop() {
    // Если уже идёт, второй раз не запускаем
    if (this.checkInterval) return;

    // Показываем статус
    const statusDiv = document.getElementById("mirror-quest-status");
    if (statusDiv) {
      statusDiv.style.display = "block";
      statusDiv.textContent = "Нет совпадения..."; // начальное
    }

    // Показываем кнопку «Заснять», но отключаем
    const shootBtn = document.getElementById("btn_shoot");
    if (shootBtn) {
      shootBtn.style.display = "inline-block";
      shootBtn.disabled = true;

      // Если хотим, чтобы нажатие «Заснять» вызывало finish напрямую, 
      // можем тут навесить слушатель:
      shootBtn.addEventListener("click", () => {
        this.finish(); 
        // Если предпочитаете вызывать finish() через QuestManager,
        // можно вызывать: this.app.questManager.handleShootMirrorQuest();
      }, { once: true });
      // { once: true } если хотим снять обработчик сразу после первого клика
    }

    // Каждые 2с проверяем совпадение
    this.checkInterval = setInterval(async () => {
      const success = await this.app.compareCurrentFrame();

      // Меняем статус
      if (statusDiv) {
        statusDiv.textContent = success 
          ? "Вы перед зеркалом!" 
          : "Нет совпадения...";
      }

      // Кнопка «Заснять» активна при success
      if (shootBtn) {
        shootBtn.disabled = !success;
      }

    }, 2000);
  }

  /**
   * stopCheckLoop – останавливает постоянную проверку,
   * и скрывает/сбрасывает UI (статус и кнопку «Заснять»).
   */
  stopCheckLoop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // Прячем статус
    const statusDiv = document.getElementById("mirror-quest-status");
    if (statusDiv) {
      statusDiv.style.display = "none";
    }
    // Прячем кнопку «Заснять»
    const shootBtn = document.getElementById("btn_shoot");
    if (shootBtn) {
      shootBtn.style.display = "none";
      // Можно снять обработчик клика, если он не { once: true }
      // shootBtn.replaceWith(shootBtn.cloneNode(true)); // костыль, если нужно
    }
  }

  /**
   * checkStatus – «быстрая» проверка (без ожидания 5с),
   * вызывает this.app.compareCurrentFrame(), возвращает true/false.
   */
  async checkStatus() {
    console.log("🪞 Зеркальный квест активно. Запуск compareCurrentFrame...");
    const success = await this.app.compareCurrentFrame();
    console.log("Результат совпадения:", success);
    return success;
  }

  /**
   * finish – завершает зеркальный квест:
   *  1) Снова проверяет условие (this.checkStatus),
   *  2) Логирует успех или неудачу,
   *  3) Убирает флаг mirrorQuestActive,
   *  4) Вызывает stopCheckLoop() (гасит UI),
   *  5) Снимает glow-эффект с кнопки камеры (toggle-camera).
   */
  async finish() {
    // Останавливаем «бегущую» проверку
    this.stopCheckLoop();

    // Выполняем финальную проверку
    const success = await this.checkStatus();

    // Берём случайную букву из имени призрака (для дневника)
    const ghost = this.app.ghostManager.getCurrentGhost();
    const randomLetter = this.getRandomLetter(ghost.name);

    // Логируем успех / неудачу
    if (success) {
      const photoData = this.app.lastMirrorPhoto 
        ? ` [photo attached]\n${this.app.lastMirrorPhoto}`
        : "";
      await this.eventManager.addDiaryEntry(
        `user_post_success: ${randomLetter}${photoData}`, 
        false
      );
      alert("✅ Задание «подойти к зеркалу» выполнено!");
    } else {
      await this.eventManager.addDiaryEntry(
        `user_post_failed: ${randomLetter}`, 
        false
      );
      alert("❌ Квест проигнорирован!");
    }

    // Снимаем флаг активации из localStorage
    localStorage.removeItem("mirrorQuestActive");
    // Обновляем состояние кнопки "Запостить"
    this.app.updatePostButtonState();

    // Убираем glow-класс с кнопки камеры
    const cameraBtn = document.getElementById("toggle-camera");
    if (cameraBtn) {
      cameraBtn.classList.remove("glowing");
    }
  }

  /**
   * getRandomLetter – возвращает одну случайную букву из имени призрака.
   * Удаляем все символы, кроме латиницы/кириллицы, берём случайную.
   * @param {string} name - Имя призрака
   */
  getRandomLetter(name) {
    const letters = name.replace(/[^A-Za-zА-Яа-яЁё]/g, '').split('');
    if (letters.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * letters.length);
    return letters[randomIndex];
  }
}