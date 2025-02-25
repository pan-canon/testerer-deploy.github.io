import { BaseEvent } from './baseEvent.js';

/**
 * PostMirrorEvent – Event triggered AFTER the successful completion of the mirror quest.
 * Its role is to explicitly log a ghost post (from the ghost) without automatically triggering subsequent actions.
 */
export class PostMirrorEvent extends BaseEvent {
  constructor(eventManager, appInstance) {
    super(eventManager);
    this.app = appInstance;
    // Set the unique key for this event.
    this.key = "post_mirror_event";
  }

  /**
   * activate – Overridden activation method for PostMirrorEvent.
   * Logs the event as a ghost post and updates the UI (enables the "Post" button and unblocks controls).
   *
   * @returns {Promise<void>}
   */
  async activate() {
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`[PostMirrorEvent] Event '${this.key}' is already logged, skipping activation.`);
      return;
    }
    console.log(`[PostMirrorEvent] Activating event '${this.key}'.`);

    // Log the event in the diary as a ghost post.
    await this.eventManager.addDiaryEntry(this.key, true);

    // Update the "Post" button state and unblock camera controls.
    this.app.questManager.updatePostButtonState();
    this.app.visualEffectsManager.setControlsBlocked(false);

    // NOTE: Removed automatic activation of "repeating_quest".
    // The repeating quest will be triggered explicitly by user action (e.g., clicking the "Post" button).
  }
}