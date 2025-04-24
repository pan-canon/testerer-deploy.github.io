import { ErrorManager } from './ErrorManager.js';
import StateKeys from '../config/stateKeys.json' assert { type: 'json' };

/**
 * StateManager
 *
 * Centralized module for managing application state.
 * Provides static methods to get, set, and remove values from localStorage.
 * All parts of the application should use these methods to access or modify state.
 *
 * Note: Values are stored as strings, so for objects or arrays use JSON.stringify() before setting,
 * and JSON.parse() when retrieving.
 */
export class StateManager {
  // Load all state-keys from external JSON config
  static KEYS = StateKeys;

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
   * Stores the given value in localStorage under the specified key.
   *
   * @param {string} key - The key under which to store the value.
   * @param {string} value - The value to store (should be a string; use JSON.stringify() if needed).
   */
  static set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      ErrorManager.logError(`StateManager.set error for key "${key}": ${error}`, "StateManager.set");
    }
  }

  /**
   * Removes the item with the specified key from localStorage.
   *
   * @param {string} key - The key of the item to remove.
   */
  static remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      ErrorManager.logError(`StateManager.remove error for key "${key}": ${error}`, "StateManager.remove");
    }
  }

  /**
   * Mark camera as open or closed.
   * @param {boolean} isOpen
   */
  static setCameraOpen(isOpen) {
    StateManager.set(StateManager.KEYS.CAMERA_OPEN, isOpen ? 'true' : 'false');
  }

  /**
   * Check whether camera is currently open.
   * @returns {boolean}
   */
  static isCameraOpen() {
    return StateManager.get(StateManager.KEYS.CAMERA_OPEN) === 'true';
  }

  /**
   * Store or clear the active quest key.
   * @param {string|null} key
   */
  static setActiveQuestKey(key) {
    if (key) {
      StateManager.set(StateManager.KEYS.ACTIVE_QUEST_KEY, key);
    } else {
      StateManager.remove(StateManager.KEYS.ACTIVE_QUEST_KEY);
    }
  }

  /**
   * Retrieve the current active quest key, or null if none.
   * @returns {string|null}
   */
  static getActiveQuestKey() {
    return StateManager.get(StateManager.KEYS.ACTIVE_QUEST_KEY);
  }

  /**
   * Return true if both the camera is open and a quest is active.
   * @returns {boolean}
   */
  static canShoot() {
    return this.get(StateManager.KEYS.CAMERA_BUTTON_ACTIVE) === "true" && !!this.getActiveQuestKey();
  }

  /**
   * Return true if no quest is active (i.e. user may press Post).
   * @returns {boolean}
   */
  static canPost() {
    return !StateManager.getActiveQuestKey();
  }
}