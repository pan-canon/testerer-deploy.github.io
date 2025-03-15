import { BaseEvent } from '../events/BaseEvent.js';
import { StateManager } from '../managers/StateManager.js';

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

    // New flag: indicates if the quest was properly activated via POST
    this.activated = false;

    // (Optional flag – not used further, can be removed if unnecessary)
    this.finalRepeatingQuestCompleted = false;

    // Restore saved quest state from StateManager.
    this.loadState();
  }

  /**
   * loadState – Restores the quest state from StateManager.
   */
  loadState() {
    const saved = StateManager.get(quest_state_${this.key});
    if (saved) {
      try {
        const state = JSON.parse(saved);
        this.currentStage = state.currentStage;
        this.finished = state.finished;
        if (state.totalStages) {
          this.totalStages = state.totalStages;
        }
        console.log([BaseRepeatingQuest] Restored quest state: stage=${this.currentStage}, finished=${this.finished});
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
    StateManager.set(quest_state_${this.key}, JSON.stringify(state));
    console.log([BaseRepeatingQuest] Saved quest state: stage=${this.currentStage}, finished=${this.finished});
  }

  /**
   * activate – Activates the repeating quest.
   * Waits for the camera to be open (using a "cameraReady" event) if needed,
   * then starts the UI check loop and sets the "Open Camera" button active via ViewManager.
   * Also saves the quest record in the database with status "active".
   */
  async activate() {
    console.log(Activating repeating quest: ${this.key});
    await this.eventManager.addDiaryEntry(this.key, true);
    console.log([BaseRepeatingQuest] Repeating quest started with ${this.totalStages} stages);
    await this.app.databaseManager.saveQuestRecord({
      quest_key: this.key,
      status: "active",
      current_stage: this.currentStage,
      total_stages: this.totalStages
    });

    // Set activated flag to true
    this.activated = true;

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
    StateManager.set("shootButtonActive", "true");
    this.app.viewManager.restoreShootButtonState();
  }

  /**
   * startCheckLoop – Delegates UI initialization for the quest stage to ViewManager,
   * then awaits user action (via the shoot button).
   */
  startCheckLoop() {
    if (this.app.viewManager && typeof this.app.viewManager.startRepeatingQuestUI === 'function') {
      this.app.viewManager.startRepeatingQuestUI({
        statusElementId: this.statusElementId,
        shootButtonId: this.shootButtonId,
        stage: this.currentStage,
        totalStages: this.totalStages,
        onShoot: () => this.finishStage(),
        quest: this // Pass the current quest instance for status checking.
      });
    } else {
      console.error("[BaseRepeatingQuest] ViewManager.startRepeatingQuestUI is not available.");
    }
    console.log("[BaseRepeatingQuest] Repeating quest UI updated. Awaiting user action to capture snapshot.");
  }

  /**
   * restoreUI – Restores the UI for the repeating quest if a cycle is active.
   * Only restores UI if the quest has been activated.
   */
  restoreUI() {
    console.log("[BaseRepeatingQuest] Attempting to restore repeating quest UI...");
    if (!this.activated) {
      console.log("[BaseRepeatingQuest] Quest not activated; UI restoration skipped.");
      return;
    }
    if (this.finished) {
      console.log("[BaseRepeatingQuest] Quest is finished; UI restoration skipped.");
      return;
    }
    const record = this.app.databaseManager.getQuestRecord(this.key);
    if (!record || record.status !== "active") {
      console.log("[BaseRepeatingQuest] DB record is not active; UI restoration skipped.");
      return;
    }
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
   * Disables the "Shoot" button, captures a snapshot, logs the stage completion,
   * updates quest state, and enables the "Post" button for the next stage (if any).
   * 
   * IMPORTANT: After finishing a stage (if quest is not finished),
   * a "questCompleted" event is dispatched to notify GhostManager.
   */
async finishStage() {
  if (this.finished || !this.activated) {
    console.warn("[BaseRepeatingQuest] Finish stage called incorrectly.");
    return;
  }

  this.app.viewManager.setShootButtonActive(false);
  const photoData = this.captureSimplePhoto();
  await this.eventManager.addDiaryEntry(
    `repeating_stage_${this.currentStage} [photo attached]\n${photoData}`,
    false
  );
  
  this.currentStage++;
  this.saveState();

  if (this.currentStage <= this.totalStages) {
    await this.app.databaseManager.saveQuestRecord({
      quest_key: this.key,
      status: "active", // <- Важно! НЕ finished, a active
      current_stage: this.currentStage,
      total_stages: this.totalStages
    });
    if (this.app.viewManager) {
      this.app.viewManager.setPostButtonEnabled(true);
    }
    document.dispatchEvent(new CustomEvent("questCompleted", { detail: this.key }));
    this.activated = false;
  } else {
    await this.finishCompletely();
  }
}


  /**
   * finishCompletely – Finalizes the repeating quest.
   * Sets the quest as finished in the database, removes the quest state from StateManager,
   * and dispatches the questCompleted event to signal full completion.
   */
  async finishCompletely() {
    this.finished = true;
    await this.app.databaseManager.saveQuestRecord({
      quest_key: this.key,
      status: "finished",
      current_stage: this.currentStage,
      total_stages: this.totalStages
    });
    StateManager.remove(quest_state_${this.key});
    document.dispatchEvent(new CustomEvent("questCompleted", { detail: this.key }));
    console.log([BaseRepeatingQuest] Quest completely finished. questCompleted event dispatched.);
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
    this.activated = false;
    console.log("[BaseRepeatingQuest] Quest state has been reset for a new cycle.");
    this.saveState();
  }

  /**
   * getCurrentQuestStatus – Retrieves the current status of the repeating quest.
   * @returns {Promise<Object>} An object containing quest status information.
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

  /**
   * getRandomLetter – Utility function that returns a random letter from the ghost's name.
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