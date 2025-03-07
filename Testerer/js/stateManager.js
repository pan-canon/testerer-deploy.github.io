import { ErrorManager } from './errorManager.js';

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
}