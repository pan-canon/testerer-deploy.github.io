import { BaseEvent } from '../events/baseEvent.js';

/**
 * BaseRepeatingQuest – Base class for the repeating quest,
 * where the player must complete several stages (e.g., capture a snapshot or post)
 * without performing image similarity checks.
 */
export class BaseRepeatingQuest extends BaseEvent {
  /**
   * @param {EventManager} eventManager - The diary/event manager.
   * @param {App} appInstance - The main application instance.
   * @param {Object} config - Additional configuration (e.g., { key: 'repeating_quest', totalStages: 3, ... })
   */
  constructor(eventManager, appInstance, config = {}) {
    super(eventManager);

    this.app = appInstance;
    this.key = config.key || "repeating_quest";
    this.doneKey = config.doneKey || (this.key + "_done");

    // UI elements
    this.statusElementId = config.statusElementId || "repeating-quest-status";
    this.shootButtonId = config.shootButtonId || "btn_shoot"; 

    // Total number of stages required to complete the quest.
    this.totalStages = config.totalStages || 3;
    this.currentStage = 1;
    this.finished = false;

    // Register UI events if necessary.
    this.registerEvents();
  }

  /**
   * registerEvents – Optionally attach additional UI event handlers.
   */
  registerEvents() {
    // Additional handlers can be added here if needed.
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
    console.log(`[BaseRepeatingQuest] Repeating quest with ${this.totalStages} stages started.`);
    
    // Set the repeating quest active flag.
    localStorage.setItem("repeatingQuestActive", "true");

    // Update the "Post" button and unblock camera controls.
    this.app.questManager.updatePostButtonState();
    this.app.visualEffectsManager.setControlsBlocked(false);
  }

  /**
   * startCheckLoop – Simulates a check by updating the UI (status display and "Shoot" button).
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
      shootBtn.disabled = false;
      // Attach a click handler to finish the current stage.
      shootBtn.addEventListener("click", () => this.finishStage(), { once: true });
    }
  }

  /**
   * stopCheckLoop – Stops the check loop and hides related UI elements.
   */
  stopCheckLoop() {
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
   * finishStage – Completes the current stage of the quest:
   * 1) Captures a snapshot.
   * 2) Logs the stage completion in the diary.
   * 3) Advances to the next stage or completes the quest.
   *
   * @returns {Promise<void>}
   */
  async finishStage() {
    if (this.finished) return;

    // 1) Capture a snapshot.
    const photoData = this.captureSimplePhoto();

    // 2) Log the stage completion in the diary.
    await this.eventManager.addDiaryEntry(
      `repeating_stage_${this.currentStage} [photo attached]\n${photoData}`,
      false
    );
    console.log(`[BaseRepeatingQuest] Completed stage: ${this.currentStage}`);

    // 3) Increment the stage counter.
    this.currentStage++;

    // If stages remain, update the UI and wait for the next snapshot.
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
      // Otherwise, finish the quest.
      await this.finish();
    }
  }

  /**
   * finish – Completes the mirror quest:
   * 1) Stops the check loop.
   * 2) Checks the status and logs the result.
   * 3) Removes the mirrorQuestActive flag and updates the UI.
   * 4) On success, explicitly triggers the "post_mirror_event" via GameEventManager.
   *
   * @returns {Promise<void>}
   */
  async finish() {
    if (this.finished) return;
    this.finished = true;

    this.stopCheckLoop();
    const success = await this.checkStatus();

    // Log the result and update the diary.
    const ghost = this.app.ghostManager.getCurrentGhost();
    const randomLetter = ghost ? this.getRandomLetter(ghost.name) : "";
    if (success) {
      const photoData = this.app.lastMirrorPhoto
        ? ` [photo attached]\n${this.app.lastMirrorPhoto}`
        : "";
      await this.eventManager.addDiaryEntry(`user_post_success: ${randomLetter}${photoData}`, false);
    } else {
      await this.eventManager.addDiaryEntry(`user_post_failed: ${randomLetter}`, false);
    }

    // Update the UI after finishing the quest.
    this.updateUIAfterFinish(success);

    // Remove the mirrorQuestActive flag.
    localStorage.removeItem("mirrorQuestActive");

    // Also clear the userPostSubmitted flag so that the "Post" button can be enabled again in the next cycle.
    localStorage.removeItem("userPostSubmitted");

    // Update the "Post" button state.
    this.app.questManager.updatePostButtonState();

    // Explicitly trigger the "post_mirror_event" if the quest was successful.
    if (success) {
      this.app.gameEventManager.activateEvent("post_mirror_event");
    }
  }

  /**
   * captureSimplePhoto – Captures a simple snapshot without image similarity checking.
   * @returns {string} dataURL of the snapshot.
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

    // Return the dataURL of the snapshot.
    return canvas.toDataURL("image/png");
  }
}