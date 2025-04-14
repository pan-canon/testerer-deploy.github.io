// File: src/managers/GameEventManager.js

import { StateManager } from './StateManager.js';
import { ErrorManager } from './ErrorManager.js';
import { loadGameEntitiesConfig } from '../utils/GameEntityLoader.js';

/**
 * GameEventManager class
 * 
 * Manages one-time game events by loading event definitions dynamically
 * from a unified JSON configuration. All event-related operations (activation,
 * auto-launch, etc.) are handled here. Sequential linking of events and quests
 * is now coordinated by GhostManager and QuestManager.
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
   * In case of dynamic keys (e.g. "post_repeating_event_stage_X"), falls back to
   * a generic event key ("post_repeating_event").
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