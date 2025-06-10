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
  async isEventLogged(eventKey) {
    const entries = await this.databaseManager.getMessengerEntries();
    // Compare the stored entry key with the provided key.
    return entries.some(entry => entry.entry === eventKey);
  }

  /**
   * addMessengerEntry – Adds a new message into messenger_entries.
   *
   * @param {string} entryKey – localization key or raw text.
   * @param {boolean} [isPostFromGhost=false] – true for ghost messages.
   */
  async addMessengerEntry(entryKey, isPostFromGhost = false) {
    // determine source and postClass for UI
    const source = isPostFromGhost ? 'ghost' : 'user';
    const postClass = isPostFromGhost ? 'ghost-post' : 'user-post';

    // 1) save into messenger_entries via DatabaseManager
    await this.databaseManager.addMessengerEntry(entryKey, source);

    // 2) if ghost event, also record in events table
    if (isPostFromGhost) {
      const eventData = {
        event_key:  entryKey,
        event_text: entryKey,
        timestamp:  new Date().toISOString(),
        completed:  0
      };
      await this.databaseManager.saveEvent(eventData);
    }

    // 3) UI update via ViewManager
    if (this.viewManager?.addSingleDiaryPost) {
      this.viewManager.addSingleDiaryPost({
        text:       entryKey,
        img:        entryKey.startsWith('data:image') ? entryKey : '',
        timestamp:  new Date().toLocaleString(),
        postClass
      });
    } else {
      this.updateDiaryDisplay();
    }

    // 4) apply visual effects to newly added entries
    if (this.viewManager?.diaryContainer && this.visualEffectsManager) {
      const newEntries = this.viewManager.diaryContainer
        .querySelectorAll('[data-animate-on-board="true"]');
      this.visualEffectsManager.applyEffectsToNewElements(newEntries);
    }
  }

  /**
   * updateDiaryDisplay
   * Retrieves diary entries from the database and instructs the ViewManager
   * to render them. Uses the current language from the LanguageManager.
   */
  async updateDiaryDisplay() {
    if (this.viewManager && typeof this.viewManager.renderDiary === 'function') {
      const entries = await this.databaseManager.getMessengerEntries();
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