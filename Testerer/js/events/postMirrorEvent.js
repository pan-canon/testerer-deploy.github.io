import { BaseEvent } from './baseEvent.js';

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

    // Set the flags to mark that the mirror quest is ready and that repeating cycle mode is active.
    localStorage.setItem("mirrorQuestReady", "true");
    localStorage.setItem("isRepeatingCycle", "true");

    // Delegate UI update: enable the "Post" button via ViewManager.
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
      this.app.viewManager.setPostButtonEnabled(true);
    }

    // Trigger the mirror visual effect.
    this.app.visualEffectsManager.triggerMirrorEffect();
    console.log("[PostMirrorEvent] Mirror quest cycle ended; waiting for user action to trigger repeating quest.");
  }
}