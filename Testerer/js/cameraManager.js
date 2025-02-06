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
      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
      }
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
}
