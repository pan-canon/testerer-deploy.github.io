import { ErrorManager } from './ErrorManager.js';

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
    // Default effect configuration (can be updated from external config)
    this.effectConfig = {
      userText: { speed: 100 },
      ghostText: { speed: 100 }
    };
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
      // If the character is a newline, insert a <br>
      if (char === "\n") {
        currentHTML += "<br>";
      } else {
        // Check for HTML tags.
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
    this.playAudioWithStop('../../../../assets/audio/phone_ringtone.mp3', 3000);
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
    this.playAudioWithStop('../../../../assets/audio/whisper.mp3', 5000);
  }

  /**
   * triggerGhostTextEffect
   * Triggers a ghost text effect by "typing" ghostly text into the target element.
   * Blocks controls during the animation.
   *
   * @param {HTMLElement} targetElem - The target element for text animation.
   * @param {string} text - The ghost text to animate.
   * @param {Function} callback - Callback invoked after animation completes.
   * @param {Object} [effectConfig] - Optional configuration for the effect (e.g. speed).
   */
  triggerGhostTextEffect(targetElem, text, callback, effectConfig) {
    // Use provided configuration or default ghostText config.
    const config = effectConfig || this.effectConfig.ghostText;

    // Block controls.
    this.setControlsBlocked(true);

    // Play ghost sound.
    const ghostSound = new Audio('../../../../assets/audio/ghost_effect.mp3');
    ghostSound.play();

    this.animateHTMLText(
      targetElem,
      text,
      config.speed,
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
   * @param {Object} [effectConfig] - Optional configuration for the effect (e.g. speed).
   */
  triggerUserTextEffect(targetElem, text, callback, effectConfig) {
    // Use provided configuration or default userText config.
    const config = effectConfig || this.effectConfig.userText;

    // Create a pencil icon.
    const pencilIcon = document.createElement("img");
    pencilIcon.src = "../../../../assets/images/pencil.png";
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
    const typeSound = new Audio('../../../../assets/audio/type_sound.mp3');
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
      config.speed,
      typeSound,
      () => {
        pencilIcon.remove();
        this.setControlsBlocked(false);
        if (callback) callback();
      },
      onChar
    );
  }

  /**
   * slideUpPanel
   * Animates the appearance of a panel by sliding it up from the bottom.
   *
   * @param {HTMLElement} panel - The panel element to animate.
   * @param {number} duration - Animation duration in milliseconds.
   * @param {string} soundPath - Path to the sound to play during the animation.
   */
  slideUpPanel(panel, duration = 1000, soundPath = 'assets/audio/panel_slide.mp3') {
    if (!panel) return;
    // Set initial state: slide the panel out of view (translateY(100%)) and transparent.
    panel.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
    panel.style.transform = "translateY(100%)";
    panel.style.opacity = "0";
    // Force reflow.
    panel.offsetHeight;
    // Play slide-up sound.
    this.playAudioWithStop(soundPath, duration);
    // Animate panel into view.
    panel.style.transform = "translateY(0)";
    panel.style.opacity = "1";
  }

  /**
   * showControlsPanelForUnregistered
   * If the user is not registered (i.e. registrationCompleted flag is not "true"),
   * animates the controls panel by sliding it up from the bottom with sound.
   */
  showControlsPanelForUnregistered() {
    if (StateManager.get("registrationCompleted") !== "true") {
      this.slideUpPanel(this.controlsPanel, 1000, 'assets/audio/panel_slide.mp3');
    }
  }

  /**
   * applyEffectsToNewElements
   * Applies visual effects to newly added DOM elements.
   * Instead of clearing the entire element content, it searches for a child <p> with the
   * "data-animate-on-board" attribute and applies animation only to that element.
   *
   * @param {Array<HTMLElement>} newElements - Array or NodeList of newly added DOM elements.
   */
  applyEffectsToNewElements(newElements) {
    Array.from(newElements).forEach(elem => {
      // If the element itself is not a <p> with animate attribute, try to find one inside.
      let targetElem = elem;
      if (elem.tagName.toLowerCase() !== "p" || !elem.dataset.animateOnBoard) {
        const pChild = elem.querySelector("p[data-animate-on-board='true']");
        if (pChild) {
          targetElem = pChild;
        }
      }
      if (targetElem && targetElem.dataset.animateOnBoard === "true") {
        // Determine effect type: default to "user" if not specified.
        const effectType = targetElem.dataset.animateEffect || "user";
        const text = targetElem.textContent;
        // Clear only the content of the target element (e.g. the <p>), leaving other parts intact.
        targetElem.textContent = "";
        if (effectType === "ghost") {
          this.triggerGhostTextEffect(targetElem, text, () => {
            delete targetElem.dataset.animateOnBoard;
          }, this.effectConfig.ghostText);
        } else {
          this.triggerUserTextEffect(targetElem, text, () => {
            delete targetElem.dataset.animateOnBoard;
          }, this.effectConfig.userText);
        }
      }
    });
  }
}

/**
 * BaseEffect
 *
 * A base class for visual effects.
 * Subclasses should implement the applyEffect method.
 */
export class BaseEffect {
  /**
   * @param {Object} config - Configuration object for the effect.
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * applyEffect
   * Applies the effect to the target element.
   * This method should be overridden in subclasses.
   *
   * @param {HTMLElement} target - The target element.
   * @param {string} text - The text to animate.
   * @param {Function} callback - Callback to call after effect is complete.
   */
  applyEffect(target, text, callback) {
    throw new Error("applyEffect must be implemented by subclass");
  }
}

/**
 * TypewriterEffect
 *
 * An example subclass of BaseEffect that implements a typewriter effect.
 */
export class TypewriterEffect extends BaseEffect {
  /**
   * Applies the typewriter effect to the target element.
   *
   * @param {HTMLElement} target - The target element.
   * @param {string} text - The text to animate.
   * @param {Function} callback - Callback to call after effect is complete.
   */
  applyEffect(target, text, callback) {
    target.innerHTML = "";
    let pos = 0;
    let currentHTML = "";
    const intervalId = setInterval(() => {
      if (pos >= text.length) {
        clearInterval(intervalId);
        if (callback) callback();
        return;
      }
      currentHTML += text[pos];
      target.innerHTML = currentHTML;
      pos++;
    }, this.config.speed);
  }
}