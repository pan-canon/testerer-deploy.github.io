// faceRecognitionManager.js

class FaceRecognitionManager {
  constructor() {
    this.model = null; // Модель загружаем лениво
  }

  /**
   * Показываем или обновляем «статусную» модалку (overlay) с текстом message.
   */
  showStatusModal(message) {
    // Пытаемся найти существующий overlay
    let overlay = document.getElementById("status-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "status-overlay";
      overlay.style.position = "fixed";
      overlay.style.top = 0;
      overlay.style.left = 0;
      overlay.style.width = "100vw";
      overlay.style.height = "100vh";
      overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      overlay.style.display = "flex";
      overlay.style.justifyContent = "center";
      overlay.style.alignItems = "center";
      overlay.style.zIndex = "9999";

      const box = document.createElement("div");
      box.id = "status-box";
      box.style.background = "#fff";
      box.style.padding = "2rem";
      box.style.borderRadius = "8px";
      box.style.textAlign = "center";

      overlay.appendChild(box);
      document.body.appendChild(overlay);
    }

    const statusBox = document.getElementById("status-box");
    statusBox.textContent = message;
  }

  /**
   * Скрываем статусную модалку (overlay).
   */
  hideStatusModal() {
    const overlay = document.getElementById("status-overlay");
    if (overlay) {
      document.body.removeChild(overlay);
    }
  }

  /**
   * Основная модель face-landmarks-detection.
   * Грузим 1 раз, при первом вызове.
   */
  async loadModel() {
    if (!this.model) {
      this.showStatusModal("Загружаем модель распознавания лица...");
      console.log("🔄 Загружаем модель face-landmarks-detection...");
      this.model = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
      );
      console.log("✅ Модель загружена.");
      this.hideStatusModal();
    }
    return this.model;
  }

  /**
   * Проверяем, не слишком ли далеко лицо (по размеру bounding box).
   * Возвращаем true, если лицо приемлемо по размеру, и false, если слишком маленькое.
   */
  isFaceCloseEnough(prediction) {
    // prediction.boundingBox = { topLeft: [x, y], bottomRight: [x2, y2] }
    const bbox = prediction.boundingBox;
    const width = Math.abs(bbox.bottomRight[0] - bbox.topLeft[0]);
    const height = Math.abs(bbox.bottomRight[1] - bbox.topLeft[1]);

    // Можем ввести простой порог, например, лицо должно занимать не менее 20% ширины картинки
    const minWidth = 100;  // условно
    const minHeight = 100; // условно

    // Если ширина или высота меньше порога — считаем, что «слишком далеко»
    if (width < minWidth || height < minHeight) {
      console.log("❌ Лицо слишком далеко: width=", width, "height=", height);
      return false;
    }
    console.log("✅ Лицо достаточно крупное: width=", width, "height=", height);
    return true;
  }

  /**
   * При создании селфи проверяем, что лицо не слишком далеко.
   * Если всё ок — вернём true, иначе покажем модалку «Лицо слишком далеко» и вернём false.
   */
  async checkDistanceDuringSelfie(imageElement) {
    this.showStatusModal("Проверяем расстояние до лица...");
    const model = await this.loadModel();
    const predictions = await model.estimateFaces({ input: imageElement });

    this.hideStatusModal();

    if (!predictions.length) {
      alert("Лицо не найдено на фото! Сделайте селфи заново.");
      return false;
    }
    // Берём первое лицо
    const pred = predictions[0];

    // Смотрим, не слишком ли далеко
    if (!this.isFaceCloseEnough(pred)) {
      alert("Лицо слишком далеко! Приблизьтесь к камере и повторите селфи.");
      return false;
    }
    return true;
  }

  /**
   * Получаем embedding (точки лица) из изображения (селфи).
   */
  async loadSelfieEmbedding(selfieSrc) {
    if (!selfieSrc) {
      console.warn("❌ Селфи отсутствует!");
      return null;
    }
    this.showStatusModal("Анализируем селфи...");

    // Создаём Image
    const img = new Image();
    img.src = selfieSrc;
    await new Promise(resolve => {
      img.onload = resolve;
      img.onerror = () => {
        console.error("❌ Ошибка загрузки изображения-селфи");
        resolve();
      };
    });

    const model = await this.loadModel();
    const predictions = await model.estimateFaces({ input: img });
    this.hideStatusModal();

    if (!predictions.length) {
      console.warn("❌ Лицо на селфи не найдено!");
      return null;
    }
    console.log("📸 Лицо на селфи загружено:", predictions[0].scaledMesh);
    return predictions[0].scaledMesh;
  }

  /**
   * Сравниваем текущее лицо в реальном времени с embedding селфи.
   */
  async compareFaces(videoElement, selfieEmbedding) {
    if (!videoElement || !selfieEmbedding) {
      console.warn("⚠️ Камера или селфи отсутствуют!");
      return false;
    }
    this.showStatusModal("Сравниваем лицо с селфи...");

    const model = await this.loadModel();
    const predictions = await model.estimateFaces({ input: videoElement });

    this.hideStatusModal();

    if (!predictions.length) {
      console.warn("❌ Лицо в реальном времени не обнаружено!");
      return false;
    }
    console.log("📹 Лицо в реальном времени:", predictions[0].scaledMesh);

    // Считаем среднее евклидовое расстояние
    let distanceSum = 0;
    const realTimeMesh = predictions[0].scaledMesh;
    const count = Math.min(selfieEmbedding.length, realTimeMesh.length);

    for (let i = 0; i < count; i++) {
      distanceSum += Math.pow(selfieEmbedding[i][0] - realTimeMesh[i][0], 2);
      distanceSum += Math.pow(selfieEmbedding[i][1] - realTimeMesh[i][1], 2);
      distanceSum += Math.pow(selfieEmbedding[i][2] - realTimeMesh[i][2], 2);
    }
    const meanDist = Math.sqrt(distanceSum / count);
    console.log("📏 Расстояние между лицами:", meanDist);

    const threshold = 20;
    return meanDist < threshold;
  }

  /**
   * Показываем конечный результат сравнения (match / no-match / too-far).
   */
  showVerificationModal(result, detail = "") {
    // Создаём оверлей
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "9999";

    const modal = document.createElement("div");
    modal.style.background = "#fff";
    modal.style.padding = "2rem";
    modal.style.borderRadius = "8px";
    modal.style.textAlign = "center";
    modal.style.maxWidth = "400px";

    const title = document.createElement("h2");
    if (result === "match") {
      title.textContent = "Лицо совпадает!";
    } else if (result === "no-match") {
      title.textContent = "Лицо не совпадает!";
    } else if (result === "too-far") {
      title.textContent = "Лицо слишком далеко!";
    } else {
      title.textContent = "Результат не определён";
    }
    modal.appendChild(title);

    if (detail) {
      const detailP = document.createElement("p");
      detailP.textContent = detail;
      modal.appendChild(detailP);
    }

    const closeButton = document.createElement("button");
    closeButton.textContent = "Закрыть";
    closeButton.style.marginTop = "1rem";
    closeButton.addEventListener("click", () => {
      document.body.removeChild(overlay);
    });
    modal.appendChild(closeButton);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }
}

// Делаем класс глобально доступным (или используем ESM-экспорт)
window.FaceRecognitionManager = FaceRecognitionManager;
