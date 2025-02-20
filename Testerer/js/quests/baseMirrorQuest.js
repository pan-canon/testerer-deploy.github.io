import { BaseEvent } from '../events/baseEvent.js';
import { ImageUtils } from '../utils/imageUtils.js'; // Подключаем ImageUtils для работы с изображениями

/**
 * BaseMirrorQuest – базовый класс для зеркального квеста.
 * 
 * Логику сравнения текущего кадра (через canvas → grayscale → pixel/histogram compare)
 * инкапсулируем здесь в методе compareFrameInternally(), чтобы не зависеть от App.
 * Также реализованы методы активации, постоянной проверки (startCheckLoop) и завершения квеста.
 */
export class BaseMirrorQuest extends BaseEvent {
  /**
   * @param {EventManager} eventManager - Менеджер дневника.
   * @param {App} appInstance - Основной объект приложения для доступа к данным и камере.
   */
  constructor(eventManager, appInstance) {
    super(eventManager);
    this.app = appInstance;
    this.key = "mirror_quest";
    this.doneKey = "mirror_done";

    // Интервал, используемый в методе startCheckLoop
    this.checkInterval = null;

    // Локальная канва и контекст для сравнения кадров (не зависят от app.tempCanvas)
    this.tempCanvas = document.createElement("canvas");
    this.tempCtx = this.tempCanvas.getContext("2d");

    // Флаг, предотвращающий повторное завершение квеста
    this.finished = false;

    this.registerEvents();
  }

  /**
   * registerEvents – регистрирует обработчики для UI элементов, если потребуется.
   * Сейчас оставляем пустым для будущего расширения.
   */
  registerEvents() {
    // Дополнительные обработчики можно добавить здесь
  }

