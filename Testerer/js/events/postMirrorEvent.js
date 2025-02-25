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
    
    // Log the event in the diary as a ghost message
    await this.eventManager.addDiaryEntry(this.key, true);

    // Instead of auto-triggering the repeating quest,
    // set the flag to enable the "Post" button for user action
    // and mark that we are in repeating cycle mode.
    localStorage.setItem("mirrorQuestReady", "true");
    localStorage.setItem("isRepeatingCycle", "true");
    this.app.questManager.updatePostButtonState();
    this.app.visualEffectsManager.triggerMirrorEffect();
    console.log("[PostMirrorEvent] Mirror quest cycle ended; waiting for user action to trigger repeating quest.");
  }
}