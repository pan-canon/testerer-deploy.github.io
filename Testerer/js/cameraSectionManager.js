// CameraSectionManager.js
export class CameraSectionManager {
  constructor(videoElementId) {
    this.videoElement = document.getElementById(videoElementId);
    this.stream = null;
  }

  async startCamera() {
    // Если камера уже запущена – ничего не делаем
    if (this.stream) {
      console.log("Камера уже запущена");
      return;
    }
    try {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const constraints = { video: { facingMode: isMobile ? "environment" : "user" } };
      console.log(`🎥 Запуск камеры: ${constraints.video.facingMode}`);
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (!this.videoElement) {
        console.error("🚨 Ошибка: элемент видео не найден!");
        return;
      }
      this.videoElement.srcObject = this.stream;
    } catch (error) {
      console.error("❌ Ошибка при доступе к камере:", error);
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }
}