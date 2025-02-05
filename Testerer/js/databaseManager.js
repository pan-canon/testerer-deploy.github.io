export class DatabaseManager {
  constructor() {
    this.db = null;
    this.initDatabasePromise = this.initDatabase();
  }

  async initDatabase() {
    const SQL = await initSqlJs({
      locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });
    // Проверяем, сохранена ли база в localStorage
    const savedDb = localStorage.getItem("diaryDB");
    if (savedDb) {
      // Декодируем base64 в Uint8Array
      const byteStr = atob(savedDb);
      const bytes = new Uint8Array(byteStr.length);
      for (let i = 0; i < byteStr.length; i++) {
        bytes[i] = byteStr.charCodeAt(i);
      }
      this.db = new SQL.Database(bytes);
    } else {
      this.db = new SQL.Database();
      this.db.run(`
        CREATE TABLE IF NOT EXISTS diary (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entry TEXT,
          timestamp TEXT
        );
      `);
    }
    console.log("📖 Database initialized!");
  }

  saveDatabase() {
    if (!this.db) return;
    // Экспортируем базу в бинарный массив
    const binaryData = this.db.export();
    let binaryStr = "";
    for (let i = 0; i < binaryData.length; i++) {
      binaryStr += String.fromCharCode(binaryData[i]);
    }
    // Кодируем в base64
    const base64 = btoa(binaryStr);
    localStorage.setItem("diaryDB", base64);
  }

async addDiaryEntry(entry) {
    if (!this.db) {
        console.error("⚠️ Database not initialized!");
        return;
    }

    try {
        const timestamp = new Date().toISOString();
        this.db.run("INSERT INTO diary (entry, timestamp) VALUES (?, ?)", [entry, timestamp]);
        this.saveDatabase();

        console.log("✅ Запись добавлена:", entry);
    } catch (error) {
        console.error("❌ Ошибка при добавлении записи в дневник:", error);
    }
}


  getDiaryEntries() {
    if (!this.db) {
      console.error("⚠️ Database not initialized!");
      return [];
    }
    const result = this.db.exec("SELECT * FROM diary ORDER BY timestamp DESC");
    if (result.length > 0) {
      return result[0].values.map(row => ({ id: row[0], entry: row[1], timestamp: row[2] }));
    }
    return [];
  }
}