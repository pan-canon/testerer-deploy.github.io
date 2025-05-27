import { BaseEvent } from './BaseEvent.js';
import { StateManager } from '../managers/StateManager.js';
import { ErrorManager } from '../managers/ErrorManager.js';

/**
 * FinalEvent
 *
 * This event finalizes the scenario. It logs the final event,
 * sets the game as finalized, triggers a ghost fade-out effect,
 * marks the current ghost as finished, disables active UI elements,
 * and notifies the user via the ViewManager.
 *
 * NOTE: FinalEvent is part of the sequential chain managed by GhostManager.
 * It performs its task and signals completion via the "gameEventCompleted" event.
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
    this.key = "final_event";
  }

  async activate() {
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`Event '${this.key}' is already logged, skipping activation.`);
      return;
    }

    console.log(`Activating final event: '${this.key}'`);
    await this.addDiaryEntry(this.key, true);

    // Set the game as finalized.
    StateManager.set(StateManager.KEYS.GAME_FINALIZED, "true");

    // Trigger the ghost fade-out effect.
    if (this.app.visualEffectsManager && typeof this.app.visualEffectsManager.triggerGhostAppearanceEffect === "function") {
      this.app.visualEffectsManager.triggerGhostAppearanceEffect("ghost_fade_out");
    }

    // Mark the current ghost as finished.
    await this.app.ghostManager.finishCurrentGhost();

    // Disable active UI elements (e.g. Post button).
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
      this.app.viewManager.setPostButtonEnabled(false);
    }

    // Re-sync UI state.
    if (this.app.questManager && typeof this.app.questManager.syncQuestState === "function") {
      await this.app.questManager.syncQuestState();
    }

    // Remove the universal active quest key to clear any remaining quest state.
    StateManager.setActiveQuestKey(null);

    // Notify the user that the scenario is finished.
    if (this.app.viewManager && typeof this.app.viewManager.showNotification === "function") {
      this.app.viewManager.showNotification("🎉 Congratulations, the scenario is finished!");
    } else {
      console.log("🎉 Congratulations, the scenario is finished!");
    }

    // Dispatch an event to signal completion of the final event.
    document.dispatchEvent(new CustomEvent("gameEventCompleted", { detail: this.key }));
  }
}