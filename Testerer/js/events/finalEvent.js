import { BaseEvent } from './baseEvent.js';
import { StateManager } from './stateManager.js';
import { ErrorManager } from './errorManager.js';

export class FinalEvent extends BaseEvent {
  /**
   * @param {EventManager} eventManager - The diary manager (EventManager).
   * @param {App} appInstance - The main application instance.
   * @param {LanguageManager} [languageManager] - The localization manager (optional).
   */
  constructor(eventManager, appInstance, languageManager) {
    super(eventManager);
    this.app = appInstance;
    this.languageManager = languageManager;
    
    // Unique key for the final event.
    this.key = "final_event";
  }

  /**
   * activate – Overridden method for activating the final event.
   * It logs the event, sets the game finalized flag, triggers a ghost fade-out effect,
   * calls finishCurrentGhost from the GhostManager, and notifies the user.
   *
   * @returns {Promise<void>}
   */
  async activate() {
    // Check if the final event has already been logged.
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`Event '${this.key}' is already logged, skipping activation.`);
      return;
    }

    console.log(`Activating final event: '${this.key}'`);
    // Log the final event in the diary as a ghost post.
    await this.eventManager.addDiaryEntry(this.key, true);

    // Set a flag indicating that the game/ghost scenario is finalized.
    StateManager.set("gameFinalized", "true");

    // Trigger a visual effect (e.g., ghost fade-out).
    this.app.visualEffectsManager.triggerGhostAppearanceEffect("ghost_fade_out");

    // Mark the current ghost as finished.
    await this.app.ghostManager.finishCurrentGhost();

    // Notify the user that the scenario is finished via ViewManager.
    if (this.app.viewManager && typeof this.app.viewManager.showNotification === 'function') {
      this.app.viewManager.showNotification("🎉 Congratulations, the scenario is finished!");
    } else {
      console.log("🎉 Congratulations, the scenario is finished!");
    }
  }
}