export class ApartmentPlanManager {
  /**
   * @param {string} containerId — ID контейнера, куда будет вставлена таблица
   * @param {DatabaseManager} dbManager — менеджер базы данных
   * @param {App} app — ссылка на главный объект приложения (если требуется доступ к profileManager и др.)
   */
  constructor(containerId, dbManager, app) {
    this.container = document.getElementById(containerId);
    this.dbManager = dbManager;
    this.app = app; // Сохраняем ссылку на приложение
    this.rooms = []; // массив объектов: {floor, startRow, startCol, endRow, endCol, type}
    this.currentFloor = 1;
    this.isSelecting = false;
    this.startCell = null;
    this.endCell = null;
    this.gridRows = 10;
    this.gridCols = 10;
    this.createTable();
    this.attachEvents();
    // После инициализации базы загружаем данные для первого этажа
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
    e.preventDefault();
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
      // Если не было выделено ни одной ячейки, можно задать дефолтное выделение (но здесь можно и не делать ничего)
      if (!this.startCell || !this.endCell) {
        // По желанию, можно задать выделение на весь план
        this.startCell = { row: 0, col: 0 };
        this.endCell = { row: this.gridRows - 1, col: this.gridCols - 1 };
      }
      
      // Вызываем модальное окно для выбора типа помещения
      this.showLocationTypeModal(
        (selectedType) => {
          // Если подтверждено, добавляем новую «комнату»
          if (this.app && this.app.profileManager) {
            this.app.profileManager.saveLocationType(selectedType);
          }
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
          // Если нажата "Отмена", просто отменяем выделение и не сохраняем ничего
          console.log("Выбор отменён. Новая комната не добавлена.");
          // Сбрасываем выделение
          this.startCell = null;
          this.endCell = null;
          this.highlightSelection();
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
    console.log("Сохраняем в БД для этажа", this.currentFloor, currentRooms);
    this.dbManager.addApartmentRooms(this.currentFloor, currentRooms);
  }

  loadFromDB() {
    console.log("Загружаем данные для этажа:", this.currentFloor);
    this.dbManager.getApartmentPlan(this.currentFloor, (rooms) => {
      if (!rooms || rooms.length === 0) {
        console.log(`Для этажа ${this.currentFloor} данных нет.`);
        // Если этаж не трогали, можно задать дефолтное значение — один большой блок
        // Например, если это первый этаж или этаж новый:
        if (this.currentFloor === 1 || confirm("Этаж пуст. Заполнить дефолтным планом (все клетки)?")) {
          const defaultRoom = {
            floor: this.currentFloor,
            startRow: 0,
            startCol: 0,
            endRow: this.gridRows - 1,
            endCol: this.gridCols - 1,
            type: "Дефолт"
          };
          this.rooms = [defaultRoom];
          this.saveToDB();
          console.log(`Этаж ${this.currentFloor} сохранён с дефолтным планом.`);
        } else {
          this.rooms = [];
        }
      } else {
        console.log(`Найденные данные для этажа ${this.currentFloor}:`, rooms);
        this.rooms = rooms;
      }
      this.renderRooms();
    });
  }

  nextFloor() {
    // При переходе на следующий этаж проверяем: если на текущем этаже данных нет, предлагаем сохранить дефолтный план
    if (this.rooms.filter(r => r.floor === this.currentFloor).length === 0) {
      if (confirm("На этом этаже нет заполненных помещений. Желаете сохранить дефолтный план (все клетки) и перейти на следующий этаж?")) {
        const defaultRoom = {
          floor: this.currentFloor,
          startRow: 0,
          startCol: 0,
          endRow: this.gridRows - 1,
          endCol: this.gridCols - 1,
          type: "Дефолт"
        };
        this.rooms.push(defaultRoom);
        this.saveToDB();
      } else {
        // Если пользователь отменяет, не переключаем этаж
        return;
      }
    }
    // Переходим на следующий этаж
    this.currentFloor++;
    // Сбрасываем данные для нового этажа (или загружаем их из БД, если они уже были сохранены ранее)
    this.rooms = [];
    this.initTable();
    this.loadFromDB();
  }

  prevFloor() {
    if (this.currentFloor > 1) {
      console.log("Переключаем на предыдущий этаж");
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
      console.log("Нажата кнопка Подтвердить, выбран тип:", selectElem.value);
      const selectedType = selectElem.value;
      if (onConfirm) onConfirm(selectedType);
      // Немного задержки перед удалением модального окна
      setTimeout(() => {
        modalOverlay.remove();
      }, 50);
    });
    
    btnContainer.appendChild(confirmBtn);
    
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Отмена";
    cancelBtn.addEventListener("click", () => {
      console.log("Нажата кнопка Отмена");
      if (onCancel) onCancel();
      modalOverlay.remove();
    });
    btnContainer.appendChild(cancelBtn);
    
    modal.appendChild(btnContainer);
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
  }
}
