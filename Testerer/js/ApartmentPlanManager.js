// Функция для показа модального окна выбора типа помещения
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
    if (document.body.contains(modalOverlay)) {
      document.body.removeChild(modalOverlay);
    }
  });
  btnContainer.appendChild(confirmBtn);
  
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Отмена";
  cancelBtn.addEventListener("click", () => {
    console.log("Нажата кнопка Отмена");
    if (onCancel) onCancel();
    if (document.body.contains(modalOverlay)) {
      document.body.removeChild(modalOverlay);
    }
  });
  btnContainer.appendChild(cancelBtn);
  
  modal.appendChild(btnContainer);
  modalOverlay.appendChild(modal);
  document.body.appendChild(modalOverlay);
}


export class ApartmentPlanManager {
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
    // Для мыши
    this.table.addEventListener("mousedown", (e) => this.startSelection(e));
    this.table.addEventListener("mousemove", (e) => this.updateSelection(e));
    document.addEventListener("mouseup", (e) => this.finishSelection(e));

    // Для касаний (touch events)
    this.table.addEventListener("touchstart", (e) => this.handleTouchStart(e));
    this.table.addEventListener("touchmove", (e) => this.handleTouchMove(e));
    this.table.addEventListener("touchend", (e) => this.handleTouchEnd(e));
  }

  handleTouchStart(e) {
    e.preventDefault();  // чтобы предотвратить нежелательный скроллинг
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.tagName === "TD") {
      this.startSelection({ clientX: touch.clientX, clientY: touch.clientY, target });
    }
  }

  handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.tagName === "TD") {
      this.updateSelection({ clientX: touch.clientX, clientY: touch.clientY, target });
    }
  }

  handleTouchEnd(e) {
    e.preventDefault();
    this.finishSelection(e);
  }
  
  startSelection(e) {
    if (e.target.tagName === "TD") {
      this.isSelecting = true;
      const row = parseInt(e.target.dataset.row);
      const col = parseInt(e.target.dataset.col);
      this.startCell = { row, col };
      this.endCell = { row, col };
      this.highlightSelection();
    }
  }
  
  updateSelection(e) {
    if (this.isSelecting && e.target.tagName === "TD") {
      const row = parseInt(e.target.dataset.row);
      const col = parseInt(e.target.dataset.col);
      this.endCell = { row, col };
      this.highlightSelection();
    }
  }
  
  finishSelection(e) {
    if (this.isSelecting) {
      this.isSelecting = false;
      // Если не было выделено ни одной ячейки, задаем дефолтное помещение на весь план
      if (!this.startCell || !this.endCell) {
        this.startCell = { row: 0, col: 0 };
        this.endCell = { row: this.gridRows - 1, col: this.gridCols - 1 };
      }
      
      // Вызываем модальное окно для выбора типа помещения
      showLocationTypeModal(
        (selectedType) => {
          // Сохраняем выбранный тип в ProfileManager
          this.app.profileManager.saveLocationType(selectedType);
          const room = {
            floor: this.currentFloor,
            startRow: Math.min(this.startCell.row, this.endCell.row),
            startCol: Math.min(this.startCell.col, this.endCell.col),
            endRow: Math.max(this.startCell.row, this.endCell.row),
            endCol: Math.max(this.startCell.col, this.endCell.col),
            type: selectedType
          };
          this.rooms.push(room);
          this.saveToDB();
          this.renderRooms();
        },
        () => {
          // При отмене устанавливаем значение по умолчанию "Другое"
          this.app.profileManager.saveLocationType("Другое");
          const room = {
            floor: this.currentFloor,
            startRow: Math.min(this.startCell.row, this.endCell.row),
            startCol: Math.min(this.startCell.col, this.endCell.col),
            endRow: Math.max(this.startCell.row, this.endCell.row),
            endCol: Math.max(this.startCell.col, this.endCell.col),
            type: "Другое"
          };
          this.rooms.push(room);
          this.saveToDB();
          this.renderRooms();
        }
      );
    }
  }
  
  highlightSelection() {
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
    const currentRooms = this.rooms.filter(room => room.floor === this.currentFloor);
    this.dbManager.addApartmentRooms(this.currentFloor, currentRooms);
  }
  
  loadFromDB() {
    this.dbManager.getApartmentPlan(this.currentFloor, (rooms) => {
      this.rooms = rooms;
      this.renderRooms();
    });
  }
  
  nextFloor() {
    this.currentFloor++;
    this.loadFromDB();
  }
  
  prevFloor() {
    if (this.currentFloor > 1) {
      this.currentFloor--;
      this.loadFromDB();
    }
  }
}
