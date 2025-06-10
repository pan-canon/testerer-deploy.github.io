import { ErrorManager } from '../managers/ErrorManager.js';

/**
 * BaseEvent - Base class for events, providing common functionality
 * for activation and logging in the diary.
 * This class is used in an Observer Pattern where each event notifies
 * subscribed components (e.g., diary UI) about changes.
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
   * If an event with the given key has not been logged yet, the event is logged via the eventManager.
   * This method handles logging and notification without triggering subsequent actions.
   *
   * NOTE: No direct UI manipulations should be placed here — any UI updates
   *       (e.g. enabling/disabling buttons) happen in specialized managers.
   *
   * @returns {Promise<void>} Asynchronous execution.
   */
  async activate() {
    try {
      // Check if the event with this key has not been logged yet.
      if (!this.eventManager.isEventLogged(this.key)) {
        console.log(`Activating event: ${this.key}`);
        // Log the event in the diary (as a user post, without ghost flag).
        await this.eventManager.addDiaryEntry(this.key);
      }
    } catch (error) {
      // Delegate error logging and user notification.
      ErrorManager.logError(error, "BaseEvent.activate");
      ErrorManager.showError("An error occurred during event activation.");
    }
  }

  /**
   * addDiaryEntry – Convenience method to add a messenger entry.
   * Delegates the addition to the eventManager's addMessengerEntry.
   *
   * @param {string} text – The text key or raw text.
   * @param {boolean} [isGhostPost=false] – true for ghost posts.
   */
  async addDiaryEntry(text, isGhostPost = false) {
    try {
      await this.eventManager.addMessengerEntry(text, isGhostPost);
    } catch (error) {
      ErrorManager.logError(error, "BaseEvent.addDiaryEntry");
      ErrorManager.showError("An error occurred while adding a diary entry.");
    }
  }
}s