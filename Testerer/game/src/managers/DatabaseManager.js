import { SQLiteDataManager } from './SQLiteDataManager.js';
import { ErrorManager } from './ErrorManager.js';

/**
 * DatabaseManager
 *
 * Responsible for managing the SQL database which stores:
 * - Diary entries
 * - Apartment plans
 * - Quest progress
 * - Ghost states
 * - Events
 * - Quests
 *
 * It uses SQLiteDataManager for persistence (IndexedDB) and ensures that
 * entries (such as diary entries) are stored in a way that the event key checks
 * (via isEventLogged) work correctly.
 */
export class DatabaseManager {
  /**
   * Constructor for DatabaseManager.
   * @param {SQLiteDataManager} dataManager - Instance for persistence operations.
   */
  constructor(dataManager) {
    this.dataManager = dataManager; // Reference to the DataManager
    // The SQL.js database instance will be stored here.
    this.db = null;
    // A Promise that resolves after the database has been initialized.
    this.initDatabasePromise = this.initDatabase();
  }

  /**
   * initDatabase – Asynchronously initializes the database.
   * Restores the database from persistence if available;
   * otherwise creates a new database instance and sets up the required tables.
   * Tables: diary, apartment_plan, quest_progress, ghosts, events, quests.
   */
  async initDatabase() {
    try {
      // Load SQL.js, providing a locateFile function to find necessary files.
      const SQL = await initSqlJs({
        locateFile: file => `assets/libs/db/${file}`
      });
      
      // Restore database from IndexedDB if saved, otherwise create a new instance.
      this.db = await this.dataManager.initDatabase(SQL);
      
      console.log("📖 Database initialized!");
    } catch (error) {
      ErrorManager.logError(error, "DatabaseManager.initDatabase");
    }
  }

  /**
   * saveDatabase – Exports the database to a base64 string and persists it via the DataManager.
   */
  async saveDatabase() {
    if (!this.db) return;
    const binaryData = this.db.export();
    let binaryStr = "";
    for (let i = 0; i < binaryData.length; i++) {
      binaryStr += String.fromCharCode(binaryData[i]);
    }
    const base64 = btoa(binaryStr);
    await this.dataManager.saveDatabase(base64);
    console.log("Database saved (persisted) successfully.");
  }

  /**
   * addDiaryEntry – Adds a new entry to the diary table.
   * The entry is stored as a JSON string containing an "entry" property and a "postClass" property.
   * This format ensures that isEventLogged (which checks the "entry" field) works correctly.
   *
   * @param {string} entry - The text of the entry (usually a key or message).
   */
  async addDiaryEntry(entry) {
    if (!this.db) {
      ErrorManager.logError("Database not initialized!", "addDiaryEntry");
      return;
    }
    const timestamp = new Date().toISOString();
    this.db.run("INSERT INTO diary (entry, timestamp) VALUES (?, ?)", [entry, timestamp]);
    console.log("✅ Entry added:", entry);
    await this.saveDatabase();
  }

  /**
   * getDiaryEntries – Returns an array of diary entries sorted by descending timestamp.
   * Each entry is parsed from JSON, so that the "entry" property can be used for comparisons.
   *
   * @returns {Array} Array of entry objects: { id, entry, postClass, timestamp }.
   */
  getDiaryEntries() {
    if (!this.db) {
      ErrorManager.logError("Database not initialized!", "getDiaryEntries");
      return [];
    }
    const result = this.db.exec("SELECT * FROM diary ORDER BY timestamp DESC");
    if (result.length > 0) {
      return result[0].values.map(row => {
        let parsed;
        try {
          parsed = JSON.parse(row[1]);
        } catch (e) {
          // Fallback: if parsing fails, assume a plain entry.
          parsed = { entry: row[1], postClass: "user-post" };
          ErrorManager.logError(e, "getDiaryEntries JSON.parse");
        }
        return { id: row[0], ...parsed, timestamp: row[2] };
      });
    }
    return [];
  }

  /**
   * addQuestProgress – Adds a quest progress record to the quest_progress table.
   *
   * @param {string} questKey - The key of the quest.
   * @param {string} status - The status of the quest.
   */
  addQuestProgress(questKey, status) {
    if (!this.db) {
      ErrorManager.logError("Database not initialized!", "addQuestProgress");
      return;
    }
    this.db.run("INSERT INTO quest_progress (quest_key, status) VALUES (?, ?)", [questKey, status]);
    console.log(`✅ Quest progress added: ${questKey} - ${status}`);
    this.saveDatabase();
  }

  /**
   * getQuestProgress – Returns an array of progress records for the specified quest.
   *
   * @param {string} questKey - The key of the quest.
   * @returns {Array} Array of progress objects: { id, quest_key, status }.
   */
  getQuestProgress(questKey) {
    if (!this.db) {
      ErrorManager.logError("Database not initialized!", "getQuestProgress");
      return null;
    }
    const result = this.db.exec("SELECT * FROM quest_progress WHERE quest_key = ?", [questKey]);
    if (result.length > 0) {
      return result[0].values.map(row => ({ id: row[0], quest_key: row[1], status: row[2] }));
    }
    return [];
  }

