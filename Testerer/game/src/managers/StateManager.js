import { ErrorManager } from './ErrorManager.js';

/**
 * StateManager
 *
 * Centralized module for managing application state.
 * Provides static methods to get, set, and remove values from localStorage,
 * along with a pub/sub mechanism for reactive updates.
 *
 * Note: Values are stored as strings, so for objects or arrays use JSON.stringify() before setting,
 * and JSON.parse() when retrieving.
 *
 * Default keys:
 * - CURRENT_SEQUENCE_INDEX: Index for the current sequence of events/quests.
 * - POST_BUTTON_DISABLED: Flag to disable/enable the "Post" button.
 * - CAMERA_BUTTON_ACTIVE: Flag indicating if the camera button is active.
 * - MIRROR_QUEST_READY: Flag indicating if the mirror quest is ready.
 */
export class StateManager {
  // Default keys for ease of use across the application.
  static KEYS = {
    CURRENT_SEQUENCE_INDEX: 'currentSequenceIndex',
    POST_BUTTON_DISABLED: 'postButtonDisabled',
    CAMERA_BUTTON_ACTIVE: 'cameraButtonActive',
    MIRROR_QUEST_READY: 'mirrorQuestReady'
  };

  // Internal map of subscribers: key -> array of callback functions
  static _subscribers = {};

  /**
   * Retrieves the value associated with the specified key from localStorage.
   *
   * @param {string} key - The key to retrieve.
   * @returns {string|null} The stored value as a string, or null if not found or on error.
   */
  static get(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      ErrorManager.logError(`StateManager.get error for key "${key}": ${error}`, "StateManager.get");
      return null;
    }
  }

  /**
   * Stores the given value in localStorage under the specified key,
   * then notifies any subscribers of the change.
   *
   * @param {string} key - The key under which to store the value.
   * @param {string} value - The value to store (should be a string; use JSON.stringify() if needed).
   */
  static set(key, value) {
    try {
      const oldValue = localStorage.getItem(key);
      localStorage.setItem(key, value);
      // Notify subscribers of the change
      const subs = StateManager._subscribers[key];
      if (subs) {
        subs.forEach(cb => {
          try { cb(value, oldValue); }
          catch (err) { ErrorManager.logError(err, "StateManager.notifySubscriber"); }
        });
      }
    } catch (error) {
      ErrorManager.logError(`StateManager.set error for key "${key}": ${error}`, "StateManager.set");
    }
  }

  /**
   * Removes the item with the specified key from localStorage,
   * then notifies any subscribers that the value has been removed (newValue=null).
   *
   * @param {string} key - The key of the item to remove.
   */
  static remove(key) {
    try {
      const oldValue = localStorage.getItem(key);
      localStorage.removeItem(key);
      // Notify subscribers of removal
      const subs = StateManager._subscribers[key];
      if (subs) {
        subs.forEach(cb => {
          try { cb(null, oldValue); }
          catch (err) { ErrorManager.logError(err, "StateManager.notifySubscriber"); }
        });
      }
    } catch (error) {
      ErrorManager.logError(`StateManager.remove error for key "${key}": ${error}`, "StateManager.remove");
    }
  }

  /**
   * Subscribe to changes of a particular key.
   * The callback is invoked with (newValue, oldValue).
   *
   * @param {string} key - The key to listen for.
   * @param {function(string|null, string|null): void} callback - Handler for value changes.
   */
  static subscribe(key, callback) {
    if (!StateManager._subscribers[key]) {
      StateManager._subscribers[key] = [];
    }
    StateManager._subscribers[key].push(callback);
  }

  /**
   * Unsubscribe a previously added callback from a key.
   *
   * @param {string} key - The key to stop listening for.
   * @param {function} callback - The handler to remove.
   */
  static unsubscribe(key, callback) {
    const subs = StateManager._subscribers[key];
    if (!subs) return;
    StateManager._subscribers[key] = subs.filter(cb => cb !== callback);
  }
}