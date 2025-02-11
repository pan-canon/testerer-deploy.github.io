export class ApartmentPlanManager {
  constructor(containerId, dbManager) {
    this.container = document.getElementById(containerId);
    this.dbManager = dbManager;
    this.rooms = []; // Все комнаты для выбранного этажа
    this.currentFloor = 1;
    this.isSelecting = false;
    this.startCell = null;
    this.endCell = null;
    this.gridRows = 10;
    this.gridCols = 10;
    this.table = null;
    
    this.createTable();
    this.attachEvents();
    
    // После инициализации БД загружаем данные для текущего этажа
    this.dbManager.initDatabasePromise.then(() => {
      this.loadRoomsFromDB();
    });
  }
  
  createTable() {
    this.table = document.createElement('table');
    this.table.style.borderCollapse = "collapse";
    this.table.style.width = "500px";
    this.table.style.height = "500px";
    this.container.innerHTML = "";
    this.container.appendChild(this.table);
    this.initTable();
  }
  
  initTable() {
    this.table.innerHTML = "";
    for (let r = 0; r < this.gridRows; r++) {
      const tr = document.createElement("tr");
      for (let c = 0; c < this.gridCols; c++) {
        const td = document.createElement("td");
        td.dataset.row = r;
        td.dataset.col = c;
        td.style.width = "50px";
        td.style.height = "50px";
        td.style.border = "1px solid #ccc";
        td.style.textAlign = "center";
        td.style.verticalAlign = "middle";
        td.style.cursor = "pointer";
        tr.appendChild(td);
      }
      this.table.appendChild(tr);
    }
    // После построения таблицы сразу отрисовываем сохранённые комнаты
    this.renderRooms();
  }
  
  attachEvents() {
    // Используем pointer-события для поддержки и мыши, и касаний
    this.table.addEventListener("pointerdown", (e) => this.onPointerDown(e));
    this.table.addEventListener("pointermove", (e) => this.onPointerMove(e));
    this.table.addEventListener("pointerup", (e) => this.onPointerUp(e));
    this.table.addEventListener("pointercancel", (e) => this.onPointerUp(e));
  }
  
  onPointerDown(e) {
    if (e.target.tagName !== "TD") return;
    this.isSelecting = true;
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    this.startCell = { row, col };
    this.endCell = { row, col };
    this.highlightSelection();
  }
  
  onPointerMove(e) {
    if (!this.isSelecting || e.target.tagName !== "TD") return;
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    this.endCell = { row, col };
    this.highlightSelection();
  }
  
  onPointerUp(e) {
    if (!this.isSelecting) return;
    this.isSelecting = false;
    
    // Если по какой-то причине координаты не заданы – выбираем весь план
    if (!this.startCell || !this.endCell) {
      this.startCell = { row: 0, col: 0 };
      this.endCell = { row: this.gridRows - 1, col: this.gridCols - 1 };
    }
    
    // После завершения выделения – показываем модальное окно для выбора типа помещения.
    this.showRoomTypeModal()
      .then((roomType) => {
        const room = {
          floor: this.currentFloor,
          startRow: Math.min(this.startCell.row, this.endCell.row),
          startCol: Math.min(this.startCell.col, this.endCell.col),
          endRow: Math.max(this.startCell.row, this.endCell.row),
          endCol: Math.max(this.startCell.col, this.endCell.col),
          type: roomType || "Другое"
        };
        this.rooms.push(room);
        this.saveRoomToDB(room);
        this.renderRooms();
      })
      .catch(() => {
        // Если пользователь отменил выбор – используем тип по умолчанию "Другое"
        const room = {
          floor: this.currentFloor,
          startRow: Math.min(this.startCell.row, this.endCell.row),
          startCol: Math.min(this.startCell.col, this.endCell.col),
          endRow: Math.max(this.startCell.row, this.endCell.row),
          endCol: Math.max(this.startCell.col, this.endCell.col),
          type: "Другое"
        };
        this.rooms.push(room);
        this.saveRoomToDB(room);
        this.renderRooms();
      })
      .finally(() => {
        this.clearSelectionHighlight();
        this.startCell = null;
        this.endCell = null;
      });
  }
  
  highlightSelection() {
    // Сбрасываем выделение всех ячеек
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
        if (cell) {
          cell.style.backgroundColor = "rgba(255, 0, 0, 0.3)";
        }
      }
    }
  }
  
  clearSelectionHighlight() {
    Array.from(this.table.getElementsByTagName("td")).forEach(cell => {
      cell.style.backgroundColor = "";
    });
  }
  
  renderRooms() {
    // Перестраиваем таблицу и отображаем сохранённые комнаты для текущего этажа
    this.initTable();
    this.rooms.forEach(room => {
      if (room.floor !== this.currentFloor) return;
      for (let r = room.startRow; r <= room.endRow; r++) {
        for (let c = room.startCol; c <= room.endCol; c++) {
          const cell = this.table.querySelector(`td[data-row='${r}'][data-col='${c}']`);
          if (cell) {
            cell.style.backgroundColor = "rgba(0, 150, 255, 0.5)";
          }
        }
      }
    });
  }
  
  saveRoomToDB(room) {
    // Сохраняем выбранную область в БД
    this.dbManager.addApartmentRoom(this.currentFloor, room);
  }
  
  loadRoomsFromDB() {
    // Загружаем данные для текущего этажа из БД
    this.dbManager.getApartmentRooms(this.currentFloor, (roomsFromDB) => {
      this.rooms = Array.isArray(roomsFromDB) ? roomsFromDB : [];
      this.renderRooms();
    });
  }
  
  nextFloor() {
    this.currentFloor++;
    this.loadRoomsFromDB();
  }
  
  prevFloor() {
    if (this.currentFloor > 1) {
      this.currentFloor--;
      this.loadRoomsFromDB();
    }
  }
  
  showRoomTypeModal() {
    // Возвращаем Promise, который резолвится выбранным типом помещения
    return new Promise((resolve, reject) => {
      const modalOverlay = document.createElement("div");
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
      selectElem.value = "Другое";
      Object.assign(selectElem.style, {
        marginBottom: "15px",
        display: "block",
        width: "100%"
      });
      modal.appendChild(selectElem);
      
      const btnContainer = document.createElement("div");
      btnContainer.style.marginTop = "15px";
      
      const confirmBtn = document.createElement("button");
      confirmBtn.textContent = "Подтвердить";
      confirmBtn.style.marginRight = "10px";
      confirmBtn.addEventListener("click", () => {
        resolve(selectElem.value);
        document.body.removeChild(modalOverlay);
      });
      btnContainer.appendChild(confirmBtn);
      
      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "Отмена";
      cancelBtn.addEventListener("click", () => {
        reject();
        document.body.removeChild(modalOverlay);
      });
      btnContainer.appendChild(cancelBtn);
      
      modal.appendChild(btnContainer);
      modalOverlay.appendChild(modal);
      document.body.appendChild(modalOverlay);
    });
  }
}