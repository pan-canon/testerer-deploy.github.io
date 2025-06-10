// File: src/events/WelcomeEvent.js

import { BaseEvent } from './BaseEvent.js';
import { StateManager } from '../managers/StateManager.js';
import { ErrorManager } from '../managers/ErrorManager.js';

/**
 * WelcomeEvent
 * 
 * This event is triggered immediately after registration. It logs a welcome message
 * (invitation to approach the mirror) in the diary and enables the "Post" button.
 * It uses StateManager to check and update the "welcomeDone" flag so that the event
 * is launched only once per registration cycle.
 *
 * NOTE: This event is part of the sequential chain managed by GhostManager.
 * It only performs its task (publishing a ghost post and setting flags) and then
 * dispatches a "gameEventCompleted" event.
 */
export class WelcomeEvent extends BaseEvent {
  /**
   * @param {EventManager} eventManager - Manager handling diary operations.
   * @param {App} appInstance - Reference to the main application instance.
   * @param {Object} config - Configuration object from gameEntities.json, contains `key`.
   * @param {LanguageManager} [languageManager] - Optional localization manager.
   */
  constructor(eventManager, appInstance, config, languageManager) {
    super(eventManager);
    this.app = appInstance;
    this.languageManager = languageManager;
    this.key = config.key;
  }

  async activate() {
    // If the welcome event has already been completed, skip activation.
    if (StateManager.get(StateManager.KEYS.WELCOME_DONE) === "true") {
      console.log(`Welcome event '${this.key}' already completed; skipping activation.`);
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
        this.app.viewManager.setPostButtonEnabled(true);
      }
      return;
    }
    
    // If the event is already logged, check the universal active quest key for enabling the Post button.
    if (await this.eventManager.isEventLogged(this.key)) {
      console.log(`Event '${this.key}' is already logged.`);
      if (StateManager.get(StateManager.KEYS.ACTIVE_QUEST_KEY) === "mirror_quest") {
        if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
          this.app.viewManager.setPostButtonEnabled(true);
          console.log("Post button enabled based on activeQuestKey 'mirror_quest'.");
        }
      } else {
        if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
          this.app.viewManager.setPostButtonEnabled(false);
          console.log("Post button remains disabled as activeQuestKey is not set to 'mirror_quest'.");
        }
      }
      return;
    }

    // Log the event as a ghost post via the unified method.
    console.log(`Activating event '${this.key}': Logging invitation to approach the mirror`);
    await this.addDiaryEntry(this.key, true);

    // Instead of setting "mirrorQuestReady", update the universal active quest key.
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
      this.app.viewManager.setPostButtonEnabled(true);
    }
    
    // Trigger the mirror effect if available.
    if (this.app.visualEffectsManager && typeof this.app.visualEffectsManager.triggerMirrorEffect === "function") {
      this.app.visualEffectsManager.triggerMirrorEffect();
    }

    // Mark the welcome event as completed.
    StateManager.set(StateManager.KEYS.WELCOME_DONE, "true");

    // Dispatch an event to signal that the welcome event has completed.
    document.dispatchEvent(new CustomEvent("gameEventCompleted", { detail: this.key }));
  }
}