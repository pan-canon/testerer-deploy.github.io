import { BaseEvent } from '../events/BaseEvent.js';
import { ImageUtils } from '../utils/ImageUtils.js';
import { StateManager } from '../managers/StateManager.js';
import { ErrorManager } from '../managers/ErrorManager.js';

/**
 * BaseMirrorQuest – Base class for the mirror quest.
 * Encapsulates the logic for comparing the current frame (canvas → grayscale → compare),
 * managing the check loop, and delegating UI updates to the ViewManager.
 */
export class BaseMirrorQuest extends BaseEvent {
  constructor(eventManager, appInstance, config = {}) {
    super(eventManager);
    this.app = appInstance;
    this.key = config.key || "mirror_quest"; // Allows overriding the key.
    this.doneKey = config.doneKey || "mirror_done";

    // UI configuration (identifiers used by ViewManager)
    this.statusElementId = config.statusElementId || "mirror-quest-status";
    this.shootButtonId = config.shootButtonId || "btn_shoot";

    this.checkInterval = null; // For startCheckLoop
    this.finished = false;

    // Canvas for frame comparison
    this.tempCanvas = document.createElement("canvas");
    this.tempCtx = this.tempCanvas.getContext("2d");

    this.registerEvents();
  }

  /**
   * registerEvents
   * If the universal active quest key matches this quest's key,
   * starts the check loop when the camera becomes ready.
   */
  registerEvents() {
    document.addEventListener('cameraReady', () => {
      // Instead of checking a specific flag, check the universal "activeQuestKey"
      if (StateManager.getActiveQuestKey() === this.key) {
        this.startCheckLoop();
      }
    });
  }

