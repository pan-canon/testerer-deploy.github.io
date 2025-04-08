// File: src/managers/GameEventManager.js

import { StateManager } from './StateManager.js';
import { ErrorManager } from './ErrorManager.js';
import { loadGameEntitiesConfig } from '../utils/GameEntityLoader.js';

/**
 * GameEventManager class
 * 
 * Manages one-time game events. It loads event definitions dynamically from
 * a unified JSON configuration. The configuration (including event class names,
 * dependencies and keys) is defined entirely in the config file.
 *
 * NOTE: Sequential linking of events and quests is now handled by GhostManager.
 */
export class GameEventManager {
  /**
   * @param {EventManager} eventManager - Manager for diary/event operations.
   * @param {App} appInstance - The main application instance.
   * @param {LanguageManager} languageManager - Localization manager.
   */
  constructor(eventManager, appInstance, languageManager) {
    this.eventManager = eventManager;
    this.app = appInstance;
    this.languageManager = languageManager;
    this.events = [];

    // Load the unified configuration and instantiate events dynamically.
    loadGameEntitiesConfig()
      .then(async config => {
        for (const eventCfg of config.events) {
          // Build dependency mapping.
          const dependencyMapping = {
            "eventManager": this.eventManager,
            "app": this.app,
            "languageManager": this.languageManager
          };
          const params = eventCfg.dependencies.map(dep => dependencyMapping[dep]);

          // Dynamically import the event class from ../events/<ClassName>.js
          const modulePath = `../events/${eventCfg.className}.js`;
          try {
            const module = await import(modulePath);
            const EventClass = module[eventCfg.className];
            if (!EventClass) {
              ErrorManager.logError(
                `Event class "${eventCfg.className}" is not exported from ${modulePath}.`,
                "GameEventManager"
              );
              continue;
            }
            const instance = new EventClass(...params);
            // Set the key as specified in the config.
            instance.key = eventCfg.key;
            this.events.push(instance);
          } catch (error) {
            ErrorManager.logError(
              `Failed to import event class "${eventCfg.className}" from ${modulePath}: ${error.message}`,
              "GameEventManager"
            );
          }
        }
        console.log("Game events loaded from configuration:", this.events.map(e => e.key));
      })
      .catch(error => {
        ErrorManager.logError("Failed to load events configuration: " + error.message, "GameEventManager");
      });
  }

  /**
   * Activates an event by its key.
   * @param {string} key - The event key.
   */
  async activateEvent(key) {
    let event = this.events.find(e => e.key === key);
    // Fallback for dynamic keys (e.g. "post_repeating_event_stage_X")
    if (!event && key.startsWith("post_repeating_event")) {
      event = this.events.find(e => e.key === "post_repeating_event");
    }
    if (event) {
      await event.activate(key);
      console.log(`Event '${key}' activated.`);
    } else {
      ErrorManager.logError(`Event "${key}" not found in the list.`, "activateEvent");
    }
  }

  /**
   * Helper method for starting a ghost quest.
   */
  async startQuest() {
    const ghost = this.app.ghostManager.getCurrentGhost();
    const questKey = `ghost_${ghost.id}_quest`;
    const event = this.events.find(e => e.key === questKey);
    if (event) {
      await this.activateEvent(questKey);
    } else {
      await this.app.questManager.activateQuest(questKey);
    }
  }

  /**
   * Helper method for explicitly starting the mirror quest.
   */
  async startMirrorQuest() {
    await this.activateEvent('mirror_quest');
    console.log("Mirror quest started (event).");
  }
  
  /**
   * Automatically launches the welcome event (after 5 seconds) post-registration,
   * if the "welcomeDone" flag is not set.
   */
  async autoLaunchWelcomeEvent() {
    if (StateManager.get("welcomeDone") === "true") {
      console.log("Welcome event already completed; auto-launch skipped.");
      return;
    }
    console.log("Auto-launching welcome event in 5 seconds...");
    setTimeout(async () => {
      await this.activateEvent("welcome");
    }, 5000);
  }
}