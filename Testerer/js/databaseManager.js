export class DatabaseManager {
  constructor() {
    this.db = null;
    this.initDatabasePromise = this.initDatabase();
  }

async initDatabase() {
  const SQL = await initSqlJs({
    locateFile: file => `js/${file}`
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
      CREATE TABLE IF NOT EXISTS user_location (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude REAL,
        longitude REAL,
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

saveUserLocation(latitude, longitude) {
  if (!this.db) {
    console.error("⚠️ Database not initialized!");
    return;
  }
  const timestamp = new Date().toISOString();
  this.db.run(
    "INSERT INTO user_location (latitude, longitude, timestamp) VALUES (?, ?, ?)",
    [latitude, longitude, timestamp]
  );
  console.log(`✅ Geolocation saved: lat=${latitude}, long=${longitude}`);
  this.saveDatabase();
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
        parsed = JSON.parse(row[1]); // Пытаемся распарсить поле записи
      } catch (e) {
        parsed = { entry: row[1], postClass: "user-post" }; // Если не получилось, используем значение по умолчанию
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
}