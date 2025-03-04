import { StateManager } from './stateManager.js';
import { ErrorManager } from './errorManager.js';

/**
 * ViewManager
 *
 * Central UI module responsible for:
 * - Switching screens.
 * - Managing button states.
 * - Updating profile display.
 * - Rendering the diary.
 * - Handling UI effects and notifications.
 *
 * All UI updates must be performed exclusively through these methods,
 * ensuring a single source of truth for UI operations.
 */
export class ViewManager {
  constructor() {
    // --- Cache Main UI Elements ---
    this.diaryContainer = document.getElementById("diary");
    this.controlsPanel = document.getElementById("controls-panel");
    
    // --- Registration Form Elements ---
    this.nameInput = document.getElementById('player-name');
    this.genderSelect = document.getElementById('player-gender');
    this.languageSelector = document.getElementById('language-selector');
    this.nextStepBtn = document.getElementById('next-step-btn');
    
    // --- Selfie Screen Elements ---
    // Selfie preview element is assumed to have id "selfie-thumbnail".
    this.selfiePreview = document.getElementById('selfie-thumbnail');
    this.captureBtn = document.getElementById('capture-btn');
    this.completeBtn = document.getElementById('complete-registration');
    
    // --- Profile Display Elements ---
    this.profileNameElem = document.getElementById('profile-name');
    this.profilePhotoElem = document.getElementById('profile-photo');
    
    // --- Import File Input ---
    this.importFileInput = document.getElementById('import-file');
    
    // --- Toggle Buttons and Global Camera ---
    this.toggleCameraBtn = document.getElementById("toggle-camera");
    this.toggleDiaryBtn = document.getElementById("toggle-diary");
    this.globalCamera = document.getElementById("global-camera");
    this.postBtn = document.getElementById("post-btn");
  }

  // ------------------ Event Binding ------------------

  /**
   * bindEvents
   * Binds UI events that were previously placed in App.
   * Also sets up listeners on registration fields to enable the "Next" button
   * when all required fields (name, gender, language) are filled.
   *
   * @param {App} app - The main application instance.
   */
  bindEvents(app) {
    // Function to check registration form validity.
    const checkRegistrationValidity = () => {
      const nameValid = this.nameInput && this.nameInput.value.trim().length > 0;
      const genderValid = this.genderSelect && this.genderSelect.value && this.genderSelect.value !== "";
      const languageValid = this.languageSelector && this.languageSelector.value && this.languageSelector.value !== "";
      // Enable Next button if all fields are valid; otherwise, disable it.
      if (this.nextStepBtn) {
        this.nextStepBtn.disabled = !(nameValid && genderValid && languageValid);
      }
    };

    // Registration fields events.
    if (this.nameInput) {
      this.nameInput.addEventListener('input', () => {
        console.log("Name input changed:", this.nameInput.value);
        checkRegistrationValidity();
      });
    }
    if (this.genderSelect) {
      this.genderSelect.addEventListener('change', () => {
        console.log("Gender select changed:", this.genderSelect.value);
        checkRegistrationValidity();
      });
    }
    if (this.languageSelector) {
      this.languageSelector.addEventListener('change', () => {
        console.log("Language select changed:", this.languageSelector.value);
        checkRegistrationValidity();
      });
    }
    if (this.nextStepBtn) {
      this.nextStepBtn.addEventListener('click', () => {
        app.goToApartmentPlanScreen();
      });
    }
    // Toggle camera/diary view events.
    if (this.toggleCameraBtn) {
      this.toggleCameraBtn.addEventListener("click", () => app.toggleCameraView());
    }
    if (this.toggleDiaryBtn) {
      this.toggleDiaryBtn.addEventListener("click", () => app.toggleCameraView());
    }
    // Additional events for other buttons are handled in their respective managers.
  }

  // ------------------ Registration Form Operations ------------------

  /**
   * getRegistrationData
   * Retrieves registration data from the form.
   * @returns {Object|null} An object with { name, gender, language } or null if elements are missing.
   */
  getRegistrationData() {
    if (!this.nameInput || !this.genderSelect || !this.languageSelector) {
      ErrorManager.logError("Registration form elements not found.", "getRegistrationData");
      return null;
    }
    return {
      name: this.nameInput.value.trim(),
      gender: this.genderSelect.value,
      language: this.languageSelector.value
    };
  }

