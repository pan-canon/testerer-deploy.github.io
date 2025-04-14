// File: src/quests/BaseRepeatingQuest.js

import { BaseEvent } from '../events/BaseEvent.js';
import { ImageUtils } from '../utils/ImageUtils.js';
import { StateManager } from '../managers/StateManager.js';
import { ErrorManager } from '../managers/ErrorManager.js';

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
    StateManager.set("shootButtonActive", "true");
    if (this.app.viewManager && typeof this.app.viewManager.restoreShootButtonState === 'function') {
      this.app.viewManager.restoreShootButtonState();
    }
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
   * This method checks the DB record and, if the quest is active,
   * sets a local flag and restores the UI via ViewManager.
   */
  restoreUI() {
    console.log("[BaseRepeatingQuest] Attempting to restore repeating quest UI...");

    // Retrieve the DB record for this quest.
    const record = this.app.databaseManager.getQuestRecord(this.key);
    
    // If there is no record or the status is not "active", skip restoration.
    if (!record || record.status !== "active") {
      console.log("[BaseRepeatingQuest] DB record is not active; UI restoration skipped.");
      return;
    }
    
    // If the quest is finished locally, skip restoration.
    if (this.finished) {
      console.log("[BaseRepeatingQuest] Quest is finished; UI restoration skipped.");
      return;
    }
    
    // If the quest was not activated locally (e.g. after a page reload), mark it as activated.
    if (!this.activated) {
      console.log("[BaseRepeatingQuest] Quest not activated locally; setting activated=true based on DB record.");
      this.activated = true;
    }
    
    // Function to restore UI state.
    const restoreButtonState = () => {
      this.startCheckLoop(); // This will reinitialize the repeating quest UI via ViewManager.
      if (this.currentStage <= this.totalStages && this.app.isCameraOpen) {
        if (this.app.viewManager && typeof this.app.viewManager.setShootButtonActive === 'function') {
          this.app.viewManager.setShootButtonActive(true);
          console.log("[BaseRepeatingQuest] Shoot button state restored as active.");
        }
      }
    };

    // Если камера не открыта, ждём события "cameraReady".
    if (!this.app.isCameraOpen) {
      document.addEventListener("cameraReady", restoreButtonState, { once: true });
    } else {
      restoreButtonState();
    }
  }

  /**
   * finishStage – Completes one stage of the repeating quest.
   * Disables the "Shoot" button, captures a snapshot, logs stage completion,
   * updates quest state, and enables the "Post" button for the next stage (if any).
   * After finishing a stage (если квест не завершён полностью), dispatches a "questCompleted" event.
   */
  async finishStage() {
    if (this.finished) return;

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
      // Для промежуточных этапов помечаем квестовую запись как "finished"
      // чтобы создать новый экземпляр квеста на следующем этапе.
      await this.app.databaseManager.saveQuestRecord({
        quest_key: this.key,
        status: "finished",
        current_stage: this.currentStage,
        total_stages: this.totalStages
      });
      // Включаем Post кнопку для следующего этапа через ViewManager.
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
        this.app.viewManager.setPostButtonEnabled(true);
        console.log("[BaseRepeatingQuest] Post button enabled for next stage.");
      }
      // Уведомляем о завершении этапа repeating quest.
      document.dispatchEvent(new CustomEvent("questCompleted", { detail: this.key }));
      console.log("[BaseRepeatingQuest] questCompleted event dispatched for repeating quest stage.");
    } else {
      // Если текущий этап превышает общее число, завершаем квест полностью.
      await this.finishCompletely();
    }
  }

  /**
   * finishCompletely – Finalizes the repeating quest.
   * Сохраняет конечное состояние в базе данных, удаляет локальное состояние квеста из StateManager,
   * и диспатчит событие "questCompleted" для сигнализации полной завершённости.
   */
  async finishCompletely() {
    this.finished = true;
    await this.app.databaseManager.saveQuestRecord({
      quest_key: this.key,
      status: "finished",
      current_stage: this.currentStage,
      total_stages: this.totalStages
    });
    StateManager.remove(`quest_state_${this.key}`);
    document.dispatchEvent(new CustomEvent("questCompleted", { detail: this.key }));
    console.log(`[BaseRepeatingQuest] Quest completely finished. questCompleted event dispatched.`);
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
   * getCurrentQuestStatus – Retrieves the current status of the repeating quest.
   * Checks if the universal active quest key matches this quest's key.
   * @returns {Promise<Object>} An object containing quest status information.
   */
  async getCurrentQuestStatus() {
    const record = this.app.databaseManager.getQuestRecord(this.key);
    const active = (StateManager.get("activeQuestKey") === this.key);
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