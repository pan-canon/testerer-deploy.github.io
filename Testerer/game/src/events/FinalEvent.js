// File: src/events/FinalEvent.js

import { BaseEvent } from './BaseEvent.js';
import { StateManager } from '../managers/StateManager.js';
import { ErrorManager } from '../managers/ErrorManager.js';

/**
 * FinalEvent
 *
 * This event finalizes the scenario. It logs the final event,
 * sets the game as finalized, triggers a ghost fade-out effect,
 * marks the current ghost as finished, and clears active quest state.
 *
 * NOTE: FinalEvent is part of the sequential chain managed by GhostManager.
 * It performs its core task and dispatches a "gameEventCompleted" event.
 * All UI updates (e.g. disabling buttons, notifications) are delegated to specialized managers.
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
    await this.eventManager.addDiaryEntry(this.key, true);

    // Set the game as finalized.
    StateManager.set("gameFinalized", "true");

    // Trigger the ghost fade-out effect.
    if (this.app.visualEffectsManager && typeof this.app.visualEffectsManager.triggerGhostAppearanceEffect === "function") {
      this.app.visualEffectsManager.triggerGhostAppearanceEffect("ghost_fade_out");
    }

    // Mark the current ghost as finished.
    await this.app.ghostManager.finishCurrentGhost();

    // Clear any active quest state.
    StateManager.remove("activeQuestKey");

    // Dispatch an event to signal completion of the final event.
    document.dispatchEvent(new CustomEvent("gameEventCompleted", { detail: this.key }));
  }
}