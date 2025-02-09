function showLocationTypeModal(onConfirm, onCancel) {
  const modalOverlay = document.createElement("div");
  modalOverlay.id = "location-type-modal-overlay";
  Object.assign(modalOverlay.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: "3000"
  });

  const modal = document.createElement("div");
  modal.id = "location-type-modal";
  Object.assign(modal.style, {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    maxWidth: "400px",
    width: "90%",
    textAlign: "center"
  });

  const title = document.createElement("h3");
  title.textContent = "Выберите тип помещения";
  modal.appendChild(title);

  const selectElem = document.createElement("select");
  const locationTypes = [
    "Кухня", "Спальня", "Гостиная", "Ванная", "Коридор", "Другое",
    "Подъезд", "Кабинет", "Библиотека", "Детская", "Кладовая", "Гараж"
  ];
  locationTypes.forEach(type => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    selectElem.appendChild(option);
  });
  // По умолчанию выбран "Другое"
  selectElem.value = "Другое";
  selectElem.style.marginBottom = "15px";
  selectElem.style.display = "block";
  selectElem.style.width = "100%";
  modal.appendChild(selectElem);

  const btnContainer = document.createElement("div");
  btnContainer.style.marginTop = "15px";

  const confirmBtn = document.createElement("button");
  confirmBtn.textContent = "Подтвердить";
  confirmBtn.style.marginRight = "10px";
  confirmBtn.addEventListener("click", () => {
    console.log("Нажата кнопка Подтвердить");
    const selectedType = selectElem.value;
    if (onConfirm) onConfirm(selectedType);
    modalOverlay.remove();  // Закрытие модального окна после подтверждения
  });
  btnContainer.appendChild(confirmBtn);

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Отмена";
  cancelBtn.addEventListener("click", () => {
    console.log("Нажата кнопка Отмена");
    if (onCancel) onCancel();
    modalOverlay.remove();  // Закрытие модального окна после отмены
  });
  btnContainer.appendChild(cancelBtn);

  modal.appendChild(btnContainer);
  modalOverlay.appendChild(modal);
  document.body.appendChild(modalOverlay);
}

class ApartmentPlanManager {
  constructor(containerId, dbManager) {
    this.container = document.getElementById(containerId);
    this.dbManager = dbManager;
    this.rooms = []; // массив объектов: {floor, startRow, startCol, endRow, endCol, type}
    this.currentFloor = 1;
    this.isSelecting = false;
    this.startCell = null;
    this.endCell = null;
    this.gridRows = 10;
    this.gridCols = 10;
    this.createTable();
    this.attachEvents();
    this.dbManager.initDatabasePromise.then(() => {
      this.loadFromDB();
    });
  }

  createTable() {
    // Создаем таблицу динамически и вставляем её в контейнер
    this.table = document.createElement('table');
    this.table.style.borderCollapse = "collapse";
    this.table.style.width = "500px";
    this.table.style.height = "500px";
    // Очистить контейнер и добавить созданную таблицу
    this.container.innerHTML = "";
    this.container.appendChild(this.table);
    this.initTable();
  }

  initTable() {
    // Заполняем таблицу ячейками (10 строк, 10 столбцов)
    this.table.innerHTML = "";
    for (let r = 0; r < this.gridRows; r++) {
      const row = document.createElement("tr");
      for (let c = 0; c < this.gridCols; c++) {
        const cell = document.createElement("td");
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.style.width = "50px";
        cell.style.height = "50px";
        cell.style.border = "1px solid #ccc";
        cell.style.textAlign = "center";
        cell.style.verticalAlign = "middle";
        cell.style.cursor = "pointer";
        row.appendChild(cell);
      }
      this.table.appendChild(row);
    }
  }

  attachEvents() {
    this.table.addEventListener('click', (e) => {
      if (e.target.tagName === 'TD') {
        const cell = e.target;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (!this.isSelecting) {
          // Начать выбор ячейки
          this.startCell = { row, col };
          this.isSelecting = true;
        } else {
          // Завершить выбор
          this.endCell = { row, col };
          this.isSelecting = false;
          this.showLocationTypeModal();
        }
      }
    });
  }

  showLocationTypeModal() {
    showLocationTypeModal((selectedType) => {
      // Сохраняем выбранное помещение
      this.rooms.push({
        floor: this.currentFloor,
        startRow: this.startCell.row,
        startCol: this.startCell.col,
        endRow: this.endCell.row,
        endCol: this.endCell.col,
        type: selectedType
      });
      console.log("Добавлено новое помещение:", this.rooms);
    }, () => {
      // Отмена выбора
      this.isSelecting = false;
      console.log("Выбор отменен");
    });
  }

  loadFromDB() {
    // Загрузка данных из базы данных, если они есть
    this.dbManager.getFloors().then(floors => {
      if (floors && floors.length) {
        floors.forEach(floor => {
          this.rooms = [...this.rooms, ...floor.rooms];
        });
        console.log("Данные загружены из базы данных", this.rooms);
        this.renderRooms();  // Отобразим загруженные комнаты
      } else {
        console.log("Нет данных для загрузки");
      }
    }).catch(error => {
      console.error("Ошибка при загрузке данных из базы данных:", error);
    });
  }

  saveToDB() {
    // Сохраняем данные в базу данных
    this.dbManager.saveRooms(this.rooms).then(() => {
      console.log("Данные сохранены в базе данных");
    }).catch(error => {
      console.error("Ошибка при сохранении данных в базе данных:", error);
    });
  }

  renderRooms() {
    // Визуализируем комнаты в таблице
    this.rooms.forEach(room => {
      const startCell = this.table.rows[room.startRow].cells[room.startCol];
      const endCell = this.table.rows[room.endRow].cells[room.endCol];

      // Здесь добавьте нужный стиль для выделения комнат
      startCell.style.backgroundColor = "#ddd";
      endCell.style.backgroundColor = "#ddd";

      const roomLabel = document.createElement("span");
      roomLabel.textContent = room.type;
      roomLabel.style.position = "absolute";
      startCell.appendChild(roomLabel);
    });
  }
}

// Пример класса dbManager для работы с базой данных
class DBManager {
  constructor() {
    this.db = null;
    this.initDatabase();
  }

  async initDatabase() {
    // Инициализация базы данных (например, IndexedDB)
    const request = indexedDB.open("apartmentPlanDB", 1);
    request.onupgradeneeded = event => {
      this.db = event.target.result;
      if (!this.db.objectStoreNames.contains("floors")) {
        this.db.createObjectStore("floors", { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = event => {
      this.db = event.target.result;
      console.log("База данных инициализирована");
    };

    request.onerror = event => {
      console.error("Ошибка при инициализации базы данных", event);
    };
  }

  async getFloors() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["floors"], "readonly");
      const store = transaction.objectStore("floors");
      const request = store.getAll();

      request.onsuccess = event => resolve(event.target.result);
      request.onerror = event => reject("Ошибка при загрузке данных");
    });
  }

  async saveRooms(rooms) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["floors"], "readwrite");
      const store = transaction.objectStore("floors");
      const request = store.put({ id: 1, rooms }); // Используем id = 1 для простоты

      request.onsuccess = event => resolve();
      request.onerror = event => reject("Ошибка при сохранении данных");
    });
  }
}
