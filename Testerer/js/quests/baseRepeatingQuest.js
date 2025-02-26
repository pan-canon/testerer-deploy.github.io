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
   * If the quest is already finished, resets the cycle.
   * При активации, если камера не открыта, она открывается автоматически.
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

    // Если камера не открыта, открываем её автоматически
    if (!this.app.isCameraOpen) {
      console.log("[BaseRepeatingQuest] Camera is not open; opening camera for repeating quest.");
      await this.app.toggleCameraView();
    }

    // Если камера открыта, запускаем UI повторяющегося квеста,
    // иначе ожидаем событие cameraReady
    if (this.app.isCameraOpen) {
      console.log("[BaseRepeatingQuest] Camera is open; starting quest UI.");
      this.startCheckLoop();
    } else {
      console.log("[BaseRepeatingQuest] Waiting for camera to open...");
      const onCameraReady = () => {
        console.log("[BaseRepeatingQuest] Camera is ready; starting quest UI.");
        this.startCheckLoop();
        document.removeEventListener("cameraReady", onCameraReady);
      };
      document.addEventListener("cameraReady", onCameraReady);
    }
  }

  /**
   * startCheckLoop – Updates the UI for the repeating quest.
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
      // Активируем кнопку для повторяющегося квеста
      shootBtn.disabled = false;
      // Клонируем кнопку для удаления предыдущих обработчиков событий
      const newShootBtn = shootBtn.cloneNode(true);
      shootBtn.parentNode.replaceChild(newShootBtn, shootBtn);
      newShootBtn.addEventListener("click", () => this.finishStage(), { once: true });
      console.log(`[BaseRepeatingQuest] Shoot button enabled for stage ${this.currentStage}.`);
    }
    console.log("[BaseRepeatingQuest] Repeating quest UI updated. Awaiting user action to capture snapshot.");
  }

  /**
   * finishStage – Completes one stage of the repeating quest.
   * При нажатии, снимается фото, создаётся пост и происходит переход к следующему этапу.
   */
  async finishStage() {
    if (this.finished) return;
    const shootBtn = document.getElementById(this.shootButtonId);
    if (shootBtn) {
      shootBtn.setAttribute("disabled", "true");
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
      const shootBtn = document.getElementById(this.shootButtonId);
      if (shootBtn) {
        // Реактивируем кнопку для следующего этапа
        shootBtn.disabled = false;
        shootBtn.style.pointerEvents = "auto";
        const newShootBtn = shootBtn.cloneNode(true);
        shootBtn.parentNode.replaceChild(newShootBtn, shootBtn);
        newShootBtn.addEventListener("click", () => this.finishStage(), { once: true });
      }
    } else {
      await this.finish();
    }
  }

  /**
   * finish – Completes the repeating quest.
   * После завершения всех этапов, логируется завершение и вызывается событие post_repeating_event.
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
   * captureSimplePhoto – Captures a snapshot from the active camera.
   * Возвращает data URL снимка.
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