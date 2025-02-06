export class CameraManager {
  constructor(videoElementId) {
    this.videoElement = document.getElementById(videoElementId);
    this.stream = null;
  }

async start() {
    try {
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const constraints = {
            video: { facingMode: isMobile ? "environment" : "user" }
        };

        console.log(`🎥 Запуск камеры: ${constraints.video.facingMode}`);
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (!this.videoElement) {
            console.error("🚨 Ошибка: videoElement не найден!");
            return;
        }

        this.videoElement.srcObject = this.stream;
    } catch (error) {
        console.error("❌ Ошибка при доступе к камере:", error);
    }
}


async loadSelfieEmbedding(selfieSrc) {
    if (!selfieSrc) {
        console.warn("❌ Селфи отсутствует!");
        return null;
    }

    // Загружаем селфи
    const img = new Image();
    img.src = selfieSrc;
    await new Promise(resolve => img.onload = resolve);

    // Загружаем модель
    const model = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
    );

    // Получаем лицо
    const predictions = await model.estimateFaces({ input: img });

    if (!predictions.length) {
        console.warn("❌ Лицо на селфи не найдено!");
        return null;
    }

    console.log("📸 Лицо на селфи загружено:", predictions[0].scaledMesh);
    return predictions[0].scaledMesh; // Координаты лица
}


async compareFaces(videoElement, selfieEmbedding) {
    if (!videoElement || !selfieEmbedding) {
        console.warn("⚠️ Камера или селфи отсутствуют!");
        return false;
    }

    // Загружаем модель
    const model = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
    );

    // Получаем лицо в реальном времени
    const predictions = await model.estimateFaces({ input: videoElement });

    if (!predictions.length) {
        console.warn("❌ Лицо не обнаружено!");
        return false;
    }

    console.log("📹 Лицо в реальном времени:", predictions[0].scaledMesh);

    // ✅ Расстояние между точками лица (евклидово расстояние)
    let distance = 0;
    for (let i = 0; i < selfieEmbedding.length; i++) {
        distance += Math.pow(selfieEmbedding[i][0] - predictions[0].scaledMesh[i][0], 2);
        distance += Math.pow(selfieEmbedding[i][1] - predictions[0].scaledMesh[i][1], 2);
        distance += Math.pow(selfieEmbedding[i][2] - predictions[0].scaledMesh[i][2], 2);
    }
    distance = Math.sqrt(distance / selfieEmbedding.length);

    console.log("📏 Расстояние между лицами:", distance);

    return distance < 20; // 🔹 Если меньше 20 — лица совпадают!
}



  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }
}