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


captureFrame() {
  if (!this.videoElement) {
    console.error("🚨 Ошибка: Видеоэлемент не найден!");
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = this.videoElement.videoWidth || 640;
  canvas.height = this.videoElement.videoHeight || 480;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png'); // Возвращаем изображение в base64
}



  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }
}