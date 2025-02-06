// faceRecognitionManager.js

/**
 * Класс FaceRecognitionManager
 * Инкапсулирует загрузку модели Face API, подготовку селфи и сравнение с текущим лицом.
 */

class FaceRecognitionManager {
  constructor() {
    // Можем хранить здесь ссылку на загруженную модель (чтобы не грузить заново)
    this.model = null;
  }

  /**
   * Загружаем (лениво) модель, если ещё не загружена.
   */
  async loadModel() {
    if (!this.model) {
      console.log("🔄 Загружаем модель face-landmarks-detection...");
      this.model = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
      );
      console.log("✅ Модель загружена.");
    }
    return this.model;
  }

  /**
   * Подготавливаем embedding (координаты) из селфи.
   * @param {string} selfieSrc - dataURL изображения (селфи).
   * @returns {Array|null} массив координат или null, если лицо не найдено
   */
  async loadSelfieEmbedding(selfieSrc) {
    if (!selfieSrc) {
      console.warn("❌ Селфи отсутствует!");
      return null;
    }

    // Создаём Image для анализа
    const img = new Image();
    img.src = selfieSrc;

    // Ждём, пока изображение загрузится
    await new Promise(resolve => {
      img.onload = resolve;
      img.onerror = () => {
        console.error("❌ Ошибка загрузки изображения-селфи");
        resolve(); // всё равно завершаем
      };
    });

    // Загружаем модель (один раз)
    const model = await this.loadModel();

    // Получаем предсказания лиц
    const predictions = await model.estimateFaces({ input: img });
    if (!predictions.length) {
      console.warn("❌ Лицо на селфи не найдено!");
      return null;
    }

    console.log("📸 Лицо на селфи загружено:", predictions[0].scaledMesh);
    return predictions[0].scaledMesh; // координаты ключевых точек
  }

  /**
   * Сравниваем текущее лицо (с камеры) с embedding селфи.
   * Возвращаем true, если расстояние между точками < threshold.
   * @param {HTMLVideoElement} videoElement - поток камеры
   * @param {Array} selfieEmbedding - координаты лица из селфи
   * @returns {boolean} true - если совпадает, false - если нет
   */
  async compareFaces(videoElement, selfieEmbedding) {
    if (!videoElement || !selfieEmbedding) {
      console.warn("⚠️ Камера или селфи отсутствуют!");
      return false;
    }

    // Загружаем модель
    const model = await this.loadModel();

    // Получаем лицо в реальном времени
    const predictions = await model.estimateFaces({ input: videoElement });
    if (!predictions.length) {
      console.warn("❌ Лицо в реальном времени не обнаружено!");
      return false;
    }

    console.log("📹 Лицо в реальном времени:", predictions[0].scaledMesh);

    // Считаем «среднее евклидовое расстояние» между соответствующими точками
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

    // Порог (threshold) можно подбирать
    const threshold = 20;
    return meanDist < threshold;
  }

  /**
   * Показываем окно (модалку) с результатом сравнения.
   * @param {string} result - 'match' или 'no-match'
   */
  showVerificationModal(result) {
    // Создаём элемент подложки
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

    // Само окно
    const modal = document.createElement("div");
    modal.style.background = "#fff";
    modal.style.padding = "2rem";
    modal.style.borderRadius = "8px";
    modal.style.textAlign = "center";
    modal.style.maxWidth = "400px";

    const title = document.createElement("h2");
    title.textContent = (result === "match")
      ? "Лицо совпадает!"
      : "Лицо не совпадает!";
    modal.appendChild(title);

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

// Делаем доступным класс глобально (или используем import/export, если есть сборка)
window.FaceRecognitionManager = FaceRecognitionManager;
