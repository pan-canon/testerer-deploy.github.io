export class VisualEffectsManager {
  /**
   * triggerMirrorEffect – запускает визуальный эффект для зеркального квеста.
   *
   * Эффект затемняет фон страницы и воспроизводит аудио (например, звук звонка).
   * Эффект выполняется только если глобальный контейнер камеры (global-camera) виден,
   * что указывает на активный режим квеста.
   */
  triggerMirrorEffect() {
    // Проверяем, открыт ли глобальный контейнер камеры.
    const globalCamera = document.getElementById('global-camera');
    if (!globalCamera || globalCamera.style.display === "none") {
      console.log("Эффект зеркального квеста не запускается, камера не активна.");
      return;
    }

    // Эффект затемнения фона: плавное затемнение на 1 секунду.
    document.body.style.transition = "background 1s";
    document.body.style.background = "black";
    setTimeout(() => {
      document.body.style.background = "";
    }, 1000);

    // Эффект статического шума: воспроизводим аудио-звонок.
    const staticNoise = new Audio('audio/phone_ringtone.mp3');
    staticNoise.play();
    setTimeout(() => {
      staticNoise.pause();
    }, 3000);
  }

  /**
   * triggerGhostAppearanceEffect – запускает визуальный эффект появления призрака.
   *
   * Создает элемент, представляющий призрачное изображение, который появляется по центру экрана.
   * Эффект предназначен для вызова, когда квест с призраком активен.
   *
   * @param {string} ghostId - Идентификатор призрака, используемый для выбора изображения.
   */
  triggerGhostAppearanceEffect(ghostId) {
    // Если необходимо добавить проверку на активность камеры, можно использовать аналогичную проверку.
    // Например, если эффект должен работать только в режиме квеста.
    const globalCamera = document.getElementById('global-camera');
    if (!globalCamera || globalCamera.style.display === "none") {
      console.log("Эффект появления призрака не запускается, камера не активна.");
      return;
    }
    
    // Создаем элемент для визуального эффекта появления призрака.
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
    
    // Добавляем элемент эффекта на страницу.
    document.body.appendChild(ghostEffect);
    
    // Плавное исчезновение эффекта через 3 секунды.
    setTimeout(() => {
      ghostEffect.style.opacity = "0";
    }, 3000);
  }

  /**
   * triggerWhisperEffect – запускает эффект шёпота.
   *
   * Воспроизводит аудио-шёпот, который можно использовать для создания атмосферы.
   */
  triggerWhisperEffect() {
    // Здесь можно добавить проверку на активность камеры, если требуется.
    const whisperSound = new Audio('audio/whisper.mp3');
    whisperSound.play();
    setTimeout(() => {
      whisperSound.pause();
    }, 5000);
  }
}