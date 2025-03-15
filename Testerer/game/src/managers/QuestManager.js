// --- Quest Classes ---
import { BaseMirrorQuest } from '../quests/BaseMirrorQuest.js';
import { BaseRepeatingQuest } from '../quests/BaseRepeatingQuest.js';
import { FinalQuest } from '../quests/FinalQuest.js';

// --- State and Error Management ---
import { StateManager } from './StateManager.js';
import { ErrorManager } from './ErrorManager.js';

/**
 * QuestManager class
 * 
 * Responsible for managing quest activation, state updates, and UI restoration.
 * All UI updates (e.g., enabling/disabling buttons) are delegated to ViewManager,
 * and all state access uses StateManager.
 *
 * NOTE: Sequential linking of events and quests is now handled exclusively by GhostManager.
 *       QuestManager is solely responsible for directly activating quests and updating the UI.
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
      console.log("[QuestManager] Detected saved state for repeating quest.");
      this.restoreRepeatingQuestUI();
    }

    // Optionally, restore additional UI states (e.g., camera button state).
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
      // Optionally, deactivate the camera button when the camera is closed.
      // this.app.viewManager.setCameraButtonActive(false);
    };
  }

  /**
   * syncQuestState
   * Synchronizes the current quest state from the database.
   * - If the game is finalized, disable the Post button.
   * - If an active quest is detected (mirror or repeating) and not finished, disable the Post button.
   * - Otherwise, enable the Post button.
   */
  async syncQuestState() {
    if (StateManager.get("gameFinalized") === "true" || StateManager.get("questActive") === "true") {
      StateManager.set("postButtonDisabled", "true");
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
        this.app.viewManager.setPostButtonEnabled(false);
      }
      console.log("[QuestManager.syncQuestState] Game finalized; Post button disabled.");
      return;
    }
    const mirrorQuestRecord = this.app.databaseManager.getQuestRecord("mirror_quest");
    const repeatingQuestRecord = this.app.databaseManager.getQuestRecord("repeating_quest");
    console.log("[QuestManager.syncQuestState] mirrorQuestRecord:", mirrorQuestRecord);
    console.log("[QuestManager.syncQuestState] repeatingQuestRecord:", repeatingQuestRecord);
    const activeQuestRecord = mirrorQuestRecord || repeatingQuestRecord;
    if (activeQuestRecord && activeQuestRecord.status !== "finished") {
      StateManager.set("postButtonDisabled", "true");
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
        this.app.viewManager.setPostButtonEnabled(false);
      }
      console.log("[QuestManager.syncQuestState] Active quest detected; Post button disabled.");
    } else {
      StateManager.set("postButtonDisabled", "false");
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
        this.app.viewManager.setPostButtonEnabled(true);
      }
      console.log("[QuestManager.syncQuestState] No active quest or quest finished; Post button enabled.");
    }
  }

  /**
   * canStartQuest - Unified method to determine if a quest can be started.
   *
   * For the repeating quest, we allow starting if the DB record exists with status "inactive"
   * (meaning the previous stage was completed) but not if the record is "active".
   *
   * @param {string} questKey - The key of the quest to be started.
   * @returns {boolean} True if the quest can be launched, false otherwise.
   */
  canStartQuest(questKey) {
    const record = this.app.databaseManager.getQuestRecord(questKey);
    if (questKey === "repeating_quest") {
      if (record && record.status === "active") {
        console.warn(`Repeating quest "${questKey}" is already active.`);
        return false;
      }
      // If record exists with status "inactive" or doesn't exist, it's ok to start.
    } else {
      if (record && record.status !== "finished") {
        console.warn(`Quest "${questKey}" is already active with status "${record.status}".`);
        return false;
      }
    }
    const activeQuestKey = StateManager.get("activeQuestKey");
    if (activeQuestKey) {
      console.warn(`Another quest "${activeQuestKey}" is already active, cannot start quest "${questKey}".`);
      return false;
    }
    if (!this.isNextInSequence(questKey)) {
      console.error(`Quest "${questKey}" is not the next expected quest in the sequence.`);
      return false;
    }
    return true;
  }

  /**
   * activateQuest
   * Finds a quest by its key and activates it.
   * This method activates the quest and then calls syncQuestState() to update the UI.
   *
   * @param {string} key - The quest key.
   */
  async activateQuest(key) {
    const quest = this.quests.find(q => q.key === key);
    if (!quest) {
      console.warn(`[QuestManager] Quest with key "${key}" not found.`);
      return;
    }
    console.log(`[QuestManager] Activating quest: ${key}`);
    await quest.activate();
    await this.syncQuestState();
  }

  /**
   * checkQuest
   * Finalizes the quest by calling its finish() method.
   * Then, updates the UI state.
   *
   * @param {string} key - The quest key.
   */
  async checkQuest(key) {
    const quest = this.quests.find(q => q.key === key);
    if (!quest) {
      console.warn(`[QuestManager] Cannot check quest "${key}": not found.`);
      return;
    }
    console.log(`[QuestManager] Finishing quest: ${key}`);
    await quest.finish();
    await this.syncQuestState();
  }

  /**
   * updateQuestProgress
   * Saves the quest progress to the database.
   *
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
    console.log("[QuestManager] Quest progress updated:", questData);
  }

  /**
   * restoreRepeatingQuestUI
   * Restores the UI for the repeating quest by delegating the restoration to the quest instance.
   */
  restoreRepeatingQuestUI() {
    const repeatingQuest = this.quests.find(q => q.key === "repeating_quest");
    if (repeatingQuest && typeof repeatingQuest.restoreUI === "function") {
      console.log("[QuestManager] Restoring repeating quest UI...");
      repeatingQuest.restoreUI();
    }
  }

  /**
   * restoreAllActiveQuests
   * Scans through all quests, retrieves their database records, and if a quest is considered active –
   * i.e. its DB record exists with status "active" (or, for repeating quests, "inactive" indicating previous stage completed)
   * and the quest is not marked as finished locally – calls its restoreUI() method.
   */
  restoreAllActiveQuests() {
    console.log("[QuestManager] Attempting to restore UI for all active quests...");
    this.quests.forEach(quest => {
      const record = this.app.databaseManager.getQuestRecord(quest.key);
      // For repeating quest, consider it active if status is either "active" or "inactive" (pending activation) and not finished.
      if (quest.key === "repeating_quest") {
        if (record && (record.status === "active" || record.status === "inactive") && !quest.finished) {
          console.log(`[QuestManager] Found repeating quest "${quest.key}" with status "${record.status}". Restoring UI...`);
          if (typeof quest.restoreUI === "function") {
            quest.restoreUI();
          } else {
            console.log(`[QuestManager] Quest "${quest.key}" does not implement restoreUI().`);
          }
        }
      } else {
        if (record && record.status === "active" && !quest.finished) {
          console.log(`[QuestManager] Found active quest "${quest.key}". Restoring UI...`);
          if (typeof quest.restoreUI === "function") {
            quest.restoreUI();
          } else {
            console.log(`[QuestManager] Quest "${quest.key}" does not implement restoreUI().`);
          }
        }
      }
    });
  }

  /**
   * handlePostButtonClick
   * Called when the "Post" button is clicked.
   * If no quest is active, it retrieves the next sequence entry and uses the unified check
   * to ensure that the quest can be started.
   */
  async handlePostButtonClick() {
    // Immediately disable the "Post" button to prevent repeated clicks.
    this.app.viewManager.setPostButtonEnabled(false);

    const nextEntry = this.sequenceManager ? this.sequenceManager.getCurrentEntry() : null;
    if (!nextEntry) {
      console.warn("No next sequence entry found.");
      return;
    }
    console.log(`GhostManager: Handling Post button click. Next expected quest: ${nextEntry.questKey}`);

    // Use the unified check to determine if the quest can be started.
    if (!this.canStartQuest(nextEntry.questKey)) {
      return;
    }
    // For repeating quest, if a record exists with status "inactive", update it to active.
    if (nextEntry.questKey === "repeating_quest") {
      const record = this.app.databaseManager.getQuestRecord("repeating_quest");
      if (record && record.status === "inactive") {
        console.log("Re-activating repeating quest from inactive state.");
        record.status = "active";
        await this.app.databaseManager.saveQuestRecord(record);
      }
    }
    await this.startQuest(nextEntry.questKey);
  }

  /**
   * onEventCompleted
   * Called when a game event completes.
   * If the completed event matches the expected event in the sequence,
   * increments the sequence index.
   *
   * @param {string} eventKey - The completed event key.
   */
  onEventCompleted(eventKey) {
    console.log(`GhostManager: Event completed with key: ${eventKey}`);
    if (this.sequenceManager && this.sequenceManager.getCurrentEntry().nextEventKey === eventKey) {
      this.sequenceManager.increment();
      StateManager.set(StateManager.KEYS.CURRENT_SEQUENCE_INDEX, String(this.sequenceManager.currentIndex));
      console.log(`GhostManager: Sequence index incremented to ${this.sequenceManager.currentIndex}`);
    }
  }

  /**
   * onQuestCompleted
   * Called when a quest completes.
   * For repeating quests, if the quest record in the DB is active (and the quest was activated),
   * triggers the dynamic event for the current stage. Otherwise, if the quest is finished,
   * triggers the final event.
   *
   * @param {string} questKey - The completed quest key.
   */
  async onQuestCompleted(questKey) {
    console.log(`GhostManager: Quest completed with key: ${questKey}`);
    // Clear the active quest key.
    this.activeQuestKey = null;
    StateManager.remove("activeQuestKey");

    if (questKey === "repeating_quest") {
      const repeatingQuest = this.app.questManager.quests.find(q => q.key === "repeating_quest");
      const questStatus = repeatingQuest
        ? await repeatingQuest.getCurrentQuestStatus()
        : { finished: false, currentStage: 1, dbStatus: "not recorded" };

      console.log("Repeating quest status:", questStatus);

      // If the repeating quest is active in DB and was activated via POST,
      // trigger the next dynamic event for the current stage.
      if (questStatus.dbStatus === "active" && !questStatus.finished && repeatingQuest.activated) {
        const dynamicEventKey = `post_repeating_event_stage_${questStatus.currentStage}`;
        console.log(`Repeating quest stage completed. Triggering ghost event: ${dynamicEventKey} without sequence increment.`);
        await this.startEvent(dynamicEventKey, true);
        return;
      } else if (!questStatus.finished) {
        console.log("Repeating quest is not truly active (or not activated); skipping dynamic event for this stage.");
        return;
      } else {
        console.log("Repeating quest fully completed. Now starting ghost event: final_event");
        await this.startEvent("final_event", true);
        this.sequenceManager.increment();
        StateManager.set(StateManager.KEYS.CURRENT_SEQUENCE_INDEX, String(this.sequenceManager.currentIndex));
        return;
      }
    }

    const currentEntry = this.sequenceManager ? this.sequenceManager.getCurrentEntry() : null;
    if (currentEntry && currentEntry.questKey === questKey && currentEntry.nextEventKey) {
      console.log(`GhostManager: Quest completed. Now starting ghost event: ${currentEntry.nextEventKey}`);
      await this.startEvent(currentEntry.nextEventKey, true);
    }
  }
}