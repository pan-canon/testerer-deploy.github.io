import { BaseEvent } from './baseEvent.js';
import { StateManager } from '../stateManager.js';
import { ErrorManager } from '../errorManager.js';

/**
 * PostMirrorEvent
 * 
 * This event publishes a ghost post and sets flags to start the mirror quest.
 * It now always logs its ghost post and then dispatches a "gameEventCompleted" event.
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
    console.log(`[PostMirrorEvent] Activating event '${this.key}'.`);
    // Always log the ghost post.
    await this.eventManager.addDiaryEntry(this.key, true);
    
    // Set required flags.
    StateManager.set("mirrorQuestReady", "true");
    StateManager.set("isRepeatingCycle", "true");

    // Enable the Post button.
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
      this.app.viewManager.setPostButtonEnabled(true);
    }
    
    // Trigger the mirror visual effect if available.
    if (this.app.visualEffectsManager && typeof this.app.visualEffectsManager.triggerMirrorEffect === "function") {
      this.app.visualEffectsManager.triggerMirrorEffect();
    }
    console.log("[PostMirrorEvent] Mirror quest cycle ended; waiting for user action to trigger the next quest.");
    
    // Dispatch the event-completed signal.
    document.dispatchEvent(new CustomEvent("gameEventCompleted", { detail: this.key }));
  }
}