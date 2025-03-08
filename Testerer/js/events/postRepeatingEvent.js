import { BaseEvent } from './baseEvent.js';
import { StateManager } from '../stateManager.js';
import { ErrorManager } from '../errorManager.js';

/**
 * PostRepeatingEvent
 * 
 * This event finalizes the mirror quest cycle and prepares the system for the repeating quest cycle.
 * It logs a ghost post and, if the current ghost is not finished, sets the mirrorQuestReady flag,
 * enables the Post button, and triggers the mirror effect.
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
    this.key = "post_repeating_event";
  }

  async activate() {
/*    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`[PostRepeatingEvent] Event '${this.key}' is already logged, skipping activation.`);
      return;
    }*/
    console.log(`[PostRepeatingEvent] Activating event '${this.key}'.`);

    await this.eventManager.addDiaryEntry(this.key, true);

    // Check if the current ghost is finished.
    const ghost = this.app.ghostManager.getCurrentGhost();
    if (ghost && ghost.isFinished) {
      console.log("[PostRepeatingEvent] Ghost is finished; ready to dispatch event completion.");
      // (No automatic quest activation here; GhostManager will handle the sequence.)
    } else {
      // Prepare the system for the next cycle of the repeating quest.
      StateManager.set("mirrorQuestReady", "true");
      
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
        this.app.viewManager.setPostButtonEnabled(true);
      }
      
      if (this.app.visualEffectsManager && typeof this.app.visualEffectsManager.triggerMirrorEffect === "function") {
        this.app.visualEffectsManager.triggerMirrorEffect();
      }
      console.log("[PostRepeatingEvent] Repeating quest cycle ended; waiting for user action.");
    }

    // Dispatch an event to signal completion of this event.
    document.dispatchEvent(new CustomEvent("gameEventCompleted", { detail: this.key }));
  }
}