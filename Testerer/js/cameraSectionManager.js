// CameraSectionManager.js
export class cameraSectionManager {
  constructor() {
    this.videoElement = null; // будет создаваться динамически
    this.stream = null;
  }

  /**
   * attachTo(containerId, options)
   * Создает (если еще не создан) видеоэлемент, применяет заданные стили и вставляет его в контейнер.
   * options может включать стили, например: { width: "100%", maxWidth: "400px", filter: "grayscale(100%)" }
   */
  attachTo(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Контейнер с id "${containerId}" не найден!`);
      return;
    }
    if (!this.videoElement) {
      this.videoElement = document.createElement('video');
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;
    } else if (this.videoElement.parentNode) {
      // Если видео уже было прикреплено к другому контейнеру, удаляем его
      this.videoElement.parentNode.removeChild(this.videoElement);
    }
    // Применяем опции как inline-стили
    for (const prop in options) {
      this.videoElement.style[prop] = options[prop];
    }
    container.innerHTML = ""; // очищаем контейнер
    container.appendChild(this.videoElement);
  }

  async startCamera() {
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
        console.error("Видеоэлемент не создан!");
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