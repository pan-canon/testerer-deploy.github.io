import { ErrorManager } from './ErrorManager.js';

/**
 * EventManager
 * Responsible for handling diary (log) operations and recording system events.
 * - Adds diary entries (both user and ghost posts).
 * - Delegates the diary UI update to ViewManager.
 * - Can trigger short events (e.g., ghost quests) if needed.
 *
 * NOTE: The sequential linking of events is managed by GhostManager.
 */
export class EventManager {
  /**
   * @param {DatabaseManager} databaseManager - Instance of the database manager.
   * @param {LanguageManager} languageManager - Localization manager.
   * @param {GhostManager} ghostManager - Manager handling ghost-related operations.
   * @param {VisualEffectsManager} visualEffectsManager - Manager handling visual effects.
   *
   * Note: The viewManager reference is expected to be set externally (e.g. in App.js).
   */
  constructor(databaseManager, languageManager, ghostManager, visualEffectsManager) {
    this.databaseManager = databaseManager;
    this.languageManager = languageManager;
    this.ghostManager = ghostManager;
    this.visualEffectsManager = visualEffectsManager;
    // viewManager is assigned externally after instantiation.
  }

  /**
   * isEventLogged
   * Checks whether an entry with the given event key has already been logged.
   * This method compares the stored entry key with the provided key.
   *
   * @param {string} eventKey - The event key to check.
   * @returns {boolean} True if the event is already logged, otherwise false.
   */
  isEventLogged(eventKey) {
    const entries = this.databaseManager.getDiaryEntries();
    // Compare the stored entry key with the provided key.
    return entries.some(entry => entry.entry === eventKey);
  }

  /**
   * addDiaryEntry
   * Adds an entry to the diary. It constructs an object with the entry text and post type,
   * serializes it as JSON, and saves it to the database. If the entry represents a system event
   * (e.g., from a ghost), it is additionally saved to the events table.
   *
   * After saving, it delegates the UI update (diary rendering) to the ViewManager.
   * Then, it calls the centralized visual effects method to animate the newly added entry.
   *
   * @param {string} entry - The text of the diary entry.
   * @param {boolean} [isPostFromGhost=false] - Flag to mark the entry as a ghost post.
   */
  async addDiaryEntry(entry, isPostFromGhost = false) {
    // Determine post class based on the source.
    const postClass = isPostFromGhost ? "ghost-post" : "user-post";
    const entryData = { entry, postClass };
    const serializedEntry = JSON.stringify(entryData);

    // Save the diary entry to the database.
    await this.databaseManager.addDiaryEntry(serializedEntry);

    // If this is a system event (ghost post), also record it in the events table.
    if (isPostFromGhost) {
      const eventData = {
        event_key: entry,
        event_text: entry,
        timestamp: new Date().toISOString(),
        completed: 0
      };
      this.databaseManager.saveEvent(eventData);
    }

    // UI: try incremental add
    if (this.viewManager && typeof this.viewManager.addSingleDiaryPost === 'function') {
      await this.viewManager.addSingleDiaryPost(entryData);
    } else {
      // fallback: full rerender
      this.updateDiaryDisplay();
    }
  }

  /**
   * updateDiaryDisplay
   * Retrieves diary entries from the database and instructs the ViewManager
   * to render them. Uses the current language from the LanguageManager.
   */
  updateDiaryDisplay() {
    if (this.viewManager && typeof this.viewManager.renderDiary === 'function') {
      const entries = this.databaseManager.getDiaryEntries();
      const currentLanguage = this.languageManager.getLanguage();
      // Delegate rendering of the diary entries to the ViewManager.
      this.viewManager.renderDiary(entries, currentLanguage, this.visualEffectsManager);
    } else {
      // Log and display an error if the viewManager is not available.
      ErrorManager.logError("ViewManager is not available. Cannot update diary display.", "updateDiaryDisplay");
      ErrorManager.showError("Unable to update diary display.");
    }
  }
}