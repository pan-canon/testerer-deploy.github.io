// File: src/events/WelcomeEvent.js

import { BaseEvent } from './BaseEvent.js';
import { StateManager } from '../managers/StateManager.js';
import { ErrorManager } from '../managers/ErrorManager.js';

/**
 * WelcomeEvent
 * 
 * This event is triggered immediately after registration.
 * It logs a welcome message (inviting the user to approach the mirror)
 * in the diary and sets the "welcomeDone" flag so that the event is launched only once per registration cycle.
 *
 * NOTE: This event is part of the sequential chain managed by GhostManager.
 * It performs its task (logging, triggering effects, setting flags) and then
 * dispatches a "gameEventCompleted" event for the managers to handle further actions (such as UI updates).
 */
export class WelcomeEvent extends BaseEvent {
  /**
   * @param {EventManager} eventManager - Manager handling diary operations.
   * @param {App} appInstance - Reference to the main application instance.
   * @param {LanguageManager} [languageManager] - Optional localization manager.
   */
  constructor(eventManager, appInstance, languageManager) {
    super(eventManager);
    this.app = appInstance;
    this.languageManager = languageManager;
    this.key = "welcome";
  }

  async activate() {
    // If the welcome event has already been completed, skip activation.
    if (StateManager.get("welcomeDone") === "true") {
      console.log("Welcome event already completed; skipping activation.");
      return;
    }
    
    // If the event is already logged, no further action is needed.
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`Event '${this.key}' is already logged.`);
      return;
    }

    // Log the welcome event as a ghost diary entry.
    console.log(`Activating event '${this.key}': Logging invitation to approach the mirror`);
    await this.eventManager.addDiaryEntry(this.key, true);

    // Trigger mirror effect if available.
    if (this.app.visualEffectsManager && typeof this.app.visualEffectsManager.triggerMirrorEffect === "function") {
      this.app.visualEffectsManager.triggerMirrorEffect();
    }

    // Mark the welcome event as completed.
    StateManager.set("welcomeDone", "true");

    // Dispatch an event to signal that the welcome event has completed.
    document.dispatchEvent(new CustomEvent("gameEventCompleted", { detail: this.key }));
  }
}