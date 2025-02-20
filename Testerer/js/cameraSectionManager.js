export class cameraSectionManager {
  /**
   * Конструктор класса.
   * Инициализирует поля:
   * - videoElement: будет создан динамически при первом вызове attachTo().
   * - stream: хранит объект MediaStream, полученный из getUserMedia().
   * - onVideoReady: callback, вызываемый, когда видеопоток готов (после события loadedmetadata).
   * - onCameraClosed: callback, вызываемый после остановки камеры.
   */
  constructor() {
    this.videoElement = null;
    this.stream = null;
    this.onVideoReady = null;
    this.onCameraClosed = null;
  }

  /**
   * attachTo(containerId, options)
   * Прикрепляет видеоэлемент к указанному контейнеру.
   * Если видеоэлемент ещё не создан, он создаётся с базовыми настройками.
   * Все переданные стили из объекта options применяются к видеоэлементу.
   * Предварительно контейнер очищается (container.innerHTML = "").
   *
   * @param {string} containerId - ID контейнера, куда нужно вставить видеоэлемент.
   * @param {object} [options={}] - Объект со стилевыми свойствами для видеоэлемента (например, width, height, filter).
   */
  attachTo(containerId, options = {}) {
    // Получаем ссылку на контейнер по ID.
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Контейнер с id "${containerId}" не найден!`);
      return;
    }

    // Если видеоэлемент еще не создан, создаем его и настраиваем.
    if (!this.videoElement) {
      this.videoElement = document.createElement('video');
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;
    } else if (this.videoElement.parentNode) {
      // Если видеоэлемент уже существует и прикреплен к какому-либо контейнеру,
      // удаляем его оттуда, чтобы предотвратить дублирование.
      this.videoElement.parentNode.removeChild(this.videoElement);
    }

    // Применяем переданные стилевые опции к видеоэлементу.
    for (const prop in options) {
      this.videoElement.style[prop] = options[prop];
    }

    // Очищаем содержимое контейнера и вставляем видеоэлемент.
    container.innerHTML = "";
    container.appendChild(this.videoElement);
  }

  /**
   * startCamera – запускает камеру, запрашивая доступ через getUserMedia.
   * Если поток уже запущен, функция ничего не делает.
   * При успешном получении потока, он устанавливается в качестве источника для видеоэлемента.
   * После загрузки метаданных видеопотока вызывается onVideoReady, если он определён.
   */
  async startCamera() {
    // Если поток уже запущен, выводим сообщение и выходим.
    if (this.stream) {
      console.log("Камера уже запущена");
      return;
    }
    try {
      // Определяем, используется ли мобильное устройство, чтобы правильно задать режим камеры.
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const constraints = { video: { facingMode: isMobile ? "environment" : "user" } };
      console.log(`🎥 Запуск камеры: ${constraints.video.facingMode}`);
      
      // Запрашиваем доступ к камере.
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (!this.videoElement) {
        console.error("Видеоэлемент не создан!");
        return;
      }
      // Устанавливаем полученный поток как источник для видеоэлемента.
      this.videoElement.srcObject = this.stream;
      
      // Добавляем обработчик события "loadedmetadata", чтобы уведомить о готовности видеопотока.
      this.videoElement.addEventListener("loadedmetadata", () => {
        console.log("loadedmetadata: видеопоток готов");
        if (typeof this.onVideoReady === "function") {
          this.onVideoReady();
        }
      }, { once: true });
    } catch (error) {
      console.error("❌ Ошибка при доступе к камере:", error);
    }
  }

  /**
   * stopCamera – останавливает текущий поток камеры.
   * Проходит по всем дорожкам (tracks) потока и останавливает их.
   * После остановки сбрасывает поле stream в null.
   * Вызывает onCameraClosed, если он определён.
   */
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
      if (typeof this.onCameraClosed === "function") {
        this.onCameraClosed();
      }
    }
  }
}