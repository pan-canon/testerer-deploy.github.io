import { BaseEvent } from '../events/baseEvent.js';
import { ImageUtils } from '../utils/imageUtils.js';
import { StateManager } from '../stateManager.js';

/**
 * BaseMirrorQuest – Base class for the mirror quest.
 * Encapsulates the logic for comparing the current frame (canvas → grayscale → compare),
 * managing the check loop, and delegating UI updates to the ViewManager.
 *
 * NOTE: This quest is part of the sequential chain managed by GhostManager.
 */
export class BaseMirrorQuest extends BaseEvent {
  constructor(eventManager, appInstance, config = {}) {
    super(eventManager);
    this.app = appInstance;
    this.key = config.key || "mirror_quest"; 
    this.doneKey = config.doneKey || "mirror_done";

    // Configuration for UI elements (identifiers used by ViewManager)
    this.statusElementId = config.statusElementId || "mirror-quest-status";
    this.shootButtonId = config.shootButtonId || "btn_shoot";

    this.checkInterval = null; 
    this.finished = false;

    // Canvas for frame comparison
    this.tempCanvas = document.createElement("canvas");
    this.tempCtx = this.tempCanvas.getContext("2d");

    this.registerEvents();
  }

  /**
   * registerEvents
   * If "mirrorQuestActive" flag is set, starts the check loop when camera is ready.
   */
  registerEvents() {
    document.addEventListener('cameraReady', () => {
      if (StateManager.get("mirrorQuestActive") === "true") {
        this.startCheckLoop();
      }
    });
  }

  /**
   * activate
   * If not yet logged, logs the quest event in the diary.
   * Sets "mirrorQuestActive" and saves "active" quest record in DB.
   */
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`Activating event: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key);
    }
    console.log("[BaseMirrorQuest] Mirror quest activated.");
    StateManager.set("mirrorQuestActive", "true");

    // Mark quest as active in DB
    await this.app.databaseManager.saveQuestRecord({
      quest_key: this.key,
      status: "active",
      current_stage: 1,
      total_stages: 1
    });
  }

  /**
   * startCheckLoop
   * Initializes the Mirror Quest UI via ViewManager and starts periodic checks (compareFrameInternally).
   */
  startCheckLoop() {
    if (this.checkInterval) return; // Already running.

    if (this.app.viewManager && typeof this.app.viewManager.startMirrorQuestUI === 'function') {
      this.app.viewManager.startMirrorQuestUI({
        statusElementId: this.statusElementId,
        shootButtonId: this.shootButtonId,
        onShoot: () => this.finish() // When user clicks shoot
      });
    }

    // Every 2 seconds, check if camera is open and compare frames
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
   * Clears the interval and hides Mirror Quest UI.
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
   * Checks if the user is "in front of the mirror" by comparing the camera frame to the selfie.
   */
  async checkStatus() {
    console.log("[BaseMirrorQuest] checkStatus() -> compareFrameInternally()");
    return await this.compareFrameInternally();
  }

  /**
   * compareFrameInternally
   * Captures the current camera frame → grayscale → compares with app.selfieData → returns boolean success/fail.
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
   * If there's a special "updateMirrorQuestUIAfterFinish" method in ViewManager, call it.
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
   * - Stop the check loop (no more frame comparisons).
   * - Do a final check (optional).
   * - Log success/fail in the diary.
   * - Clear "mirrorQuestActive" in StateManager.
   * - Save quest as "finished" in DB.
   * - If success, triggers "post_mirror_event".
   * - Finally, calls syncQuestState to refresh UI (enable Post if no other quests).
   */
  async finish() {
    if (this.finished) return;
    this.finished = true;

    // Stop the periodic check
    this.stopCheckLoop();

    const success = await this.checkStatus(); 
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

    // Cleanup UI
    this.updateUIAfterFinish(success);

    // Deactivate camera button if needed
    if (this.app.viewManager && typeof this.app.viewManager.setCameraButtonActive === 'function') {
      this.app.viewManager.setCameraButtonActive(false);
    }

    // Remove the "mirrorQuestActive" flag
    StateManager.remove("mirrorQuestActive");

    // Save as finished in DB
    await this.app.databaseManager.saveQuestRecord({
      quest_key: this.key,
      status: "finished",
      current_stage: 1,
      total_stages: 1
    });

    // If success, launch post_mirror_event
    if (success) {
      this.app.gameEventManager.activateEvent("post_mirror_event");
    }

    // CHANGED/ADDED: Immediately sync the quest state to update "Post" button, etc.
    if (this.app.questManager && typeof this.app.questManager.syncQuestState === 'function') {
      await this.app.questManager.syncQuestState();
    }
  }

  /**
   * getCurrentQuestStatus
   * Returns an object with quest data from DB + local flags (finished, mirrorQuestActive).
   */
  async getCurrentQuestStatus() {
    const record = this.app.databaseManager.getQuestRecord(this.key);
    const activeFlag = StateManager.get("mirrorQuestActive") === "true";
    return {
      key: this.key,
      active: activeFlag,
      finished: this.finished,
      dbStatus: record ? record.status : "not recorded"
    };
  }

  /**
   * getRandomLetter
   * Utility function: returns a random letter from ghost's name.
   */
  getRandomLetter(name) {
    if (!name) return "";
    const letters = name.replace(/[^A-Za-zА-Яа-яЁё]/g, '').split('');
    if (!letters.length) return '';
    return letters[Math.floor(Math.random() * letters.length)];
  }
}