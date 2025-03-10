import { BaseEvent } from './baseEvent.js';
import { StateManager } from '../stateManager.js';
import { ErrorManager } from '../errorManager.js';

/**
 * FinalEvent
 *
 * This event finalizes the scenario. It logs a final ghost post,
 * sets the game as finalized, triggers a ghost fade-out effect,
 * marks the current ghost as finished, disables active UI elements,
 * and notifies the user via the ViewManager.
 * It then dispatches a "gameEventCompleted" event.
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
    console.log(`Activating final event: '${this.key}'`);
    await this.eventManager.addDiaryEntry(this.key, true);
    
    // Set game as finalized.
    StateManager.set("gameFinalized", "true");
    
    // Trigger ghost fade-out effect.
    if (this.app.visualEffectsManager && typeof this.app.visualEffectsManager.triggerGhostAppearanceEffect === "function") {
      this.app.visualEffectsManager.triggerGhostAppearanceEffect("ghost_fade_out");
    }
    
    // Mark the current ghost as finished.
    await this.app.ghostManager.finishCurrentGhost();
    
    // Disable active UI elements.
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
      this.app.viewManager.setPostButtonEnabled(false);
    }
    
    // Re-sync UI state.
    if (this.app.questManager && typeof this.app.questManager.syncQuestState === "function") {
      await this.app.questManager.syncQuestState();
    }
    
    // Notify the user.
    if (this.app.viewManager && typeof this.app.viewManager.showNotification === "function") {
      this.app.viewManager.showNotification("🎉 Congratulations, the scenario is finished!");
    } else {
      console.log("🎉 Congratulations, the scenario is finished!");
    }
    
    document.dispatchEvent(new CustomEvent("gameEventCompleted", { detail: this.key }));
  }
}