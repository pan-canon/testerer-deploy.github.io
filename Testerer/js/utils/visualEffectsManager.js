export class VisualEffectsManager {
  /**
   * @param {App} appInstance – ссылка на основной объект приложения.
   * @param {HTMLElement} controlsPanel – элемент с кнопками управления.
   */
  constructor(appInstance, controlsPanel) {
    this.app = appInstance;
    this.controlsPanel = controlsPanel;
  }

  /**
   * playAudioWithStop – воспроизводит аудио и автоматически останавливает его через заданное время.
   * @param {string} audioSrc - путь к аудиофайлу.
   * @param {number} stopDelay - время в мс.
   */
  playAudioWithStop(audioSrc, stopDelay) {
    const audio = new Audio(audioSrc);
    audio.play();
    if (stopDelay && stopDelay > 0) {
      setTimeout(() => {
        audio.pause();
      }, stopDelay);
    }
    return audio;
  }

  /**
   * setControlsBlocked – блокирует или разблокирует элементы управления.
   * @param {boolean} shouldBlock - true для блокировки.
   */
  setControlsBlocked(shouldBlock) {
    if (!this.controlsPanel) return;
    // Если камера открыта, не блокируем
    if (this.app.isCameraOpen) {
      shouldBlock = false;
    }
    this.controlsPanel.style.pointerEvents = shouldBlock ? "none" : "auto";
  }

  /**
   * animateHTMLText – анимирует текст, разбирая HTML-теги.
   */
  animateHTMLText(targetElem, text, speed, audioObj, callback, onChar) {
    targetElem.innerHTML = "";
    let pos = 0;
    let currentHTML = "";
    let isTag = false;
    let tagBuffer = "";

    const intervalId = setInterval(() => {
      const char = text[pos];
      if (!char) {
        clearInterval(intervalId);
        if (audioObj) audioObj.pause();
        if (callback) callback();
        return;
      }

      if (char === "<") {
        isTag = true;
      }
      if (isTag) {
        tagBuffer += char;
        if (char === ">") {
          currentHTML += tagBuffer;
          tagBuffer = "";
          isTag = false;
        }
      } else {
        currentHTML += char;
      }

      targetElem.innerHTML = currentHTML;
      pos++;

      if (typeof onChar === "function") {
        onChar(targetElem, currentHTML);
      }
    }, speed);
  }

  /**
   * triggerMirrorEffect – запускает визуальный эффект для зеркального квеста.
   * Теперь, если камера не активна, выводится более информативное сообщение.
   */
  triggerMirrorEffect() {
    if (!this.app.isCameraOpen) {
      console.log("Зеркальный эффект не запускается: камера не активна. Эффект будет применён при активации камеры.");
      return;
    }
    document.body.style.transition = "background 1s";
    document.body.style.background = "black";
    setTimeout(() => {
      document.body.style.background = "";
    }, 1000);
    this.playAudioWithStop('audio/phone_ringtone.mp3', 3000);
  }

  /**
   * triggerGhostAppearanceEffect – эффект появления призрака.
   */
  triggerGhostAppearanceEffect(ghostId) {
    if (!this.app.isCameraOpen) {
      console.log("Эффект появления призрака не запускается: камера не активна.");
      return;
    }
    const ghostEffect = document.createElement("div");
    Object.assign(ghostEffect.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "200px",
      height: "200px",
      background: `url('images/${ghostId}.png') no-repeat center center`,
      backgroundSize: "contain",
      opacity: "0.7",
      transition: "opacity 2s"
    });
    document.body.appendChild(ghostEffect);
    setTimeout(() => { ghostEffect.style.opacity = "0"; }, 3000);
    setTimeout(() => { ghostEffect.remove(); }, 5000);
  }

  /**
   * triggerWhisperEffect – эффект шёпота (5 секунд).
   */
  triggerWhisperEffect() {
    this.playAudioWithStop('audio/whisper.mp3', 5000);
  }

  /**
   * triggerGhostTextEffect – печатает "призрачный" текст с эффектом.
   */
  triggerGhostTextEffect(targetElem, text, callback) {
    this.setControlsBlocked(true);
    const ghostSound = new Audio('audio/ghost_effect.mp3');
    ghostSound.play();

    this.animateHTMLText(
      targetElem,
      text,
      100,
      ghostSound,
      () => {
        this.setControlsBlocked(false);
        if (callback) callback();
      }
    );
  }

  /**
   * triggerUserTextEffect – имитирует печать пользователя с визуальным эффектом.
   */
  triggerUserTextEffect(targetElem, text, callback) {
    const pencilIcon = document.createElement("img");
    pencilIcon.src = "images/pencil.png";
    pencilIcon.alt = "Пишется...";
    Object.assign(pencilIcon.style, {
      width: "24px",
      height: "24px",
      position: "absolute"
    });

    const parentElem = targetElem.parentElement;
    parentElem.style.position = "relative";
    parentElem.insertBefore(pencilIcon, targetElem);

    this.setControlsBlocked(true);
    const typeSound = new Audio('audio/type_sound.mp3');
    typeSound.loop = true;
    typeSound.play();

    const onChar = () => {
      const dummySpan = document.createElement("span");
      dummySpan.innerHTML = "&nbsp;";
      targetElem.appendChild(dummySpan);

      const rectDummy = dummySpan.getBoundingClientRect();
      const rectParent = parentElem.getBoundingClientRect();
      pencilIcon.style.left = (rectDummy.left - rectParent.left) + "px";
      pencilIcon.style.top  = (rectDummy.top - rectParent.top) + "px";

      dummySpan.remove();
    };

    this.animateHTMLText(
      targetElem,
      text,
      100,
      typeSound,
      () => {
        pencilIcon.remove();
        this.setControlsBlocked(false);
        if (callback) callback();
      },
      onChar
    );
  }
}