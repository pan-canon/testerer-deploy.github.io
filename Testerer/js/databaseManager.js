import { SQLiteDataManager } from './SQLiteDataManager.js';

export class DatabaseManager {
  /**
   * Constructor for DatabaseManager.
   * @param {SQLiteDataManager} dataManager - Instance of the DataManager for persistence.
   */
  constructor(dataManager) {
    this.dataManager = dataManager; // Save reference to DataManager
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
    // Load SQL.js, providing a locateFile function to find necessary files.
    const SQL = await initSqlJs({
      locateFile: file => `js/${file}`
    });
    
    // Restore database from IndexedDB if saved, otherwise create a new instance
    this.db = await this.dataManager.initDatabase(SQL);
    
    console.log("📖 Database initialized!");
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
   * @param {string} entry - The text of the entry (usually a JSON string).
   */
  async addDiaryEntry(entry) {
    if (!this.db) {
      console.error("⚠️ Database not initialized!");
      return;
    }
    const timestamp = new Date().toISOString();
    this.db.run("INSERT INTO diary (entry, timestamp) VALUES (?, ?)", [entry, timestamp]);
    console.log("✅ Entry added:", entry);
    await this.saveDatabase();
  }

  /**
   * getDiaryEntries – Returns an array of diary entries sorted by descending timestamp.
   * @returns {Array} An array of entry objects { id, entry, postClass, timestamp }.
   */
  getDiaryEntries() {
    if (!this.db) {
      console.error("⚠️ Database not initialized!");
      return [];
    }
    const result = this.db.exec("SELECT * FROM diary ORDER BY timestamp DESC");
    if (result.length > 0) {
      return result[0].values.map(row => {
        let parsed;
        try {
          parsed = JSON.parse(row[1]);
        } catch (e) {
          parsed = { entry: row[1], postClass: "user-post" };
        }
        return { id: row[0], ...parsed, timestamp: row[2] };
      });
    }
    return [];
  }

  /**
   * addQuestProgress – Adds a quest progress record to the quest_progress table.
   * @param {string} questKey - The key of the quest.
   * @param {string} status - The status of the quest.
   */
  addQuestProgress(questKey, status) {
    if (!this.db) {
      console.error("⚠️ Database not initialized!");
      return;
    }
    this.db.run("INSERT INTO quest_progress (quest_key, status) VALUES (?, ?)", [questKey, status]);
    console.log(`✅ Quest progress added: ${questKey} - ${status}`);
    this.saveDatabase();
  }

  /**
   * getQuestProgress – Returns an array of progress records for the specified quest.
   * @param {string} questKey - The key of the quest.
   * @returns {Array} An array of progress objects { id, quest_key, status }.
   */
  getQuestProgress(questKey) {
    if (!this.db) {
      console.error("⚠️ Database not initialized!");
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
   * @param {number} floor - The floor number.
   * @param {Array} rooms - An array of room objects.
   */
  addApartmentRooms(floor, rooms) {
    if (!this.db) {
      console.error("⚠️ Database not initialized!");
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
   * @param {number} floor - The floor number.
   * @param {function} callback - A callback function that receives the plan data array.
   */
  getApartmentPlan(floor, callback) {
    if (!this.db) {
      console.error("⚠️ Database not initialized!");
      callback([]);
      return;
    }
    const result = this.db.exec("SELECT room_data FROM apartment_plan WHERE floor_number = ? ORDER BY id", [floor]);
    if (result.length > 0) {
      const rooms = result[0].values.map(row => {
        try {
          return JSON.parse(row[0]);
        } catch (e) {
          return row[0];
        }
      });
      callback(rooms);
    } else {
      callback([]);
    }
  }

  // ===== New methods for ghosts, events, and quests =====

  /**
   * saveGhostState – Saves or updates the ghost state in the ghosts table.
   * @param {Object} ghost - Ghost object containing id (optional), name, status, progress.
   */
  saveGhostState(ghost) {
    if (!this.db) {
      console.error("⚠️ Database not initialized!");
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
   * @param {number} ghostId - The ID of the ghost.
   * @returns {Object|null} The ghost object or null if not found.
   */
  getGhostState(ghostId) {
    if (!this.db) {
      console.error("⚠️ Database not initialized!");
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
   * @param {Object} eventData - Object with properties: event_key, event_text, timestamp, completed (0 or 1).
   */
  saveEvent(eventData) {
    if (!this.db) {
      console.error("⚠️ Database not initialized!");
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
   * @returns {Array} An array of event objects.
   */
  getEvents() {
    if (!this.db) {
      console.error("⚠️ Database not initialized!");
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
   * @param {Object} questData - Object with properties: quest_key, status, current_stage, total_stages.
   */
  saveQuestRecord(questData) {
    if (!this.db) {
      console.error("⚠️ Database not initialized!");
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
   * @param {string} questKey - The key of the quest.
   * @returns {Object|null} The quest record or null if not found.
   */
  getQuestRecord(questKey) {
    if (!this.db) {
      console.error("⚠️ Database not initialized!");
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