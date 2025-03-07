import { BaseEvent } from './baseEvent.js';
import { StateManager } from '../stateManager.js';
import { ErrorManager } from '../errorManager.js';

/**
 * PostMirrorEvent
 * 
 * This event publishes a ghost post and sets flags to start the mirror quest.
 * It updates the UI via ViewManager and uses StateManager to set the necessary flags.
 *
 * NOTE: This event is now part of the sequential chain managed by GhostManager.
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

    // Set necessary flags using StateManager.
    StateManager.set("mirrorQuestReady", "true");
    StateManager.set("isRepeatingCycle", "true");

    // Delegate UI update: enable the "Post" button via ViewManager.
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
      this.app.viewManager.setPostButtonEnabled(true);
    }

    // Trigger the mirror visual effect.
    this.app.visualEffectsManager.triggerMirrorEffect();

    console.log("[PostMirrorEvent] Mirror quest cycle ended; waiting for user action to trigger repeating quest.");
  }
}