  // ------------------ Selfie and Profile Operations ------------------

  /**
   * updateSelfiePreview
   * Updates the selfie preview image using a Data URL.
   * @param {string} imageData - Data URL of the processed selfie.
   */
  updateSelfiePreview(imageData) {
    if (this.selfiePreview) {
      this.selfiePreview.src = imageData;
      this.selfiePreview.style.display = 'block';
    } else {
      ErrorManager.logError("Selfie preview element not found.", "updateSelfiePreview");
    }
  }

  /**
   * enableCompleteButton
   * Enables the "Complete Registration" button.
   */
  enableCompleteButton() {
    if (this.completeBtn) {
      this.completeBtn.disabled = false;
    }
  }

  /**
   * disableCompleteButton
   * Disables the "Complete Registration" button.
   */
  disableCompleteButton() {
    if (this.completeBtn) {
      this.completeBtn.disabled = true;
    }
  }

  /**
   * getSelfieSource
   * Returns the current selfie source (Data URL).
   * @returns {string} The Data URL from the selfie preview.
   */
  getSelfieSource() {
    return this.selfiePreview ? this.selfiePreview.src : "";
  }

  // ------------------ File Import Operations ------------------

  /**
   * getImportFile
   * Returns the selected file from the import input.
   * @returns {File|null} The selected file, or null if none selected.
   */
  getImportFile() {
    if (this.importFileInput && this.importFileInput.files.length > 0) {
      return this.importFileInput.files[0];
    }
    return null;
  }

  // ------------------ Toggle Buttons and Camera Views ------------------

  /**
   * showToggleCameraButton
   * Displays the toggle-camera button.
   */
  showToggleCameraButton() {
    if (this.toggleCameraBtn) {
      this.toggleCameraBtn.style.display = 'inline-block';
    }
  }

  /**
   * showPostButton
   * Displays the "Post" button.
   */
  showPostButton() {
    if (this.postBtn) {
      this.postBtn.style.display = 'inline-block';
    }
  }

  /**
   * showDiaryView
   * Displays the diary view and hides the global camera.
   */
  showDiaryView() {
    const diary = document.getElementById("diary");
    if (diary && this.globalCamera) {
      diary.style.display = "block";
      this.globalCamera.style.display = "none";
      if (this.toggleCameraBtn) this.toggleCameraBtn.style.display = 'inline-block';
      if (this.toggleDiaryBtn) this.toggleDiaryBtn.style.display = 'none';
    }
  }

  /**
   * showCameraView
   * Displays the camera view and hides the diary.
   */
  showCameraView() {
    const diary = document.getElementById("diary");
    if (diary && this.globalCamera) {
      diary.style.display = "none";
      this.globalCamera.style.display = "flex";
      if (this.toggleCameraBtn) this.toggleCameraBtn.style.display = 'none';
      if (this.toggleDiaryBtn) this.toggleDiaryBtn.style.display = 'inline-block';
    }
  }

  // ------------------ Profile Display Operations ------------------

  /**
   * updateProfileDisplay
   * Updates the profile display with provided data.
   * @param {Object} profile - An object containing at least { name, selfie }.
   */
  updateProfileDisplay(profile) {
    if (this.profileNameElem) {
      this.profileNameElem.textContent = profile.name;
    }
    if (this.profilePhotoElem) {
      this.profilePhotoElem.src = profile.selfie;
      this.profilePhotoElem.style.display = 'block';
    }
  }

  // ------------------ Diary Rendering Operations ------------------

