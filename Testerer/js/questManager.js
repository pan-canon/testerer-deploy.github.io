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
      // If you want to auto-reset camera UI here, you can do so.
    };
  }

  /**
   * syncQuestState
   * Synchronizes the current quest state from the database.
   * 
   * 1) Если welcomeDone !== "true", «Пост» отключена.
   * 2) Если gameFinalized === "true", «Пост» отключена.
   * 3) Если есть активный (не finished) квест (mirror или repeating), «Пост» отключена.
   * 4) Иначе «Пост» включена.
   */
  async syncQuestState() {
    // NEW: Пока welcome не выполнен, блокируем «Пост».
    if (StateManager.get("welcomeDone") !== "true") {
      console.log("[QuestManager.syncQuestState] Blocking Post because welcomeDone is not set.");
      StateManager.set("postButtonDisabled", "true");
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
        this.app.viewManager.setPostButtonEnabled(false);
      }
      return;
    }

    // If the game has been finalized (final quest completed).
    if (StateManager.get("gameFinalized") === "true") {
      StateManager.set("postButtonDisabled", "true");
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
        this.app.viewManager.setPostButtonEnabled(false);
      }
      console.log("[QuestManager.syncQuestState] Game finalized; post button disabled.");
      return;
    }

    // Check active quest records for mirror or repeating quest.
    const mirrorQuestRecord = this.app.databaseManager.getQuestRecord("mirror_quest");
    const repeatingQuestRecord = this.app.databaseManager.getQuestRecord("repeating_quest");
    const activeQuestRecord = mirrorQuestRecord && mirrorQuestRecord.status !== "finished"
                              ? mirrorQuestRecord
                              : repeatingQuestRecord && repeatingQuestRecord.status !== "finished"
                                ? repeatingQuestRecord
                                : null;

    if (activeQuestRecord) {
      StateManager.set("postButtonDisabled", "true");
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
        this.app.viewManager.setPostButtonEnabled(false);
      }
      console.log("[QuestManager.syncQuestState] Active quest detected, post button disabled.");
    } else {
      StateManager.set("postButtonDisabled", "false");
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
        this.app.viewManager.setPostButtonEnabled(true);
      }
      console.log("[QuestManager.syncQuestState] No active quest, post button enabled.");
    }
  }

  /**
   * activateQuest
   * Finds a quest by its key and activates it, then calls syncQuestState() to update UI accordingly.
   * @param {string} key - The quest key.
   */
  async activateQuest(key) {
    const quest = this.quests.find(q => q.key === key);
    if (!quest) {
      console.warn(`[QuestManager] Quest with key "${key}" not found.`);
      return;
    }
    await quest.activate();
    await this.syncQuestState(); // Post button might be disabled after quest activation
  }

  /**
   * checkQuest
   * Finalizes a quest by calling finish() on it, then calls syncQuestState().
   * @param {string} key - The quest key.
   */
  async checkQuest(key) {
    const quest = this.quests.find(q => q.key === key);
    if (!quest) {
      console.warn(`[QuestManager] Cannot check quest "${key}": not found.`);
      return;
    }
    await quest.finish();
    await this.syncQuestState(); // Re-enable Post if no active quest
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
   * 1) Сразу отключает «Пост» (чтобы не нажимали повторно).
   * 2) Если игра финализирована => отказ.
   * 3) Проверяем mirrorQuestReady => если false => отказ.
   * 4) Сбрасываем mirrorQuestReady, включаем камеру, и...
   * 5) **Убираем** логику isRepeatingCycle. Всегда запускаем mirror_quest через GhostManager.
   */
  async handlePostButtonClick() {
    // 1) Disable Post immediately
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
      this.app.viewManager.setPostButtonEnabled(false);
      console.log("[QuestManager] Post button disabled immediately after click.");
    }
    StateManager.set("postButtonDisabled", "true");

    // 2) If game finalized, abort
    if (StateManager.get("gameFinalized") === "true") {
      ErrorManager.showError("The game has been finalized. No further posts are allowed.");
      return;
    }

    // 3) Check mirrorQuestReady
    if (StateManager.get("mirrorQuestReady") !== "true") {
      ErrorManager.showError("No event is ready to post yet. (mirrorQuestReady is false)");
      return;
    }

    // 4) Remove mirrorQuestReady, turn on camera button
    StateManager.remove("mirrorQuestReady");
    if (this.app.viewManager && typeof this.app.viewManager.setCameraButtonActive === 'function') {
      this.app.viewManager.setCameraButtonActive(true);
    }

    // 5) **Новая логика**: всегда запускаем mirror_quest через GhostManager (который потом передаст эстафету).
    console.log("[QuestManager] Triggering 'mirror_quest' via GhostManager chain.");
    this.app.ghostManager.startQuest("mirror_quest");
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