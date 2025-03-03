import { BaseEvent } from './baseEvent.js';
import { StateManager } from '../stateManager.js';
import { ErrorManager } from '../errorManager.js';

export class WelcomeEvent extends BaseEvent {
  /**
   * @param {EventManager} eventManager - The event manager for diary operations.
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
    // If the "welcomeDone" flag is already set, skip activation and enable the Post button.
    if (StateManager.get("welcomeDone") === "true") {
      console.log("Welcome event already completed; skipping activation.");
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
        this.app.viewManager.setPostButtonEnabled(true);
      }
      return;
    }
    
    // If the event is already logged, adjust the Post button based on the "mirrorQuestReady" flag.
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`Event '${this.key}' is already logged.`);
      if (StateManager.get("mirrorQuestReady") === "true") {
        if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
          this.app.viewManager.setPostButtonEnabled(true);
          console.log("Post button enabled based on mirrorQuestReady flag.");
        }
      } else {
        if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
          this.app.viewManager.setPostButtonEnabled(false);
          console.log("Post button remains disabled as mirrorQuestReady flag is false.");
        }
      }
      return;
    }

    console.log(`Activating event '${this.key}': Logging invitation to approach the mirror`);
    await this.eventManager.addDiaryEntry(this.key, true);

    // Set the mirrorQuestReady flag and enable the Post button.
    StateManager.set("mirrorQuestReady", "true");
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
      this.app.viewManager.setPostButtonEnabled(true);
    }
    
    // Trigger the mirror visual effect.
    this.app.visualEffectsManager.triggerMirrorEffect();

    // Set the welcomeDone flag to prevent future auto-launch of the event.
    StateManager.set("welcomeDone", "true");
  }
}