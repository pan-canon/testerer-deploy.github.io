import { BaseEvent } from '../events/baseEvent.js';
import { ImageUtils } from '../utils/imageUtils.js';

export class BaseMirrorQuest extends BaseEvent {
  constructor(eventManager, appInstance, config = {}) {
    super(eventManager);
    this.app     = appInstance;
    this.key     = config.key     || "mirror_quest";
    this.doneKey = config.doneKey || "mirror_done";

    this.statusElementId = config.statusElementId || "mirror-quest-status";
    this.shootButtonId   = config.shootButtonId   || "btn_shoot";

    this.checkInterval = null;
    this.finished      = false;

    this.tempCanvas = document.createElement("canvas");
    this.tempCtx    = this.tempCanvas.getContext("2d");
  }

  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`Активируем событие: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key);
    }
    console.log("[BaseMirrorQuest] Зеркальный квест запущен.");
    localStorage.setItem("mirrorQuestActive", "true");
  }

  startCheckLoop() {
    if (this.checkInterval) return;
    const statusDiv = document.getElementById(this.statusElementId);
    if (statusDiv) {
      statusDiv.style.display  = "block";
      statusDiv.textContent    = "Нет совпадения...";
    }
    const shootBtn = document.getElementById(this.shootButtonId);
    if (shootBtn) {
      shootBtn.style.display   = "inline-block";
      shootBtn.disabled        = true;
      shootBtn.addEventListener("click", () => this.finish(), { once: true });
    }

    // Каждые 2 секунды проверяем
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

  async checkStatus() {
    console.log("[BaseMirrorQuest] checkStatus() -> compareFrameInternally()");
    return await this.compareFrameInternally();
  }

  async compareFrameInternally() {
    if (!this.app.selfieData) return false;
    const videoEl = this.app.cameraSectionManager?.videoElement;
    if (!videoEl || !videoEl.srcObject) return false;

    this.tempCanvas.width  = videoEl.videoWidth  || 640;
    this.tempCanvas.height = videoEl.videoHeight || 480;
    this.tempCtx.drawImage(videoEl, 0, 0, this.tempCanvas.width, this.tempCanvas.height);

    const currentFrameData = ImageUtils.convertToGrayscale(this.tempCanvas);
    const matchPixel = ImageUtils.pixelWiseComparison(this.app.selfieData, currentFrameData);
    const matchHist  = ImageUtils.histogramComparison(this.app.selfieData, currentFrameData);
    console.log(`[BaseMirrorQuest] pixel=${matchPixel.toFixed(2)}, hist=${matchHist.toFixed(2)}`);

    return (matchPixel > 0.6 && matchHist > 0.7);
  }

  /**
   * finish – по завершении зеркального квеста:
   *  1) Логируем успех/неуспех,
   *  2) Снимаем флаг mirrorQuestActive,
   *  3) Активируем repeating_quest.
   */
  async finish() {
    if (this.finished) return;
    this.finished = true;

    this.stopCheckLoop();
    const success = await this.checkStatus();
    const ghost = this.app.ghostManager?.getCurrentGhost?.() || null;
    let letter = "";
    if (ghost) letter = this.getRandomLetter(ghost.name);

    if (success) {
      await this.eventManager.addDiaryEntry(`user_post_success: ${letter}`, false);
      console.log("✅ Зеркальный квест выполнен!");
    } else {
      await this.eventManager.addDiaryEntry(`user_post_failed: ${letter}`, false);
      console.warn("❌ Зеркальный квест не выполнен!");
    }
    localStorage.removeItem("mirrorQuestActive");
    this.app.questManager.updatePostButtonState();

    // Снимаем glow
    const camBtn = document.getElementById("toggle-camera");
    if (camBtn) camBtn.classList.remove("glowing");

    // Запускаем следующий квест: repeating_quest
    console.log("[BaseMirrorQuest] Запускаем repeating_quest...");
    this.app.questManager.activateQuest("repeating_quest");
  }

  getRandomLetter(name) {
    const letters = name.replace(/[^A-Za-zА-Яа-яЁё]/g, '').split('');
    if (!letters.length) return "";
    return letters[Math.floor(Math.random() * letters.length)];
  }
}