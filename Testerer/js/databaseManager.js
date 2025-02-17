export class DatabaseManager {
  constructor() {
    // Объект базы данных (SQL.Database) будет храниться здесь.
    this.db = null;
    // Promise, который разрешается после инициализации базы данных.
    this.initDatabasePromise = this.initDatabase();
  }

  /**
   * initDatabase – асинхронно инициализирует базу данных.
   * Если база сохранена в localStorage, загружает её; иначе создаёт новую с нужными таблицами.
   */
  async initDatabase() {
    // Загружаем SQL.js, передавая функцию locateFile для поиска необходимых файлов.
    const SQL = await initSqlJs({
      locateFile: file => `js/${file}`
    });
    // Проверяем, сохранена ли база в localStorage под ключом "diaryDB"
    const savedDb = localStorage.getItem("diaryDB");
    if (savedDb) {
      // Если база найдена, декодируем base64-строку в Uint8Array
      const byteStr = atob(savedDb);
      const bytes = new Uint8Array(byteStr.length);
      for (let i = 0; i < byteStr.length; i++) {
        bytes[i] = byteStr.charCodeAt(i);
      }
      // Создаем базу из загруженных байтов
      this.db = new SQL.Database(bytes);
    } else {
      // Если базы нет, создаем новую базу данных
      this.db = new SQL.Database();
      // Создаем необходимые таблицы: diary, apartment_plan и quest_progress
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
   * saveDatabase – экспортирует базу данных и сохраняет её в localStorage.
   */
  saveDatabase() {
    if (!this.db) return;
    // Экспорт базы в бинарный массив
    const binaryData = this.db.export();
    let binaryStr = "";
    for (let i = 0; i < binaryData.length; i++) {
      binaryStr += String.fromCharCode(binaryData[i]);
    }
    // Кодируем бинарную строку в base64 и сохраняем в localStorage
    const base64 = btoa(binaryStr);
    localStorage.setItem("diaryDB", base64);
  }

  /**
   * addDiaryEntry – добавляет новую запись в таблицу diary.
   * @param {string} entry - Текст записи (обычно JSON‑строка).
   */
  async addDiaryEntry(entry) {
    if (!this.db) {
      console.error("⚠️ Database not initialized!");
      return;
    }
    // Получаем текущую дату и время в формате ISO
    const timestamp = new Date().toISOString();
    // Вставляем новую запись в таблицу diary
    this.db.run("INSERT INTO diary (entry, timestamp) VALUES (?, ?)", [entry, timestamp]);
    console.log("✅ Entry added:", entry);
    // Сохраняем базу после вставки записи
    this.saveDatabase();
  }

  /**
   * getDiaryEntries – возвращает массив записей из таблицы diary, отсортированных по убыванию времени.
   * @returns {Array} Массив объектов записей { id, entry, postClass, timestamp }.
   */
  getDiaryEntries() {
    if (!this.db) {
      console.error("⚠️ Database not initialized!");
      return [];
    }
    // Выполняем запрос на выбор всех записей
    const result = this.db.exec("SELECT * FROM diary ORDER BY timestamp DESC");
    if (result.length > 0) {
      return result[0].values.map(row => {
        let parsed;
        try {
          // Пробуем распарсить поле записи как JSON
          parsed = JSON.parse(row[1]);
        } catch (e) {
          // Если парсинг не удался, используем значение по умолчанию
          parsed = { entry: row[1], postClass: "user-post" };
        }
        return { id: row[0], ...parsed, timestamp: row[2] };
      });
    }
    return [];
  }

  /**
   * addQuestProgress – добавляет запись о прогрессе квеста в таблицу quest_progress.
   * @param {string} questKey - Ключ квеста.
   * @param {string} status - Статус выполнения квеста.
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
   * getQuestProgress – возвращает массив записей о прогрессе для указанного квеста.
   * @param {string} questKey - Ключ квеста.
   * @returns {Array} Массив объектов прогресса { id, quest_key, status }.
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
   * addApartmentRooms – сохраняет данные плана квартиры для указанного этажа.
   * @param {number} floor - номер этажа.
   * @param {Array} rooms - массив объектов, описывающих помещения (например, {floor, startRow, startCol, endRow, endCol, type}).
   */
  addApartmentRooms(floor, rooms) {
    if (!this.db) {
      console.error("⚠️ Database not initialized!");
      return;
    }
    // Преобразуем массив комнат в JSON-строку
    const roomData = JSON.stringify(rooms);
    // Удаляем старые данные для этого этажа (если есть)
    this.db.run("DELETE FROM apartment_plan WHERE floor_number = ?", [floor]);
    // Вставляем новые данные
    this.db.run("INSERT INTO apartment_plan (floor_number, room_data) VALUES (?, ?)", [floor, roomData]);
    console.log(`✅ Apartment plan for floor ${floor} saved.`);
    this.saveDatabase();
  }

  /**
   * getApartmentPlan – возвращает данные плана квартиры для указанного этажа.
   * @param {number} floor - Номер этажа.
   * @param {function} callback - Функция обратного вызова, которая получает массив данных (план).
   */
  getApartmentPlan(floor, callback) {
    if (!this.db) {
      console.error("⚠️ Database not initialized!");
      callback([]);
      return;
    }
    // Выполняем запрос для получения данных плана по указанному этажу
    const result = this.db.exec("SELECT room_data FROM apartment_plan WHERE floor_number = ? ORDER BY id", [floor]);
    if (result.length > 0) {
      // Преобразуем каждую запись (room_data) из JSON, если возможно
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