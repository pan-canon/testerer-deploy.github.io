import { BaseEvent } from './baseEvent.js';
import { StateManager } from './stateManager.js';
import { ErrorManager } from './errorManager.js';

export class PostMirrorEvent extends BaseEvent {
  constructor(eventManager, appInstance) {
    super(eventManager);
    this.app = appInstance;
    this.key = "post_mirror_event";
  }

  async activate() {
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`[PostMirrorEvent] Event '${this.key}' is already logged, skipping activation.`);
      return;
    }
    console.log(`[PostMirrorEvent] Activating event '${this.key}'.`);
    
    // Log the event in the diary as a ghost message.
    await this.eventManager.addDiaryEntry(this.key, true);

    // Set flags using StateManager.
    StateManager.set("mirrorQuestReady", "true");
    StateManager.set("isRepeatingCycle", "true");

    // Delegate UI update: enable the "Post" button via ViewManager.
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
      this.app.viewManager.setPostButtonEnabled(true);
    }

    // Trigger the mirror visual effect.
    this.app.visualEffectsManager.triggerMirrorEffect();
    console.log("[PostMirrorEvent] Mirror quest cycle ended; waiting for user action to trigger repeating quest.");
  }
}