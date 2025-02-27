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
      // Create object store if needed.
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
   * saveDatabase – Saves the provided database data (as a base64 string) to IndexedDB.
   * @param {string} base64Data - The base64-encoded database data.
   * @returns {Promise<void>} Resolves when saving is complete.
   */
  async saveDatabase(base64Data) {
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
  }

  /**
   * loadDatabase – Loads the database data from IndexedDB.
   * @returns {Promise<string>} Resolves to the base64 string representing the database, or undefined if not found.
   */
  async loadDatabase() {
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
  }

  /**
   * saveProfile – Saves the profile data to IndexedDB.
   * This method is an example and can be expanded as needed.
   * @param {Object} profile - The profile object to be saved.
   * @returns {Promise<void>}
   */
  async saveProfile(profile) {
    // Here you can define a separate key or use a dedicated object store for profiles.
    const profileKey = 'profile';
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
  }

  /**
   * getProfile – Loads the profile data from IndexedDB.
   * @returns {Promise<Object|null>} Resolves to the profile object or null if not found.
   */
  async getProfile() {
    const profileKey = 'profile';
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
  }

  // Similarly, additional methods such as saveGhostProgress, getGhostProgress,
  // saveLocationType, and getLocationType can be implemented following this pattern.
}