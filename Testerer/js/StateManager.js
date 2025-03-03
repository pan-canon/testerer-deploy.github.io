export class StateManager {
  /**
   * Retrieves the value for the specified key from localStorage.
   * @param {string} key - The key to retrieve.
   * @returns {string|null} The stored value as a string, or null if not found or on error.
   */
  static get(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`StateManager.get error for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Stores the given value in localStorage under the specified key.
   * @param {string} key - The key under which to store the value.
   * @param {string} value - The value to store (should be a string; use JSON.stringify if needed).
   */
  static set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`StateManager.set error for key "${key}":`, error);
    }
  }

  /**
   * Removes the item with the specified key from localStorage.
   * @param {string} key - The key of the item to remove.
   */
  static remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`StateManager.remove error for key "${key}":`, error);
    }
  }
}