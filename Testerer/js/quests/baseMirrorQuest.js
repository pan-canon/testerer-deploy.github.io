import { BaseEvent } from '../events/baseEvent.js';
import { ImageUtils } from '../utils/imageUtils.js'; // Подключаем ImageUtils для работы с изображениями

/**
 * BaseMirrorQuest – базовый класс для зеркального квеста.
 * 
 * Инкапсулирует логику сравнения текущего кадра (через canvas → grayscale → pixel/histogram compare)
 * и управление циклом проверки состояния квеста, а также обновление UI, связанного с зеркальным квестом.
 * Теперь все, что специфично для зеркального квеста, находится в этом классе, что позволяет не «засорять»
 * общий переключатель камеры.
 */
export class BaseMirrorQuest extends BaseEvent {
  /**
   * @param {EventManager} eventManager - Менеджер дневника.
   * @param {App} appInstance - Основной объект приложения для доступа к данным и камере.
   * @param {Object} [config] - Дополнительная конфигурация (например, ID UI-элементов).
   */
  constructor(eventManager, appInstance, config = {}) {
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

    // Конфигурация UI-элементов, используемых в квесте
    this.statusElementId = config.statusElementId || "mirror-quest-status";
    this.shootButtonId = config.shootButtonId || "btn_shoot";

    this.registerEvents();
  }

  /**
   * registerEvents – регистрирует обработчики для UI элементов, если потребуется.
   * Здесь можно добавить обработку дополнительных событий, связанных с квестом.
   */
  registerEvents() {
    // Дополнительные обработчики можно добавить здесь
  }

  /**
   * activate – запускает зеркальный квест:
   * 1) Регистрирует событие в дневнике, если оно ещё не зарегистрировано.
   * 2) Устанавливает флаг mirrorQuestActive, сигнализируя, что квест активен.
   * Внешний код должен после успешного старта камеры вызвать startCheckLoop().
   */
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(Активируем событие: ${this.key});
      await this.eventManager.addDiaryEntry(this.key);
    }
    console.log("[BaseMirrorQuest] Зеркальный квест запущен.");
    localStorage.setItem("mirrorQuestActive", "true");
  }

  /**
   * startCheckLoop – запускает цикл проверки состояния квеста каждые 2 секунды.
   * Обновляет UI: статус в элементе с ID this.statusElementId и состояние кнопки "Заснять"
   * (элемент с ID this.shootButtonId) в зависимости от результата проверки.
   */
  startCheckLoop() {
    if (this.checkInterval) return;

    const statusDiv = document.getElementById(this.statusElementId);
    if (statusDiv) {
      statusDiv.style.display = "block";
      statusDiv.textContent = "Нет совпадения...";
    }

    const shootBtn = document.getElementById(this.shootButtonId);
    if (shootBtn) {
      shootBtn.style.display = "inline-block";
      shootBtn.disabled = true;
      // Обработчик кнопки "Заснять" срабатывает однократно для завершения квеста
      shootBtn.addEventListener("click", () => this.finish(), { once: true });
    }

    this.checkInterval = setInterval(async () => {
      const success = await this.checkStatus();
      if (statusDiv) {
        statusDiv.textContent = success ? "Вы перед зеркалом!" : "Нет совпадения...";
      }
      if (shootBtn) {
        shootBtn.disabled = !success;
      }
    }, 2000);
  }

  /**
   * stopCheckLoop – останавливает цикл проверки (интервал) и скрывает UI элементы, связанные с квестом.
   */
  stopCheckLoop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    const statusDiv = document.getElementById(this.statusElementId);
    if (statusDiv) {
      statusDiv.style.display = "none";
    }
    const shootBtn = document.getElementById(this.shootButtonId);
    if (shootBtn) {
      shootBtn.style.display = "none";
    }
  }

  /**
   * checkStatus – проверяет, находится ли игрок "перед зеркалом"
   * посредством сравнения текущего кадра с сохранёнными данными селфи.
   * @returns {boolean} true, если совпадение достаточно, иначе false.
   */
  async checkStatus() {
    console.log("[BaseMirrorQuest] checkStatus() -> compareFrameInternally()");
    return await this.compareFrameInternally();
  }

  /**
   * compareFrameInternally – захватывает текущий кадр с камеры, преобразует его в оттенки серого и сравнивает с сохранёнными данными селфи.
   * @returns {boolean} Результат сравнения (true, если сходство по пикселям и гистограмме выше порога).
   */
  async compareFrameInternally() {
    // Если нет сохранённого селфи, вернуть false
    if (!this.app.selfieData) {
      console.warn("[BaseMirrorQuest] ❌ Нет сохранённого селфи (app.selfieData)");
      return false;
    }

    // Проверяем, активна ли камера
    const videoEl = this.app.cameraSectionManager?.videoElement;
    if (!videoEl || !videoEl.srcObject) {
      console.warn("[BaseMirrorQuest] ❌ Камера не активна!");
      return false;
    }

    // Настраиваем размеры локальной канвы
    this.tempCanvas.width = videoEl.videoWidth || 640;
    this.tempCanvas.height = videoEl.videoHeight || 480;
    this.tempCtx.drawImage(videoEl, 0, 0, this.tempCanvas.width, this.tempCanvas.height);

    // Преобразуем полученный кадр в оттенки серого
    const currentFrameData = ImageUtils.convertToGrayscale(this.tempCanvas);

    // Выполняем сравнение по пикселям и гистограмме
    const matchPixel = ImageUtils.pixelWiseComparison(this.app.selfieData, currentFrameData);
    const matchHist = ImageUtils.histogramComparison(this.app.selfieData, currentFrameData);
    console.log([BaseMirrorQuest] pixel=${matchPixel.toFixed(2)}, hist=${matchHist.toFixed(2)});

    const success = (matchPixel > 0.6 && matchHist > 0.7);
    if (success) {
      // Сохраняем последний успешно сравнившийся кадр (для записи в дневник)
      this.app.lastMirrorPhoto = currentFrameData;
    }
    return success;
  }

  /**
   * finish – завершает зеркальный квест:
   * 1) Останавливает цикл проверки.
   * 2) Выполняет финальную проверку и логирует результат в дневник.
   * 3) Удаляет флаг mirrorQuestActive, обновляет состояние кнопки "Запостить" и убирает glow с камеры.
   */
  async finish() {
    if (this.finished) return;
    this.finished = true;

    this.stopCheckLoop();
    const success = await this.checkStatus();

    const ghost = this.app.ghostManager.getCurrentGhost();
    const randomLetter = this.getRandomLetter(ghost.name);

    if (success) {
      const photoData = this.app.lastMirrorPhoto
        ?  [photo attached]\n${this.app.lastMirrorPhoto}
        : "";
      await this.eventManager.addDiaryEntry(user_post_success: ${randomLetter}${photoData}, false);
      const statusDiv = document.getElementById(this.statusElementId);
      if (statusDiv) {
        statusDiv.textContent = "✅ Задание «подойти к зеркалу» выполнено!";
        setTimeout(() => statusDiv.style.display = "none", 2000);
      }
    } else {
      await this.eventManager.addDiaryEntry(user_post_failed: ${randomLetter}, false);
      const statusDiv = document.getElementById(this.statusElementId);
      if (statusDiv) {
        statusDiv.textContent = "❌ Квест проигнорирован!";
        setTimeout(() => statusDiv.style.display = "none", 2000);
      }
    }

    localStorage.removeItem("mirrorQuestActive");
    this.app.questManager.updatePostButtonState();

    // Убираем эффект подсветки с кнопки камеры
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
    return letters[Math.floor(Math.random() * letters.length)];
  }
}