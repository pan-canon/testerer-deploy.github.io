import { StateManager } from './StateManager.js';
import { ErrorManager } from './ErrorManager.js';
import { loadGameEntitiesConfig } from '../utils/GameEntityLoader.js';

/**
 * QuestManager class
 * 
 * Responsible for managing quest activation, state updates, and UI restoration.
 * It loads quest definitions dynamically from a unified JSON configuration.
 * Reactively synchronizes Post button on activeQuestKey and gameFinalized changes.
 */
export class QuestManager {
  /**
   * @param {EventManager} eventManager - The event manager handling diary entries.
   * @param {App} appInstance - The main application instance.
   */
  constructor(eventManager, appInstance) {
    this.eventManager = eventManager;
    this.app = appInstance;
    this.quests = [];

    // Load the unified configuration and instantiate quests dynamically.
    loadGameEntitiesConfig()
      .then(async config => {
        for (const questCfg of config.quests) {
          const dependencyMapping = {
            eventManager: this.eventManager,
            app: this.app
          };
          const params = questCfg.dependencies.map(dep => dependencyMapping[dep]);
          if (questCfg.config) params.push(questCfg.config);
          const modulePath = `../quests/${questCfg.className}.js`;
          try {
            const module = await import(modulePath);
            const QuestClass = module[questCfg.className];
            if (!QuestClass) {
              ErrorManager.logError(
                `Quest class "${questCfg.className}" is not exported from ${modulePath}.`,
                'QuestManager'
              );
              continue;
            }
            const instance = new QuestClass(...params);
            instance.key = questCfg.key;
            this.quests.push(instance);
          } catch (error) {
            ErrorManager.logError(
              `Failed to import quest class "${questCfg.className}" from ${modulePath}: ${error.message}`,
              'QuestManager'
            );
          }
        }
        console.log('Quests loaded from configuration:', this.quests.map(q => q.key));
      })
      .catch(error => {
        ErrorManager.logError(
          `Failed to load quests configuration: ${error.message}`,
          'QuestManager'
        );
      });

    this.initCameraListeners();

    // Restore UI state for repeating quest if present
    if (StateManager.get('quest_state_repeating_quest')) {
      console.log('[QuestManager] Detected saved state for repeating quest.');
      this.restoreRepeatingQuestUI();
    }
    // Restore camera and shoot button states
    this.app.viewManager?.restoreCameraButtonState();
    this.app.viewManager?.restoreShootButtonState();

    // Subscribe reactively to changes in activeQuestKey and gameFinalized
    StateManager.subscribe('activeQuestKey', () => this.syncQuestState());
    StateManager.subscribe('gameFinalized', () => this.syncQuestState());

    // Initial synchronization of Post button
    this.syncQuestState();
  }

  /**
   * Registers listeners for camera readiness and closure events.
   */
  initCameraListeners() {
    const cameraManager = this.app.cameraSectionManager;
    if (!cameraManager) return;
    cameraManager.onVideoReady = () => console.log('[QuestManager] onVideoReady signal received.');
    cameraManager.onCameraClosed = () => console.log('[QuestManager] onCameraClosed signal received.');
  }

  /**
   * Synchronizes the Post button based on active quest and finalized state.
   */
  syncQuestState() {
    const gameFinalized = StateManager.get('gameFinalized') === 'true';
    const activeKey = StateManager.get('activeQuestKey');
    // Enable Post only if no active quest and not finalized
    const enablePost = !gameFinalized && !activeKey;
    this.app.viewManager?.setPostButtonEnabled(enablePost);
    console.log(`[QuestManager] Post button ${enablePost ? 'enabled' : 'disabled'}`);
  }

  /**
   * Finds and activates a quest by key, setting the universal activeQuestKey.
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
    StateManager.set('activeQuestKey', key);
  }

  /**
   * Finishes a quest by key and clears the activeQuestKey.
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
    StateManager.remove('activeQuestKey');
  }

  /**
   * Saves quest progress to the database.
   */
  async updateQuestProgress(questKey, currentStage, totalStages, status) {
    await this.app.databaseManager.saveQuestRecord({
      quest_key: questKey,
      current_stage: currentStage,
      total_stages: totalStages,
      status
    });
    console.log('[QuestManager] Quest progress updated:', questKey);
  }

  /**
   * Restores the UI for the repeating quest.
   */
  restoreRepeatingQuestUI() {
    const repeatingQuest = this.quests.find(q => q.key === 'repeating_quest');
    if (repeatingQuest?.restoreUI) {
      console.log('[QuestManager] Restoring repeating quest UI...');
      repeatingQuest.restoreUI();
    }
  }

  /**
   * Restores UI for all active quests on reload.
   */
  restoreAllActiveQuests() {
    console.log('[QuestManager] Restoring UI for all active quests...');
    this.quests.forEach(quest => {
      const record = this.app.databaseManager.getQuestRecord(quest.key);
      if (record && (record.status === 'active' || (record.status === 'finished' && quest.currentStage <= quest.totalStages))) {
        console.log(`[QuestManager] Restoring UI for quest "${quest.key}"...`);
        quest.restoreUI?.();
      }
    });
  }
}