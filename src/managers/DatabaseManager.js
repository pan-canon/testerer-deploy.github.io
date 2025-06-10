import { SQLiteDataManager } from './SQLiteDataManager.js';
import { BASE_PATH } from '../config/paths.js';
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
        locateFile: file => `${BASE_PATH}/assets/libs/db/${file}`
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
   * insertOrUpdate – Performs a generic INSERT or INSERT OR REPLACE into any table.
   *
   * @param {string} tableName – Name of the table.
   * @param {Object} data – Key/value pairs matching columns and their values.
   * @param {Object} [options] – Optional flags.
   * @param {boolean} [options.replace=false] – If true, uses INSERT OR REPLACE.
   */
  async insertOrUpdate(tableName, data, options = {}) {
    if (!this.db) {
      ErrorManager.logError("Database not initialized!", "insertOrUpdate");
      return;
    }
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data);
    const verb = options.replace ? 'INSERT OR REPLACE' : 'INSERT';
    const sql = `${verb} INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    try {
      this.db.run(sql, values);
      await this.saveDatabase();
    } catch (err) {
      if (err.message && err.message.includes("no such table")) {
        console.warn(`⚠️ Skipping write to missing table "${tableName}"`);
      } else {
        throw err;
      }
    }
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
    await this.insertOrUpdate('diary', { entry, timestamp });
    console.log("✅ Entry added:", entry);
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
  async addQuestProgress(questKey, status) {
    if (!this.db) {
      ErrorManager.logError("Database not initialized!", "addQuestProgress");
      return;
    }
    await this.insertOrUpdate('quest_progress', { quest_key: questKey, status });
    console.log(`✅ Quest progress added: ${questKey} - ${status}`);
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
  async addApartmentRooms(floor, rooms) {
    if (!this.db) {
      ErrorManager.logError("Database not initialized!", "addApartmentRooms");
      return;
    }
    const roomData = JSON.stringify(rooms);
    // Replace existing plan for floor, then insert new
    await this.insertOrUpdate('apartment_plan', { floor_number: floor, room_data: roomData }, { replace: true });
    console.log(`✅ Apartment plan for floor ${floor} saved.`);
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
  async saveGhostState(ghost) {
    if (!this.db) {
      ErrorManager.logError("Database not initialized!", "saveGhostState");
      return;
    }
    // Upsert by id
    const data = {
      id: ghost.id || null,
      name: ghost.name,
      status: ghost.status || "",
      progress: ghost.progress || 0
    };
    await this.insertOrUpdate('ghosts', data, { replace: true });
    console.log("✅ Ghost state saved:", ghost);
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
  async saveEvent(eventData) {
    if (!this.db) {
      ErrorManager.logError("Database not initialized!", "saveEvent");
      return;
    }
    await this.insertOrUpdate('events', {
      event_key: eventData.event_key,
      event_text: eventData.event_text,
      timestamp: eventData.timestamp,
      completed: eventData.completed ? 1 : 0
    });
    console.log("✅ Event saved:", eventData);
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
  async saveQuestRecord(questData) {
    if (!this.db) {
      ErrorManager.logError("Database not initialized!", "saveQuestRecord");
      return;
    }
    // Upsert by quest_key
    const existingIdResult = this.db.exec(
      "SELECT id FROM quests WHERE quest_key = ?",
      [questData.quest_key]
    );
    const id = existingIdResult.length ? existingIdResult[0].values[0][0] : null;
    await this.insertOrUpdate('quests', {
      id,
      quest_key: questData.quest_key,
      status: questData.status,
      current_stage: questData.current_stage,
      total_stages: questData.total_stages
    }, { replace: true });
    console.log("✅ Quest record saved:", questData);
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