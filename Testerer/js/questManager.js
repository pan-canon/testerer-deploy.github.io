// --- Quest Classes ---
import { BaseMirrorQuest } from './quests/baseMirrorQuest.js';
import { BaseRepeatingQuest } from './quests/baseRepeatingQuest.js';
import { FinalQuest } from './quests/finalQuest.js';

// --- State and Error Management ---
import { StateManager } from './stateManager.js';
import { ErrorManager } from './errorManager.js';

/**
 * QuestManager class
 * 
 * Responsible for managing quest activation, state updates, and UI restoration.
 * All UI updates (e.g. disabling/enabling buttons) are delegated to ViewManager,
 * and all state access uses StateManager.
 *
 * NOTE: Последовательное связывание событий и квестов теперь осуществляется через API GhostManager.
 *       QuestManager остаётся ответственным за непосредственную активацию квестов и обновление UI.
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

    // Optionally, restore additional UI states (e.g. camera button state).
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
      // ADDED (пример, если хотим что-то делать при закрытии камеры)
      // this.app.viewManager.setCameraButtonActive(false);
    };
  }

  /**
   * syncQuestState
   * Synchronizes the current quest state from the database.
   * 
   * - Checks if game is finalized -> disable Post
   * - Checks if there's an active quest (mirror or repeating) -> disable Post
   * - Otherwise -> enable Post
   */
  async syncQuestState() {
    // Check if the game has been finalized (final quest completed)
    if (StateManager.get("gameFinalized") === "true") {
      StateManager.set("postButtonDisabled", "true");
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
        this.app.viewManager.setPostButtonEnabled(false);
      }
      console.log("QuestManager.syncQuestState: Game finalized; post button disabled.");
      return;
    }

    // Retrieve quest records for mirror and repeating quests from the database.
    const mirrorQuestRecord = this.app.databaseManager.getQuestRecord("mirror_quest");
    const repeatingQuestRecord = this.app.databaseManager.getQuestRecord("repeating_quest");
    const activeQuestRecord = mirrorQuestRecord || repeatingQuestRecord;

    // If an active quest is detected and its status is not "finished"
    if (activeQuestRecord && activeQuestRecord.status !== "finished") {
      StateManager.set("postButtonDisabled", "true");
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
        this.app.viewManager.setPostButtonEnabled(false);
      }
      console.log("QuestManager.syncQuestState: Active quest detected, post button disabled.");
    } else {
      // No active quest or quest finished: enable the Post button.
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

    // ADDED: После активации квеста сразу обновим UI, чтобы "Пост" стал disabled (если квест активен)
    await this.syncQuestState();
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

    // ADDED: После завершения квеста заново синхронизируем UI
    await this.syncQuestState();
  }

  /**
   * handleShootMirrorQuest
   * Called when the "Shoot" button is clicked during the mirror quest.
   */
  async handleShootMirrorQuest() {
    console.log("[QuestManager] handleShootMirrorQuest() called.");
    await this.checkQuest("mirror_quest");
    // CHANGED: теперь после checkQuest() → syncQuestState() вызывается в самом checkQuest().
  }

  /**
   * handlePostButtonClick
   * Handles the click event for the "Post" button.
   * 
   * - Immediately disables "Post".
   * - Checks if game is finalized => abort.
   * - Checks mirrorQuestReady => if false => error.
   * - If repeating quest is finished => error.
   * - Otherwise removes mirrorQuestReady, activates camera, and starts the quest.
   */
  async handlePostButtonClick() {
    // If game is finalized, do not process the button click.
    if (StateManager.get("gameFinalized") === "true") {
      ErrorManager.showError("The game has been finalized. No further posts are allowed.");
      return;
    }

    // Disable the Post button immediately via ViewManager.
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
      this.app.viewManager.setPostButtonEnabled(false);
      console.log("[QuestManager] Post button disabled immediately after click.");
    }
    // Set persistent flag to indicate Post button is disabled.
    StateManager.set("postButtonDisabled", "true");

    // If the repeating quest is finished, do not start a new cycle.
    const repeatingQuest = this.quests.find(q => q.key === "repeating_quest");
    if (repeatingQuest && repeatingQuest.finished) {
      ErrorManager.showError("Repeating quest is finished. Final event has been activated.");
      return;
    }
    
    // Check the readiness flag for the mirror quest.
    const isReady = StateManager.get("mirrorQuestReady") === "true";
    if (!isReady) {
      ErrorManager.showError("Repeating quest is not ready.");
      return;
    }
    
    // Remove the readiness flag immediately to prevent multiple activations.
    StateManager.remove("mirrorQuestReady");
    
    // Activate the "Open Camera" button via ViewManager to indicate camera readiness.
    if (this.app.viewManager && typeof this.app.viewManager.setCameraButtonActive === 'function') {
      this.app.viewManager.setCameraButtonActive(true);
    }
    
    // Determine which quest to activate based on the "isRepeatingCycle" flag.
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
   * Saves the quest progress to the database (delegated to DatabaseManager).
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