  /**
   * addApartmentRooms – Saves the apartment plan data for the specified floor.
   *
   * @param {number} floor - The floor number.
   * @param {Array} rooms - An array of room objects.
   */
  addApartmentRooms(floor, rooms) {
    if (!this.db) {
      ErrorManager.logError("Database not initialized!", "addApartmentRooms");
      return;
    }
    const roomData = JSON.stringify(rooms);
    this.db.run("DELETE FROM apartment_plan WHERE floor_number = ?", [floor]);
    this.db.run("INSERT INTO apartment_plan (floor_number, room_data) VALUES (?, ?)", [floor, roomData]);
    console.log(`✅ Apartment plan for floor ${floor} saved.`);
    this.saveDatabase();
  }

  /**
   * getApartmentPlan – Returns the apartment plan data for the specified floor.
   *
   * @param {number} floor - The floor number.
   * @param {function} callback - Callback function receiving the plan data array.
   */
  getApartmentPlan(floor, callback) {
    if (!this.db) {
      ErrorManager.logError("Database not initialized!", "getApartmentPlan");
      callback([]);
      return;
    }
    const result = this.db.exec("SELECT room_data FROM apartment_plan WHERE floor_number = ? ORDER BY id", [floor]);
    if (result.length > 0) {
      const rooms = result[0].values.map(row => {
        try {
          return JSON.parse(row[0]);
        } catch (e) {
          ErrorManager.logError(e, "getApartmentPlan JSON.parse");
          return row[0];
        }
      });
      callback(rooms);
    } else {
      callback([]);
    }
  }

  // ===== Methods for ghosts, events, and quests =====

  /**
   * saveGhostState – Saves or updates the ghost state in the ghosts table.
   *
   * @param {Object} ghost - Ghost object containing id (optional), name, status, progress.
   */
  saveGhostState(ghost) {
    if (!this.db) {
      ErrorManager.logError("Database not initialized!", "saveGhostState");
      return;
    }
    this.db.run(
      `INSERT OR REPLACE INTO ghosts (id, name, status, progress)
       VALUES ((SELECT id FROM ghosts WHERE id = ?), ?, ?, ?)`,
      [ghost.id || null, ghost.name, ghost.status || "", ghost.progress || 0]
    );
    console.log("✅ Ghost state saved:", ghost);
    this.saveDatabase();
  }

  /**
   * getGhostState – Retrieves the ghost state by ghost id.
   *
   * @param {number} ghostId - The ID of the ghost.
   * @returns {Object|null} The ghost object or null if not found.
   */
  getGhostState(ghostId) {
    if (!this.db) {
      ErrorManager.logError("Database not initialized!", "getGhostState");
      return null;
    }
    const result = this.db.exec("SELECT * FROM ghosts WHERE id = ?", [ghostId]);
    if (result.length > 0) {
      const row = result[0].values[0];
      return { id: row[0], name: row[1], status: row[2], progress: row[3] };
    }
    return null;
  }

  /**
   * saveEvent – Saves an event record in the events table.
   *
   * @param {Object} eventData - Object with properties: event_key, event_text, timestamp, completed (0 or 1).
   */
  saveEvent(eventData) {
    if (!this.db) {
      ErrorManager.logError("Database not initialized!", "saveEvent");
      return;
    }
    this.db.run(
      `INSERT INTO events (event_key, event_text, timestamp, completed)
       VALUES (?, ?, ?, ?)`,
      [eventData.event_key, eventData.event_text, eventData.timestamp, eventData.completed ? 1 : 0]
    );
    console.log("✅ Event saved:", eventData);
    this.saveDatabase();
  }

  /**
   * getEvents – Retrieves all event records from the events table.
   *
   * @returns {Array} An array of event objects.
   */
  getEvents() {
    if (!this.db) {
      ErrorManager.logError("Database not initialized!", "getEvents");
      return [];
    }
    const result = this.db.exec("SELECT * FROM events ORDER BY timestamp DESC");
    if (result.length > 0) {
      return result[0].values.map(row => ({
        id: row[0],
        event_key: row[1],
        event_text: row[2],
        timestamp: row[3],
        completed: row[4] === 1
      }));
    }
    return [];
  }

  /**
   * saveQuestRecord – Saves or updates a quest record in the quests table.
   *
   * @param {Object} questData - Object with properties: quest_key, status, current_stage, total_stages.
   */
  saveQuestRecord(questData) {
    if (!this.db) {
      ErrorManager.logError("Database not initialized!", "saveQuestRecord");
      return;
    }
    this.db.run(
      `INSERT OR REPLACE INTO quests (id, quest_key, status, current_stage, total_stages)
       VALUES ((SELECT id FROM quests WHERE quest_key = ?), ?, ?, ?, ?)`,
      [questData.quest_key, questData.quest_key, questData.status, questData.current_stage, questData.total_stages]
    );
    console.log("✅ Quest record saved:", questData);
    this.saveDatabase();
  }

  /**
   * getQuestRecord – Retrieves a quest record by quest key.
   *
   * @param {string} questKey - The key of the quest.
   * @returns {Object|null} The quest record or null if not found.
   */
  getQuestRecord(questKey) {
    if (!this.db) {
      ErrorManager.logError("Database not initialized!", "getQuestRecord");
      return null;
    }
    const result = this.db.exec("SELECT * FROM quests WHERE quest_key = ?", [questKey]);
    if (result.length > 0) {
      const row = result[0].values[0];
      return {
        id: row[0],
        quest_key: row[1],
        status: row[2],
        current_stage: row[3],
        total_stages: row[4]
      };
    }
    return null;
  }
}