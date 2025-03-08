import { BaseEvent } from './baseEvent.js';
import { StateManager } from '../stateManager.js';
import { ErrorManager } from '../errorManager.js';

/**
 * PostMirrorEvent
 * 
 * This event publishes a ghost post and sets flags to start the mirror quest.
 * It updates the UI via ViewManager and uses StateManager to set the necessary flags.
 *
 * NOTE: This event is part of the sequential chain managed by GhostManager.
 * It does not handle sequence logic; it only performs its task and signals completion.
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
    // If the event is already logged in the diary, do not activate it again.
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`[PostMirrorEvent] Event '${this.key}' is already logged, skipping activation.`);
      return;
    }

    console.log(`[PostMirrorEvent] Activating event '${this.key}'.`);
    // Log the event as a ghost post.
    await this.eventManager.addDiaryEntry(this.key, true);

    // Set the necessary flags in StateManager.
    StateManager.set("mirrorQuestReady", "true");
    StateManager.set("isRepeatingCycle", "true");

    // Enable the "Post" button via ViewManager.
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
      this.app.viewManager.setPostButtonEnabled(true);
    }

    // Trigger the mirror effect if it is implemented.
    if (this.app.visualEffectsManager && typeof this.app.visualEffectsManager.triggerMirrorEffect === 'function') {
      this.app.visualEffectsManager.triggerMirrorEffect();
    }

    console.log("[PostMirrorEvent] Mirror quest cycle ended; waiting for user action to trigger repeating quest.");

    // Dispatch a custom event to signal the completion of this event.
    document.dispatchEvent(new CustomEvent("gameEventCompleted", { detail: this.key }));
  }
}