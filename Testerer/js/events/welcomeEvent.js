import { BaseEvent } from './baseEvent.js';

/**
 * WelcomeEvent – A welcome event that notifies the user with an invitation
 * to approach the mirror. Inherits from BaseEvent and implements activation logic
 * via the EventManager.
 *
 * Upon activation:
 *  1) Checks if the "welcome" event has already been logged.
 *  2) Logs the "welcome" entry in the diary as a ghost post (if not already logged).
 *  3) Sets the 'mirrorQuestReady' flag in localStorage to enable the "Post" button.
 *  4) Delegates UI update for the "Post" button to the ViewManager.
 *  5) Triggers the mirror visual effect.
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

  /**
   * activate – Overridden activation method for the 'welcome' event.
   *
   * Steps:
   *  1) If the "welcome" event is already logged, update the UI and exit.
   *  2) Otherwise, log the "welcome" entry in the diary as a ghost post.
   *  3) Set the 'mirrorQuestReady' flag in localStorage.
   *  4) Delegate the "Post" button update to the ViewManager.
   *  5) Trigger the mirror visual effect.
   *
   * @returns {Promise<void>}
   */
  async activate() {
    // Step 1: Check if the "welcome" event is already logged.
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`Event '${this.key}' is already logged. Skipping logging, but updating UI.`);
      // Update the UI to enable the Post button, so the user can proceed.
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
        this.app.viewManager.setPostButtonEnabled(true);
      }
      return;
    }

    console.log(`Activating event '${this.key}': Logging invitation to approach the mirror`);
    
    // Step 2: Log the "welcome" entry in the diary as a ghost post.
    await this.eventManager.addDiaryEntry(this.key, true);
    
    // Step 3: Set the mirrorQuestReady flag in localStorage.
    localStorage.setItem("mirrorQuestReady", "true");
    
    // Step 4: Update the UI to enable the Post button.
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
      this.app.viewManager.setPostButtonEnabled(true);
    }
    
    // Step 5: Trigger the mirror visual effect.
    this.app.visualEffectsManager.triggerMirrorEffect();
  }
}