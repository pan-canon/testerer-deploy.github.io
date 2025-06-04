// File: src/managers/QuestManager.js

import { StateManager } from './StateManager.js';
import { ErrorManager } from './ErrorManager.js';
import { loadGameEntitiesConfig, getQuestKeyToEventKeyMap } from '../utils/GameEntityLoader.js';

/**
 * QuestManager class
 * 
 * Responsible for managing quest activation, state updates, and UI restoration.
 * It loads quest definitions dynamically from a unified JSON configuration.
 */
export class QuestManager {
  /**
   * @param {EventManager} eventManager - The event manager handling diary entries.
   * @param {App} appInstance - The main application instance.
   */
  constructor(eventManager, appInstance) {
    this.eventManager = eventManager;
    this.app          = appInstance;
    this.quests       = [];

    // Load the unified configuration and instantiate quests dynamically.
    // Also prepare a mapping from questKey to its parent eventKey.
    Promise.all([ loadGameEntitiesConfig(), getQuestKeyToEventKeyMap() ])
      .then(async ([config, questKeyToEventKey]) => {
        for (const questCfg of config.quests) {
          // Build dependency mapping.
          const dependencyMapping = {
            "eventManager": this.eventManager,
            "app":          this.app
          };
          const params = questCfg.dependencies.map(dep => dependencyMapping[dep]);
          // If quest-specific configuration exists, append it.
          if (questCfg.config) {
            params.push(questCfg.config);
          }

          // Determine which triad chunk this quest belongs to.
          const eventKey = questKeyToEventKey[questCfg.key];
          if (!eventKey) {
            ErrorManager.logError(
              `Cannot find parent eventKey for quest "${questCfg.key}".`,
              "QuestManager"
            );
            continue;
          }

          // Dynamically import the triad bundle for that eventKey instead of individual quest file.
          try {
            // Import via alias "triads" so Webpack resolves build/triads/triad-<eventKey>.js
            const module = await import(
              /* webpackChunkName: "triads/triad-[request]" */
              `triads/triad-${eventKey}.js`
            );
            const QuestClass = module[questCfg.className];
            if (!QuestClass) {
              ErrorManager.logError(
                `Quest class "${questCfg.className}" is not exported from triads/triad-${eventKey}.js.`,
                "QuestManager"
              );
              continue;
            }
            const instance = new QuestClass(...params);
            // Set the key as specified in the configuration.
            instance.key = questCfg.key;
            this.quests.push(instance);
          } catch (error) {
            ErrorManager.logError(
              `Failed to import triad for quest "${questCfg.key}": ${error.message}`,
              "QuestManager"
            );
          }
        }
        console.log("Quests loaded from configuration:", this.quests.map(q => q.key));
      })
      .catch(error => {
        ErrorManager.logError(error, "QuestManager.loadConfig");
        ErrorManager.showError("Failed to load quests configuration");
      });

    this.initCameraListeners();

    // Restore UI state for the repeating quest if a saved state exists.
    if (StateManager.get(StateManager.KEYS.REPEATING_QUEST_STATE)) {
      console.log("[QuestManager] Detected saved state for repeating quest.");
      this.restoreRepeatingQuestUI();
    }
    if (this.app.viewManager && typeof this.app.viewManager.restoreCameraButtonState === 'function') {
      this.app.viewManager.restoreCameraButtonState();
    }
    // *** Add restoration for the Shoot button ***
    if (this.app.viewManager && typeof this.app.viewManager.restoreShootButtonState === 'function') {
      this.app.viewManager.restoreShootButtonState();
    }
  }

  /**
   * Registers listeners for camera readiness and closure events.
   */
  initCameraListeners() {
    const cameraManager = this.app.cameraSectionManager;
    if (!cameraManager) return;

    cameraManager.onVideoReady = async () => {
      console.log("[QuestManager] onVideoReady signal received.");

      if (StateManager.getActiveQuestKey() === "repeating_quest") {
        const repeatingQuest = this.quests.find(q => q.key === "repeating_quest");

        console.log(`[QuestManager] Detection target is "${repeatingQuest.currentTarget}"`);

        const config = repeatingQuest.generateDetectionConfig();
        await this.app.cameraSectionManager.startAIDetection(config);
      }
    };

    cameraManager.onCameraClosed = () => {
      console.log("[QuestManager] onCameraClosed signal received. Stopping detection.");
      this.app.cameraSectionManager.stopAIDetection();
    };
  }

