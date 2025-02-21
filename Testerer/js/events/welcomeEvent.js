import { BaseEvent } from './baseEvent.js';

/**
 * WelcomeEvent – A welcome event that notifies the user with an invitation
 * to approach the mirror. Inherits from BaseEvent and implements activation logic
 * via the EventManager.
 *
 * Upon activation:
 *  1) Checks if the "welcome" event has already been logged.
 *  2) If not, logs the "welcome" entry in the diary as a ghost post.
 *  3) Sets the 'mirrorQuestReady' flag in localStorage to enable the "Post" button.
 *  4) Calls updatePostButtonState() in QuestManager to update the UI.
 *  5) If the camera is open, triggers the mirror visual effect.
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
   *  1) If the "welcome" event is already logged, exit.
   *  2) Otherwise, log the "welcome" entry in the diary as a ghost post.
   *  3) Set the 'mirrorQuestReady' flag in localStorage.
   *  4) Call updatePostButtonState() in QuestManager to update the "Post" button.
   *  5) If the camera is open, trigger the mirror visual effect.
   *
   * @returns {Promise<void>}
   */
  async activate() {
    // Step 1: Check if the "welcome" event is already logged.
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`Event '${this.key}' is already logged. Skipping activation.`);
      return;
    }

    console.log(`Activating event '${this.key}': Logging invitation to approach the mirror`);

    // Step 2: Log the "welcome" entry in the diary as a ghost post.
    await this.eventManager.addDiaryEntry(this.key, true);

    // Step 3: Set the mirrorQuestReady flag in localStorage.
    localStorage.setItem("mirrorQuestReady", "true");

    // Step 4: Update the "Post" button state via QuestManager.
    this.app.questManager.updatePostButtonState();

    // Step 5: Trigger the mirror visual effect only if the camera is open.
    if (this.app.isCameraOpen) {
      this.app.visualEffectsManager.triggerMirrorEffect();
    } else {
      console.log("Mirror effect not triggered because camera is closed.");
    }
  }
}