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
 */
export class QuestManager {
  /**
   * Constructor for QuestManager.
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
    };
  }

  /**
   * syncQuestState
   * Synchronizes the current quest state from the database.
   * 
   * This method checks if there is an active quest (mirror or repeating) in the database.
   * If an active quest exists and its status is not "finished", it sets the 
   * "postButtonDisabled" flag in StateManager and disables the Post button via ViewManager.
   * Additionally, if the game is finalized (flag "gameFinalized" set), the Post button remains disabled.
   * Otherwise, it enables the Post button.
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
   * Handles the click event for the "Post" button.
   * 
   * This method disables the Post button immediately and sets the corresponding flag.
   * It then checks for the current event step to decide whether to activate a quest or display an error message.
   */
  async handlePostButtonClick() {
    // If game is finalized, do not process the button click.
    if (StateManager.get("gameFinalized") === "true") {
      ErrorManager.showError("The game has been finalized. No further posts are allowed.");
      return;
    }

    // First, set the persistent flag to disable the Post button.
    StateManager.set("postButtonDisabled", "true");
    
    // Then, immediately disable the Post button via ViewManager.
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
      this.app.viewManager.setPostButtonEnabled(false);
      console.log("[QuestManager] Post button disabled immediately after click.");
    }

    // Get the current event step from GhostManager.
    const currentStep = this.app.ghostManager.getCurrentEventStep();
    if (!currentStep) {
      ErrorManager.showError("No active event found.");
      return;
    }
    console.log("[QuestManager] Current event step:", currentStep);

    // Determine quest activation based on the current event step.
    switch (currentStep.name) {
      case 'welcome':
        // If welcome event is active and not yet started, allow activation.
        if (currentStep.status === 'not_started') {
          // Transition from welcome to mirror quest.
          this.app.ghostManager.updateEventStepStatus('welcome', 'finished');
          this.app.ghostManager.updateEventStepStatus('mirror', 'in_progress');
          console.log("[QuestManager] Transitioning from welcome to mirror quest.");
          await this.activateQuest("mirror_quest");
        } else {
          ErrorManager.showError("Нечего постить.");
        }
        break;
      case 'mirror':
        // If mirror quest is already in progress or finished, disable posting.
        ErrorManager.showError("Нечего постить.");
        break;
      case 'repeating':
        // For repeating event, check if the quest is not started and within the allowed window.
        if (currentStep.status === 'not_started') {
          if (StateManager.get("isRepeatingCycle") === "true") {
            this.app.ghostManager.updateEventStepStatus('repeating', 'in_progress');
            console.log("[QuestManager] Activating repeating quest.");
            await this.activateQuest("repeating_quest");
          } else {
            ErrorManager.showError("Повторяющийся квест не готов.");
          }
        } else {
          ErrorManager.showError("Нечего постить.");
        }
        break;
      case 'final':
        // Final event – game is over.
        ErrorManager.showError("Игра завершена.");
        break;
      default:
        ErrorManager.showError("Invalid event state.");
        break;
    }
  }

  /**
   * updateQuestProgress
   * Updates the quest progress in the database.
   * 
   * Constructs a quest progress object and delegates saving the record to the DatabaseManager.
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