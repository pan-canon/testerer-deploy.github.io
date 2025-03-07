import { BaseEvent } from '../events/baseEvent.js';
import { StateManager } from '../stateManager.js';

/**
 * BaseRepeatingQuest – Base class for the repeating quest.
 * Manages quest progress by updating state across multiple stages,
 * saving progress via StateManager, and delegating UI updates to ViewManager.
 *
 * NOTE: This quest is part of the sequential chain managed by GhostManager.
 */
export class BaseRepeatingQuest extends BaseEvent {
  constructor(eventManager, appInstance, config = {}) {
    super(eventManager);
    this.app = appInstance;
    this.key = config.key || "repeating_quest";
    this.doneKey = config.doneKey || (this.key + "_done");

    // UI configuration (delegated to ViewManager)
    this.statusElementId = config.statusElementId || "repeating-quest-status";
    this.shootButtonId = config.shootButtonId || "btn_shoot";

    // Quest state
    this.totalStages = config.totalStages || 3;
    this.currentStage = 1;
    this.finished = false;

    // Flag to ensure final repeating quest is triggered only once.
    this.finalRepeatingQuestCompleted = false;

    // Restore saved quest state from StateManager.
    this.loadState();
  }

  /**
   * loadState – Restores the quest state from StateManager.
   */
  loadState() {
    const saved = StateManager.get(`quest_state_${this.key}`);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        this.currentStage = state.currentStage;
        this.finished = state.finished;
        if (state.totalStages) {
          this.totalStages = state.totalStages;
        }
        console.log(`[BaseRepeatingQuest] Restored quest state: stage=${this.currentStage}, finished=${this.finished}`);
      } catch (e) {
        console.error("[BaseRepeatingQuest] Error parsing saved quest state:", e);
      }
    }
  }

  /**
   * saveState – Saves the current quest state to StateManager.
   */
  saveState() {
    const state = {
      currentStage: this.currentStage,
      finished: this.finished,
      totalStages: this.totalStages
    };
    StateManager.set(`quest_state_${this.key}`, JSON.stringify(state));
    console.log(`[BaseRepeatingQuest] Saved quest state: stage=${this.currentStage}, finished=${this.finished}`);
  }

  /**
   * activate – Activates the repeating quest.
   * Waits for the camera to be open (using a "cameraReady" event) if needed,
   * then starts the UI check loop and sets the "Open Camera" button active via ViewManager.
   * Also saves the quest record in the database with status "active".
   */
  async activate() {
    console.log(`Activating repeating quest: ${this.key}`);
    await this.eventManager.addDiaryEntry(this.key, true);
    console.log(`[BaseRepeatingQuest] Repeating quest started with ${this.totalStages} stages`);
    // Save quest record as active.
    await this.app.databaseManager.saveQuestRecord({
      quest_key: this.key,
      status: "active",
      current_stage: this.currentStage,
      total_stages: this.totalStages
    });
    if (this.app.viewManager && typeof this.app.viewManager.setCameraButtonActive === 'function') {
      this.app.viewManager.setCameraButtonActive(true);
    }
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
    this.startCheckLoop();
  }

  /**
   * startCheckLoop – Delegates UI initialization for the quest stage to ViewManager,
   * then starts a periodic check loop (every 2 seconds) to update the quest status.
   */
  startCheckLoop() {
    if (this.app.viewManager && typeof this.app.viewManager.startRepeatingQuestUI === 'function') {
      this.app.viewManager.startRepeatingQuestUI({
        statusElementId: this.statusElementId,
        shootButtonId: this.shootButtonId,
        stage: this.currentStage,
        totalStages: this.totalStages,
        onShoot: () => this.finishStage()
      });
    } else {
      console.error("[BaseRepeatingQuest] ViewManager.startRepeatingQuestUI is not available.");
    }
    console.log("[BaseRepeatingQuest] Repeating quest UI updated. Awaiting user action to capture snapshot.");
  }

  /**
   * restoreUI – Restores the UI for the repeating quest if a cycle is active.
   * If the camera is open, restores the active state of the "Shoot" button via ViewManager.
   */
  restoreUI() {
    console.log("[BaseRepeatingQuest] Restoring repeating quest UI...");
    const restoreButtonState = () => {
      this.startCheckLoop();
      if (this.currentStage <= this.totalStages && this.app.isCameraOpen) {
        if (this.app.viewManager && typeof this.app.viewManager.setShootButtonActive === 'function') {
          this.app.viewManager.setShootButtonActive(true);
          console.log("[BaseRepeatingQuest] Shoot button state restored as active.");
        }
      }
    };

    if (!this.app.isCameraOpen) {
      document.addEventListener("cameraReady", restoreButtonState, { once: true });
    } else {
      restoreButtonState();
    }
  }

  /**
   * finishStage – Completes one stage of the repeating quest.
   * Disables the "Shoot" button via ViewManager, captures a snapshot, logs the stage completion,
   * updates quest state via StateManager, and enables the "Post" button for the next stage.
   */
  async finishStage() {
    if (this.finished) return;
    
    // Disable the Shoot button via ViewManager to prevent multiple clicks.
    if (this.app.viewManager && typeof this.app.viewManager.setShootButtonActive === 'function') {
      this.app.viewManager.setShootButtonActive(false);
      console.log("[BaseRepeatingQuest] Shoot button disabled after click.");
    }
    
    const photoData = this.captureSimplePhoto();
    console.log(`[BaseRepeatingQuest] Captured snapshot for stage ${this.currentStage}.`);
    
    await this.eventManager.addDiaryEntry(
      `repeating_stage_${this.currentStage} [photo attached]\n${photoData}`,
      false
    );
    console.log(`[BaseRepeatingQuest] Completed stage: ${this.currentStage}`);
    
    this.currentStage++;
    this.saveState();

    if (this.currentStage <= this.totalStages) {
      // Set the readiness flag using StateManager.
      StateManager.set("mirrorQuestReady", "true");
      // Enable the Post button via ViewManager.
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
        this.app.viewManager.setPostButtonEnabled(true);
        console.log("[BaseRepeatingQuest] Post button enabled for next stage.");
      }
    } else {
      // All stages completed; finish the quest.
      await this.finish();
    }
  }

  /**
   * finish – Completes the repeating quest.
   * Logs the final diary entry, triggers the final event,
   * disables the Post button via ViewManager, resets quest state via StateManager,
   * and resets the "Open Camera" button active state.
   * Also updates the quest record in the database with status "finished".
   */
  async finish() {
    if (this.finished) return;
    this.finished = true;
    this.saveState();
    console.log(`[BaseRepeatingQuest] All ${this.totalStages} stages completed!`);
    await this.eventManager.addDiaryEntry(`${this.key}_complete`, true);
    if (!this.finalRepeatingQuestCompleted) {
      this.finalRepeatingQuestCompleted = true;
      await this.app.gameEventManager.activateEvent("final_event");
    }
    StateManager.remove("mirrorQuestReady");
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
      this.app.viewManager.setPostButtonEnabled(false);
      console.log("[BaseRepeatingQuest] Post button disabled after finishing repeating quest.");
    }
    StateManager.remove(`quest_state_${this.key}`);
    if (this.app.viewManager && typeof this.app.viewManager.setCameraButtonActive === 'function') {
      this.app.viewManager.setCameraButtonActive(false);
      console.log("[BaseRepeatingQuest] Camera button active state reset after quest completion.");
    }
    // Update quest record in the database as finished.
    await this.app.databaseManager.saveQuestRecord({
      quest_key: this.key,
      status: "finished",
      current_stage: this.currentStage,
      total_stages: this.totalStages
    });
  }

  /**
   * captureSimplePhoto – Captures a snapshot from the active camera and returns a data URL.
   * @returns {string} Data URL of the captured image.
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

  /**
   * resetCycle – Resets the state of the repeating quest for a new cycle.
   */
  resetCycle() {
    this.finished = false;
    this.currentStage = 1;
    console.log("[BaseRepeatingQuest] Quest state has been reset for a new cycle.");
    this.saveState();
  }

  /**
   * getCurrentQuestStatus
   * NEW: Retrieves the current status of the repeating quest.
   * Combines local quest state (currentStage, finished, totalStages) and information from the database.
   *
   * @returns {Promise<Object>} An object with keys: key, active, finished, currentStage, totalStages, dbStatus.
   */
  async getCurrentQuestStatus() {
    const record = this.app.databaseManager.getQuestRecord(this.key);
    const active = (!this.finished && this.currentStage <= this.totalStages);
    return {
      key: this.key,
      active: active,
      finished: this.finished,
      currentStage: this.currentStage,
      totalStages: this.totalStages,
      dbStatus: record ? record.status : "not recorded"
    };
  }
}