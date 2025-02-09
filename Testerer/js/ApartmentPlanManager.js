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
    // Привязка событий для выбора ячеек
    this.table.addEventListener("click", (event) => {
      if (!this.isSelecting) return;

      const cell = event.target;
      if (cell.tagName !== "TD") return;

      const row = parseInt(cell.dataset.row, 10);
      const col = parseInt(cell.dataset.col, 10);

      if (!this.startCell) {
        this.startCell = { row, col };
      } else {
        this.endCell = { row, col };
        this.isSelecting = false;
        this.highlightSelectedArea();
      }
    });
  }

  highlightSelectedArea() {
    // Сброс подсветки всех ячеек
    Array.from(this.table.getElementsByTagName("td")).forEach(cell => {
      cell.style.backgroundColor = "";
    });
    if (!this.startCell || !this.endCell) return;
    const startRow = Math.min(this.startCell.row, this.endCell.row);
    const endRow = Math.max(this.startCell.row, this.endCell.row);
    const startCol = Math.min(this.startCell.col, this.endCell.col);
    const endCol = Math.max(this.startCell.col, this.endCell.col);
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const cell = this.table.querySelector(`td[data-row='${r}'][data-col='${c}']`);
        if (cell) cell.style.backgroundColor = "rgba(255, 0, 0, 0.3)";
      }
    }
  }

  renderRooms() {
    // Пересоздаем таблицу и отмечаем сохраненные помещения для текущего этажа
    this.initTable();
    this.rooms.forEach(room => {
      if (room.floor === this.currentFloor) {
        for (let r = room.startRow; r <= room.endRow; r++) {
          for (let c = room.startCol; c <= room.endCol; c++) {
            const cell = this.table.querySelector(`td[data-row='${r}'][data-col='${c}']`);
            if (cell) cell.style.backgroundColor = "rgba(0, 150, 255, 0.5)";
          }
        }
      }
    });
  }

  saveToDB() {
    console.log("Сохраняем данные этажей...");
    const currentRooms = this.rooms.filter(room => room.floor === this.currentFloor);
    console.log("Текущие локации для этажа", this.currentFloor, currentRooms);

    this.dbManager.addApartmentRooms(this.currentFloor, currentRooms).then(() => {
      console.log("Локации успешно сохранены в базу данных!");
      this.renderRooms();  // Обновление отображения на экране
    }).catch(error => {
      console.error("Ошибка при сохранении данных: ", error);
    });
  }

  loadFromDB() {
    console.log(`Загружаем данные для этажа ${this.currentFloor}...`);
    this.dbManager.getApartmentPlan(this.currentFloor, (rooms) => {
      console.log(`Загружены локации для этажа ${this.currentFloor}: `, rooms);
      if (!rooms || rooms.length === 0) {
        console.log("Локации не найдены, создаем по умолчанию.");
      }
      this.rooms = rooms || [];
      this.renderRooms();
    });
  }

  nextFloor() {
    console.log("Переход на следующий этаж...");
    this.currentFloor++;
    this.loadFromDB();
  }

  prevFloor() {
    if (this.currentFloor > 1) {
      console.log("Переход на предыдущий этаж...");
      this.currentFloor--;
      this.loadFromDB();
    }
  }

  showLocationTypeModal(onConfirm, onCancel) {
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
    selectElem.value = "Другое"; // По умолчанию выбран "Другое"
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
}