// File: src/events/PostMirrorEvent.js

import { BaseEvent } from './BaseEvent.js';
import { StateManager } from '../managers/StateManager.js';
import { ErrorManager } from '../managers/ErrorManager.js';

/**
 * PostMirrorEvent
 * 
 * This event publishes a ghost post and signals that the mirror quest cycle has ended.
 * It no longer directly updates UI elements (e.g. enabling the Post button) but relies on
 * the global event "gameEventCompleted" for subsequent UI updates.
 *
 * NOTE: This event is part of the sequential chain managed by GhostManager.
 * It performs its task and then dispatches a "gameEventCompleted" event.
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
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`[PostMirrorEvent] Event '${this.key}' is already logged, skipping activation.`);
      return;
    }

    console.log(`[PostMirrorEvent] Activating event '${this.key}'.`);
    await this.eventManager.addDiaryEntry(this.key, true);

    // Instead of directly updating the Post button state,
    // trigger the mirror effect and allow higher-level managers to update the UI.
    if (this.app.visualEffectsManager && typeof this.app.visualEffectsManager.triggerMirrorEffect === "function") {
      this.app.visualEffectsManager.triggerMirrorEffect();
    }
    console.log("[PostMirrorEvent] Mirror quest cycle ended; waiting for user action to trigger the next quest.");

    // Dispatch a global event to signal that this event has completed.
    document.dispatchEvent(new CustomEvent("gameEventCompleted", { detail: this.key }));
  }
}