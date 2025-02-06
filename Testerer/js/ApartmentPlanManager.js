export class ApartmentPlanManager {
    constructor(canvasId, dbManager) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
        this.dbManager = dbManager;
        this.rooms = [];
        this.currentFloor = 1;
        this.drawing = false;
        this.startX = 0;
        this.startY = 0;
        this.init();
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

// После сохранения плана квартиры, переходим на главный экран
window.app.showMainScreen();

// Звонок через 5 секунд после завершения регистрации и планирования
setTimeout(() => window.app.startPhoneCall(), 5000);
}
