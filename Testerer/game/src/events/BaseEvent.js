// File: src/events/BaseEvent.js

import { ErrorManager } from '../managers/ErrorManager.js';

/**
 * BaseEvent - Base class for events, providing common functionality
 * for activation and diary logging.
 * This class implements the observer pattern to notify subscribed components (e.g. diary UI)
 * about event activations without directly updating the UI.
 */
export class BaseEvent {
  /**
   * Constructor for the BaseEvent.
   * @param {EventManager} eventManager - Instance of the event manager responsible for diary operations.
   *
   * @property {string} key - Unique identifier for the event, which should be set by subclasses.
   */
  constructor(eventManager) {
    /** @type {EventManager} */
    this.eventManager = eventManager;
    // Event key; should be overridden in subclasses.
    this.key = "";
  }

  /**
   * activate - Activates the event.
   * If the event with the given key has not been logged yet, it is logged via the eventManager.
   * No direct UI manipulations are performed here.
   *
   * @returns {Promise<void>} Asynchronous execution.
   */
  async activate() {
    try {
      // Check if the event with this key has not been logged yet.
      if (!this.eventManager.isEventLogged(this.key)) {
        console.log(`Activating event: ${this.key}`);
        // Log the event in the diary.
        await this.eventManager.addDiaryEntry(this.key);
      }
    } catch (error) {
      ErrorManager.logError(error, "BaseEvent.activate");
      ErrorManager.showError("An error occurred during event activation.");
    }
  }

  /**
   * addDiaryEntry - Convenience method to add a diary entry.
   * Delegates the addition to the eventManager.
   *
   * @param {string} text - The text of the entry to be added to the diary.
   * @param {boolean} [isGhostPost=false] - Flag indicating if this is a ghost post.
   * @returns {Promise<void>} Asynchronous execution.
   */
  async addDiaryEntry(text, isGhostPost = false) {
    try {
      await this.eventManager.addDiaryEntry(text, isGhostPost);
    } catch (error) {
      ErrorManager.logError(error, "BaseEvent.addDiaryEntry");
      ErrorManager.showError("An error occurred while adding a diary entry.");
    }
  }
}