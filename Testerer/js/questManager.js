// --- Quest Classes ---
import { BaseMirrorQuest } from './quests/baseMirrorQuest.js';
import { BaseRepeatingQuest } from './quests/baseRepeatingQuest.js';
import { FinalQuest } from './quests/finalQuest.js';

// --- State and Error Management ---
import { StateManager } from './stateManager.js';
import { ErrorManager } from './errorManager.js';

/**
 * QuestManager class
 * Responsible for managing quest activation, state updates, and UI restoration.
 * All UI updates (e.g. disabling/enabling buttons) are delegated to ViewManager,
 * and all state access uses StateManager.
 */
export class QuestManager {
  /**
   * @param {EventManager} eventManager - The event manager handling diary entries.
   * @param {App} appInstance - The main application instance.
   */
  constructor(eventManager, appInstance) {
    this.eventManager = eventManager;
    this.app = appInstance;

    // Initialize quests with respective configurations.
    this.quests = [
      new BaseMirrorQuest(this.eventManager, this.app, { key: "mirror_quest" }),
      new BaseRepeatingQuest(this.eventManager, this.app, {
        key: "repeating_quest",
        totalStages: 5,
        statusElementId: "repeating-quest-status",
        shootButtonId: "btn_shoot"
      }),
      new FinalQuest(this.eventManager, this.app, { key: "final_quest" })
    ];

    // Set up camera-related event listeners.
    this.initCameraListeners();

    // Restore UI state for the repeating quest if previously saved.
    if (StateManager.get("quest_state_repeating_quest")) {
      this.restoreRepeatingQuestUI();
    }

    // Optionally, restore any other UI states via ViewManager here.
    if (this.app.viewManager && typeof this.app.viewManager.restoreCameraButtonState === 'function') {
      this.app.viewManager.restoreCameraButtonState();
    }
  }

  /**
   * initCameraListeners
   * Registers listeners for camera readiness and closure events.
   */
  initCameraListeners() {
    const cameraManager = this.app.cameraSectionManager;
    if (!cameraManager) return;
    cameraManager.onVideoReady = () => {
      console.log("[QuestManager] onVideoReady signal received.");
    };
    cameraManager.onCameraClosed = () => {
      console.log("[QuestManager] onCameraClosed signal received.");
    };
  }

