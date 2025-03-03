import { BaseEvent } from './baseEvent.js';
import { StateManager } from './stateManager.js';
import { ErrorManager } from './errorManager.js';

export class PostRepeatingEvent extends BaseEvent {
  constructor(eventManager, appInstance) {
    super(eventManager);
    this.app = appInstance;
    this.key = "post_repeating_event";
  }

  async activate() {
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`[PostRepeatingEvent] Event '${this.key}' is already logged, skipping activation.`);
      return;
    }
    console.log(`[PostRepeatingEvent] Activating event '${this.key}'.`);
    
    // Log the event in the diary as a ghost message.
    await this.eventManager.addDiaryEntry(this.key, true);

    const ghost = this.app.ghostManager.getCurrentGhost();
    if (ghost && ghost.isFinished) {
      console.log("[PostRepeatingEvent] Ghost is finished, triggering final quest.");
      await this.app.questManager.activateQuest("final_quest");
    } else {
      // If the ghost is not finished, re-enable the "Post" button for the next repeating quest cycle.
      StateManager.set("mirrorQuestReady", "true");
      // The flag "isRepeatingCycle" remains true for repeating cycles.
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
        this.app.viewManager.setPostButtonEnabled(true);
      }
      this.app.visualEffectsManager.triggerMirrorEffect();
      console.log("[PostRepeatingEvent] Repeating quest cycle ended; waiting for user action.");
    }
  }
}