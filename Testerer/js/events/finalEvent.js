import { BaseEvent } from './baseEvent.js';
import { StateManager } from '../stateManager.js';
import { ErrorManager } from '../errorManager.js';

/**
 * FinalEvent
 *
 * This event finalizes the scenario. It logs the final event,
 * sets the game as finalized, triggers a ghost fade-out effect,
 * marks the current ghost as finished, disables active UI elements,
 * and notifies the user via the ViewManager.
 *
 * NOTE: FinalEvent is part of the sequential chain managed by GhostManager.
 * It only performs its assigned tasks and signals completion via the "gameEventCompleted" event.
 */
export class FinalEvent extends BaseEvent {
  /**
   * @param {EventManager} eventManager - The diary/event manager.
   * @param {App} appInstance - The main application instance.
   * @param {LanguageManager} [languageManager] - Optional localization manager.
   */
  constructor(eventManager, appInstance, languageManager) {
    super(eventManager);
    this.app = appInstance;
    this.languageManager = languageManager;
    
    // Unique key for the final event.
    this.key = "final_event";
  }

  /**
   * activate – Activates the final event.
   * Logs the event in the diary, sets the finalized flag,
   * triggers a ghost fade-out effect, finishes the current ghost,
   * disables active buttons via ViewManager, and notifies the user.
   *
   * At the end, it dispatches a "gameEventCompleted" event to signal completion.
   *
   * @returns {Promise<void>}
   */
  async activate() {
    // Skip activation if the event has already been logged.
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`Event '${this.key}' is already logged, skipping activation.`);
      return;
    }

    console.log(`Activating final event: '${this.key}'`);
    // Log the final event in the diary as a ghost post.
    await this.eventManager.addDiaryEntry(this.key, true);

    // Set the game finalized flag using StateManager.
    StateManager.set("gameFinalized", "true");

    // Trigger the ghost fade-out visual effect (e.g., "ghost_fade_out").
    if (this.app.visualEffectsManager && typeof this.app.visualEffectsManager.triggerGhostAppearanceEffect === "function") {
      this.app.visualEffectsManager.triggerGhostAppearanceEffect("ghost_fade_out");
    }

    // Mark the current ghost as finished.
    await this.app.ghostManager.finishCurrentGhost();

    // Disable active buttons (e.g., the "Post" button) via ViewManager.
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
      this.app.viewManager.setPostButtonEnabled(false);
    }

    // Optionally, re-sync quest state so that the UI updates instantly.
    if (this.app.questManager && typeof this.app.questManager.syncQuestState === "function") {
      await this.app.questManager.syncQuestState();
    }

    // Notify the user that the scenario has ended via ViewManager.
    if (this.app.viewManager && typeof this.app.viewManager.showNotification === "function") {
      this.app.viewManager.showNotification("🎉 Congratulations, the scenario is finished!");
    } else {
      console.log("🎉 Congratulations, the scenario is finished!");
    }

    // Dispatch a custom event to signal that the final event has completed.
    document.dispatchEvent(new CustomEvent("gameEventCompleted", { detail: this.key }));
  }
}