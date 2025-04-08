// File: src/managers/GameEventManager.js

import { WelcomeEvent } from '../events/WelcomeEvent.js';
import { PostMirrorEvent } from '../events/PostMirrorEvent.js';
import { PostRepeatingEvent } from '../events/PostRepeatingEvent.js';
import { FinalEvent } from '../events/FinalEvent.js';

import { StateManager } from './StateManager.js';
import { ErrorManager } from './ErrorManager.js';
import { loadGameEntitiesConfig } from '../utils/GameEntityLoader.js';

/**
 * GameEventManager class
 * 
 * Manages one-time game events. It now loads event definitions from a unified JSON configuration.
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

    // Mapping of event class names to their implementations.
    this._eventClasses = {
      "WelcomeEvent": WelcomeEvent,
      "PostMirrorEvent": PostMirrorEvent,
      "PostRepeatingEvent": PostRepeatingEvent,
      "FinalEvent": FinalEvent
    };

    // Load the unified configuration and instantiate events.
    loadGameEntitiesConfig()
      .then(config => {
        config.events.forEach(eventCfg => {
          // Map dependency names to actual objects.
          const dependencyMapping = {
            "eventManager": this.eventManager,
            "app": this.app,
            "languageManager": this.languageManager
          };
          const params = eventCfg.dependencies.map(dep => dependencyMapping[dep]);
          const EventClass = this._eventClasses[eventCfg.className];
          if (!EventClass) {
            ErrorManager.logError(`Event class "${eventCfg.className}" is not registered.`, "GameEventManager");
            return;
          }
          const instance = new EventClass(...params);
          // Ensure that the instance has its key set.
          instance.key = eventCfg.key;
          this.events.push(instance);
        });
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
    // If dynamic keys (e.g. "post_repeating_event_stage_X") are used, fallback to the PostRepeatingEvent instance.
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