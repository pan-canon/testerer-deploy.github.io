export class FaceRecognitionManager {
    constructor() {
        this.model = null;
    }

    async loadModel() {
        if (!this.model) {
            this.model = await faceLandmarksDetection.load(
                faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
            );
            console.log("🧠 Модель распознавания лиц загружена!");
        }
    }

    async getFaceEmbedding(imageSrc) {
        if (!imageSrc) {
            console.warn("❌ Нет изображения для анализа!");
            return null;
        }

        const img = new Image();
        img.src = imageSrc;
        await new Promise(resolve => img.onload = resolve);

        await this.loadModel();
        const predictions = await this.model.estimateFaces({ input: img });

        if (!predictions.length) {
            console.warn("❌ Лицо не найдено на изображении!");
            return null;
        }

        console.log("📸 Лицо на фото:", predictions[0].scaledMesh);
        return predictions[0].scaledMesh;
    }

    async compareFaces(videoElement, selfieEmbedding) {
        if (!videoElement || !selfieEmbedding) {
            console.warn("⚠️ Камера или селфи отсутствуют!");
            return false;
        }

        await this.loadModel();
        const predictions = await this.model.estimateFaces({ input: videoElement });

        if (!predictions.length) {
            console.warn("❌ Лицо в камере не найдено!");
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
}