  /**
   * renderDiary
   * Renders the diary entries into the diary container.
   * @param {Array} entries - Array of diary entry objects.
   * @param {string} currentLanguage - Current language code.
   * @param {Object} effectsManager - Reference to the VisualEffectsManager.
   */
  renderDiary(entries, currentLanguage, effectsManager) {
    if (!this.diaryContainer) {
      ErrorManager.logError("Diary container not found!", "renderDiary");
      return;
    }
    this.diaryContainer.innerHTML = "";
    const animatedIds = JSON.parse(StateManager.get("animatedDiaryIds") || "[]");
    const seen = new Set();
    
    entries.forEach(entryObj => {
      if (seen.has(entryObj.id)) return;
      seen.add(entryObj.id);
      
      const articleElem = document.createElement("article");
      articleElem.classList.add(entryObj.postClass);
      
      let mainText = entryObj.entry;
      let imageData = null;
      if (entryObj.entry.includes("[photo attached]")) {
        const parts = entryObj.entry.split("[photo attached]");
        mainText = parts[0].trim();
        if (parts.length >= 2) {
          imageData = parts[1].trim();
          if (!/^data:/.test(imageData)) {
            imageData = "data:image/png;base64," + imageData;
          }
        }
      }
      
      const localizedText = window.localization &&
                            window.localization[currentLanguage] &&
                            window.localization[currentLanguage][mainText]
                            ? window.localization[currentLanguage][mainText]
                            : mainText;
      
      const cleanedText = localizedText.replace(/^user_post_success:\s*/, '').replace(/^user_post_failed:\s*/, '');
      const formattedTimestamp = entryObj.timestamp.replace(/\.\d+Z$/, '');
      const fullText = `${cleanedText} (${formattedTimestamp})`;
      
      const textContainer = document.createElement("p");
      if (imageData) {
        const img = document.createElement("img");
        img.src = imageData;
        img.alt = (window.localization &&
                   window.localization[currentLanguage] &&
                   window.localization[currentLanguage]["photo_attached"]) || "Photo attached";
        img.style.maxWidth = "100%";
        articleElem.appendChild(img);
      }
      articleElem.appendChild(textContainer);
      
      let messageText = fullText;
      const dateMatch = fullText.match(/(\(\d{4}-\d{2}-\d{2}.*\))$/);
      if (dateMatch) {
        const dateText = dateMatch[1].trim();
        messageText = fullText.replace(dateText, "").trim() + "<br>" + dateText;
      }
      
      const isAlreadyAnimated = animatedIds.includes(entryObj.id);
      if (isAlreadyAnimated) {
        textContainer.innerHTML = messageText;
      } else {
        const animatedSpan = document.createElement("span");
        textContainer.innerHTML = "";
        textContainer.appendChild(animatedSpan);
        
        if (entryObj.postClass === "ghost-post") {
          effectsManager.triggerGhostTextEffect(animatedSpan, messageText);
        } else {
          effectsManager.triggerUserTextEffect(animatedSpan, messageText);
        }
        
        animatedIds.push(entryObj.id);
      }
      
      this.diaryContainer.appendChild(articleElem);
    });
    
    StateManager.set("animatedDiaryIds", JSON.stringify(animatedIds));
    console.log("Diary updated.");
  }

  // ------------------ Screen Switching ------------------

