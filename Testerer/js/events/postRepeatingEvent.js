import { BaseEvent } from './baseEvent.js';
import { StateManager } from '../stateManager.js';
import { ErrorManager } from '../errorManager.js';

/**
 * PostRepeatingEvent
 * 
 * This event finalizes the mirror quest cycle and prepares the system for the repeating quest cycle.
 * It logs a ghost post, then checks if the current ghost is finished.
 * - If the ghost is finished, it triggers the final quest.
 * - Otherwise, it resets the "mirrorQuestReady" flag, re-enables the "Post" button via ViewManager,
 *   and triggers the mirror visual effect.
 */
export class PostRepeatingEvent extends BaseEvent {
  /**
   * @param {EventManager} eventManager - Manager for diary operations.
   * @param {App} appInstance - Reference to the main application instance.
   */
  constructor(eventManager, appInstance) {
    super(eventManager);
    this.app = appInstance;
    this.key = "post_repeating_event";
  }

  async activate() {
    // Check if the event is already logged; if so, skip activation.
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`[PostRepeatingEvent] Event '${this.key}' is already logged, skipping activation.`);
      return;
    }
    console.log(`[PostRepeatingEvent] Activating event '${this.key}'.`);

    // Log the event in the diary as a ghost post.
    await this.eventManager.addDiaryEntry(this.key, true);

    // Retrieve the current ghost.
    const ghost = this.app.ghostManager.getCurrentGhost();
    if (ghost && ghost.isFinished) {
      // If the ghost is finished, trigger the final quest.
      console.log("[PostRepeatingEvent] Ghost is finished, triggering final quest.");
      await this.app.questManager.activateQuest("final_quest");
    } else {
      // If the ghost is not finished, prepare for the next repeating quest cycle.
      
      // Reset the mirror quest readiness flag via StateManager.
      StateManager.set("mirrorQuestReady", "true");
      // The flag "isRepeatingCycle" is assumed to remain true for repeating cycles.
      
      // Delegate the UI update to enable the "Post" button via ViewManager.
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
        this.app.viewManager.setPostButtonEnabled(true);
      }
      
      // Trigger the mirror visual effect.
      this.app.visualEffectsManager.triggerMirrorEffect();
      console.log("[PostRepeatingEvent] Repeating quest cycle ended; waiting for user action.");
    }
  }
}