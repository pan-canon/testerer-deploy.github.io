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

saveButtonStates() {
  StateManager.set("postButtonEnabled", this.postBtn && !this.postBtn.disabled);
  StateManager.set("shootButtonEnabled", this.shootBtn && !this.shootBtn.disabled);
  StateManager.set("cameraButtonActive", this.toggleCameraBtn && this.toggleCameraBtn.classList.contains("active"));
  StateManager.set("diaryButtonActive", this.toggleDiaryBtn && this.toggleDiaryBtn.classList.contains("active"));
  console.log("[ViewManager] Button states saved.");
}

restoreButtonStates() {
  const postEnabled = StateManager.get("postButtonEnabled") === "true";
  const shootEnabled = StateManager.get("shootButtonEnabled") === "true";
  const cameraActive = StateManager.get("cameraButtonActive") === "true";
  const diaryActive = StateManager.get("diaryButtonActive") === "true";

  if (this.postBtn) this.postBtn.disabled = !postEnabled;
  if (this.shootBtn) this.shootBtn.disabled = !shootEnabled;
  if (this.toggleCameraBtn) {
    if (cameraActive) {
      this.toggleCameraBtn.classList.add("active");
    } else {
      this.toggleCameraBtn.classList.remove("active");
    }
  }
  if (this.toggleDiaryBtn) {
    if (diaryActive) {
      this.toggleDiaryBtn.classList.add("active");
    } else {
      this.toggleDiaryBtn.classList.remove("active");
    }
  }
  console.log("[ViewManager] Button states restored.");
}

}