export class ApartmentPlanManager {
  /**
   * Конструктор класса ApartmentPlanManager.
   * @param {string} containerId - ID контейнера, в котором будет отображаться план квартиры.
   * @param {DatabaseManager} dbManager - Менеджер базы данных для сохранения и загрузки данных плана.
   */
  constructor(containerId, dbManager) {
    // Получаем DOM-элемент контейнера для плана квартиры
    this.container = document.getElementById(containerId);
    this.dbManager = dbManager;

    // Массив объектов помещений (комнат) для текущего этажа.
    // Каждый объект имеет свойства: { floor, startRow, startCol, endRow, endCol, type }
    this.rooms = [];

    // Начальный этаж, который отображается
    this.currentFloor = 1;

    // Флаг выбора (выделения) ячеек (помещений)
    this.isSelecting = false;

    // Начальная и конечная ячейки выделения
    this.startCell = null;
    this.endCell = null;

    // Размер сетки: предлагаем 16×16 ячеек (можно изменить при необходимости)
    this.gridRows = 16;
    this.gridCols = 16;

    // Создаем сетку (грид) с помощью div'ов вместо таблицы
    this.createGrid();

    // Привязываем обработчики событий для взаимодействия с ячейками
    this.attachEvents();

    // После инициализации базы данных загружаем данные плана для текущего этажа
    this.dbManager.initDatabasePromise.then(() => {
      this.loadFromDB();
    });
  }

  /**
   * createGrid – создает контейнер-сетку для отображения плана квартиры.
   * Вместо таблицы создается <div> с CSS‑grid, в котором создаются ячейки в виде div’ов.
   */
  createGrid() {
    // Создаем контейнер для сетки
    this.gridContainer = document.createElement('div');
    // Используем CSS Grid для размещения ячеек
    this.gridContainer.style.display = "grid";
    // Задаем количество столбцов равное количеству ячеек в строке (фиксированная ширина ячейки 50px)
    this.gridContainer.style.gridTemplateColumns = `repeat(${this.gridCols}, 50px)`;
    // Задаем фиксированную высоту ячейки (50px)
    this.gridContainer.style.gridAutoRows = "50px";
    // Задаем промежуток между ячейками, если нужно (опционально)
    this.gridContainer.style.gap = "1px";

    // Очищаем контейнер и добавляем созданный элемент сетки
    this.container.innerHTML = "";
    this.container.appendChild(this.gridContainer);

    // Заполняем сетку ячейками
    this.initGrid();
  }

  /**
   * initGrid – инициализирует сетку, создавая 16×16 ячеек.
   * Каждая ячейка представляет собой div с датасетами row и col для хранения координат.
   */
  initGrid() {
    // Очищаем сетку
    this.gridContainer.innerHTML = "";
    // Цикл по строкам
    for (let r = 0; r < this.gridRows; r++) {
      // Цикл по столбцам
      for (let c = 0; c < this.gridCols; c++) {
        const cell = document.createElement("div");
        // Сохраняем координаты ячейки в data-атрибутах
        cell.dataset.row = r;
        cell.dataset.col = c;
        // Задаем фиксированные размеры и стили для ячеек
        cell.style.width = "50px";
        cell.style.height = "50px";
        cell.style.border = "1px solid #ccc";
        cell.style.textAlign = "center";
        cell.style.verticalAlign = "middle";
        cell.style.cursor = "pointer";
        // Добавляем ячейку в контейнер сетки
        this.gridContainer.appendChild(cell);
      }
    }
  }

  /**
   * attachEvents – привязывает обработчики событий для взаимодействия с ячейками сетки.
   * Обрабатываются как события мыши, так и касания.
   */
  attachEvents() {
    // Обработчики для мыши:
    this.gridContainer.addEventListener("mousedown", (e) => this.startSelection(e));
    this.gridContainer.addEventListener("mousemove", (e) => this.updateSelection(e));
    document.addEventListener("mouseup", (e) => this.finishSelection(e));

    // Обработчики для touch-событий:
    this.gridContainer.addEventListener("touchstart", (e) => this.handleTouchStart(e));
    this.gridContainer.addEventListener("touchmove", (e) => this.handleTouchMove(e));
    this.gridContainer.addEventListener("touchend", (e) => this.handleTouchEnd(e));
  }

