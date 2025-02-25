import { BaseEvent } from './baseEvent.js';

/**
 * PostRepeatingEvent – A short event triggered AFTER the success of the RepeatingQuest.
 * Its task is to explicitly switch to the FinalQuest without initiating an automatic chain.
 */
export class PostRepeatingEvent extends BaseEvent {
  constructor(eventManager, appInstance) {
    super(eventManager);
    this.app = appInstance;
    this.key = "post_repeating_event";
  }

  /**
   * activate – Overridden activation method for PostRepeatingEvent.
   * Logs the event in the diary and explicitly triggers the FinalQuest via QuestManager.
   *
   * @returns {Promise<void>}
   */
  async activate() {
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`[PostRepeatingEvent] Event '${this.key}' is already logged, skipping activation.`);
      return;
    }
    console.log(`[PostRepeatingEvent] Activating event '${this.key}'.`);

    // Log the event in the diary as a ghost post.
    await this.eventManager.addDiaryEntry(this.key, true);

    // Explicitly trigger the FinalQuest via QuestManager.
    console.log("[PostRepeatingEvent] Explicitly triggering 'final_quest'...");
    await this.app.questManager.activateQuest("final_quest");
  }
}