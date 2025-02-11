// Класс для работы с планом апартаментов
export class ApartmentPlanManager {
  constructor(containerId, dbManager) {
    this.container = document.getElementById(containerId);
    this.dbManager = dbManager;
    this.rooms = []; // массив объектов: {floor, startRow, startCol, endRow, endCol, type}
    this.currentFloor = 1;
    this.maxFloor = 1; // для динамического добавления этажей
    this.currentMode = 'roomGeneration'; // 'roomGeneration' или 'selfLocation'
    this.isSelecting = false;
    this.startCell = null;
    this.endCell = null;
    this.gridRows = 10;
    this.gridCols = 10;
    
    // Инициализируем UI: выбор режима, этажи, область для таблицы
    this.initUI();
    
    // После инициализации БД загружаем данные для этажа
    this.dbManager.initDatabasePromise.then(() => {
      this.loadFromDB();
    });
  }

  initUI() {
    // Очищаем контейнер и создаём элементы управления
    this.container.innerHTML = "";
    
    // Создаём панель выбора режима
    this.createModeSelectionControls();
    
    // Создаём панель управления этажами
    this.createFloorControls();
    
    // Создаём контейнер для таблицы (плана)
    this.tableContainer = document.createElement('div');
    this.container.appendChild(this.tableContainer);
    
    // Создаём таблицу с ячейками
    this.createTable();
    
    // Вешаем обработчики событий
    this.attachEvents();
  }
  