  /**
   * activate
   * Activates the mirror quest if it is not yet logged and creates an "active" quest record in the database.
   * Note: The universal active quest key is set by the GhostManager/QuestManager.
   */
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`Activating event: ${this.key}`);
      // Use the unified diary entry method from BaseEvent.
      await this.addDiaryEntry(this.key);
    }
    console.log("[BaseMirrorQuest] Mirror quest activated.");
    // Save quest record as active.
    await this.app.databaseManager.saveQuestRecord({
      quest_key: this.key,
      status: "active",
      current_stage: 1,
      total_stages: 1
    });
  }

  /**
   * startCheckLoop
   * Displays the mirror quest UI (via ViewManager) and starts a loop that checks 
   * "compareFrameInternally" every 2 seconds.
   */
  startCheckLoop() {
    if (this.checkInterval) return; // Already running.

    if (this.app.viewManager && typeof this.app.viewManager.startMirrorQuestUI === 'function') {
      this.app.viewManager.startMirrorQuestUI({
        statusElementId: this.statusElementId,
        shootButtonId: this.shootButtonId,
        onShoot: () => this.finish() // When user clicks the shoot button, finish the quest.
      });
    }

    this.checkInterval = setInterval(async () => {
      if (!this.app.isCameraOpen) {
        console.warn("[BaseMirrorQuest] Camera is not active - stopping check loop.");
        this.stopCheckLoop();
        return;
      }
      const success = await this.checkStatus();
      if (this.app.viewManager && typeof this.app.viewManager.updateMirrorQuestStatus === 'function') {
        this.app.viewManager.updateMirrorQuestStatus(success, this.statusElementId, this.shootButtonId);
      }
    }, 2000);
  }

  /**
   * stopCheckLoop
   * Clears the interval and hides the quest UI via ViewManager.
   */
  stopCheckLoop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.app.viewManager && typeof this.app.viewManager.stopMirrorQuestUI === 'function') {
      this.app.viewManager.stopMirrorQuestUI(this.statusElementId);
    }
  }

  /**
   * checkStatus
   * Uses compareFrameInternally to decide if the user is "in front of the mirror."
   */
  async checkStatus() {
    console.log("[BaseMirrorQuest] checkStatus() -> compareFrameInternally()");
    return await this.compareFrameInternally();
  }

  /**
   * compareFrameInternally
   * Captures the current camera frame, converts it to grayscale, compares it to the saved selfieData,
   * and returns a boolean indicating success or failure.
   */
  async compareFrameInternally() {
    if (!this.app.isCameraOpen) {
      console.warn("[BaseMirrorQuest] Camera is not active (app.isCameraOpen false)");
      return false;
    }
    if (!this.app.selfieData) {
      console.warn("[BaseMirrorQuest] No saved selfie (app.selfieData)");
      return false;
    }
    const videoEl = this.app.cameraSectionManager?.videoElement;
    if (!videoEl || !videoEl.srcObject) {
      console.warn("[BaseMirrorQuest] Camera is not active!");
      return false;
    }

    this.tempCanvas.width = videoEl.videoWidth || 640;
    this.tempCanvas.height = videoEl.videoHeight || 480;
    this.tempCtx.drawImage(videoEl, 0, 0, this.tempCanvas.width, this.tempCanvas.height);

    const currentFrameData = ImageUtils.convertToGrayscale(this.tempCanvas);
    const matchPixel = ImageUtils.pixelWiseComparison(this.app.selfieData, currentFrameData);
    const matchHist = ImageUtils.histogramComparison(this.app.selfieData, currentFrameData);
    console.log(`[BaseMirrorQuest] pixel=${matchPixel.toFixed(2)}, hist=${matchHist.toFixed(2)}`);
    const success = (matchPixel > 0.6 && matchHist > 0.7);

    if (success) {
      this.app.lastMirrorPhoto = currentFrameData;
    }
    return success;
  }

  /**
   * updateUIAfterFinish
   * Calls a custom "updateMirrorQuestUIAfterFinish" method in ViewManager (if available)
   * to update UI elements after quest completion.
   *
   * @param {boolean} success - Indicates whether the final check was successful.
   */
  updateUIAfterFinish(success) {
    if (this.app.viewManager && typeof this.app.viewManager.updateMirrorQuestUIAfterFinish === 'function') {
      this.app.viewManager.updateMirrorQuestUIAfterFinish(success, {
        statusElementId: this.statusElementId,
        shootButtonId: this.shootButtonId,
        cameraButtonId: "toggle-camera"
      });
    }
  }

  /**
   * finish
   * Finalizes the mirror quest:
   * - Stops the check loop.
   * - Performs a final status check.
   * - Logs a diary entry indicating success or failure.
   * - Updates the UI (e.g., disables camera highlights, resets buttons).
   * - Clears the quest-specific state.
   * - Marks the quest as finished in the database.
   * - Does NOT automatically trigger the next quest or event.
   * - Dispatches a "questCompleted" event to signal completion to GhostManager.
   */
  async finish() {
    if (this.finished) return;
    this.finished = true;

    this.stopCheckLoop();  // Stop the quest UI check loop.

    const success = await this.checkStatus(); 
    const ghost = this.app.ghostManager.getCurrentGhost();
    const randomLetter = ghost ? this.getRandomLetter(ghost.name) : "";

    if (success) {
      const photoData = this.app.lastMirrorPhoto
        ? ` [photo attached]\n${this.app.lastMirrorPhoto}`
        : "";
      // Use the unified method for adding a diary entry.
      await this.addDiaryEntry(`user_post_success: ${randomLetter}${photoData}`, false);
    } else {
      await this.addDiaryEntry(`user_post_failed: ${randomLetter}`, false);
    }

    // Update the UI after finishing the quest.
    this.updateUIAfterFinish(success);

    // Reset the "Open Camera" button if necessary.
    if (this.app.viewManager && typeof this.app.viewManager.setCameraButtonActive === 'function') {
      this.app.viewManager.setCameraButtonActive(false);
    }

    // Mark the quest as finished in the database.
    await this.app.databaseManager.saveQuestRecord({
      quest_key: this.key,
      status: "finished",
      current_stage: 1,
      total_stages: 1
    });

    // Synchronize the quest state so that the "Post" button updates.
    await this.app.questManager.syncQuestState();

    // Dispatch a custom event to signal that the quest has been completed.
    document.dispatchEvent(new CustomEvent("questCompleted", { detail: this.key }));
  }

  /**
   * getCurrentQuestStatus
   * Retrieves the quest state from the database along with local flags.
   * Now, instead of checking "mirrorQuestActive", it checks if the universal active quest key
   * matches this quest's key.
   * @returns {Promise<Object>} An object containing quest status information.
   */
  async getCurrentQuestStatus() {
    const record = this.app.databaseManager.getQuestRecord(this.key);
    const activeFlag = (StateManager.getActiveQuestKey() === this.key);
    return {
      key: this.key,
      active: activeFlag,
      finished: this.finished,
      dbStatus: record ? record.status : "not recorded"
    };
  }

  /**
   * getRandomLetter
   * Utility function: returns a random letter from the ghost's name.
   * @param {string} name - The ghost's name.
   * @returns {string} A random letter from the name.
   */
  getRandomLetter(name) {
    if (!name) return "";
    const letters = name.replace(/[^A-Za-zА-Яа-яЁё]/g, '').split('');
    if (!letters.length) return '';
    return letters[Math.floor(Math.random() * letters.length)];
  }
}