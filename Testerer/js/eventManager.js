import { ErrorManager } from './errorManager.js';

export class EventManager {
  /**
   * Constructor for EventManager.
   * @param {DatabaseManager} databaseManager - Instance of the database manager.
   * @param {LanguageManager} languageManager - Localization manager.
   * @param {GhostManager} ghostManager - Ghost manager.
   * @param {VisualEffectsManager} visualEffectsManager - Visual effects manager.
   *
   * This class is responsible for diary operations:
   * - Adding entries (dialogues, notifications, quest messages).
   * - Delegating the display update of diary entries to the ViewManager.
   * - Launching short events if needed.
   */
  constructor(databaseManager, languageManager, ghostManager, visualEffectsManager) {
    this.databaseManager = databaseManager;
    this.languageManager = languageManager;
    this.ghostManager = ghostManager;
    this.visualEffectsManager = visualEffectsManager;
    // The viewManager reference is expected to be set externally (e.g., from App).
  }

  /**
   * isEventLogged – Checks whether an entry with the given key has already been added.
   * @param {string} eventKey - The event key.
   * @returns {boolean} True if the entry is found, otherwise false.
   */
  isEventLogged(eventKey) {
    const entries = this.databaseManager.getDiaryEntries();
    return entries.some(entry => entry.entry === eventKey);
  }

  /**
   * addDiaryEntry – Adds an entry to the diary with an indication of its source (ghost or user).
   * Delegates the diary UI update to the ViewManager.
   * Also saves system events to the events table.
   * @param {string} entry - The text of the entry.
   * @param {boolean} [isPostFromGhost=false] - If true, styles the entry as a ghost post.
   */
  async addDiaryEntry(entry, isPostFromGhost = false) {
    const postClass = isPostFromGhost ? "ghost-post" : "user-post";
    const entryData = { entry, postClass };
    const serializedEntry = JSON.stringify(entryData);

    // Add diary entry to the database.
    await this.databaseManager.addDiaryEntry(serializedEntry);

    // If this is a system event, also save it to the events table.
    if (isPostFromGhost) {
      const eventData = {
        event_key: entry,
        event_text: entry,
        timestamp: new Date().toISOString(),
        completed: 0
      };
      this.databaseManager.saveEvent(eventData);
    }

    // Delegate UI update.
    this.updateDiaryDisplay();
  }

  /**
   * updateDiaryDisplay – Retrieves diary entries and delegates rendering to the ViewManager.
   */
  updateDiaryDisplay() {
    if (this.viewManager && typeof this.viewManager.renderDiary === 'function') {
      const entries = this.databaseManager.getDiaryEntries();
      const currentLanguage = this.languageManager.getLanguage();
      this.viewManager.renderDiary(entries, currentLanguage, this.visualEffectsManager);
    } else {
      ErrorManager.logError("ViewManager is not available. Cannot update diary display.", "updateDiaryDisplay");
      ErrorManager.showError("Unable to update diary display.");
    }
  }

  /**
   * startGhostQuest – Example method: Starts a quest for the current ghost.
   */
  async startGhostQuest() {
    const ghost = this.ghostManager.getCurrentGhost();
    if (ghost) {
      const questKey = `ghost_${ghost.id}_quest`;
      await this.addDiaryEntry(questKey, true);
      console.log(`👻 Starting quest for ${ghost.name}...`);
    } else {
      ErrorManager.logError("No active ghost found.", "startGhostQuest");
      ErrorManager.showError("⚠️ No active ghost found.");
    }
  }
  
  // Additional helper methods can be added as needed.
}