  createModeSelectionControls() {
    const modeContainer = document.createElement('div');
    modeContainer.style.marginBottom = '10px';

    const modeLabel = document.createElement('span');
    modeLabel.textContent = "Режим работы: ";
    modeContainer.appendChild(modeLabel);

    // Режим 1: Генерация помещений
    const mode1Label = document.createElement('label');
    mode1Label.style.marginRight = '10px';
    const mode1Radio = document.createElement('input');
    mode1Radio.type = 'radio';
    mode1Radio.name = 'mode';
    mode1Radio.value = 'roomGeneration';
    mode1Radio.checked = true;
    mode1Radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        this.currentMode = 'roomGeneration';
        this.clearSelection();
      }
    });
    mode1Label.appendChild(mode1Radio);
    mode1Label.appendChild(document.createTextNode('Генерация помещений'));
    modeContainer.appendChild(mode1Label);

    // Режим 2: Определение моего местоположения
    const mode2Label = document.createElement('label');
    const mode2Radio = document.createElement('input');
    mode2Radio.type = 'radio';
    mode2Radio.name = 'mode';
    mode2Radio.value = 'selfLocation';
    mode2Radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        this.currentMode = 'selfLocation';
        this.clearSelection();
      }
    });
    mode2Label.appendChild(mode2Radio);
    mode2Label.appendChild(document.createTextNode('Определение моего местоположения'));
    modeContainer.appendChild(mode2Label);

    this.container.appendChild(modeContainer);
  }
  
  createFloorControls() {
    const floorContainer = document.createElement('div');
    floorContainer.style.marginBottom = '10px';

    const floorLabel = document.createElement('span');
    floorLabel.textContent = "Этаж: ";
    floorContainer.appendChild(floorLabel);

    // Выпадающий список для выбора этажа
    this.floorSelect = document.createElement('select');
    const option = document.createElement('option');
    option.value = "1";
    option.textContent = "1";
    this.floorSelect.appendChild(option);
    this.floorSelect.value = "1";
    this.floorSelect.addEventListener('change', (e) => {
      this.currentFloor = parseInt(e.target.value);
      this.loadFromDB();
    });
    floorContainer.appendChild(this.floorSelect);

    // Кнопка для добавления нового этажа
    const addFloorBtn = document.createElement('button');
    addFloorBtn.textContent = "+ Этаж";
    addFloorBtn.style.marginLeft = '10px';
    addFloorBtn.addEventListener('click', () => {
      this.maxFloor++;
      this.currentFloor = this.maxFloor;
      const newOption = document.createElement('option');
      newOption.value = this.maxFloor.toString();
      newOption.textContent = this.maxFloor.toString();
      this.floorSelect.appendChild(newOption);
      this.floorSelect.value = this.currentFloor.toString();
      // Для нового этажа очищаем список локаций
      this.rooms = [];
      this.renderRooms();
    });
    floorContainer.appendChild(addFloorBtn);

    this.container.appendChild(floorContainer);
  }
  
  createTable() {
    // Создаём таблицу с ячейками и добавляем её в tableContainer
    this.table = document.createElement('table');
    this.table.style.borderCollapse = "collapse";
    this.table.style.width = "500px";
    this.table.style.height = "500px";
    this.tableContainer.innerHTML = "";
    this.tableContainer.appendChild(this.table);
    this.initTable();
  }
  
  initTable() {
    // Заполняем таблицу ячейками (10 x 10)
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
    // Для режима «Генерация помещений» используем mouse/touch события (выделение области)
    this.table.addEventListener("mousedown", (e) => {
      if (this.currentMode === 'roomGeneration') {
        this.startSelection(e);
      }
    });
    this.table.addEventListener("mousemove", (e) => {
      if (this.currentMode === 'roomGeneration') {
        this.updateSelection(e);
      }
    });
    document.addEventListener("mouseup", (e) => {
      if (this.currentMode === 'roomGeneration') {
        this.finishSelection(e);
      }
    });
    this.table.addEventListener("touchstart", (e) => {
      if (this.currentMode === 'roomGeneration') {
        this.handleTouchStart(e);
      }
    });
    this.table.addEventListener("touchmove", (e) => {
      if (this.currentMode === 'roomGeneration') {
        this.handleTouchMove(e);
      }
    });
    this.table.addEventListener("touchend", (e) => {
      if (this.currentMode === 'roomGeneration') {
        this.handleTouchEnd(e);
      }
    });
    
    // Для режима «Определение моего местоположения» – по клику по ячейке
    this.table.addEventListener("click", (e) => {
      if (this.currentMode === 'selfLocation' && e.target.tagName === "TD") {
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        this.startCell = { row, col };
        this.endCell = { row, col };
        this.highlightSelection();
        this.finishSelectionSelfLocation(e);
      }
    });
  }
  
  clearSelection() {
    this.isSelecting = false;
    this.startCell = null;
    this.endCell = null;
    this.highlightSelection(); // сброс подсветки
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
  
  // === Режим roomGeneration (выделение области) ===
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
      // Если выделение не было совершено, используем весь план (только для этажа 1)
      if (!this.startCell || !this.endCell) {
        this.startCell = { row: 0, col: 0 };
        this.endCell = { row: this.gridRows - 1, col: this.gridCols - 1 };
      }
      // Показываем модальное окно для выбора типа помещения
      this.showLocationTypeModal(
        (selectedType) => {
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
          this.clearSelection();
        },
        () => {
          // При отмене выбираем тип по умолчанию "Другое"
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
          this.clearSelection();
        }
      );
    }
  }
  
  // === Режим selfLocation (по клику по ячейке) ===
  finishSelectionSelfLocation(e) {
    // Показываем модальное окно для подтверждения своего местоположения
    this.showSelfLocationModal(
      () => {
        const room = {
          floor: this.currentFloor,
          startRow: this.startCell.row,
          startCol: this.startCell.col,
          endRow: this.startCell.row,
          endCol: this.startCell.col,
          type: "Мое местоположение"
        };
        this.rooms.push(room);
        this.saveToDB();
        this.renderRooms();
        this.clearSelection();
      },
      () => {
        this.clearSelection();
      }
    );
  }
  
  highlightSelection() {
    // Сбрасываем подсветку всех ячеек
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
    // Пересоздаём таблицу и отображаем сохранённые локации для текущего этажа
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
    console.log("Сохраняем в БД комнаты: ", currentRooms);
    this.dbManager.addApartmentRooms(this.currentFloor, currentRooms);
  }
  
  loadFromDB() {
    console.log("Загружаем данные для этажа:", this.currentFloor);
    this.dbManager.getApartmentPlan(this.currentFloor, (rooms) => {
      if (!rooms || rooms.length === 0) {
        console.log(`Локации для этажа ${this.currentFloor} не созданы.`);
        // Если для этажа 1 ничего не выбрано, можно создать дефолтное помещение, охватывающее весь план
        if (this.currentFloor === 1) {
          const defaultRoom = {
            floor: 1,
            startRow: 0,
            startCol: 0,
            endRow: this.gridRows - 1,
            endCol: this.gridCols - 1,
            type: "Другое"
          };
          this.rooms = [defaultRoom];
          this.saveToDB();
        } else {
          this.rooms = [];
        }
      } else {
        console.log(`Найденные локации для этажа ${this.currentFloor}: `, rooms);
        this.rooms = rooms;
      }
      this.renderRooms();
    });
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
  
  showSelfLocationModal(onConfirm, onCancel) {
    // Простое модальное окно для подтверждения выбора своего местоположения
    const modalOverlay = document.createElement("div");
    modalOverlay.id = "self-location-modal-overlay";
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
    modal.id = "self-location-modal";
    Object.assign(modal.style, {
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "8px",
      maxWidth: "400px",
      width: "90%",
      textAlign: "center"
    });
    
    const title = document.createElement("h3");
    title.textContent = "Подтвердите ваше местоположение";
    modal.appendChild(title);
    
    const btnContainer = document.createElement("div");
    btnContainer.style.marginTop = "15px";
    
    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "Подтвердить";
    confirmBtn.style.marginRight = "10px";
    confirmBtn.addEventListener("click", () => {
      if (onConfirm) onConfirm();
      setTimeout(() => {
        modalOverlay.remove();
      }, 50);
    });
    btnContainer.appendChild(confirmBtn);
    
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Отмена";
    cancelBtn.addEventListener("click", () => {
      if (onCancel) onCancel();
      modalOverlay.remove();
    });
    btnContainer.appendChild(cancelBtn);
    
    modal.appendChild(btnContainer);
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
  }
}