export class DatabaseManager {
  constructor() {
    this.db = null;
    this.initDatabasePromise = this.initDatabase();
  }

  async initDatabase() {
    const SQL = await initSqlJs({
      locateFile: file => `js/${file}`
    });
    // Если база уже сохранена в localStorage, загружаем её
    const savedDb = localStorage.getItem("diaryDB");
    if (savedDb) {
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

  saveDatabase() {
    if (!this.db) return;
    const binaryData = this.db.export();
    let binaryStr = "";
    for (let i = 0; i < binaryData.length; i++) {
      binaryStr += String.fromCharCode(binaryData[i]);
    }
    const base64 = btoa(binaryStr);
    localStorage.setItem("diaryDB", base64);
  }

  async addDiaryEntry(entry) {
    if (!this.db) {
      console.error("⚠️ Database not initialized!");
      return;
    }
    const timestamp = new Date().toISOString();
    this.db.run("INSERT INTO diary (entry, timestamp) VALUES (?, ?)", [entry, timestamp]);
    console.log("✅ Entry added:", entry);
    this.saveDatabase();
  }

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

  addQuestProgress(questKey, status) {
    if (!this.db) {
      console.error("⚠️ Database not initialized!");
      return;
    }
    this.db.run("INSERT INTO quest_progress (quest_key, status) VALUES (?, ?)", [questKey, status]);
    console.log(`✅ Quest progress added: ${questKey} - ${status}`);
    this.saveDatabase();
  }

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
  
  // Новые методы для работы с планом апартаментов
  addApartmentRooms(floorNumber, rooms) {
    if (!this.db) {
      console.error("⚠️ Database not initialized!");
      return;
    }
    const roomData = JSON.stringify(rooms);
    // Проверяем, существует ли уже запись для данного этажа
    const stmt = this.db.prepare("SELECT id FROM apartment_plan WHERE floor_number = ?");
    stmt.bind([floorNumber]);
    let existingId = null;
    while (stmt.step()) {
      const row = stmt.getAsObject();
      existingId = row.id;
    }
    stmt.free();
    if (existingId) {
      this.db.run("UPDATE apartment_plan SET room_data = ? WHERE id = ?", [roomData, existingId]);
    } else {
      this.db.run("INSERT INTO apartment_plan (floor_number, room_data) VALUES (?, ?)", [floorNumber, roomData]);
    }
    this.saveDatabase();
  }
  
  getApartmentPlan(floorNumber, callback) {
    if (!this.db) {
      console.error("⚠️ Database not initialized!");
      callback([]);
      return;
    }
    const stmt = this.db.prepare("SELECT room_data FROM apartment_plan WHERE floor_number = ?");
    stmt.bind([floorNumber]);
    let rooms = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      try {
        rooms = JSON.parse(row.room_data);
      } catch (e) {
        console.error("Error parsing room_data:", e);
      }
    }
    stmt.free();
    callback(rooms);
  }
}