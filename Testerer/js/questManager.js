import { BaseMirrorQuest } from './quests/baseMirrorQuest.js';
import { BaseRepeatingQuest } from './quests/baseRepeatingQuest.js';
import { FinalQuest } from './quests/finalQuest.js';
import { StateManager } from './stateManager.js';
import { ErrorManager } from './errorManager.js';

export class QuestManager {
  /**
   * @param {EventManager} eventManager - The event manager for diary operations.
   * @param {App} appInstance - The main application instance.
   */
  constructor(eventManager, appInstance) {
    this.eventManager = eventManager;
    this.app = appInstance;

    // Initialize quests.
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

    this.initCameraListeners();

    // Restore UI states upon initialization via ViewManager.
    if (this.app.viewManager && typeof this.app.viewManager.restoreCameraButtonState === 'function') {
      this.app.viewManager.restoreCameraButtonState();
    }
    // If a repeating quest state is saved, restore its UI via StateManager.
    if (StateManager.get("quest_state_repeating_quest")) {
      this.restoreRepeatingQuestUI();
    }
  }

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
   * activateQuest – Finds and activates a quest by key.
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
   * checkQuest – Checks the quest by calling its finish() method.
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
   * handleShootMirrorQuest – Called when the "Shoot" button is clicked during the mirror quest.
   */
  async handleShootMirrorQuest() {
    console.log("[QuestManager] handleShootMirrorQuest() called.");
    await this.checkQuest("mirror_quest");
  }

  /**
   * handlePostButtonClick – Called when the "Post" button is clicked.
   * Triggers either the repeating quest or mirror quest based on flags.
   */
  async handlePostButtonClick() {
    // Disable the post button via ViewManager.
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
      this.app.viewManager.setPostButtonEnabled(false);
      console.log("[QuestManager] Post button disabled immediately after click.");
    }

    // If a repeating quest exists and is finished, do not start a new cycle.
    const repeatingQuest = this.quests.find(q => q.key === "repeating_quest");
    if (repeatingQuest && repeatingQuest.finished) {
      ErrorManager.showError("Repeating quest is finished. Final event has been activated.");
      return;
    }
    
    // Check readiness flag via StateManager.
    const isReady = StateManager.get("mirrorQuestReady") === "true";
    if (!isReady) {
      ErrorManager.showError("Repeating quest is not ready.");
      return;
    }
    
    // Remove the readiness flag immediately to prevent reactivation.
    StateManager.remove("mirrorQuestReady");
    
    // Set Open Camera button active state via ViewManager.
    if (this.app.viewManager && typeof this.app.viewManager.setCameraButtonActive === 'function') {
      this.app.viewManager.setCameraButtonActive(true);
    }
    
    // Determine if repeating cycle mode is active using StateManager.
    const isRepeating = StateManager.get("isRepeatingCycle") === "true";
    if (isRepeating) {
      console.log("[QuestManager] Triggering repeating quest from handlePostButtonClick.");
      await this.activateQuest("repeating_quest");
    } else {
      console.log("[QuestManager] Triggering mirror quest from handlePostButtonClick.");
      await this.activateQuest("mirror_quest");
    }
  }

  /**
   * updateQuestProgress – Updates the quest progress in the database.
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
   * restoreRepeatingQuestUI – Delegates UI restoration for the repeating quest to the quest instance.
   */
  restoreRepeatingQuestUI() {
    const repeatingQuest = this.quests.find(q => q.key === "repeating_quest");
    if (repeatingQuest && typeof repeatingQuest.restoreUI === "function") {
      console.log("[QuestManager] Restoring repeating quest UI...");
      repeatingQuest.restoreUI();
    }
  }
}