  /**
   * handleTouchStart – обработчик для начала касания, предотвращающий нежелательный скроллинг.
   */
  handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.tagName === "DIV") {
      this.startSelection({ clientX: touch.clientX, clientY: touch.clientY, target });
    }
  }

  /**
   * handleTouchMove – обработчик для движения касания.
   */
  handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.tagName === "DIV") {
      this.updateSelection({ clientX: touch.clientX, clientY: touch.clientY, target });
    }
  }

  /**
   * handleTouchEnd – обработчик для завершения касания.
   */
  handleTouchEnd(e) {
    e.preventDefault();
    this.finishSelection(e);
  }

  /**
   * startSelection – начинает выделение ячеек при нажатии (mousedown/touchstart).
   * @param {Object} e - Событие, содержащее информацию о цели.
   */
  startSelection(e) {
    if (e.target.tagName === "DIV") {
      this.isSelecting = true;
      // Сохраняем координаты начальной ячейки
      const row = parseInt(e.target.dataset.row);
      const col = parseInt(e.target.dataset.col);
      this.startCell = { row, col };
      // Изначально конечная ячейка совпадает с начальной
      this.endCell = { row, col };
      // Обновляем визуальное выделение
      this.highlightSelection();
    }
  }

  /**
   * updateSelection – обновляет выделение ячеек при движении мыши/касании.
   * @param {Object} e - Событие, содержащее цель.
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
   * finishSelection – завершает процесс выделения ячеек.
   * Если не было выделено, выбирается весь план по умолчанию.
   * Затем вызывается модальное окно для выбора типа помещения.
   */
  finishSelection(e) {
    // Если событие произошло внутри модального окна, игнорируем его
    if (e.target.closest('#location-type-modal-overlay')) return;

    if (this.isSelecting) {
      this.isSelecting = false;
      // Если не было выделено ни одной ячейки, задаем дефолтное помещение на весь план
      if (!this.startCell || !this.endCell) {
        this.startCell = { row: 0, col: 0 };
        this.endCell = { row: this.gridRows - 1, col: this.gridCols - 1 };
      }
      
      // Вызываем модальное окно для выбора типа помещения
      this.showLocationTypeModal(
        (selectedType) => {
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
        }
      );
    }
  }

  /**
   * highlightSelection – визуально подсвечивает выбранную область в сетке.
   * Проходит по всем ячейкам и сбрасывает подсветку, затем устанавливает фон для выбранных ячеек.
   */
  highlightSelection() {
    // Сбрасываем подсветку для всех ячеек.
    Array.from(this.gridContainer.children).forEach(cell => {
      cell.style.backgroundColor = "";
    });
    if (!this.startCell || !this.endCell) return;
    // Вычисляем начальные и конечные координаты выделения.
    const startRow = Math.min(this.startCell.row, this.endCell.row);
    const endRow = Math.max(this.startCell.row, this.endCell.row);
    const startCol = Math.min(this.startCell.col, this.endCell.col);
    const endCol = Math.max(this.startCell.col, this.endCell.col);
    // Проходим по выбранной области и подсвечиваем ячейки.
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const cell = this.gridContainer.querySelector(`div[data-row='${r}'][data-col='${c}']`);
        if (cell) cell.style.backgroundColor = "rgba(255, 0, 0, 0.3)";
      }
    }
  }

  /**
   * renderRooms – обновляет отображение помещений для текущего этажа.
   * Инициализирует сетку заново и подсвечивает ячейки, соответствующие сохраненным помещениям.
   */
  renderRooms() {
    // Пересоздаем сетку с ячейками
    this.initGrid();
    // Для каждого помещения, сохраненного для текущего этажа, подсвечиваем соответствующие ячейки
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
   * saveToDB – сохраняет данные помещений для текущего этажа в базу данных.
   */
  saveToDB() {
    // Фильтруем помещения, относящиеся к текущему этажу.
    const currentRooms = this.rooms.filter(room => room.floor === this.currentFloor);
    console.log("Сохраняем в БД комнаты: ", currentRooms);
    this.dbManager.addApartmentRooms(this.currentFloor, currentRooms);
  }

  /**
   * loadFromDB – загружает данные плана для текущего этажа из базы данных.
   * @returns {void}
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
   * nextFloor – переключает отображение на следующий этаж и загружает данные.
   */
  nextFloor() {
    console.log("Переключаем на следующий этаж");
    this.currentFloor++;
    this.loadFromDB();
  }

  /**
   * prevFloor – переключает отображение на предыдущий этаж, если текущий этаж больше первого.
   */
  prevFloor() {
    if (this.currentFloor > 1) {
      console.log("Переключаем на предыдущий этаж");
      this.currentFloor--;
      this.loadFromDB();
    }
  }

  /**
   * showLocationTypeModal – отображает модальное окно для выбора типа помещения.
   * @param {Function} onConfirm - функция, вызываемая при подтверждении выбора типа.
   * @param {Function} onCancel - функция, вызываемая при отмене выбора.
   */
  showLocationTypeModal(onConfirm, onCancel) {
    // Создаем overlay для модального окна
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
    
    // Создаем само модальное окно
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
    
    // Заголовок модального окна
    const title = document.createElement("h3");
    title.textContent = "Выберите тип помещения";
    modal.appendChild(title);
    
    // Создаем select для выбора типа помещения
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
    // Устанавливаем значение по умолчанию "Другое"
    selectElem.value = "Другое";
    selectElem.style.marginBottom = "15px";
    selectElem.style.display = "block";
    selectElem.style.width = "100%";
    modal.appendChild(selectElem);
    
    // Контейнер для кнопок модального окна
    const btnContainer = document.createElement("div");
    btnContainer.style.marginTop = "15px";
    
    // Кнопка подтверждения выбора
    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "Подтвердить";
    confirmBtn.style.marginRight = "10px";
    confirmBtn.addEventListener("click", () => {
      console.log("Нажата кнопка Подтвердить, выбран тип:", selectElem.value);
      const selectedType = selectElem.value;
      if (onConfirm) onConfirm(selectedType);
      console.log("Удаляем модальное окно");
      // Небольшая задержка перед удалением окна
      setTimeout(() => {
        modalOverlay.remove();
      }, 50);
    });
    btnContainer.appendChild(confirmBtn);
    
    // Кнопка отмены выбора
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