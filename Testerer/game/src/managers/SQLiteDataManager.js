export class SQLiteDataManager {
  /**
   * Constructor for SQLiteDataManager.
   * @param {Object} options - Configuration options.
   *   - dbName: Name of the IndexedDB database (default: 'sqliteDB').
   *   - storeName: Name of the object store (default: 'dbStore').
   *   - key: Key under which the database is stored (default: 'sqlite').
   */
  constructor(options = {}) {
    this.dbName = options.dbName || 'sqliteDB';
    this.storeName = options.storeName || 'dbStore';
    this.key = options.key || 'sqlite';
  }

  /**
   * openDB – Opens (or creates) the IndexedDB database.
   * @returns {Promise<IDBDatabase>} Resolves with the opened database instance.
   */
  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = event => {
        console.error("Error opening IndexedDB:", event.target.error);
        reject(event.target.error);
      };
      request.onupgradeneeded = event => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      request.onsuccess = event => {
        resolve(event.target.result);
      };
    });
  }

  /**
   * initDatabase – Initializes the SQL.js database.
   * If saved database data is found in IndexedDB, restores it.
   * Otherwise, creates a new database instance and sets up the required tables.
   *
   * Tables: diary, apartment_plan, quest_progress, ghosts, events, quests.
   *
   * @param {Object} SQL - The SQL.js module.
   * @returns {Promise<SQL.Database>} Resolves to the SQL.js database instance.
   */
  async initDatabase(SQL) {
    try {
      const savedDbBase64 = await this.loadDatabase();
      let dbInstance;
      if (savedDbBase64) {
        // Restore database from saved base64 data.
        const binaryStr = atob(savedDbBase64);
        const binaryData = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          binaryData[i] = binaryStr.charCodeAt(i);
        }
        dbInstance = new SQL.Database(binaryData);
        console.log("Database restored from IndexedDB.");
      } else {
        // Create a new database instance and initialize tables.
        dbInstance = new SQL.Database();
        dbInstance.run(`
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
          CREATE TABLE IF NOT EXISTS ghosts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            status TEXT,
            progress INTEGER
          );
          CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_key TEXT,
            event_text TEXT,
            timestamp TEXT,
            completed INTEGER
          );
          CREATE TABLE IF NOT EXISTS quests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quest_key TEXT,
            status TEXT,
            current_stage INTEGER,
            total_stages INTEGER
          );
        `);
        console.log("New database created and tables initialized.");
      }
      return dbInstance;
    } catch (error) {
      console.error("Error in initDatabase:", error);
      throw error;
    }
  }

  /**
   * saveDatabase – Exports the database to a base64 string and persists it via IndexedDB.
   *
   * @param {string} base64Data - The base64-encoded database data.
   * @returns {Promise<void>} Resolves when saving is complete.
   */
  async saveDatabase(base64Data) {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readwrite");
        transaction.oncomplete = () => {
          console.log("Database saved successfully in IndexedDB.");
          resolve();
        };
        transaction.onerror = event => {
          console.error("Transaction error during saveDatabase:", event.target.error);
          reject(event.target.error);
        };
        const store = transaction.objectStore(this.storeName);
        const putRequest = store.put(base64Data, this.key);
        putRequest.onerror = event => {
          console.error("Error saving database data:", event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("Error in saveDatabase:", error);
      throw error;
    }
  }

  /**
   * loadDatabase – Loads the database data from IndexedDB.
   *
   * @returns {Promise<string>} Resolves to the base64 string representing the database, or undefined if not found.
   */
  async loadDatabase() {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readonly");
        transaction.onerror = event => {
          console.error("Transaction error during loadDatabase:", event.target.error);
          reject(event.target.error);
        };
        const store = transaction.objectStore(this.storeName);
        const getRequest = store.get(this.key);
        getRequest.onsuccess = event => {
          console.log("Database loaded successfully from IndexedDB.");
          resolve(event.target.result);
        };
        getRequest.onerror = event => {
          console.error("Error loading database data:", event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("Error in loadDatabase:", error);
      throw error;
    }
  }

  /**
   * resetDatabase – Deletes the saved SQL database data (base64 string) from IndexedDB.
   *
   * @returns {Promise<void>} Resolves when the database data is successfully deleted.
   */
  async resetDatabase() {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readwrite");
        transaction.oncomplete = () => {
          console.log("SQL database reset successfully in IndexedDB.");
          resolve();
        };
        transaction.onerror = event => {
          console.error("Transaction error during resetDatabase:", event.target.error);
          reject(event.target.error);
        };
        const store = transaction.objectStore(this.storeName);
        const deleteRequest = store.delete(this.key);
        deleteRequest.onerror = event => {
          console.error("Error deleting SQL database data:", event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("Error in resetDatabase:", error);
      throw error;
    }
  }

  /**
   * saveProfile – Saves the profile data to IndexedDB.
   *
   * @param {Object} profile - The profile object to be saved.
   * @returns {Promise<void>}
   */
  async saveProfile(profile) {
    const profileKey = 'profile';
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readwrite");
        transaction.oncomplete = () => {
          console.log("Profile saved successfully in IndexedDB.");
          resolve();
        };
        transaction.onerror = event => {
          console.error("Transaction error during saveProfile:", event.target.error);
          reject(event.target.error);
        };
        const store = transaction.objectStore(this.storeName);
        const putRequest = store.put(JSON.stringify(profile), profileKey);
        putRequest.onerror = event => {
          console.error("Error saving profile data:", event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("Error in saveProfile:", error);
      throw error;
    }
  }

  /**
   * getProfile – Loads the profile data from IndexedDB.
   *
   * @returns {Promise<Object|null>} Resolves to the profile object or null if not found.
   */
  async getProfile() {
    const profileKey = 'profile';
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readonly");
        transaction.onerror = event => {
          console.error("Transaction error during getProfile:", event.target.error);
          reject(event.target.error);
        };
        const store = transaction.objectStore(this.storeName);
        const getRequest = store.get(profileKey);
        getRequest.onsuccess = event => {
          const result = event.target.result;
          if (result) {
            resolve(JSON.parse(result));
          } else {
            resolve(null);
          }
        };
        getRequest.onerror = event => {
          console.error("Error loading profile data:", event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("Error in getProfile:", error);
      throw error;
    }
  }

  /**
   * resetProfile – Deletes the profile data from IndexedDB.
   *
   * @returns {Promise<void>} Resolves when the profile is successfully reset.
   */
  async resetProfile() {
    const profileKey = 'profile';
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readwrite");
        transaction.oncomplete = () => {
          console.log("Profile reset successfully in IndexedDB.");
          resolve();
        };
        transaction.onerror = event => {
          console.error("Transaction error during resetProfile:", event.target.error);
          reject(event.target.error);
        };
        const store = transaction.objectStore(this.storeName);
        const deleteRequest = store.delete(profileKey);
        deleteRequest.onerror = event => {
          console.error("Error deleting profile:", event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("Error in resetProfile:", error);
      throw error;
    }
  }

  // Additional methods for ghosts, events, quests can be added here:
  // async saveGhostProgress(progress) { ... }
  // async getGhostProgress() { ... }
  // async saveLocationType(locationType) { ... }
  // async getLocationType() { ... }
}