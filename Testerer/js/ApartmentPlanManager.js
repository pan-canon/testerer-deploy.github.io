export class ApartmentPlanManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
        this.floors = [{}]; // Храним массив этажей
        this.currentFloor = 0;

        this.canvas.addEventListener("mousedown", (e) => this.startSelection(e));
    }

    addFloor() {
        this.floors.push({});
        this.currentFloor = this.floors.length - 1;
        this.clearCanvas();
    }

    removeFloor() {
        if (this.floors.length > 1) {
            this.floors.splice(this.currentFloor, 1);
            this.currentFloor = Math.max(0, this.currentFloor - 1);
            this.clearCanvas();
        }
    }

    startSelection(event) {
        // Логика выбора зоны
        const x = event.offsetX;
        const y = event.offsetY;
        this.ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
        this.ctx.fillRect(x - 20, y - 20, 40, 40);
        this.floors[this.currentFloor][`${x}-${y}`] = true;
    }

    savePlan() {
        localStorage.setItem("apartmentPlan", JSON.stringify(this.floors));
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
