// File: baseRepeatingQuest.js
import { BaseEvent } from '../events/baseEvent.js';

export class BaseRepeatingQuest extends BaseEvent {
  constructor(eventManager, appInstance, config = {}) {
    super(eventManager);
    this.app = appInstance;
    this.key = config.key || "repeating_quest";
    this.doneKey = config.doneKey || (this.key + "_done");

    // UI element IDs
    this.statusElementId = config.statusElementId || "repeating-quest-status";
    this.shootButtonId = config.shootButtonId || "btn_shoot";

    // Quest state
    this.totalStages = config.totalStages || 3;
    this.currentStage = 1;
    this.finished = false;
  }

  /**
   * resetCycle – Resets the repeating quest state to allow a new cycle.
   */
  resetCycle() {
    this.finished = false;
    this.currentStage = 1;
    console.log("[BaseRepeatingQuest] Quest state has been reset for a new cycle.");
  }

  /**
   * activate – Activates the repeating quest.
   * Если квест уже завершён, происходит сброс состояния.
   * Если камера не открыта, квест ждёт события cameraReady,
   * чтобы обновить UI (активировать кнопку «Заснять») в режиме камеры.
   */
  async activate() {
    if (this.finished) {
      this.resetCycle();
    }
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`Activating repeating quest: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key, true);
    }
    console.log(`[BaseRepeatingQuest] Repeating quest started with ${this.totalStages} stages`);

    // Если камера не открыта, ожидаем события cameraReady
    if (!this.app.isCameraOpen) {
      console.log("[BaseRepeatingQuest] Camera is not open. Waiting for cameraReady event...");
      await new Promise(resolve => {
        const onCameraReady = () => {
          document.removeEventListener("cameraReady", onCameraReady);
          resolve();
        };
        document.addEventListener("cameraReady", onCameraReady);
      });
    }
    // После открытия камеры обновляем UI повторяющегося квеста
    this.startCheckLoop();
  }

  /**
   * startCheckLoop – Обновляет UI повторяющегося квеста.
   * Делает кнопку «Заснять» видимой и активной.
   */
  startCheckLoop() {
    const statusDiv = document.getElementById(this.statusElementId);
    if (statusDiv) {
      statusDiv.style.display = "block";
      statusDiv.textContent = `Repeating quest – Stage ${this.currentStage} of ${this.totalStages}`;
    }
    const shootBtn = document.getElementById(this.shootButtonId);
    if (shootBtn) {
      shootBtn.style.display = "inline-block";
      // Активируем кнопку: убираем disabled и восстанавливаем pointer events
      shootBtn.disabled = false;
      shootBtn.removeAttribute("disabled");
      shootBtn.style.pointerEvents = "auto";
      // Удаляем старые обработчики посредством клонирования
      const newShootBtn = shootBtn.cloneNode(true);
      shootBtn.parentNode.replaceChild(newShootBtn, shootBtn);
      newShootBtn.addEventListener("click", this.finishStage.bind(this), { once: true });
      console.log(`[BaseRepeatingQuest] Shoot button enabled for stage ${this.currentStage}.`);
    } else {
      console.error("[BaseRepeatingQuest] Shoot button not found in the DOM.");
    }
    console.log("[BaseRepeatingQuest] Repeating quest UI updated. Awaiting user action to capture snapshot.");
  }

  /**
   * finishStage – Завершает один этап квеста.
   * Снимается фото (без проверок), логируется пост, и происходит переход к следующему этапу.
   */
  async finishStage() {
    if (this.finished) return;
    const shootBtn = document.getElementById(this.shootButtonId);
    if (shootBtn) {
      shootBtn.disabled = true;
      shootBtn.style.pointerEvents = "none";
    }
    const photoData = this.captureSimplePhoto();
    console.log(`[BaseRepeatingQuest] Captured snapshot for stage ${this.currentStage}.`);
    await this.eventManager.addDiaryEntry(
      `repeating_stage_${this.currentStage} [photo attached]\n${photoData}`,
      false
    );
    console.log(`[BaseRepeatingQuest] Completed stage: ${this.currentStage}`);
    this.currentStage++;
    if (this.currentStage <= this.totalStages) {
      const statusDiv = document.getElementById(this.statusElementId);
      if (statusDiv) {
        statusDiv.textContent = `Repeating quest – Stage ${this.currentStage} of ${this.totalStages}`;
      }
      // Реактивируем кнопку для следующего этапа
      const shootBtn = document.getElementById(this.shootButtonId);
      if (shootBtn) {
        shootBtn.disabled = false;
        shootBtn.style.pointerEvents = "auto";
        const newShootBtn = shootBtn.cloneNode(true);
        shootBtn.parentNode.replaceChild(newShootBtn, shootBtn);
        newShootBtn.addEventListener("click", this.finishStage.bind(this), { once: true });
      }
    } else {
      await this.finish();
    }
  }

  /**
   * finish – Завершает повторяющийся квест.
   * Логируется завершение, обновляется UI и активируется событие post_repeating_event.
   */
  async finish() {
    const statusDiv = document.getElementById(this.statusElementId);
    if (statusDiv) statusDiv.style.display = "none";
    const shootBtn = document.getElementById(this.shootButtonId);
    if (shootBtn) {
      shootBtn.disabled = true;
      shootBtn.style.pointerEvents = "none";
    }
    this.finished = true;
    console.log(`[BaseRepeatingQuest] All ${this.totalStages} stages completed!`);
    await this.eventManager.addDiaryEntry(`${this.key}_complete`, true);
    this.app.gameEventManager.activateEvent("post_repeating_event");
  }

  /**
   * captureSimplePhoto – Захватывает снимок с активной камеры.
   * Возвращает data URL изображения.
   */
  captureSimplePhoto() {
    const video = this.app.cameraSectionManager?.videoElement;
    if (!video || !video.srcObject) {
      console.warn("[BaseRepeatingQuest] Camera is not active — returning an empty string");
      return "";
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  }
}