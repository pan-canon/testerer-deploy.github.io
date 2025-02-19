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
    }, 3000);
  }

  /**
   * triggerWhisperEffect – запускает эффект шёпота.
   *
   * Воспроизводит аудио-шёпот, который можно использовать для создания атмосферы.
   */
  triggerWhisperEffect() {
    const whisperSound = new Audio('audio/whisper.mp3');
    whisperSound.play();
    setTimeout(() => {
      whisperSound.pause();
    }, 5000);
  }

  /**
   * triggerGhostTextEffect – плавно проявляет текст в targetElem, проигрывая звук эффекта.
   * Этот метод используется для записей от призрака.
   * @param {HTMLElement} targetElem - элемент, в который будет анимирован текст.
   * @param {string} text - текст для анимации.
   * @param {Function} [callback] - функция, вызываемая после завершения анимации.
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
    }, 100); // интервал 100 мс между символами
  }

  /**
   * triggerUserTextEffect – имитирует эффект печатания текста с иконкой карандаша и звуковым сопровождением.
   * Блокирует элементы управления до завершения анимации.
   * @param {HTMLElement} targetElem - элемент, в который будет анимирован текст.
   * @param {string} text - текст для анимации.
   * @param {Function} [callback] - функция, вызываемая после завершения анимации.
   */
  triggerUserTextEffect(targetElem, text, callback) {
    // Создаем элемент для иконки карандаша и размещаем его над targetElem
    const pencilIcon = document.createElement("img");
    pencilIcon.src = "images/pencil.png";
    pencilIcon.alt = "Пишется...";
    pencilIcon.style.width = "24px";
    pencilIcon.style.height = "24px";
    pencilIcon.style.position = "absolute";
    pencilIcon.style.top = "-30px";
    // Блокируем элементы управления, если контейнер с id "controls" существует
    const controls = document.getElementById("controls");
    if (controls) {
      controls.style.pointerEvents = "none";
    }
    // Устанавливаем позиционирование родительского контейнера targetElem
    targetElem.parentElement.style.position = "relative";
    targetElem.parentElement.insertBefore(pencilIcon, targetElem);

    // Звук печатания
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
        // Убираем иконку карандаша
        pencilIcon.remove();
        // Разблокируем элементы управления
        if (controls) {
          controls.style.pointerEvents = "auto";
        }
        if (callback) callback();
      }
    }, 100); // интервал 100 мс между символами
  }
}