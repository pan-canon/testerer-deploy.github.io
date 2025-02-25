import { BaseEvent } from './baseEvent.js';

/**
 * PostMirrorEvent – A short event triggered AFTER the success of the mirror quest.
 * Its role is to explicitly switch to the RepeatingQuest by calling activateQuest("repeating_quest")
 * without automatically triggering any subsequent actions.
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
   * Logs the event as a ghost post and explicitly triggers the RepeatingQuest via QuestManager.
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

    // Explicitly trigger the RepeatingQuest via QuestManager.
    console.log("[PostMirrorEvent] Explicitly triggering 'repeating_quest'...");
    await this.app.questManager.activateQuest("repeating_quest");
  }
}