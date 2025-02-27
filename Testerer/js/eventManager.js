export class EventManager {
  /**
   * Constructor for EventManager.
   * @param {DatabaseManager} databaseManager - Instance of the database manager.
   * @param {LanguageManager} languageManager - Localization manager.
   * @param {GhostManager} ghostManager - Ghost manager (if used).
   * @param {VisualEffectsManager} visualEffectsManager - Visual effects manager (if used).
   *
   * This class is responsible for diary operations:
   * - Adding entries (dialogues, notifications, quest messages).
   * - Delegating the display update of diary entries to the ViewManager.
   * - Launching short events (via GameEventManager) if needed.
   */
  constructor(databaseManager, languageManager, ghostManager, visualEffectsManager) {
    this.databaseManager = databaseManager;
    this.languageManager = languageManager;
    this.ghostManager = ghostManager;
    this.visualEffectsManager = visualEffectsManager;
    
    // NOTE: The diary container is no longer accessed directly.
    // Diary rendering is delegated to the ViewManager.
    // Expect this.viewManager to be set externally (e.g., from App).
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
   * @param {string} entry - The text of the entry (usually in JSON format or plain text).
   * @param {boolean} [isPostFromGhost=false] - If true, the entry will be styled as a ghost post.
   */
  async addDiaryEntry(entry, isPostFromGhost = false) {
    // Determine the CSS class for styling the entry.
    const postClass = isPostFromGhost ? "ghost-post" : "user-post";
    // Create the entry object.
    const entryData = { entry, postClass };
    // Serialize the entry object into a JSON string.
    const serializedEntry = JSON.stringify(entryData);

    // Add the entry to the database using DatabaseManager.
    await this.databaseManager.addDiaryEntry(serializedEntry);

    // Delegate the diary display update to ViewManager.
    this.updateDiaryDisplay();
  }

  /**
   * updateDiaryDisplay – Retrieves diary entries from the database and delegates their rendering.
   * The actual UI update is handled by the ViewManager's renderDiary method.
   */
  updateDiaryDisplay() {
    if (this.viewManager && typeof this.viewManager.renderDiary === 'function') {
      const entries = this.databaseManager.getDiaryEntries();
      const currentLanguage = this.languageManager.getLanguage();
      // Delegate rendering: ViewManager should handle animations and DOM updates.
      this.viewManager.renderDiary(entries, currentLanguage, this.visualEffectsManager);
    } else {
      console.error("ViewManager is not available. Cannot update diary display.");
    }
  }

  /**
   * startGhostQuest – Example method: Starts a quest for the current ghost.
   * Adds a diary entry with the quest key and logs the information to the console.
   */
  async startGhostQuest() {
    const ghost = this.ghostManager.getCurrentGhost();
    if (ghost) {
      const questKey = `ghost_${ghost.id}_quest`;
      await this.addDiaryEntry(questKey, true);
      console.log(`👻 Starting quest for ${ghost.name}...`);
      // Further logic (e.g., triggering QuestManager) can be added here.
    } else {
      console.error("⚠️ No active ghost found.");
    }
  }
  
  /*
   * Additional helper methods for triggering events can be added here.
   * All DOM manipulations related to diary updates must be delegated to ViewManager.
   */
}