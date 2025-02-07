export class ApartmentPlanManager {
  constructor(tableId, dbManager) {
    this.table = document.getElementById(tableId);
    this.dbManager = dbManager;
    this.rooms = []; // массив объектов: {floor, startRow, startCol, endRow, endCol, type}
    this.currentFloor = 1;
    this.isSelecting = false;
    this.startCell = null;
    this.endCell = null;
    this.gridRows = 10;
    this.gridCols = 10;
    this.initTable();
    this.attachEvents();
  }
  
  initTable() {
    // Генерируем таблицу с заданным количеством строк и колонок
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
    // Обрабатываем выбор ячеек – нажали, перемещение мыши и отпускание
    this.table.addEventListener("mousedown", (e) => this.startSelection(e));
    this.table.addEventListener("mouseover", (e) => this.updateSelection(e));
    document.addEventListener("mouseup", (e) => this.finishSelection(e));
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
      // Запрашиваем тип помещения
      const roomType = prompt("Введите тип помещения (спальня, кухня и т.д.):", "Неизвестное") || "Неизвестное";
      const room = {
        floor: this.currentFloor,
        startRow: Math.min(this.startCell.row, this.endCell.row),
        startCol: Math.min(this.startCell.col, this.endCell.col),
        endRow: Math.max(this.startCell.row, this.endCell.row),
        endCol: Math.max(this.startCell.col, this.endCell.col),
        type: roomType
      };
      this.rooms.push(room);
      this.saveToDB();
      this.renderRooms();
    }
  }
  
  highlightSelection() {
    // Сбросить подсветку всех ячеек
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
    // Пересоздаём таблицу и отмечаем сохранённые помещения для текущего этажа
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
