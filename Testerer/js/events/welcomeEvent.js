import { BaseEvent } from './baseEvent.js';
import { StateManager } from '../stateManager.js';
import { ErrorManager } from '../errorManager.js';

/**
 * WelcomeEvent
 * 
 * This event is triggered immediately after registration. It logs a welcome message
 * (invitation to approach the mirror) in the diary and enables the "Post" button.
 * It uses StateManager to check and update the "welcomeDone" flag so that the event
 * is launched only once per registration cycle.
 *
 * NOTE: This event is now part of the sequential chain managed by GhostManager.
 * It does not handle sequence logic; it only performs its task and signals completion.
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
    // Unique key for the welcome event.
    this.key = "welcome";
  }

  async activate() {
    // If welcomeDone is already set, skip activation.
    if (StateManager.get("welcomeDone") === "true") {
      console.log("Welcome event already completed; skipping activation.");
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
        this.app.viewManager.setPostButtonEnabled(true);
      }
      return;
    }
    
    // If the event is already logged, check mirrorQuestReady flag to decide on the Post button.
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`Event '${this.key}' is already logged.`);
      if (StateManager.get("mirrorQuestReady") === "true") {
        if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
          this.app.viewManager.setPostButtonEnabled(true);
          console.log("Post button enabled based on mirrorQuestReady flag.");
        }
      } else {
        if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
          this.app.viewManager.setPostButtonEnabled(false);
          console.log("Post button remains disabled as mirrorQuestReady flag is false.");
        }
      }
      return;
    }

    // Log the event as a ghost post (invitation to approach the mirror)
    console.log(`Activating event '${this.key}': Logging invitation to approach the mirror`);
    await this.eventManager.addDiaryEntry(this.key, true);

    // Set the mirrorQuestReady flag and enable the Post button.
    StateManager.set("mirrorQuestReady", "true");
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
      this.app.viewManager.setPostButtonEnabled(true);
    }
    
    // Trigger the mirror effect if available.
    if (this.app.visualEffectsManager && typeof this.app.visualEffectsManager.triggerMirrorEffect === 'function') {
      this.app.visualEffectsManager.triggerMirrorEffect();
    }

    // Mark the welcome event as completed.
    StateManager.set("welcomeDone", "true");

    // Dispatch a custom event to signal completion of the welcome event.
    document.dispatchEvent(new CustomEvent("gameEventCompleted", { detail: this.key }));
  }
}