  /**
   * switchScreen
   * Switches between different application screens and updates button groups.
   * @param {string} screenId - ID of the target screen.
   * @param {string} buttonsGroupId - ID of the buttons group to display.
   */
  switchScreen(screenId, buttonsGroupId) {
    document.querySelectorAll('section').forEach(section => {
      section.style.display = 'none';
    });
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.style.display = 'block';
    }
    document.querySelectorAll('#controls-panel > .buttons').forEach(group => {
      group.style.display = 'none';
      group.style.pointerEvents = 'none';
    });
    if (buttonsGroupId) {
      const targetGroup = document.getElementById(buttonsGroupId);
      if (targetGroup) {
        targetGroup.style.display = 'flex';
        targetGroup.style.pointerEvents = 'auto';
      }
    }
  }

  // ------------------ Button State Management ------------------

  /**
   * setPostButtonEnabled
   * Enables or disables the "Post" button.
   * @param {boolean} isEnabled - True to enable, false to disable.
   */
  setPostButtonEnabled(isEnabled) {
    const postBtn = document.getElementById("post-btn");
    if (postBtn) {
      postBtn.disabled = !isEnabled;
    }
  }

  /**
   * setCameraButtonHighlight
   * Adds or removes a highlight effect on the camera toggle button.
   * @param {boolean} isActive - True to add highlight, false to remove.
   */
  setCameraButtonHighlight(isActive) {
    const cameraBtn = document.getElementById("toggle-camera");
    if (cameraBtn) {
      if (isActive) {
        cameraBtn.classList.add("glowing");
      } else {
        cameraBtn.classList.remove("glowing");
      }
    }
  }

  /**
   * setCameraButtonActive
   * Sets the active state for the "Open Camera" button.
   * Also saves the state using StateManager.
   * @param {boolean} isActive - True to mark as active, false to remove.
   */
  setCameraButtonActive(isActive) {
    const cameraBtn = document.getElementById("toggle-camera");
    if (cameraBtn) {
      if (isActive) {
        cameraBtn.classList.add("active");
      } else {
        cameraBtn.classList.remove("active");
      }
      StateManager.set("cameraButtonActive", JSON.stringify(isActive));
    }
  }

  /**
   * restoreCameraButtonState
   * Restores the "Open Camera" button state from StateManager.
   */
  restoreCameraButtonState() {
    const stored = StateManager.get("cameraButtonActive");
    const isActive = stored ? JSON.parse(stored) : false;
    this.setCameraButtonActive(isActive);
  }

  /**
   * setShootButtonActive
   * Sets the active state for the "Shoot" button.
   * Enables/disables the button and saves the state using StateManager.
   * @param {boolean} isActive - True to enable, false to disable.
   */
  setShootButtonActive(isActive) {
    const shootBtn = document.getElementById("btn_shoot");
    if (shootBtn) {
      shootBtn.disabled = !isActive;
      if (isActive) {
        shootBtn.classList.add("active");
      } else {
        shootBtn.classList.remove("active");
      }
      StateManager.set("shootButtonActive", JSON.stringify(isActive));
    } else {
      ErrorManager.logError("Shoot button not found.", "setShootButtonActive");
    }
  }

  /**
   * restoreShootButtonState
   * Restores the "Shoot" button state from StateManager.
   */
  restoreShootButtonState() {
    const stored = StateManager.get("shootButtonActive");
    const isActive = stored ? JSON.parse(stored) : false;
    this.setShootButtonActive(isActive);
  }

  // ------------------ Mirror Quest UI ------------------

  /**
   * startMirrorQuestUI
   * Initializes the UI for the mirror quest.
   * @param {Object} options - Contains:
   *   - statusElementId: ID of the status display element.
   *   - shootButtonId: ID of the "Shoot" button.
   *   - onShoot: Callback executed when the "Shoot" button is clicked.
   */
  startMirrorQuestUI(options) {
    const statusElem = document.getElementById(options.statusElementId);
    if (statusElem) {
      statusElem.style.display = "block";
      statusElem.textContent = "No match...";
    }
    const shootBtn = document.getElementById(options.shootButtonId);
    if (shootBtn) {
      shootBtn.style.display = "inline-block";
      this.setShootButtonActive(true);
      shootBtn.style.pointerEvents = "auto";
      shootBtn.onclick = null;
      shootBtn.onclick = () => {
        this.setShootButtonActive(false);
        if (typeof options.onShoot === 'function') {
          options.onShoot();
        }
      };
    } else {
      ErrorManager.logError("Shoot button not found in the DOM.", "startMirrorQuestUI");
    }
  }

  /**
   * updateMirrorQuestStatus
   * Updates the mirror quest status UI.
   * @param {boolean} success - True if the mirror match was successful.
   * @param {string} statusElementId - ID of the status display element.
   * @param {string} shootButtonId - ID of the "Shoot" button.
   */
  updateMirrorQuestStatus(success, statusElementId, shootButtonId) {
    const statusElem = document.getElementById(statusElementId);
    if (statusElem) {
      statusElem.textContent = success ? "You are in front of the mirror!" : "No match...";
    }
    const shootBtn = document.getElementById(shootButtonId);
    if (shootBtn) {
      shootBtn.disabled = !success;
    }
  }

  /**
   * stopMirrorQuestUI
   * Hides the mirror quest UI elements.
   * @param {string} statusElementId - ID of the status display element.
   */
  stopMirrorQuestUI(statusElementId) {
    const statusElem = document.getElementById(statusElementId);
    if (statusElem) {
      statusElem.style.display = "none";
    }
  }

  // ------------------ Repeating Quest UI ------------------

  /**
   * startRepeatingQuestUI
   * Initializes the UI for a repeating quest stage.
   * @param {Object} options - Contains:
   *   - statusElementId: ID of the status display element.
   *   - shootButtonId: ID of the "Shoot" button.
   *   - stage: Current stage number.
   *   - totalStages: Total number of stages.
   *   - onShoot: Callback executed when the "Shoot" button is clicked.
   */
  startRepeatingQuestUI(options) {
    const statusElem = document.getElementById(options.statusElementId);
    if (statusElem) {
      statusElem.style.display = "block";
      statusElem.textContent = `Repeating quest – Stage ${options.stage} of ${options.totalStages}`;
    }
    const shootBtn = document.getElementById(options.shootButtonId);
    if (shootBtn) {
      shootBtn.style.display = "inline-block";
      this.setShootButtonActive(true);
      shootBtn.style.pointerEvents = "auto";
      shootBtn.onclick = null;
      shootBtn.onclick = () => {
        this.setShootButtonActive(false);
        if (typeof options.onShoot === 'function') {
          options.onShoot();
        }
      };
    } else {
      ErrorManager.logError("Shoot button not found in the DOM.", "startRepeatingQuestUI");
    }
  }

  /**
   * disableShootButton
   * Disables the "Shoot" button.
   * @param {string} shootButtonId - ID of the "Shoot" button.
   */
  disableShootButton(shootButtonId) {
    const shootBtn = document.getElementById(shootButtonId);
    if (shootBtn) {
      shootBtn.disabled = true;
      shootBtn.style.pointerEvents = "none";
    }
  }

  /**
   * stopRepeatingQuestUI
   * Hides the repeating quest UI.
   * @param {string} statusElementId - ID of the status display element.
   */
  stopRepeatingQuestUI(statusElementId) {
    const statusElem = document.getElementById(statusElementId);
    if (statusElem) {
      statusElem.style.display = "none";
    }
  }

  // ------------------ Visual Effects and Notifications ------------------

  /**
   * applyBackgroundTransition
   * Applies a background transition effect to the document body.
   * @param {string} color - The target background color.
   * @param {number} duration - Duration of the transition in milliseconds.
   */
  applyBackgroundTransition(color, duration) {
    document.body.style.transition = `background ${duration}ms`;
    document.body.style.background = color;
    setTimeout(() => {
      document.body.style.background = "";
    }, duration);
  }

  /**
   * showGhostAppearanceEffect
   * Displays a ghost appearance effect.
   * @param {string} ghostId - Identifier for the ghost effect image.
   */
  showGhostAppearanceEffect(ghostId) {
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
   * showNotification
   * Displays a notification message to the user using a simple toast.
   * @param {string} message - The notification message.
   */
  showNotification(message) {
    const notification = document.createElement("div");
    notification.textContent = message;
    Object.assign(notification.style, {
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: "rgba(0,0,0,0.8)",
      color: "white",
      padding: "10px 20px",
      borderRadius: "5px",
      zIndex: 10000,
      opacity: "0",
      transition: "opacity 0.5s"
    });
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.opacity = "1";
    }, 100);
    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 3000);
  }

  // ------------------ Miscellaneous ------------------

  /**
   * setControlsBlocked
   * Blocks or unblocks user interaction with the controls panel.
   * @param {boolean} shouldBlock - True to block, false to unblock.
   */
  setControlsBlocked(shouldBlock) {
    if (this.controlsPanel) {
      this.controlsPanel.style.pointerEvents = shouldBlock ? "none" : "auto";
    }
  }

  /**
   * clearCache
   * Sends a message to the Service Worker to clear all caches.
   */
  clearCache() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ action: 'CLEAR_CACHE' });
      console.log("Clear cache message sent to Service Worker.");
    } else {
      console.warn("No active Service Worker controller found.");
    }
  }
}