  /**
   * activate – запускает зеркальный квест:
   *  1) Если событие ещё не зарегистрировано – логирует его.
   *  2) Устанавливает флаг mirrorQuestActive в localStorage.
   *  3) Запускает постоянную проверку (startCheckLoop).
   */
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`Активируем событие: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key);
    }
    console.log("[BaseMirrorQuest] Зеркальный квест запущен.");

    localStorage.setItem("mirrorQuestActive", "true");
    this.startCheckLoop();
  }

  /**
   * startCheckLoop – каждые 2 секунды:
   *  - Вызывает compareFrameInternally() для проверки условия "перед зеркалом".
   *  - Обновляет текст статуса в #mirror-quest-status.
   *  - Разблокирует кнопку "Заснять" (btn_shoot), если условие выполнено.
   * Обработчик нажатия на "Заснять" навешивается один раз с { once: true }.
   */
  startCheckLoop() {
    if (this.checkInterval) return;

    const statusDiv = document.getElementById("mirror-quest-status");
    if (statusDiv) {
      statusDiv.style.display = "block";
      statusDiv.textContent = "Нет совпадения...";
    }

    const shootBtn = document.getElementById("btn_shoot");
    if (shootBtn) {
      shootBtn.style.display = "inline-block";
      shootBtn.disabled = true;
      // Навешиваем обработчик на кнопку "Заснять" (однократно)
      shootBtn.addEventListener("click", () => this.finish(), { once: true });
    }

    this.checkInterval = setInterval(async () => {
      const success = await this.checkStatus();
      if (statusDiv) {
        statusDiv.textContent = success 
          ? "Вы перед зеркалом!" 
          : "Нет совпадения...";
      }
      if (shootBtn) {
        shootBtn.disabled = !success;
      }
    }, 2000);
  }

  /**
   * stopCheckLoop – останавливает проверку (интервал) и скрывает UI элементы квеста.
   */
  stopCheckLoop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    const statusDiv = document.getElementById("mirror-quest-status");
    if (statusDiv) {
      statusDiv.style.display = "none";
    }
    const shootBtn = document.getElementById("btn_shoot");
    if (shootBtn) {
      shootBtn.style.display = "none";
    }
  }

  /**
   * checkStatus – проверяет, находится ли игрок "перед зеркалом" посредством
   * сравнения текущего кадра с сохранённым селфи. Использует compareFrameInternally().
   * @returns {boolean} true, если совпадение достаточно, иначе false.
   */
  async checkStatus() {
    console.log("[BaseMirrorQuest] checkStatus() -> compareFrameInternally()");
    const success = await this.compareFrameInternally();
    return success;
  }

  /**
   * compareFrameInternally – рисует текущий кадр из камеры на локальную канву,
   * преобразует его в оттенки серого и сравнивает с сохранёнными данными селфи.
   * Возвращает true, если сходство по пикселям и гистограмме выше порога.
   * @returns {boolean}
   */
  async compareFrameInternally() {
    // 1) Если нет сохранённого селфи, вернуть false
    if (!this.app.selfieData) {
      console.warn("[BaseMirrorQuest] ❌ Нет сохранённого селфи (app.selfieData)");
      return false;
    }

    // 2) Проверяем, активна ли камера
    const videoEl = this.app.cameraSectionManager?.videoElement;
    if (!videoEl || !videoEl.srcObject) {
      console.warn("[BaseMirrorQuest] ❌ Камера не активна!");
      return false;
    }

    // 3) Настраиваем размеры локальной канвы
    this.tempCanvas.width = videoEl.videoWidth || 640;
    this.tempCanvas.height = videoEl.videoHeight || 480;
    this.tempCtx.drawImage(videoEl, 0, 0, this.tempCanvas.width, this.tempCanvas.height);

    // 4) Преобразуем полученный кадр в оттенки серого
    const currentFrameData = ImageUtils.convertToGrayscale(this.tempCanvas);

    // 5) Выполняем пиксельное и гистограммное сравнение с сохранёнными данными селфи
    const matchPixel = ImageUtils.pixelWiseComparison(this.app.selfieData, currentFrameData);
    const matchHist = ImageUtils.histogramComparison(this.app.selfieData, currentFrameData);
    console.log(`[BaseMirrorQuest] pixel=${matchPixel.toFixed(2)}, hist=${matchHist.toFixed(2)}`);

    const success = (matchPixel > 0.6 && matchHist > 0.7);
    if (success) {
      // Сохраняем последний успешно сравнившийся кадр (для записи в дневник)
      this.app.lastMirrorPhoto = currentFrameData;
    }
    return success;
  }

  /**
   * finish – завершает зеркальный квест:
   *  1) Останавливаем проверку (stopCheckLoop).
   *  2) Выполняем финальную проверку с помощью checkStatus().
   *  3) Логируем результат в дневник (успех или неудача).
   *  4) Удаляем флаг mirrorQuestActive, обновляем состояние кнопки "Запостить" и снимаем glow с камеры.
   */
  async finish() {
    // Если квест уже завершён, выходим (чтобы избежать дублирования)
    if (this.finished) return;
    this.finished = true;

    this.stopCheckLoop();
    const success = await this.checkStatus();

    // Получаем текущего призрака и случайную букву из его имени
    const ghost = this.app.ghostManager.getCurrentGhost();
    const randomLetter = this.getRandomLetter(ghost.name);

    // Логирование результата в дневник
    if (success) {
      const photoData = this.app.lastMirrorPhoto
        ? ` [photo attached]\n${this.app.lastMirrorPhoto}`
        : "";
      await this.eventManager.addDiaryEntry(`user_post_success: ${randomLetter}${photoData}`, false);
      // Вместо alert() обновляем статус уведомления (и можно скрыть его через 2с)
      const statusDiv = document.getElementById("mirror-quest-status");
      if (statusDiv) {
        statusDiv.textContent = "✅ Задание «подойти к зеркалу» выполнено!";
        setTimeout(() => statusDiv.style.display = "none", 2000);
      }
    } else {
      await this.eventManager.addDiaryEntry(`user_post_failed: ${randomLetter}`, false);
      const statusDiv = document.getElementById("mirror-quest-status");
      if (statusDiv) {
        statusDiv.textContent = "❌ Квест проигнорирован!";
        setTimeout(() => statusDiv.style.display = "none", 2000);
      }
    }

    localStorage.removeItem("mirrorQuestActive");
    this.app.questManager.updatePostButtonState();

    // Снимаем glow с кнопки камеры
    const cameraBtn = document.getElementById("toggle-camera");
    if (cameraBtn) {
      cameraBtn.classList.remove("glowing");
    }
  }

  /**
   * getRandomLetter – возвращает случайную букву из имени призрака,
   * удаляя из строки все символы, кроме латинских и кириллических.
   * @param {string} name - Имя призрака.
   * @returns {string} Случайная буква или пустая строка, если буквы не найдены.
   */
  getRandomLetter(name) {
    const letters = name.replace(/[^A-Za-zА-Яа-яЁё]/g, '').split('');
    if (!letters.length) return '';
    const idx = Math.floor(Math.random() * letters.length);
    return letters[idx];
  }
}