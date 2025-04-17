import { ErrorManager } from './ErrorManager.js';

/**
 * StateManager
 *
 * Centralized module for managing application state.
 * Provides static methods to get, set, and remove values from localStorage.
 * All parts of the application should use these methods to access or modify state.
 *
 * Note: Values are stored as strings, so for objects or arrays use JSON.stringify() before setting,
 * and JSON.parse() when retrieving.
 *
 * Default keys:
 * - currentSequenceIndex: Index for the current sequence of events/quests.
 * - postButtonDisabled: Flag to disable/enable the "Post" button.
 * - cameraButtonActive: Flag indicating if the camera button is active.
 * - mirrorQuestReady: Flag indicating if the mirror quest is ready.
 */
export class StateManager {
  // Define default keys as static constants for ease of use across the application.
  static KEYS = {
    CURRENT_SEQUENCE_INDEX: 'currentSequenceIndex',
    POST_BUTTON_DISABLED: 'postButtonDisabled',
    CAMERA_BUTTON_ACTIVE: 'cameraButtonActive',
    MIRROR_QUEST_READY: 'mirrorQuestReady'
  };

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

  static set(key, value) {
    try {
      localStorage.setItem(key, value);
      // 🚀 если меняется activeQuestKey — бросаем событие
      if (key === 'activeQuestKey') {
        document.dispatchEvent(
          new CustomEvent('activeQuestKeyChanged', { detail: value })
        );
      }
    } catch (error) {
      ErrorManager.logError(
        `StateManager.set error for key "${key}": ${error}`,
        "StateManager.set"
      );
    }
  }

  static remove(key) {
    try {
      localStorage.removeItem(key);
      // 🚀 если удаляем activeQuestKey — бросаем событие с detail:null
      if (key === 'activeQuestKey') {
        document.dispatchEvent(
          new CustomEvent('activeQuestKeyChanged', { detail: null })
        );
      }
    } catch (error) {
      ErrorManager.logError(
        `StateManager.remove error for key "${key}": ${error}`,
        "StateManager.remove"
      );
    }
  }
}