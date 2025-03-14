import { ErrorManager } from './ErrorManager.js';
import { StateManager } from './StateManager.js';

export class ApartmentPlanManager {
  /**
   * Constructor for ApartmentPlanManager.
   * @param {string} containerId - ID of the container where the apartment plan will be displayed.
   * @param {DatabaseManager} dbManager - Manager for database persistence.
   * @param {App} appInstance - Reference to the main application instance.
   */
  constructor(containerId, dbManager, appInstance) {
    this.app = appInstance; // Reference to main app (for UI delegation)
    this.container = document.getElementById(containerId);
    this.dbManager = dbManager;

    // Array of room objects for the current floor.
    // Each room has properties: { floor, startRow, startCol, endRow, endCol, type }
    this.rooms = [];

    // Current floor.
    this.currentFloor = 1;

    // Flags for cell selection.
    this.isSelecting = false;
    this.startCell = null;
    this.endCell = null;

    // Grid dimensions (16×16 cells).
    this.gridRows = 16;
    this.gridCols = 16;

    // Create grid and bind events.
    this.createGrid();
    this.attachEvents();

    // Load plan data for the current floor after DB initialization.
    this.dbManager.initDatabasePromise.then(() => {
      this.loadFromDB();
    });

    // Bind event listener for the "Далее" button on the apartment plan screen.
    const nextBtn = document.getElementById("apartment-plan-next-btn");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        // Optionally disable the button to prevent double-clicks.
        nextBtn.disabled = true;
        // Transition to the selfie screen.
        this.app.goToSelfieScreen();
      });
    } else {
      ErrorManager.logError("Apartment plan Next button not found during initialization.", "ApartmentPlanManager");
    }
  }

  /**
   * createGrid – Creates a grid container for the apartment plan.
   */
  createGrid() {
    this.gridContainer = document.createElement('div');
    this.gridContainer.style.display = "grid";
    this.gridContainer.style.gridTemplateColumns = `repeat(${this.gridCols}, 50px)`;
    this.gridContainer.style.gridAutoRows = "50px";
    this.gridContainer.style.gap = "1px";
    this.container.innerHTML = "";
    this.container.appendChild(this.gridContainer);
    this.initGrid();
  }

  /**
   * initGrid – Initializes the grid by creating cells.
   */
  initGrid() {
    this.gridContainer.innerHTML = "";
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const cell = document.createElement("div");
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.style.width = "50px";
        cell.style.height = "50px";
        cell.style.border = "1px solid #ccc";
        cell.style.textAlign = "center";
        cell.style.verticalAlign = "middle";
        cell.style.cursor = "pointer";
        this.gridContainer.appendChild(cell);
      }
    }
  }

  /**
   * attachEvents – Binds mouse and touch event handlers for cell selection.
   */
  attachEvents() {
    this.gridContainer.addEventListener("mousedown", (e) => this.startSelection(e));
    this.gridContainer.addEventListener("mousemove", (e) => this.updateSelection(e));
    document.addEventListener("mouseup", (e) => this.finishSelection(e));

    this.gridContainer.addEventListener("touchstart", (e) => this.handleTouchStart(e));
    this.gridContainer.addEventListener("touchmove", (e) => this.handleTouchMove(e));
    this.gridContainer.addEventListener("touchend", (e) => this.handleTouchEnd(e));
  }

  handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.tagName === "DIV") {
      this.startSelection({ clientX: touch.clientX, clientY: touch.clientY, target });
    }
  }

  handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.tagName === "DIV") {
      this.updateSelection({ clientX: touch.clientX, clientY: touch.clientY, target });
    }
  }

  handleTouchEnd(e) {
    e.preventDefault();
    this.finishSelection(e);
  }

  /**
   * startSelection – Begins cell selection.
   */
  startSelection(e) {
    if (e.target.tagName === "DIV") {
      this.isSelecting = true;
      const row = parseInt(e.target.dataset.row);
      const col = parseInt(e.target.dataset.col);
      this.startCell = { row, col };
      this.endCell = { row, col };
      this.highlightSelection();
    }
  }

  /**
   * updateSelection – Updates cell selection as the pointer moves.
   */
  updateSelection(e) {
    if (this.isSelecting && e.target.tagName === "DIV") {
      const row = parseInt(e.target.dataset.row);
      const col = parseInt(e.target.dataset.col);
      this.endCell = { row, col };
      this.highlightSelection();
    }
  }

  /**
   * finishSelection – Completes cell selection and shows the location type modal.
   */
  finishSelection(e) {
    // Ignore events inside modal overlay.
    if (e.target.closest('#location-type-modal-overlay')) return;
    if (this.isSelecting) {
      this.isSelecting = false;
      if (!this.startCell || !this.endCell) {
        this.startCell = { row: 0, col: 0 };
        this.endCell = { row: this.gridRows - 1, col: this.gridCols - 1 };
      }
      this.showLocationTypeModal(
        (selectedType) => {
          // Confirm callback: save location type and add room.
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
          // Enable the "Next" button on the apartment plan screen.
          if (this.app && this.app.viewManager && typeof this.app.viewManager.setApartmentPlanNextButtonEnabled === 'function') {
            this.app.viewManager.setApartmentPlanNextButtonEnabled(true);
          }
        },
        () => {
          // Cancel callback: use default type "Другое".
          console.log("Локация не выбрана, выбран тип по умолчанию: 'Другое'.");
          if (this.app && this.app.profileManager) {
            this.app.profileManager.saveLocationType("Другое");
          }
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
          if (this.app && this.app.viewManager && typeof this.app.viewManager.setApartmentPlanNextButtonEnabled === 'function') {
            this.app.viewManager.setApartmentPlanNextButtonEnabled(true);
          }
        }
      );
    }
  }

  /**
   * highlightSelection – Visually highlights the selected area in the grid.
   */
  highlightSelection() {
    Array.from(this.gridContainer.children).forEach(cell => {
      cell.style.backgroundColor = "";
    });
    if (!this.startCell || !this.endCell) return;
    const startRow = Math.min(this.startCell.row, this.endCell.row);
    const endRow = Math.max(this.startCell.row, this.endCell.row);
    const startCol = Math.min(this.startCell.col, this.endCell.col);
    const endCol = Math.max(this.startCell.col, this.endCell.col);
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const cell = this.gridContainer.querySelector(`div[data-row='${r}'][data-col='${c}']`);
        if (cell) cell.style.backgroundColor = "rgba(255, 0, 0, 0.3)";
      }
    }
  }

  /**
   * renderRooms – Recreates the grid and highlights cells corresponding to saved rooms for the current floor.
   */
  renderRooms() {
    this.initGrid();
    this.rooms.forEach(room => {
      if (room.floor === this.currentFloor) {
        for (let r = room.startRow; r <= room.endRow; r++) {
          for (let c = room.startCol; c <= room.endCol; c++) {
            const cell = this.gridContainer.querySelector(`div[data-row='${r}'][data-col='${c}']`);
            if (cell) cell.style.backgroundColor = "rgba(0, 150, 255, 0.5)";
          }
        }
      }
    });
  }

  /**
   * saveToDB – Saves the apartment plan (rooms) for the current floor to the database.
   */
  saveToDB() {
    const currentRooms = this.rooms.filter(room => room.floor === this.currentFloor);
    console.log("Сохраняем в БД комнаты: ", currentRooms);
    this.dbManager.addApartmentRooms(this.currentFloor, currentRooms);
  }

  /**
   * loadFromDB – Loads the apartment plan data for the current floor from the database.
   */
  loadFromDB() {
    console.log("Загружаем данные для этажа:", this.currentFloor);
    this.dbManager.getApartmentPlan(this.currentFloor, (rooms) => {
      if (!rooms || rooms.length === 0) {
        console.log(`Локации для этажа ${this.currentFloor} не созданы, выбран дефолт.`);
      } else {
        console.log(`Найденные локации для этажа ${this.currentFloor}: `, rooms);
      }
      this.rooms = rooms;
      this.renderRooms();
    });
  }

  /**
   * nextFloor – Switches to the next floor and loads its data.
   */
  nextFloor() {
    console.log("Переключаем на следующий этаж");
    this.currentFloor++;
    this.loadFromDB();
  }

  /**
   * prevFloor – Switches to the previous floor if possible.
   */
  prevFloor() {
    if (this.currentFloor > 1) {
      console.log("Переключаем на предыдущий этаж");
      this.currentFloor--;
      this.loadFromDB();
    }
  }

  /**
   * showLocationTypeModal – Displays a modal window for selecting the location type.
   * @param {Function} onConfirm - Callback invoked with the selected type.
   * @param {Function} onCancel - Callback invoked if selection is cancelled.
   */
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
}