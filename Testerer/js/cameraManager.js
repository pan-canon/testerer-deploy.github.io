export class CameraManager {
  constructor(videoElementId, faceRecManager) {
    this.videoElement = document.getElementById(videoElementId);
    this.stream = null;
    // Внедряем FaceRecognitionManager, чтобы можно было вызывать при создании селфи
    this.faceRecManager = faceRecManager;
  }

  async start() {
    try {
      console.log("🎥 Запуск камеры: user");
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const constraints = {
        video: { facingMode: isMobile ? "environment" : "user" }
      };

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

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  /**
   * Делаем снимок (селфи).
   * Возвращает dataURL или null, если что-то пошло не так.
   * Дополнительно проверяем «не далеко ли лицо» через faceRecManager?
   */
  async captureSelfie() {
    console.log("📸 Попытка сделать снимок...");

    if (!this.videoElement || !this.videoElement.srcObject) {
      console.error("❌ Камера не активна!");
      alert("Ошибка: Камера не включена.");
      return null;
    }

    // Проверяем, готово ли видео
    if (this.videoElement.readyState < 2) {
      console.warn("⏳ Камера ещё не готова...");
      alert("Подождите, пока камера загрузится.");
      return null;
    }

    try {
      // Создаём canvas, чтобы захватить кадр
      const canvas = document.createElement("canvas");
      canvas.width = this.videoElement.videoWidth || 640;
      canvas.height = this.videoElement.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Не удалось получить контекст canvas.");

      ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
      const selfieData = canvas.toDataURL("image/png");
      if (!selfieData || selfieData.length < 100) {
        throw new Error("Ошибка обработки изображения.");
      }

      // Дополнительно проверяем «лицо не слишком далеко»
      // Создадим временное Image и попросим faceRecManager проверить
      const img = new Image();
      img.src = selfieData;
      await new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve; // чтобы не зависало
      });

      // Если проверка не пройдена — возвращаем null, просим пользователя повторить
      const isOk = await this.faceRecManager.checkDistanceDuringSelfie(img);
      if (!isOk) {
        return null;
      }

      console.log("✅ Снимок успешно сделан!");
      return selfieData;
    } catch (error) {
      console.error("❌ Ошибка при создании снимка:", error);
      alert("Ошибка при создании снимка! Попробуйте снова.");
      return null;
    }
  }
}