  /**
   * syncQuestState
   * NEW: Synchronizes the current quest state from the database.
   * Checks for an active quest (mirror or repeating) and, if found with a status not "finished",
   * sets the "postButtonDisabled" flag in StateManager and disables the Post button via ViewManager.
   * Otherwise, ensures the Post button is enabled.
   */
  async syncQuestState() {
    const mirrorQuestRecord = this.app.databaseManager.getQuestRecord("mirror_quest");
    const repeatingQuestRecord = this.app.databaseManager.getQuestRecord("repeating_quest");
    const activeQuestRecord = mirrorQuestRecord || repeatingQuestRecord;

    if (activeQuestRecord && activeQuestRecord.status !== "finished") {
      StateManager.set("postButtonDisabled", "true");
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
        this.app.viewManager.setPostButtonEnabled(false);
      }
      console.log("QuestManager.syncQuestState: Active quest detected, post button disabled.");
    } else {
      StateManager.set("postButtonDisabled", "false");
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
        this.app.viewManager.setPostButtonEnabled(true);
      }
      console.log("QuestManager.syncQuestState: No active quest or quest finished, post button enabled.");
    }
  }

  /**
   * activateQuest
   * Finds a quest by its key and activates it.
   * @param {string} key - The quest key.
   */
  async activateQuest(key) {
    const quest = this.quests.find(q => q.key === key);
    if (!quest) {
      console.warn(`[QuestManager] Quest with key "${key}" not found.`);
      return;
    }
    await quest.activate();
  }

  /**
   * checkQuest
   * Checks and finalizes the quest by calling its finish() method.
   * @param {string} key - The quest key.
   */
  async checkQuest(key) {
    const quest = this.quests.find(q => q.key === key);
    if (!quest) {
      console.warn(`[QuestManager] Cannot check quest "${key}": not found.`);
      return;
    }
    await quest.finish();
  }

  /**
   * handleShootMirrorQuest
   * Called when the "Shoot" button is clicked during the mirror quest.
   */
  async handleShootMirrorQuest() {
    console.log("[QuestManager] handleShootMirrorQuest() called.");
    await this.checkQuest("mirror_quest");
  }

  /**
   * handlePostButtonClick
   * Called when the "Post" button is clicked.
   * Depending on the state flags (using StateManager), triggers either the mirror quest or repeating quest.
   * Delegates UI updates (e.g. disabling/enabling buttons) to the ViewManager.
   *
   * NEW: Sets a persistent flag "postButtonDisabled" in StateManager and
   * calls the universal method getCurrentQuestStatus() from the base quest class
   * to verify and log the current quest status.
   */
  async handlePostButtonClick() {
    // Disable the post button via ViewManager.
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
      this.app.viewManager.setPostButtonEnabled(false);
      console.log("[QuestManager] Post button disabled immediately after click.");
    }
    // Set persistent flag in StateManager.
    StateManager.set("postButtonDisabled", "true");

    // If the repeating quest is finished, do not start a new cycle.
    const repeatingQuest = this.quests.find(q => q.key === "repeating_quest");
    if (repeatingQuest && repeatingQuest.finished) {
      ErrorManager.showError("Repeating quest is finished. Final event has been activated.");
      return;
    }
    
    // Check readiness flag for mirror quest via StateManager.
    const isReady = StateManager.get("mirrorQuestReady") === "true";
    if (!isReady) {
      ErrorManager.showError("Repeating quest is not ready.");
      return;
    }
    
    // Remove the readiness flag immediately to prevent reactivation.
    StateManager.remove("mirrorQuestReady");
    
    // Activate the "Open Camera" button via ViewManager.
    if (this.app.viewManager && typeof this.app.viewManager.setCameraButtonActive === 'function') {
      this.app.viewManager.setCameraButtonActive(true);
    }
    
    // Universal check of current quest status using base class method.
    if (StateManager.get("isRepeatingCycle") === "true") {
      console.log("[QuestManager] Checking status for repeating quest...");
      const status = await repeatingQuest.getCurrentQuestStatus();
      console.log("[QuestManager] Current repeating quest status:", status);
      console.log("[QuestManager] Triggering repeating quest from handlePostButtonClick.");
      await this.activateQuest("repeating_quest");
    } else {
      const mirrorQuest = this.quests.find(q => q.key === "mirror_quest");
      console.log("[QuestManager] Checking status for mirror quest...");
      const status = await mirrorQuest.getCurrentQuestStatus();
      console.log("[QuestManager] Current mirror quest status:", status);
      console.log("[QuestManager] Triggering mirror quest from handlePostButtonClick.");
      await this.activateQuest("mirror_quest");
    }
  }

  /**
   * updateQuestProgress
   * Updates the quest progress in the database.
   * @param {string} questKey - The key of the quest.
   * @param {number} currentStage - The current stage of the quest.
   * @param {number} totalStages - The total number of stages.
   * @param {string} status - The status of the quest.
   */
  async updateQuestProgress(questKey, currentStage, totalStages, status) {
    const questData = {
      quest_key: questKey,
      current_stage: currentStage,
      total_stages: totalStages,
      status
    };
    await this.app.databaseManager.saveQuestRecord(questData);
    console.log("Quest progress updated:", questData);
  }

  /**
   * restoreRepeatingQuestUI
   * Restores the UI for the repeating quest by delegating the UI restoration to the quest instance.
   */
  restoreRepeatingQuestUI() {
    const repeatingQuest = this.quests.find(q => q.key === "repeating_quest");
    if (repeatingQuest && typeof repeatingQuest.restoreUI === "function") {
      console.log("[QuestManager] Restoring repeating quest UI...");
      repeatingQuest.restoreUI();
    }
  }
}