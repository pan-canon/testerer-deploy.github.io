export class DatabaseManager {
  constructor() {
    this.db = null;
    this.initDatabasePromise = this.initDatabase();
  }

async initDatabase() {
  const SQL = await initSqlJs({
    locateFile: file => `js/${file}`
  });
  const savedDb = localStorage.getItem("diaryDB");
  if (savedDb) {
    const byteStr = atob(savedDb);
    const bytes = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) {
      bytes[i] = byteStr.charCodeAt(i);
    }
    this.db = new SQL.Database(bytes);
    // Обновляем схему: добавляем таблицу, если её нет
    this.db.run(`
      CREATE TABLE IF NOT EXISTS apartment_plan (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        floor_number INTEGER,
        room_data TEXT
      );
    `);
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
      return result[0].values.map(row => ({ id: row[0], entry: row[1], timestamp: row[2] }));
    }
    return [];
  }

addApartmentRooms(floor, rooms) {
  const roomsJSON = JSON.stringify(rooms);
  // Проверяем, существует ли запись для этого этажа
  const result = this.db.exec("SELECT COUNT(*) FROM apartment_plan WHERE floor_number = " + floor);
  if (result.length > 0 && result[0].values[0][0] > 0) {
    // Если запись существует, обновляем её
    this.db.run("UPDATE apartment_plan SET room_data = ? WHERE floor_number = ?", [roomsJSON, floor]);
  } else {
    // Если записи нет, вставляем новую
    this.db.run("INSERT INTO apartment_plan (floor_number, room_data) VALUES (?, ?)", [floor, roomsJSON]);
  }
  this.saveDatabase();
}



getApartmentPlan(floor, callback) {
  const stmt = this.db.prepare("SELECT room_data FROM apartment_plan WHERE floor_number = ?");
  stmt.bind([floor]);
  if (stmt.step()) {
    const row = stmt.get();
    const rooms = JSON.parse(row[0]);
    callback(rooms);
  } else {
    callback([]);
  }
  stmt.free();
}

}