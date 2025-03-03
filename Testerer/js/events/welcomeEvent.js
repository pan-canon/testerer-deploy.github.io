import { BaseEvent } from './baseEvent.js';

/**
 * WelcomeEvent – A welcome event that notifies the user with an invitation
 * to approach the mirror. Inherits from BaseEvent and implements activation logic
 * via the EventManager.
 *
 * Upon activation:
 *  1) If the final flag "welcomeEventCompleted" is set, the event is skipped.
 *  2) If the "welcome" event is already logged, it checks the 'mirrorQuestReady' flag.
 *     - If the flag is "true", it updates the UI to enable the "Post" button.
 *     - Otherwise, it leaves the UI unchanged.
 *  3) If the event is not yet logged, it logs the "welcome" entry as a ghost post,
 *     sets the 'mirrorQuestReady' flag, updates the UI to enable the "Post" button,
 *     triggers the mirror visual effect, and then marks the event as completed.
 *
 * @returns {Promise<void>}
 */
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
    // Skip activation if the welcome event has already been completed.
    if (localStorage.getItem("welcomeEventCompleted") === "true") {
      console.log("Welcome event already completed; skipping activation.");
      return;
    }

    // If the "welcome" event is already logged, check the mirrorQuestReady flag.
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`Event '${this.key}' is already logged.`);
      if (localStorage.getItem("mirrorQuestReady") === "true") {
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

    // If event is not logged, proceed with activation.
    console.log(`Activating event '${this.key}': Logging invitation to approach the mirror`);
    await this.eventManager.addDiaryEntry(this.key, true);

    // Set the mirrorQuestReady flag to "true" and update the UI.
    localStorage.setItem("mirrorQuestReady", "true");
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
      this.app.viewManager.setPostButtonEnabled(true);
    }
    
    // Trigger the mirror visual effect.
    this.app.visualEffectsManager.triggerMirrorEffect();

    // Mark the welcome event as completed to prevent future activation.
    localStorage.setItem("welcomeEventCompleted", "true");
  }
}