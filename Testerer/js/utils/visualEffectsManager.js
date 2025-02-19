export class VisualEffectsManager {
  /**
   * Конструктор VisualEffectsManager.
   * @param {HTMLElement} controlsPanel - DOM-элемент панели управления, используемый для блокировки элементов.
   */
  constructor(controlsPanel) {
    this.controlsPanel = controlsPanel;
  }

  /**
   * triggerMirrorEffect – запускает визуальный эффект для зеркального квеста.
   *
   * Эффект затемняет фон страницы и воспроизводит аудио (например, звук звонка).
   * Эффект выполняется только если глобальный контейнер камеры (global-camera) виден.
   */
  triggerMirrorEffect() {
    const globalCamera = document.getElementById('global-camera');
    if (!globalCamera || globalCamera.style.display === "none") {
      console.log("Эффект зеркального квеста не запускается, камера не активна.");
      return;
    }

    // Затемняем фон на 1 секунду.
    document.body.style.transition = "background 1s";
    document.body.style.background = "black";
    setTimeout(() => {
      document.body.style.background = "";
    }, 1000);

    // Воспроизводим аудио-звонок.
    const staticNoise = new Audio('audio/phone_ringtone.mp3');
    staticNoise.play();
    setTimeout(() => {
      staticNoise.pause();
    }, 3000);
  }

  /**
   * triggerGhostAppearanceEffect – запускает визуальный эффект появления призрака.
   *
   * Создает элемент с изображением призрака по центру экрана.
   *
   * @param {string} ghostId - Идентификатор призрака, используемый для выбора изображения.
   */
  triggerGhostAppearanceEffect(ghostId) {
    const globalCamera = document.getElementById('global-camera');
    if (!globalCamera || globalCamera.style.display === "none") {
      console.log("Эффект появления призрака не запускается, камера не активна.");
      return;
    }

    const ghostEffect = document.createElement("div");
    ghostEffect.style.position = "absolute";
    ghostEffect.style.top = "50%";
    ghostEffect.style.left = "50%";
    ghostEffect.style.transform = "translate(-50%, -50%)";
    ghostEffect.style.width = "200px";
    ghostEffect.style.height = "200px";
    ghostEffect.style.background = `url('images/${ghostId}.png') no-repeat center center`;
    ghostEffect.style.backgroundSize = "contain";
    ghostEffect.style.opacity = "0.7";

    document.body.appendChild(ghostEffect);
    setTimeout(() => {
      ghostEffect.style.opacity = "0";
      setTimeout(() => ghostEffect.remove(), 500);
    }, 3000);
  }

  /**
   * triggerWhisperEffect – запускает эффект шепота.
   *
   * Воспроизводит аудио-шепот для создания атмосферного эффекта.
   */
  triggerWhisperEffect() {
    const whisperSound = new Audio('audio/whisper.mp3');
    whisperSound.play();
    setTimeout(() => {
      whisperSound.pause();
    }, 5000);
  }

  /**
   * triggerGhostTextEffect – плавно проявляет текст в targetElem с эффектом звука.
   * Этот метод используется для анимации записей от призрака.
   *
   * @param {HTMLElement} targetElem - Элемент, в который будет анимирован текст.
   * @param {string} text - Текст для анимации.
   * @param {Function} [callback] - Функция, вызываемая после завершения анимации.
   */
  triggerGhostTextEffect(targetElem, text, callback) {
    targetElem.textContent = "";
    const ghostSound = new Audio('audio/ghost_effect.mp3');
    ghostSound.play();
    let i = 0;
    const interval = setInterval(() => {
      targetElem.textContent += text[i];
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        ghostSound.pause();
        if (callback) callback();
      }
    }, 100);
  }

  /**
   * triggerUserTextEffect – имитирует эффект печатания текста с иконкой карандаша и звуковым сопровождением.
   * Блокирует элементы управления до завершения анимации.
   *
   * @param {HTMLElement} targetElem - Элемент, в который будет анимирован текст.
   * @param {string} text - Текст для анимации.
   * @param {Function} [callback] - Функция, вызываемая после завершения анимации.
   */
  triggerUserTextEffect(targetElem, text, callback) {
    // Создаем иконку карандаша.
    const pencilIcon = document.createElement("img");
    pencilIcon.src = "images/pencil.png";
    pencilIcon.alt = "Пишется...";
    pencilIcon.style.width = "24px";
    pencilIcon.style.height = "24px";
    pencilIcon.style.position = "absolute";
    pencilIcon.style.top = "-30px";

    // Блокируем панель управления.
    if (this.controlsPanel) {
      this.controlsPanel.style.pointerEvents = "none";
    }

    // Обеспечиваем относительное позиционирование родительского элемента.
    targetElem.parentElement.style.position = "relative";
    targetElem.parentElement.insertBefore(pencilIcon, targetElem);

    const typeSound = new Audio('audio/type_sound.mp3');
    typeSound.loop = true;
    typeSound.play();

    targetElem.textContent = "";
    let i = 0;
    const interval = setInterval(() => {
      targetElem.textContent += text[i];
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        typeSound.pause();
        pencilIcon.remove();
        if (this.controlsPanel) {
          this.controlsPanel.style.pointerEvents = "auto";
        }
        if (callback) callback();
      }
    }, 100);
  }
}