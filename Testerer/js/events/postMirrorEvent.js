import { BaseEvent } from './baseEvent.js';
import { StateManager } from '../stateManager.js';
import { ErrorManager } from '../errorManager.js';

/**
 * PostMirrorEvent
 * 
 * This event publishes a ghost post and updates the ghost sequence to mark the mirror quest as finished,
 * preparing the repeating event by setting its status to 'not_started'.
 * It also updates the UI via ViewManager.
 */
export class PostMirrorEvent extends BaseEvent {
  /**
   * @param {EventManager} eventManager - Manager handling diary operations.
   * @param {App} appInstance - Reference to the main application instance.
   */
  constructor(eventManager, appInstance) {
    super(eventManager);
    this.app = appInstance;
    this.key = "post_mirror_event";
  }

  async activate() {
    // If the event is already logged, skip activation.
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`[PostMirrorEvent] Event '${this.key}' is already logged, skipping activation.`);
      return;
    }
    console.log(`[PostMirrorEvent] Activating event '${this.key}'.`);

    // Log the event in the diary as a ghost post.
    await this.eventManager.addDiaryEntry(this.key, true);

    // Update ghost sequence: mark mirror quest as finished and prepare repeating event.
    this.app.ghostManager.updateEventStepStatus('mirror', 'finished');
    this.app.ghostManager.updateEventStepStatus('repeating', 'not_started');
    console.log("[PostMirrorEvent] Updated event sequence: 'mirror' set to finished and 'repeating' set to not_started.");

    // Clear the mirrorQuestReady flag.
    StateManager.set("mirrorQuestReady", "false");
    // Set the isRepeatingCycle flag so that repeating quest can be initiated.
    StateManager.set("isRepeatingCycle", "true");
    // Ensure that the postButtonDisabled flag is cleared.
    StateManager.set("postButtonDisabled", "false");

    // Delegate UI update: enable the "Post" button via ViewManager.
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
      this.app.viewManager.setPostButtonEnabled(true);
      console.log("[PostMirrorEvent] Post button enabled via ViewManager.");
    }

    // Trigger the mirror visual effect.
    this.app.visualEffectsManager.triggerMirrorEffect();

    console.log("[PostMirrorEvent] Mirror quest cycle ended; waiting for user action to trigger repeating quest.");
  }
}