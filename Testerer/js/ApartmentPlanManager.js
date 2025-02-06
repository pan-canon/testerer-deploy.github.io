export class ApartmentPlanManager {
constructor(canvasId, dbManager) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.dbManager = dbManager;

    if (!this.dbManager) {
        console.error("⚠️ DatabaseManager is not initialized!");
        return; // Прерываем выполнение, если база данных не инициализирована
    }

    this.rooms = [];
    this.currentFloor = 1;
    this.drawing = false;
    this.startX = 0;
    this.startY = 0;
    this.init();
}



nextFloor() {
    if (!this.isSwitchingFloor) {  // 🔹 Проверка на двойное нажатие
        this.isSwitchingFloor = true;
        setTimeout(() => { this.isSwitchingFloor = false; }, 200); // 🔹 Защита от двойного клика
        this.currentFloor++;
        this.loadFromDB();
    }
}

prevFloor() {
    if (!this.isSwitchingFloor && this.currentFloor > 1) {
        this.isSwitchingFloor = true;
        setTimeout(() => { this.isSwitchingFloor = false; }, 200);
        this.currentFloor--;
        this.loadFromDB();
    }
}


completeApartment() {
    this.saveApartmentPlan();
    console.log("✅ План квартиры сохранён!");

    // После завершения планировки переходим на главный экран
    app.showMainScreen();

    // Через 5 секунд запускаем звонок
    setTimeout(() => app.startPhoneCall(), 5000);
}


    init() {
        this.canvas.addEventListener("mousedown", (e) => this.startDrawing(e));
        this.canvas.addEventListener("mousemove", (e) => this.draw(e));
        this.canvas.addEventListener("mouseup", () => this.stopDrawing());
    }

    startDrawing(event) {
        this.drawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.startX = event.clientX - rect.left;
        this.startY = event.clientY - rect.top;
    }

    draw(event) {
        if (!this.drawing) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        this.clearCanvas();
        this.drawAllRooms();
        this.ctx.strokeStyle = "red";
        this.ctx.strokeRect(this.startX, this.startY, x - this.startX, y - this.startY);
    }

    stopDrawing() {
        this.drawing = false;
        const roomType = prompt("Введите тип помещения (спальня, кухня и т. д.)") || "Неизвестное";
        this.rooms.push({ floor: this.currentFloor, x: this.startX, y: this.startY, width: 50, height: 50, type: roomType });
        this.saveToDB();
        this.drawAllRooms();
    }

    drawAllRooms() {
        this.rooms.forEach(room => {
            this.ctx.fillStyle = "rgba(0, 150, 255, 0.5)";
            this.ctx.fillRect(room.x, room.y, room.width, room.height);
            this.ctx.strokeRect(room.x, room.y, room.width, room.height);
        });
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    saveToDB() {
        this.dbManager.addApartmentRoom(this.rooms);
    }

    loadFromDB() {
        this.dbManager.getApartmentPlan(this.currentFloor, (rooms) => {
            this.rooms = rooms;
            this.drawAllRooms();
        });
    }

saveApartmentPlan() {
  if (!this.dbManager) {
    console.error("⚠️ Database Manager is not initialized.");
    return;
  }

  // Если rooms пустые, создаём дефолтный план
  if (this.rooms.length === 0) {
    console.log("🏠 Используется дефолтный план квартиры.");
    this.rooms = [
      { floor: 1, x: 50, y: 50, width: 100, height: 100, type: "Кухня" },
      { floor: 1, x: 200, y: 50, width: 100, height: 100, type: "Ванная" },
      { floor: 1, x: 350, y: 50, width: 100, height: 100, type: "Спальня" }
    ];
  }

  const roomData = JSON.stringify(this.rooms); 
  this.dbManager.saveApartmentPlan(this.currentFloor, roomData);

  console.log("🏠 План этажа сохранён:", this.currentFloor);
  window.app.showMainScreen(); // Переход на главный экран
  setTimeout(() => window.app.startPhoneCall(), 5000); // Звонок через 5 секунд
}




}
