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
    // Set the unique key for the welcome event.
    this.key = "welcome";
  }

  async activate() {
    // Check if the welcome event has already been completed.
    if (StateManager.get("welcomeDone") === "true") {
      console.log("Welcome event already completed; skipping activation.");
      // Ensure the Post button is enabled.
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
        this.app.viewManager.setPostButtonEnabled(true);
      }
      return;
    }
    
    // If the event is already logged in the diary, adjust the Post button based on the "mirrorQuestReady" flag.
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

    // Log the welcome event in the diary (as a ghost post).
    console.log(`Activating event '${this.key}': Logging invitation to approach the mirror`);
    await this.eventManager.addDiaryEntry(this.key, true);

    // Set the flag indicating that the mirror quest is ready.
    StateManager.set("mirrorQuestReady", "true");
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
      this.app.viewManager.setPostButtonEnabled(true);
    }
    
    // Trigger the mirror visual effect.
    this.app.visualEffectsManager.triggerMirrorEffect();

    // Finally, mark the welcome event as completed to prevent future auto-launch.
    StateManager.set("welcomeDone", "true");
  }
}