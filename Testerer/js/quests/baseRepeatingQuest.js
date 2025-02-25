import { BaseEvent } from '../events/baseEvent.js';

/**
 * BaseRepeatingQuest – Handles the repeating quest by capturing a snapshot without face detection.
 */
export class BaseRepeatingQuest extends BaseEvent {
  constructor(eventManager, appInstance, config = {}) {
    super(eventManager);
    this.app = appInstance;
    this.key = config.key || "repeating_quest";
    this.doneKey = config.doneKey || (this.key + "_done");

    this.statusElementId = config.statusElementId || "repeating-quest-status";
    this.shootButtonId = config.shootButtonId || "btn_shoot"; 
    this.totalStages = config.totalStages || 3;
    this.currentStage = 1;
    this.finished = false;
  }

  /**
   * activate – Starts the repeating quest.
   * Does not automatically open the camera; instead, waits for the user to open it.
   * If the camera is already open, immediately start the quest UI.
   */
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`Activating repeating quest: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key, true);
    }
    console.log(`[BaseRepeatingQuest] Repeating quest started with ${this.totalStages} stages`);
    
    if (this.app.isCameraOpen) {
      console.log("[BaseRepeatingQuest] Camera is already open; starting quest UI.");
      this.startCheckLoop();
    } else {
      console.log("[BaseRepeatingQuest] Waiting for camera to be opened manually.");
      const onCameraReady = () => {
        console.log("[BaseRepeatingQuest] Detected camera ready; starting quest UI.");
        this.startCheckLoop();
        document.removeEventListener("cameraReady", onCameraReady);
      };
      document.addEventListener("cameraReady", onCameraReady);
    }
  }

  /**
   * startCheckLoop – Updates the repeating quest UI.
   * Enables the shoot button (even though App.toggleCameraView() disables it by default).
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
      // Explicitly enable the shoot button for repeating quest
      shootBtn.disabled = false;
      // Replace button to clear previous listeners
      const newShootBtn = shootBtn.cloneNode(true);
      shootBtn.parentNode.replaceChild(newShootBtn, shootBtn);
      newShootBtn.addEventListener("click", () => this.finishStage(), { once: true });
      console.log(`[BaseRepeatingQuest] Shoot button enabled for stage ${this.currentStage}.`);
    }
    console.log("[BaseRepeatingQuest] Repeating quest UI updated. Waiting for user to capture a snapshot.");
  }

  /**
   * finishStage – Captures a snapshot and logs the completion of the current stage.
   */
  async finishStage() {
    if (this.finished) return;
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
        const newShootBtn = shootBtn.cloneNode(true);
        shootBtn.parentNode.replaceChild(newShootBtn, shootBtn);
        newShootBtn.addEventListener("click", () => this.finishStage(), { once: true });
      }
    } else {
      await this.finish();
    }
  }

  /**
   * finish – Completes the repeating quest and triggers the post repeating event.
   */
  async finish() {
    const statusDiv = document.getElementById(this.statusElementId);
    if (statusDiv) statusDiv.style.display = "none";
    const shootBtn = document.getElementById(this.shootButtonId);
    if (shootBtn) shootBtn.style.display = "none";
    this.finished = true;
    console.log(`[BaseRepeatingQuest] All ${this.totalStages} stages completed!`);
    await this.eventManager.addDiaryEntry(`${this.key}_complete`, true);
    // Trigger the post repeating event to signal the end of this cycle.
    this.app.gameEventManager.activateEvent("post_repeating_event");
  }

  /**
   * captureSimplePhoto – Captures a snapshot from the active camera.
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