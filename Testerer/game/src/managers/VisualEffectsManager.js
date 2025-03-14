import { ErrorManager } from './managers/ErrorManager.js';

/**
 * VisualEffectsManager
 *
 * Manages visual effects (fades, animations, transitions) for the application.
 * It delegates UI updates to the ViewManager when available and uses ErrorManager
 * for error handling.
 *
 * @param {App} appInstance - Reference to the main application instance.
 * @param {HTMLElement} controlsPanel - The controls panel element used for blocking interactions.
 */
export class VisualEffectsManager {
  constructor(appInstance, controlsPanel) {
    this.app = appInstance;
    this.controlsPanel = controlsPanel;
  }

  /**
   * playAudioWithStop
   * Plays an audio file and stops it automatically after the specified delay.
   *
   * @param {string} audioSrc - Path to the audio file.
   * @param {number} stopDelay - Time in milliseconds after which to stop playback.
   * @returns {HTMLAudioElement|null} The audio object, or null if an error occurred.
   */
  playAudioWithStop(audioSrc, stopDelay) {
    try {
      const audio = new Audio(audioSrc);
      audio.play();
      if (stopDelay && stopDelay > 0) {
        setTimeout(() => {
          audio.pause();
        }, stopDelay);
      }
      return audio;
    } catch (error) {
      ErrorManager.logError(error, "playAudioWithStop");
      return null;
    }
  }

  /**
   * setControlsBlocked
   * Blocks or unblocks user interaction with the controls.
   * Delegates to the ViewManager if available.
   *
   * @param {boolean} shouldBlock - True to block controls, false to unblock.
   */
  setControlsBlocked(shouldBlock) {
    // Do not block controls if the camera is open.
    if (this.app.isCameraOpen) {
      shouldBlock = false;
    }
    if (this.app.viewManager && typeof this.app.viewManager.setControlsBlocked === 'function') {
      this.app.viewManager.setControlsBlocked(shouldBlock);
    } else if (this.controlsPanel) {
      try {
        this.controlsPanel.style.pointerEvents = shouldBlock ? "none" : "auto";
      } catch (error) {
        ErrorManager.logError(error, "setControlsBlocked");
      }
    }
  }

  /**
   * animateHTMLText
   * Animates HTML text by "typing" it into the target element.
   *
   * @param {HTMLElement} targetElem - The target element for text animation.
   * @param {string} text - The text (including HTML tags) to animate.
   * @param {number} speed - Typing speed in milliseconds.
   * @param {HTMLAudioElement} [audioObj] - Optional audio object to play during animation.
   * @param {Function} [callback] - Callback invoked after animation completes.
   * @param {Function} [onChar] - Callback invoked after each character is inserted.
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

      // Parse HTML tags.
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
   * triggerMirrorEffect
   * Triggers the mirror effect by applying a background transition and playing a ringtone.
   * Delegates the background transition to the ViewManager when available.
   */
  triggerMirrorEffect() {
    if (!this.app.isCameraOpen) {
      ErrorManager.logError("Mirror effect not triggered: camera is closed.", "triggerMirrorEffect");
      return;
    }
    if (this.app.viewManager && typeof this.app.viewManager.applyBackgroundTransition === 'function') {
      // Delegate background transition to ViewManager.
      this.app.viewManager.applyBackgroundTransition("black", 1000);
    } else {
      try {
        // Fallback: Direct DOM manipulation.
        document.body.style.transition = "background 1s";
        document.body.style.background = "black";
        setTimeout(() => {
          document.body.style.background = "";
        }, 1000);
      } catch (error) {
        ErrorManager.logError(error, "triggerMirrorEffect - fallback");
      }
    }
    // Play the ringtone audio for 3 seconds.
    this.playAudioWithStop('../../assets/audio/phone_ringtone.mp3', 3000);
  }

  /**
   * triggerGhostAppearanceEffect
   * Triggers the ghost appearance effect.
   * Delegates display to ViewManager if available, otherwise uses a fallback.
   *
   * @param {string} ghostId - Identifier for the ghost effect image.
   */
  triggerGhostAppearanceEffect(ghostId) {
    if (!this.app.isCameraOpen) {
      ErrorManager.logError("Ghost appearance effect not triggered: camera is closed.", "triggerGhostAppearanceEffect");
      return;
    }
    if (this.app.viewManager && typeof this.app.viewManager.showGhostAppearanceEffect === 'function') {
      this.app.viewManager.showGhostAppearanceEffect(ghostId);
    } else {
      try {
        // Fallback: Direct DOM manipulation.
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
      } catch (error) {
        ErrorManager.logError(error, "triggerGhostAppearanceEffect - fallback");
      }
    }
  }

  /**
   * triggerWhisperEffect
   * Triggers the whisper effect by playing a whisper audio for 5 seconds.
   */
  triggerWhisperEffect() {
    this.playAudioWithStop('../../assets/audio/whisper.mp3', 5000);
  }

  /**
   * triggerGhostTextEffect
   * Triggers a ghost text effect by "typing" ghostly text into the target element.
   * Blocks controls during the animation.
   *
   * @param {HTMLElement} targetElem - The target element for text animation.
   * @param {string} text - The ghost text to animate.
   * @param {Function} callback - Callback invoked after animation completes.
   */
  triggerGhostTextEffect(targetElem, text, callback) {
    // Block controls.
    this.setControlsBlocked(true);

    // Play ghost sound.
    const ghostSound = new Audio('../../assets/audio/ghost_effect.mp3');
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
   * triggerUserTextEffect
   * Triggers a user text effect that simulates typing with a moving pencil icon.
   * Blocks controls during the animation.
   *
   * @param {HTMLElement} targetElem - The target element for text animation.
   * @param {string} text - The text to animate.
   * @param {Function} callback - Callback invoked after animation completes.
   */
  triggerUserTextEffect(targetElem, text, callback) {
    // Create a pencil icon.
    const pencilIcon = document.createElement("img");
    pencilIcon.src = "../../assets/images/pencil.png";
    pencilIcon.alt = "Typing...";
    Object.assign(pencilIcon.style, {
      width: "24px",
      height: "24px",
      position: "absolute"
    });

    // Insert the pencil icon into the parent element.
    const parentElem = targetElem.parentElement;
    parentElem.style.position = "relative";
    parentElem.insertBefore(pencilIcon, targetElem);

    // Block controls.
    this.setControlsBlocked(true);

    // Play typing sound.
    const typeSound = new Audio('../../assets/audio/type_sound.mp3');
    typeSound.loop = true;
    typeSound.play();

    const onChar = () => {
      const dummySpan = document.createElement("span");
      dummySpan.innerHTML = "&nbsp;"; // For positioning.
      targetElem.appendChild(dummySpan);

      const rectDummy = dummySpan.getBoundingClientRect();
      const rectParent = parentElem.getBoundingClientRect();
      // Update pencil icon position.
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