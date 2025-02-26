import { BaseEvent } from '../events/baseEvent.js';

/**
 * BaseRepeatingQuest – Base class for the repeating quest,
 * where the player must complete a number of stages (e.g., capture a snapshot)
 * without image similarity checks.
 */
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
    // Flag to prevent double-processing a stage
    this.processingStage = false;
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
   * Waits for the camera to be open and then starts the quest UI.
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

    // Если камера открыта – запускаем интерфейс квеста сразу, иначе ждём события "cameraReady"
    if (this.app.isCameraOpen) {
      console.log("[BaseRepeatingQuest] Camera is already open; starting quest UI.");
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
   * Enables the "Shoot" button and sets up the event handler for capturing a snapshot.
   */
  startCheckLoop() {
    const statusDiv = document.getElementById(this.statusElementId);
    if (statusDiv) {
      statusDiv.style.display = "block";
      statusDiv.textContent = `Repeating quest – Stage ${this.currentStage} of ${this.totalStages}`;
    }
    this.enableShootButton();
    console.log("[BaseRepeatingQuest] Repeating quest UI updated. Awaiting user action to capture snapshot.");
  }

  /**
   * enableShootButton – Clones and enables the shoot button with a fresh event handler.
   */
  enableShootButton() {
    const shootBtn = document.getElementById(this.shootButtonId);
    if (shootBtn) {
      shootBtn.style.display = "inline-block";
      shootBtn.disabled = false;
      shootBtn.style.pointerEvents = "auto";
      // Clone the button to remove old event listeners
      const newShootBtn = shootBtn.cloneNode(true);
      shootBtn.parentNode.replaceChild(newShootBtn, shootBtn);
      newShootBtn.addEventListener("click", () => this.finishStage(), { once: true });
      console.log(`[BaseRepeatingQuest] Shoot button enabled for stage ${this.currentStage}.`);
    }
  }

  /**
   * finishStage – Completes one stage of the repeating quest.
   * Captures a snapshot and logs the stage completion.
   */
  async finishStage() {
    if (this.finished || this.processingStage) return;
    this.processingStage = true;
    
    // Immediately disable the shoot button to prevent repeated clicks.
    const shootBtn = document.getElementById(this.shootButtonId);
    if (shootBtn) {
      shootBtn.disabled = true;
      shootBtn.style.pointerEvents = "none";
      console.log(`[BaseRepeatingQuest] Shoot button disabled for stage ${this.currentStage}.`);
    }
    
    const photoData = this.captureSimplePhoto();
    console.log(`[BaseRepeatingQuest] Captured snapshot for stage ${this.currentStage}.`);
    await this.eventManager.addDiaryEntry(
      `repeating_stage_${this.currentStage} [photo attached]\n${photoData}`,
      false
    );
    console.log(`[BaseRepeatingQuest] Completed stage: ${this.currentStage}`);
    this.currentStage++;
    this.processingStage = false;
    if (this.currentStage <= this.totalStages) {
      // Обновляем статус и переактивируем кнопку для следующего этапа
      const statusDiv = document.getElementById(this.statusElementId);
      if (statusDiv) {
        statusDiv.textContent = `Repeating quest – Stage ${this.currentStage} of ${this.totalStages}`;
      }
      this.enableShootButton();
    } else {
      await this.finish();
    }
  }

  /**
   * finish – Completes the repeating quest.
   * Logs quest completion, updates the UI, and triggers the "post_repeating_event".
   */
  async finish() {
    const statusDiv = document.getElementById(this.statusElementId);
    if (statusDiv) statusDiv.style.display = "none";
    const shootBtn = document.getElementById(this.shootButtonId);
    if (shootBtn) {
      shootBtn.disabled = true;
      shootBtn.style.pointerEvents = "none";
      console.log(`[BaseRepeatingQuest] Shoot button disabled at quest finish.`);
    }
    this.finished = true;
    console.log(`[BaseRepeatingQuest] All ${this.totalStages} stages completed!`);
    await this.eventManager.addDiaryEntry(`${this.key}_complete`, true);
    // Trigger the post repeating event to signal cycle completion
    this.app.gameEventManager.activateEvent("post_repeating_event");
  }

  /**
   * captureSimplePhoto – Captures a snapshot from the active camera.
   * @returns {string} Data URL of the captured snapshot.
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