import { BaseEvent } from '../events/baseEvent.js';

/**
 * BaseRepeatingQuest – Base class for the repeating quest.
 * In this quest, the player must complete a number of stages by capturing a snapshot 
 * from the camera without performing any face comparison. This quest is used for repeating cycles 
 * once the initial mirror quest has been completed.
 */
export class BaseRepeatingQuest extends BaseEvent {
  /**
   * @param {EventManager} eventManager - The diary/event manager.
   * @param {App} appInstance - The main application instance.
   * @param {Object} config - Configuration options, e.g., { key: 'repeating_quest', totalStages: 5, ... }
   */
  constructor(eventManager, appInstance, config = {}) {
    super(eventManager);
    this.app = appInstance;
    this.key = config.key || "repeating_quest";
    this.doneKey = config.doneKey || (this.key + "_done");

    // UI element IDs (can be overridden via config)
    this.statusElementId = config.statusElementId || "repeating-quest-status";
    this.shootButtonId = config.shootButtonId || "btn_shoot"; 

    // Total stages required for completion of the quest.
    this.totalStages = config.totalStages || 3;
    this.currentStage = 1;
    this.finished = false;
  }

  /**
   * activate – Activates the repeating quest.
   * Logs the start of the quest and immediately displays the UI for the quest.
   */
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`Activating repeating quest: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key, true);
    }
    console.log(`[BaseRepeatingQuest] Repeating quest started with ${this.totalStages} stages`);
    // Immediately display the repeating quest UI
    this.startCheckLoop();
  }

  /**
   * startCheckLoop – For the repeating quest, this method displays the status text and 
   * shows the "Shoot" button. Unlike the mirror quest, no periodic check is performed.
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
      shootBtn.disabled = false; // Enable the button immediately
      // Attach a click handler to finish the current stage
      shootBtn.addEventListener("click", () => this.finishStage(), { once: true });
    }
    console.log("[BaseRepeatingQuest] UI updated for repeating quest. Waiting for user to capture a snapshot.");
  }

  /**
   * finishStage – Completes one stage of the repeating quest.
   * Captures a snapshot using a simple method and logs the completion of the stage.
   */
  async finishStage() {
    if (this.finished) return;

    // Capture a simple snapshot without any image comparison
    const photoData = this.captureSimplePhoto();
    console.log(`[BaseRepeatingQuest] Captured snapshot for stage ${this.currentStage}.`);
    
    // Log the stage completion in the diary
    await this.eventManager.addDiaryEntry(
      `repeating_stage_${this.currentStage} [photo attached]\n${photoData}`,
      false
    );
    console.log(`[BaseRepeatingQuest] Completed stage: ${this.currentStage}`);
    
    // Increment stage counter
    this.currentStage++;

    // Update UI for next stage or finish quest if all stages are complete
    if (this.currentStage <= this.totalStages) {
      const statusDiv = document.getElementById(this.statusElementId);
      if (statusDiv) {
        statusDiv.textContent = `Repeating quest – Stage ${this.currentStage} of ${this.totalStages}`;
      }
      const shootBtn = document.getElementById(this.shootButtonId);
      if (shootBtn) {
        shootBtn.addEventListener("click", () => this.finishStage(), { once: true });
      }
    } else {
      await this.finish();
    }
  }

  /**
   * finish – Completes the repeating quest.
   * Logs the quest completion and triggers the "post_repeating_event" to move the cycle forward.
   */
  async finish() {
    // Hide the repeating quest UI elements
    const statusDiv = document.getElementById(this.statusElementId);
    if (statusDiv) statusDiv.style.display = "none";
    const shootBtn = document.getElementById(this.shootButtonId);
    if (shootBtn) shootBtn.style.display = "none";

    this.finished = true;
    console.log(`[BaseRepeatingQuest] All ${this.totalStages} stages completed!`);
    
    // Log quest completion in the diary
    await this.eventManager.addDiaryEntry(`${this.key}_complete`, true);
    
    // Trigger the post repeating event to signal end of cycle
    this.app.gameEventManager.activateEvent("post_repeating_event");
  }

  /**
   * captureSimplePhoto – Captures a snapshot from the camera without additional processing.
   * @returns {string} Data URL of the captured snapshot.
   */
  captureSimplePhoto() {
    const video = this.app.cameraSectionManager?.videoElement;
    if (!video || !video.srcObject) {
      console.warn("[BaseRepeatingQuest] Camera is not active — returning an empty string");
      return "";
    }
    // Create a temporary canvas to capture the current video frame
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  }
}