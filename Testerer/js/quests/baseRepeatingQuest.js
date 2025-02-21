import { BaseEvent } from '../events/baseEvent.js';

/**
 * BaseRepeatingQuest – Base class for the repeating quest,
 * where the player must complete N stages (e.g., capture a snapshot or post) without image similarity checks.
 */
export class BaseRepeatingQuest extends BaseEvent {
  /**
   * @param {EventManager} eventManager - The diary/event manager.
   * @param {App} appInstance - The main application instance.
   * @param {Object} config - For example: { key: 'repeating_quest', totalStages: 3, ... }
   */
  constructor(eventManager, appInstance, config = {}) {
    super(eventManager);

    this.app = appInstance;
    this.key = config.key || "repeating_quest";
    this.doneKey = config.doneKey || (this.key + "_done");

    // UI elements: you can specify alternative IDs if you want separate buttons/status for the repeating quest.
    this.statusElementId = config.statusElementId || "repeating-quest-status";
    this.shootButtonId = config.shootButtonId || "btn_shoot"; 

    // Total number of stages required to complete the quest.
    this.totalStages = config.totalStages || 3;
    this.currentStage = 1;
    this.finished = false;

    // Register UI events if needed (can be handled externally via QuestManager).
    this.registerEvents();
  }

  /**
   * registerEvents – Optionally attach UI handlers here.
   */
  registerEvents() {
    // No default event registration; UI handling can be managed in QuestManager.
  }

  /**
   * activate – Logs the start of the repeating quest (if not already logged).
   *
   * @returns {Promise<void>}
   */
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`Activating repeating quest: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key, true);
    }
    console.log(`[BaseRepeatingQuest] Repeating quest started with ${this.totalStages} stages`);
    // Optionally, you can set a flag like "repeatingQuestActive" here.
  }

  /**
   * startCheckLoop – For consistency with the mirror quest, this method simulates a "pseudo-check"
   * by simply displaying the UI elements (status display and "Shoot" button).
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
      shootBtn.disabled = false; // Unlike the mirror quest, the button is enabled.
      // Attach a click handler that will finish the current stage.
      shootBtn.addEventListener("click", () => this.finishStage(), { once: true });
    }
  }

  /**
   * stopCheckLoop – Hides the UI and removes any attached handlers.
   */
  stopCheckLoop() {
    const statusDiv = document.getElementById(this.statusElementId);
    if (statusDiv) {
      statusDiv.style.display = "none";
    }
    const shootBtn = document.getElementById(this.shootButtonId);
    if (shootBtn) {
      shootBtn.style.display = "none";
      // The "once" event listener is self-removing.
    }
  }

  /**
   * finishStage – Completes one stage of the quest:
   *  1) Captures a snapshot using a simple method.
   *  2) Logs the stage completion in the diary.
   *  3) If the current stage is less than the total stages, updates the UI and waits for the next shot.
   *  4) If the current stage equals the total stages, finishes the quest.
   *
   * @returns {Promise<void>}
   */
  async finishStage() {
    if (this.finished) return;

    // 1) Capture a snapshot (no image comparison is needed).
    const photoData = this.captureSimplePhoto();

    // 2) Log the stage completion in the diary.
    await this.eventManager.addDiaryEntry(
      `repeating_stage_${this.currentStage} [photo attached]\n${photoData}`,
      false
    );
    console.log(`[BaseRepeatingQuest] Completed stage: ${this.currentStage}`);

    // 3) Increment the stage counter.
    this.currentStage++;

    // If more stages remain, update the UI and re-attach the shoot button handler.
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
      // 4) Otherwise, finish the quest completely.
      await this.finish();
    }
  }

  /**
   * finish – Fully completes the repeating quest.
   * Stops the check loop, logs the completion, and explicitly triggers the "post_repeating_event"
   * to initiate the next event.
   *
   * @returns {Promise<void>}
   */
  async finish() {
    this.stopCheckLoop();
    this.finished = true;
    console.log(`[BaseRepeatingQuest] All ${this.totalStages} stages completed!`);

    // Log the quest completion in the diary.
    await this.eventManager.addDiaryEntry(`${this.key}_complete`, true);

    // Explicitly trigger the "post_repeating_event" to start the next event.
    this.app.gameEventManager.activateEvent("post_repeating_event");
  }

  /**
   * captureSimplePhoto – Captures a simple snapshot without comparing images.
   * @returns {string} The dataURL of the captured snapshot.
   */
  captureSimplePhoto() {
    const video = this.app.cameraSectionManager?.videoElement;
    if (!video || !video.srcObject) {
      console.warn("[BaseRepeatingQuest] ❌ Camera is not active — returning an empty string");
      return "";
    }
    // Create a temporary canvas.
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Return the base64 data URL of the snapshot.
    return canvas.toDataURL("image/png");
  }
}