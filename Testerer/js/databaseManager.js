export class DatabaseManager {
  constructor() {
    // The database object (SQL.Database) will be stored here.
    this.db = null;
    // A Promise that resolves after the database has been initialized.
    this.initDatabasePromise = this.initDatabase();
  }

  /**
   * initDatabase – Asynchronously initializes the database.
   * If the database is stored in localStorage, it loads it; otherwise, it creates a new one with the required tables.
   */
  async initDatabase() {
    // Load SQL.js, providing a locateFile function to find necessary files.
    const SQL = await initSqlJs({
      locateFile: file => `js/${file}`
    });
    // Check if the database is stored in localStorage under the key "diaryDB"
    const savedDb = localStorage.getItem("diaryDB");
    if (savedDb) {
      // If the database is found, decode the base64 string into a Uint8Array
      const byteStr = atob(savedDb);
      const bytes = new Uint8Array(byteStr.length);
      for (let i = 0; i < byteStr.length; i++) {
        bytes[i] = byteStr.charCodeAt(i);
      }
      // Create the database from the loaded bytes
      this.db = new SQL.Database(bytes);
    } else {
      // If no database is found, create a new database
      this.db = new SQL.Database();
      // Create the necessary tables: diary, apartment_plan, and quest_progress
      this.db.run(`
        CREATE TABLE IF NOT EXISTS diary (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entry TEXT,
          timestamp TEXT
        );
        CREATE TABLE IF NOT EXISTS apartment_plan (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          floor_number INTEGER,
          room_data TEXT
        );
        CREATE TABLE IF NOT EXISTS quest_progress (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          quest_key TEXT,
          status TEXT
        );
      `);
    }
    console.log("📖 Database initialized!");
  }

  /**
   * saveDatabase – Exports the database and saves it to localStorage.
   */
  saveDatabase() {
    if (!this.db) return;
    // Export the database to a binary array
    const binaryData = this.db.export();
    let binaryStr = "";
    for (let i = 0; i < binaryData.length; i++) {
      binaryStr += String.fromCharCode(binaryData[i]);
    }
    // Encode the binary string in base64 and save it in localStorage
    const base64 = btoa(binaryStr);
    localStorage.setItem("diaryDB", base64);
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
    // Get the current date and time in ISO format
    const timestamp = new Date().toISOString();
    // Insert a new entry into the diary table
    this.db.run("INSERT INTO diary (entry, timestamp) VALUES (?, ?)", [entry, timestamp]);
    console.log("✅ Entry added:", entry);
    // Save the database after inserting the entry
    this.saveDatabase();
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
    // Execute a query to select all entries
    const result = this.db.exec("SELECT * FROM diary ORDER BY timestamp DESC");
    if (result.length > 0) {
      return result[0].values.map(row => {
        let parsed;
        try {
          // Attempt to parse the entry field as JSON
          parsed = JSON.parse(row[1]);
        } catch (e) {
          // If parsing fails, use a default value
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
   * @param {Array} rooms - An array of objects describing the rooms (e.g., {floor, startRow, startCol, endRow, endCol, type}).
   */
  addApartmentRooms(floor, rooms) {
    if (!this.db) {
      console.error("⚠️ Database not initialized!");
      return;
    }
    // Convert the array of rooms to a JSON string
    const roomData = JSON.stringify(rooms);
    // Delete old data for this floor (if any)
    this.db.run("DELETE FROM apartment_plan WHERE floor_number = ?", [floor]);
    // Insert the new data
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
    // Execute a query to get the apartment plan data for the specified floor
    const result = this.db.exec("SELECT room_data FROM apartment_plan WHERE floor_number = ? ORDER BY id", [floor]);
    if (result.length > 0) {
      // Attempt to parse each room_data entry from JSON
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
}