  /**
   * Universal method to synchronize the state for a given quest.
   * Uses the universal active quest key stored in StateManager.
   * If the active quest key matches the provided questKey, the Post button is disabled;
   * otherwise, the Post button is enabled.
   * @param {string} questKey - The key of the quest to synchronize.
   */
  async syncQuestStateForQuest(questKey) {
    // If the game is finalized, disable Post button.
    if (StateManager.get(StateManager.KEYS.GAME_FINALIZED) === "true") {
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
        this.app.viewManager.setPostButtonEnabled(false);
      }
      console.log(`[QuestManager.syncQuestStateForQuest] Game finalized; Post button disabled for quest "${questKey}".`);
      return;
    }
    // Retrieve the universal active quest key.
    const canPost = StateManager.canPost();
    this.app.viewManager.setPostButtonEnabled(canPost);
    console.log(`[QuestManager] Post button ${canPost ? "enabled" : "disabled"} for quest "${questKey}".`);
  }

  /**
   * Synchronizes the quest state for predefined quests.
   */
  async syncQuestState() {
    for (const quest of this.quests) {
      await this.syncQuestStateForQuest(quest.key);
    }
  }

  /**
   * Finds a quest by its key and activates it.
   * After activation, updates the universal active quest key.
   * @param {string} key - The quest key.
   */
  async activateQuest(key) {
    const quest = this.quests.find(q => q.key === key);
    if (!quest) {
      ErrorManager.logError(`Quest "${key}" not found`, "QuestManager.activateQuest");
      ErrorManager.showError(`Cannot activate quest "${key}"`);
      return;
    }
    console.log(`[QuestManager] Activating quest: ${key}`);
    await quest.activate();
    StateManager.setActiveQuestKey(key);
    await this.syncQuestState();
  }

  /**
   * Finalizes a quest by calling its finish() method and updates the UI.
   * @param {string} key - The quest key.
   */
  async checkQuest(key) {
    const quest = this.quests.find(q => q.key === key);
    if (!quest) {
      ErrorManager.logError(`Quest "${key}" not found`, "QuestManager.checkQuest");
      ErrorManager.showError(`Cannot finish quest "${key}"`);
      return;
    }
    console.log(`[QuestManager] Finishing quest: ${key}`);
    await quest.finish();
    await this.syncQuestState();
  }

  /**
   * Saves the quest progress to the database.
   * @param {string} questKey - The quest key.
   * @param {number} currentStage - The current stage.
   * @param {number} totalStages - The total number of stages.
   * @param {string} status - The quest status.
   */
  async updateQuestProgress(questKey, currentStage, totalStages, status) {
    const questData = {
      quest_key:    questKey,
      current_stage: currentStage,
      total_stages: totalStages,
      status
    };
    await this.app.databaseManager.saveQuestRecord(questData);
    console.log("[QuestManager] Quest progress updated:", questData);
  }

  /**
   * Restores the UI for the repeating quest.
   */
  restoreRepeatingQuestUI() {
    const repeatingQuest = this.quests.find(q => q.key === "repeating_quest");
    if (repeatingQuest && typeof repeatingQuest.restoreUI === "function") {
      console.log("[QuestManager] Restoring repeating quest UI...");
      repeatingQuest.restoreUI();
    }
  }

  /**
   * Re-initializes UI for all active quests.
   * For each quest, if a corresponding database record exists with active status,
   * the quest's restoreUI method is called to reinitialize its UI.
   */
  restoreAllActiveQuests() {
    console.log("[QuestManager] Attempting to restore UI for all active quests...");
    this.quests.forEach(quest => {
      const record = this.app.databaseManager.getQuestRecord(quest.key);
      if (
        record &&
        (record.status === "active" || (record.status === "finished" && quest.currentStage <= quest.totalStages)) &&
        !quest.finished
      ) {
        console.log(`[QuestManager] Found active quest "${quest.key}". Restoring UI...`);
        if (typeof quest.restoreUI === "function") {
          quest.restoreUI();
        } else {
          console.log(`[QuestManager] Quest "${quest.key}" does not implement restoreUI().`);
        }
      }
    });
    // Update the Post button state after UI restoration
    if (this.app.ghostManager && typeof this.app.ghostManager.updatePostButtonState === 'function') {
      this.app.ghostManager.updatePostButtonState();
    }
  }
}