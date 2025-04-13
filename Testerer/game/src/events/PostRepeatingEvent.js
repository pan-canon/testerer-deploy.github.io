// File: src/events/PostRepeatingEvent.js

import { BaseEvent } from './BaseEvent.js';
import { StateManager } from '../managers/StateManager.js';
import { ErrorManager } from '../managers/ErrorManager.js';

/**
 * PostRepeatingEvent
 * 
 * This event finalizes the mirror quest cycle and prepares the system for the repeating quest cycle.
 * It logs a ghost post and, if the current ghost is not finished, enables the Post button and triggers the mirror effect.
 * It does not directly set quest-specific flags; these are managed via the universal state.
 *
 * NOTE: This event does not automatically trigger quest activation;
 * it simply performs its task and dispatches a "gameEventCompleted" event.
 */
export class PostRepeatingEvent extends BaseEvent {
  /**
   * @param {EventManager} eventManager - Manager handling diary operations.
   * @param {App} appInstance - Reference to the main application instance.
   */
  constructor(eventManager, appInstance) {
    super(eventManager);
    this.app = appInstance;
    // Base key for post repeating event.
    this.key = "post_repeating_event";
  }

  /**
   * activate - Activates the post repeating event.
   * Accepts an optional dynamicKey to generate a unique event id (e.g., "post_repeating_event_stage_2").
   *
   * @param {string} [dynamicKey] - Optional unique event key.
   */
  async activate(dynamicKey) {
    const eventKey = dynamicKey || this.key;
    if (this.eventManager.isEventLogged(eventKey)) {
      console.log(`[PostRepeatingEvent] Event '${eventKey}' is already logged, skipping activation.`);
      return;
    }
    console.log(`[PostRepeatingEvent] Activating event '${eventKey}'.`);

    await this.eventManager.addDiaryEntry(eventKey, true);

    // Check if the current ghost is finished.
    const ghost = this.app.ghostManager.getCurrentGhost();
    if (ghost && ghost.isFinished) {
      console.log("[PostRepeatingEvent] Ghost is finished; ready to dispatch event completion.");
      // No additional processing is needed if the ghost is finished.
    } else {
      // Instead of setting a mirrorQuestReady flag,
      // simply enable the Post button and trigger the mirror effect.
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
        this.app.viewManager.setPostButtonEnabled(true);
      }
      
      if (this.app.visualEffectsManager && typeof this.app.visualEffectsManager.triggerMirrorEffect === "function") {
        this.app.visualEffectsManager.triggerMirrorEffect();
      }
      console.log("[PostRepeatingEvent] Repeating quest cycle ended; waiting for user action.");
    }

    // Dispatch an event to signal completion of this event.
    document.dispatchEvent(new CustomEvent("gameEventCompleted", { detail: eventKey }));
  }
}
