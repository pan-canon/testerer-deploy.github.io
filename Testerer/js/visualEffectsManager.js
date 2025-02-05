export class VisualEffectsManager {
    constructor() {
        this.staticNoise = new Audio('audio/static_noise.mp3');
    }

    // 🔹 Запуск белого шума
    triggerStaticNoise(enable) {
        if (enable) {
            this.staticNoise.loop = true;
            this.staticNoise.play().catch(error => console.error("Ошибка воспроизведения звука:", error));
            document.body.classList.add("static-noise");
        } else {
            this.staticNoise.pause();
            this.staticNoise.currentTime = 0;
            document.body.classList.remove("static-noise");
        }
    }

    // 🔹 Эффект затемнения экрана
    triggerDarkScreenEffect() {
        document.body.style.transition = "background 1s";
        document.body.style.background = "black";
        setTimeout(() => {
            document.body.style.background = "";
        }, 1000);
    }

    // 🔹 Показываем текстовое задание
    showMirrorTask(text) {
        const mirrorTask = document.createElement("p");
        mirrorTask.textContent = text;
        mirrorTask.id = "mirror-task";
        document.getElementById("diary").appendChild(mirrorTask);
    }

    // 🔹 Добавляем кнопку камеры
    showCameraButton(appInstance) {
        if (!document.getElementById("camera-toggle")) {
            const cameraToggle = document.createElement("button");
            cameraToggle.textContent = "📸 Открыть камеру";
            cameraToggle.id = "camera-toggle";

            cameraToggle.addEventListener("click", () => appInstance.toggleCameraView());
            document.getElementById("main-screen").appendChild(cameraToggle);
        }
    }
}
