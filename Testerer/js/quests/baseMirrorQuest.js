import { BaseEvent } from '../events/baseEvent.js';
import { ImageUtils } from '../utils/imageUtils.js'; // убедитесь, что у вас есть путь к ImageUtils

/**
 * BaseMirrorQuest – базовый класс для зеркального квеста.
 * 
 * Логику сравнения кадра (canvas → grayscale → pixel/histogram compare)
 * мы инкапсулируем здесь (compareFrameInternally), чтобы не вызывать
 * this.app.compareCurrentFrame(), которого может не быть в App.
 */
export class BaseMirrorQuest extends BaseEvent {
  /**
   * @param {EventManager} eventManager - Менеджер дневника
   * @param {App} appInstance - Основной объект приложения (app), для доступа к
   *                            ghostManager, selfieData, cameraSectionManager и т.д.
   */
  constructor(eventManager, appInstance) {
    super(eventManager);
    this.app = appInstance;
    this.key = "mirror_quest";
    this.doneKey = "mirror_done";

    // Интервал, который крутит "startCheckLoop()"
    this.checkInterval = null;

    // Локальный canvas/ctx для сравнения кадров (чтобы не зависеть от app.tempCanvas)
    this.tempCanvas = document.createElement("canvas");
    this.tempCtx    = this.tempCanvas.getContext("2d");

    this.registerEvents();
  }

  registerEvents() {
    // Пустой; можно расширять для доп. кнопок UI
  }

  /**
   * activate – вызывается при старте квеста:
   *  - Логируем "mirror_quest" в дневнике (если ещё не было),
   *  - Ставим mirrorQuestActive = true,
   *  - Запускаем startCheckLoop() (проверку каждые 2с).
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
   * startCheckLoop – каждые 2с вызываем checkStatus(),
   * отображаем статус "Вы перед зеркалом!" или "Нет совпадения...",
   * разблокируем #btn_shoot при success = true.
   */
  startCheckLoop() {
    if (this.checkInterval) return;

    // Показываем статус
    const statusDiv = document.getElementById("mirror-quest-status");
    if (statusDiv) {
      statusDiv.style.display = "block";
      statusDiv.textContent = "Нет совпадения...";
    }

    // Показываем «Заснять»
    const shootBtn = document.getElementById("btn_shoot");
    if (shootBtn) {
      shootBtn.style.display = "inline-block";
      shootBtn.disabled = true; // изначально выключено

      // Навешиваем однократный клик => finish()
      shootBtn.addEventListener("click", () => this.finish(), { once: true });
    }

    // Интервал каждые 2с
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
   * stopCheckLoop – останавливаем интервал, скрываем статус и кнопку «Заснять».
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
   * checkStatus – проверяет условие «перед зеркалом»:
   *  вызывает compareFrameInternally(), возвращает true/false.
   */
  async checkStatus() {
    console.log("[BaseMirrorQuest] checkStatus() -> compareFrameInternally()");
    const success = await this.compareFrameInternally();
    return success;
  }

  /**
   * compareFrameInternally – рисует текущий кадр из камеры,
   * сравнивает с selfieData, возвращает bool.
   */
  async compareFrameInternally() {
    // 1) Проверяем, есть ли селфи
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

    // 3) Рисуем кадр на tempCanvas
    this.tempCanvas.width  = videoEl.videoWidth  || 640;
    this.tempCanvas.height = videoEl.videoHeight || 480;
    this.tempCtx.drawImage(videoEl, 0, 0, this.tempCanvas.width, this.tempCanvas.height);

    // 4) Преобразуем в grayscale
    const currentFrameData = ImageUtils.convertToGrayscale(this.tempCanvas);

    // 5) Сравниваем с selfieData
    const matchPixel = ImageUtils.pixelWiseComparison(this.app.selfieData, currentFrameData);
    const matchHist  = ImageUtils.histogramComparison(this.app.selfieData, currentFrameData);
    console.log(`[BaseMirrorQuest] pixel=${matchPixel.toFixed(2)}, hist=${matchHist.toFixed(2)}`);

    const success = (matchPixel > 0.6 && matchHist > 0.7);
    if (success) {
      // Если хотим сохранить "lastMirrorPhoto"
      this.app.lastMirrorPhoto = currentFrameData;
    }
    return success;
  }

  /**
   * finish – завершаем квест (по нажатию «Заснять» или при success):
   *  1) stopCheckLoop()
   *  2) final checkStatus()
   *  3) log success/fail
   *  4) clear mirrorQuestActive, remove glow
   *  5) updatePostButtonState (если нужно)
   */
  async finish() {
    this.stopCheckLoop();

    const success = await this.checkStatus();

    // Берём призрака и случайную букву
    const ghost = this.app.ghostManager.getCurrentGhost();
    const randomLetter = this.getRandomLetter(ghost.name);

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

    // Очищаем mirrorQuestActive
    localStorage.removeItem("mirrorQuestActive");

    // Обновляем кнопку "Запостить" (если логика требует)
    this.app.questManager.updatePostButtonState();

    // Снимаем glow с toggle-camera
    const cameraBtn = document.getElementById("toggle-camera");
    if (cameraBtn) {
      cameraBtn.classList.remove("glowing");
    }
  }

  /**
   * getRandomLetter – берёт случайную букву (кириллица/латиница) из имени призрака.
   */
  getRandomLetter(name) {
    const letters = name.replace(/[^A-Za-zА-Яа-яЁё]/g, '').split('');
    if (!letters.length) return '';
    const idx = Math.floor(Math.random() * letters.length);
    return letters[idx];
  }
}