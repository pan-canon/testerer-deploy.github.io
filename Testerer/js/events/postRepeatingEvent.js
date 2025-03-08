import { BaseEvent } from './baseEvent.js';
import { StateManager } from '../stateManager.js';
import { ErrorManager } from '../errorManager.js';

/**
 * PostRepeatingEvent
 * 
 * This event finalizes the mirror quest cycle and prepares the system for the repeating quest cycle.
 * It logs a ghost post, then checks if the current ghost is finished.
 * - If the ghost is finished, it triggers the final quest.
 * - Otherwise, it sets the "mirrorQuestReady" flag, re-enables the "Post" button via ViewManager,
 *   and triggers the mirror visual effect.
 *
 * NOTE: This event is part of the sequential chain managed by GhostManager.
 * It does not handle sequence logic; it only performs its task and signals completion.
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
    // If the event is already logged in the diary, skip activation.
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`[PostRepeatingEvent] Event '${this.key}' is already logged, skipping activation.`);
      return;
    }
    console.log(`[PostRepeatingEvent] Activating event '${this.key}'.`);

    // Log the event as a ghost post.
    await this.eventManager.addDiaryEntry(this.key, true);

    // Check if the current ghost is finished.
    const ghost = this.app.ghostManager.getCurrentGhost();
    if (ghost && ghost.isFinished) {
      // If the ghost is finished, trigger the final quest.
      console.log("[PostRepeatingEvent] Ghost is finished, triggering final quest.");
      await this.app.questManager.activateQuest("final_quest");
    } else {
      // Otherwise, prepare the system for the next cycle of the repeating quest.
      
      // Set the mirrorQuestReady flag.
      StateManager.set("mirrorQuestReady", "true");
      // (The "isRepeatingCycle" flag remains true for the repeating cycle.)
      
      // Enable the "Post" button via ViewManager.
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
        this.app.viewManager.setPostButtonEnabled(true);
      }
      
      // Trigger the mirror visual effect, if available.
      if (this.app.visualEffectsManager && typeof this.app.visualEffectsManager.triggerMirrorEffect === "function") {
        this.app.visualEffectsManager.triggerMirrorEffect();
      }

      console.log("[PostRepeatingEvent] Repeating quest cycle ended; waiting for user action.");
    }

    // Dispatch a custom event to signal the completion of this event.
    document.dispatchEvent(new CustomEvent("gameEventCompleted", { detail: this.key }));
  }
}