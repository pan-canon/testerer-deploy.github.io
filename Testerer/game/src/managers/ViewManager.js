import { StateManager } from './StateManager.js';
import { ErrorManager } from './ErrorManager.js';

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
 *
 * NOTE: Sequential linking of events and quests is handled by GhostManager.
 *       This module also persists button states to StateManager.
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
    this.saveButtonStates = this.saveButtonStates.bind(this);
    this.restoreButtonStates = this.restoreButtonStates.bind(this);

    // --- Additional Control Buttons ---
    this.resetDataBtn = document.getElementById("reset-data");
    this.exportProfileBtn = document.getElementById("export-profile-btn");
    this.updateBtn = document.getElementById("update-btn");

    // --- Camera Manager Reference (to be set externally) ---
    this.cameraManager = null;

    // By default, disable the "Post" button after registration.
    if (this.postBtn) {
      this.postBtn.disabled = true;
      // Persist state: post button is initially disabled.
      StateManager.set("postButtonDisabled", "true");
      console.log("[ViewManager] Post button disabled on initialization.");
    }
  }

  /**
   * setCameraManager
   * Sets the camera manager instance (e.g., an instance of cameraSectionManager)
   * to allow unified access to camera methods.
   */
  setCameraManager(cameraManager) {
    this.cameraManager = cameraManager;
    console.log("[ViewManager] Camera manager set.");
  }

  /**
   * startCameraWithOptions
   * Wrapper method to start the camera with given options.
   */
  startCameraWithOptions(options = {}) {
    if (this.cameraManager) {
      this.cameraManager.attachTo("global-camera", options);
      this.cameraManager.startCamera();
      console.log("[ViewManager] Camera started with options:", options);
    } else {
      ErrorManager.logError("Camera Manager is not set.", "startCameraWithOptions");
    }
  }

  /**
   * stopCamera
   * Wrapper method to stop the camera via the camera manager.
   */
  stopCamera() {
    if (this.cameraManager) {
      this.cameraManager.stopCamera();
      console.log("[ViewManager] Camera stopped.");
    } else {
      ErrorManager.logError("Camera Manager is not set.", "stopCamera");
    }
  }

  /**
   * hidePostButton
   * Hides the "Post" button by setting its display style to 'none'.
   */
  hidePostButton() {
    if (this.postBtn) {
      this.postBtn.style.display = 'none';
      console.log("[ViewManager] Post button hidden.");
    }
  }

  // ------------------ Event Binding ------------------

  bindEvents(app) {
    const checkRegistrationValidity = () => {
      const nameValid = this.nameInput && this.nameInput.value.trim().length > 0;
      const genderValid = this.genderSelect && this.genderSelect.value && this.genderSelect.value !== "";
      const languageValid = this.languageSelector && this.languageSelector.value && this.languageSelector.value !== "";
      if (this.nextStepBtn) {
        this.nextStepBtn.disabled = !(nameValid && genderValid && languageValid);
      }
    };

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
        console.log("[ViewManager] Next step button clicked.");
      });
    }
    if (this.captureBtn) {
      this.captureBtn.addEventListener("click", () => {
        console.log("Capture button clicked. Triggering captureSelfie().");
        app.captureSelfie();
      });
    }
    if (this.completeBtn) {
      this.completeBtn.addEventListener("click", () => {
        console.log("Complete Registration button clicked. Triggering completeRegistration().");
        app.completeRegistration();
      });
    }
    // IMPORTANT: "Post" button click calls GhostManager.handlePostButtonClick()
    if (this.postBtn) {
      this.postBtn.addEventListener("click", () => {
        console.log("Post button clicked. Triggering GhostManager.handlePostButtonClick().");
        app.ghostManager.handlePostButtonClick();
      });
    }
    if (this.resetDataBtn) {
      this.resetDataBtn.addEventListener("click", () => {
        console.log("Reset Data button clicked.");
        app.profileManager.resetProfile();
      });
    }
    if (this.exportProfileBtn) {
      this.exportProfileBtn.addEventListener("click", () => {
        console.log("Export Profile button clicked.");
        app.exportProfile();
      });
    }
    if (this.updateBtn) {
      this.updateBtn.addEventListener("click", () => {
        console.log("Update button clicked.");
        this.clearCache();
      });
    }
    if (this.toggleCameraBtn) {
      this.toggleCameraBtn.addEventListener("click", () => app.toggleCameraView());
    }
    if (this.toggleDiaryBtn) {
      this.toggleDiaryBtn.addEventListener("click", () => app.toggleCameraView());
    }
  }

  // ------------------ Registration Form Operations ------------------

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

  updateSelfiePreview(imageData) {
    if (this.selfiePreview) {
      this.selfiePreview.src = imageData;
      this.selfiePreview.style.display = 'block';
      console.log("[ViewManager] Selfie preview updated.");
    } else {
      ErrorManager.logError("Selfie preview element not found.", "updateSelfiePreview");
    }
  }

  enableCompleteButton() {
    if (this.completeBtn) {
      this.completeBtn.disabled = false;
      console.log("[ViewManager] Complete button enabled.");
    }
  }

  disableCompleteButton() {
    if (this.completeBtn) {
      this.completeBtn.disabled = true;
      console.log("[ViewManager] Complete button disabled.");
    }
  }

  getSelfieSource() {
    return this.selfiePreview ? this.selfiePreview.src : "";
  }

  getImportFile() {
    if (this.importFileInput && this.importFileInput.files.length > 0) {
      return this.importFileInput.files[0];
    }
    return null;
  }

  // ------------------ Toggle Buttons and Camera Views ------------------

  showToggleCameraButton() {
    if (this.toggleCameraBtn) {
      this.toggleCameraBtn.style.display = 'inline-block';
      console.log("[ViewManager] Toggle Camera button shown.");
    }
  }

  showPostButton() {
    if (this.postBtn) {
      this.postBtn.style.display = 'inline-block';
      console.log("[ViewManager] Post button shown.");
    }
  }

  hidePostButton() {
    if (this.postBtn) {
      this.postBtn.style.display = 'none';
      console.log("[ViewManager] Post button hidden.");
    }
  }

  showDiaryView() {
    const diary = document.getElementById("diary");
    if (diary && this.globalCamera) {
      this.saveButtonStates();
      diary.style.display = "block";
      this.globalCamera.style.display = "none";
      if (this.toggleCameraBtn) this.toggleCameraBtn.style.display = 'inline-block';
      if (this.toggleDiaryBtn) {
        this.toggleDiaryBtn.style.display = "none";
      }
      const shootBtn = document.getElementById("btn_shoot");
      if (shootBtn) {
        shootBtn.style.display = "none";
      }
      this.showPostButton();
      console.log("[ViewManager] Switched to diary view.");
      this.restoreButtonStates();
    }
  }

  saveButtonStates() {
    StateManager.set("postButtonEnabled", this.postBtn && !this.postBtn.disabled);
    StateManager.set("shootButtonEnabled", this.shootBtn && !this.shootBtn.disabled);
    StateManager.set("cameraButtonActive", this.toggleCameraBtn && this.toggleCameraBtn.classList.contains("active"));
    StateManager.set("diaryButtonActive", this.toggleDiaryBtn && this.toggleDiaryBtn.classList.contains("active"));
    console.log("[ViewManager] Button states saved.");
  }

  restoreButtonStates() {
    const postEnabled = StateManager.get("postButtonEnabled") === "true";
    const shootEnabled = StateManager.get("shootButtonEnabled") === "true";
    const cameraActive = StateManager.get("cameraButtonActive") === "true";
    const diaryActive = StateManager.get("diaryButtonActive") === "true";

    if (this.postBtn) this.postBtn.disabled = !postEnabled;
    if (this.shootBtn) this.shootBtn.disabled = !shootEnabled;
    if (this.toggleCameraBtn) {
      if (cameraActive) this.toggleCameraBtn.classList.add("active");
      else this.toggleCameraBtn.classList.remove("active");
    }
    if (this.toggleDiaryBtn) {
      if (diaryActive) this.toggleDiaryBtn.classList.add("active");
      else this.toggleDiaryBtn.classList.remove("active");
    }
    console.log("[ViewManager] Button states restored.");
  }

  showCameraView() {
    const diary = document.getElementById("diary");
    if (diary && this.globalCamera) {
      this.saveButtonStates();
      diary.style.display = "none";
      this.globalCamera.style.display = "flex";
      if (this.toggleCameraBtn) this.toggleCameraBtn.style.display = 'none';
      if (this.toggleDiaryBtn) this.toggleDiaryBtn.style.display = 'inline-block';
      this.hidePostButton();
      const shootBtn = document.getElementById("btn_shoot");
      if (shootBtn) {
        shootBtn.style.display = "inline-block";
        shootBtn.disabled = true;
        shootBtn.style.pointerEvents = "none";
      }
      console.log("[ViewManager] Switched to camera view.");
      this.restoreButtonStates();
    }
  }

  showGlobalCamera() {
    if (this.globalCamera) {
      this.globalCamera.style.display = 'block';
      console.log("[ViewManager] Global camera displayed.");
    } else {
      ErrorManager.logError("Global camera element not found.", "showGlobalCamera");
    }
  }

  hideGlobalCamera() {
    if (this.globalCamera) {
      this.globalCamera.style.display = 'none';
      console.log("[ViewManager] Global camera hidden.");
    } else {
      ErrorManager.logError("Global camera element not found.", "hideGlobalCamera");
    }
  }

  // ------------------ Profile Display Operations ------------------

  updateProfileDisplay(profile) {
    if (this.profileNameElem) {
      this.profileNameElem.textContent = profile.name;
    }
    if (this.profilePhotoElem) {
      this.profilePhotoElem.src = profile.selfie;
      this.profilePhotoElem.style.display = 'block';
    }
    console.log("[ViewManager] Profile display updated.");
  }

  // ------------------ Diary Rendering Operations ------------------

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
    console.log("[ViewManager] Diary updated.");
  }

  // ------------------ Screen Switching ------------------

  switchScreen(screenId, buttonsGroupId) {
    document.querySelectorAll('section').forEach(section => {
      section.style.display = 'none';
    });
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.style.display = 'block';
      console.log(`[ViewManager] Switched to screen: ${screenId}`);
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
        if (screenId === "main-screen") {
          const td = targetGroup.querySelector("#toggle-diary");
          if (td) {
            td.style.display = "none";
          }
          const shootBtn = targetGroup.querySelector("#btn_shoot");
          if (shootBtn) {
            shootBtn.style.display = "none";
          }
        }
        console.log(`[ViewManager] Controls panel updated for group: ${buttonsGroupId}`);
      }
    }
  }

  // ------------------ Button State Management ------------------

  /**
   * setPostButtonEnabled
   * Enables or disables the "Post" button.
   *
   * This method updates the UI and persists the new state in StateManager.
   * It takes into account flags such as gameFinalized and postButtonDisabled.
   *
   * @param {boolean} isEnabled - If true, the button should be enabled.
   */
  setPostButtonEnabled(isEnabled) {
    const postBtn = document.getElementById("post-btn");
    if (postBtn) {
      const gameFinalized = StateManager.get("gameFinalized") === "true";
      if (gameFinalized) {
        postBtn.disabled = true;
        StateManager.set("postButtonDisabled", "true");
        console.log("[ViewManager] Game finalized. Post button disabled.");
      } else {
        postBtn.disabled = !isEnabled;
        // Persist the new state: if isEnabled is true, then postButtonDisabled is "false".
        StateManager.set("postButtonDisabled", isEnabled ? "false" : "true");
        console.log(`[ViewManager] Post button set to ${isEnabled ? "enabled" : "disabled"}.`);
      }
    }
  }

  setCameraButtonHighlight(isActive) {
    const cameraBtn = document.getElementById("toggle-camera");
    if (cameraBtn) {
      if (isActive) {
        cameraBtn.classList.add("glowing");
      } else {
        cameraBtn.classList.remove("glowing");
      }
      console.log(`[ViewManager] Camera button highlight ${isActive ? "added" : "removed"}.`);
    }
  }

  setCameraButtonActive(isActive) {
    const cameraBtn = document.getElementById("toggle-camera");
    if (cameraBtn) {
      if (isActive) {
        cameraBtn.classList.add("active");
      } else {
        cameraBtn.classList.remove("active");
      }
      StateManager.set("cameraButtonActive", JSON.stringify(isActive));
      console.log(`[ViewManager] Camera button active state set to ${isActive}.`);
    }
  }

  restoreCameraButtonState() {
    const stored = StateManager.get("cameraButtonActive");
    const isActive = stored ? JSON.parse(stored) : false;
    this.setCameraButtonActive(isActive);
    console.log("[ViewManager] Camera button state restored:", isActive);
  }

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
      console.log(`[ViewManager] Shoot button active state set to ${isActive}.`);
    } else {
      ErrorManager.logError("Shoot button not found.", "setShootButtonActive");
    }
  }

  restoreShootButtonState() {
    const stored = StateManager.get("shootButtonActive");
    const isActive = stored ? JSON.parse(stored) : false;
    this.setShootButtonActive(isActive);
    console.log("[ViewManager] Shoot button state restored:", isActive);
  }

  // ------------------ Apartment Plan UI ------------------

  setApartmentPlanNextButtonEnabled(isEnabled) {
    const nextBtn = document.getElementById("apartment-plan-next-btn");
    if (nextBtn) {
      nextBtn.disabled = !isEnabled;
      console.log(`Apartment Plan Next button is now ${isEnabled ? "enabled" : "disabled"}.`);
    } else {
      ErrorManager.logError("Apartment plan Next button not found.", "setApartmentPlanNextButtonEnabled");
    }
  }

  // ------------------ Mirror Quest UI ------------------

  startMirrorQuestUI(options) {
    const statusElem = document.getElementById(options.statusElementId);
    if (statusElem) {
      statusElem.style.display = "block";
      statusElem.textContent = "No match...";
      console.log("[ViewManager] Mirror quest UI started, status set to 'No match...'");
    }
    const shootBtn = document.getElementById(options.shootButtonId);
    if (shootBtn) {
      shootBtn.style.display = "inline-block";
      const initialActive = (typeof options.initialActive !== 'undefined') ? options.initialActive : false;
      this.setShootButtonActive(initialActive);
      shootBtn.style.pointerEvents = initialActive ? "auto" : "none";
      shootBtn.onclick = null;
      shootBtn.onclick = () => {
        this.setShootButtonActive(false);
        if (typeof options.onShoot === 'function') {
          options.onShoot();
        }
      };
      console.log("[ViewManager] Shoot button for mirror quest initialized.");
    } else {
      ErrorManager.logError("Shoot button not found in the DOM.", "startMirrorQuestUI");
    }
  }

  updateMirrorQuestStatus(success, statusElementId, shootButtonId) {
    const statusElem = document.getElementById(statusElementId);
    if (statusElem) {
      statusElem.textContent = success ? "You are in front of the mirror!" : "No match...";
    }
    const shootBtn = document.getElementById(shootButtonId);
    if (shootBtn) {
      shootBtn.disabled = !success;
      shootBtn.style.pointerEvents = success ? "auto" : "none";
    }
    console.log(`[ViewManager] Mirror quest status updated. Success: ${success}`);
  }

  // CHANGED: Stopping Mirror UI now resets camera and shoot button states.
  stopMirrorQuestUI(statusElementId) {
    const statusElem = document.getElementById(statusElementId);
    if (statusElem) {
      statusElem.style.display = "none";
    }
    // Reset camera and shoot button states.
    this.setCameraButtonActive(false);
    this.setShootButtonActive(false);
    console.log("[ViewManager] Mirror quest UI stopped.");
  }

  // ------------------ Repeating Quest UI ------------------
  /**
   * startRepeatingQuestUI
   * Initializes the UI for a repeating quest stage.
   * It displays the status, enables the "Shoot" button, and attaches an onClick handler.
   * The onClick handler first checks if the quest (passed via options.quest) is finished.
   * If not finished, it disables the Shoot button and calls the provided onShoot callback.
   *
   * @param {object} options - Options including:
   *   - statusElementId: the ID of the status element.
   *   - shootButtonId: the ID of the Shoot button.
   *   - stage: current stage number.
   *   - totalStages: total number of stages.
   *   - onShoot: callback to be executed when Shoot is pressed.
   *   - quest: the current repeating quest instance (for checking its finished flag).
   */
  startRepeatingQuestUI(options) {
    const statusElem = document.getElementById(options.statusElementId);
    if (statusElem) {
      statusElem.style.display = "block";
      statusElem.textContent = `Repeating quest – Stage ${options.stage} of ${options.totalStages}`;
      console.log(`[ViewManager] Repeating quest UI started: Stage ${options.stage} of ${options.totalStages}`);
    }
    const shootBtn = document.getElementById(options.shootButtonId);
    if (shootBtn) {
      shootBtn.style.display = "inline-block";
      this.setShootButtonActive(true);
      shootBtn.style.pointerEvents = "auto";
      shootBtn.onclick = null;
      shootBtn.onclick = () => {
        // Extra check: if the quest is finished, ignore the click.
        if (options.quest && options.quest.finished) {
          console.log("[ViewManager] Quest is finished; Shoot button click ignored.");
          return;
        }
        // Disable the Shoot button immediately.
        this.setShootButtonActive(false);
        if (typeof options.onShoot === "function") {
          options.onShoot();
        }
      };
      console.log("[ViewManager] Shoot button for repeating quest initialized.");
    } else {
      ErrorManager.logError("Shoot button not found in the DOM.", "startRepeatingQuestUI");
    }
  }

  disableShootButton(shootButtonId) {
    const shootBtn = document.getElementById(shootButtonId);
    if (shootBtn) {
      shootBtn.disabled = true;
      shootBtn.style.pointerEvents = "none";
      console.log("[ViewManager] Shoot button disabled.");
    }
  }

  // CHANGED: Stopping Repeating UI now resets camera and shoot button states.
  stopRepeatingQuestUI(statusElementId) {
    const statusElem = document.getElementById(statusElementId);
    if (statusElem) {
      statusElem.style.display = "none";
    }
    // Reset camera and shoot button states.
    this.setCameraButtonActive(false);
    this.setShootButtonActive(false);
    console.log("[ViewManager] Repeating quest UI stopped.");
  }

  // ADDED: Convenient method for mass UI update after quest stage completion.
  /**
   * updateUIAfterQuestStage
   * Allows simultaneous updating of "Post", "Open Camera", "Shoot", etc.
   * Example usage:
   *    this.app.viewManager.updateUIAfterQuestStage({
   *      postEnabled: true,
   *      cameraActive: false,
   *      shootActive: false
   *    });
   */
  updateUIAfterQuestStage({ postEnabled, cameraActive, shootActive }) {
    if (typeof postEnabled === 'boolean') {
      this.setPostButtonEnabled(postEnabled);
    }
    if (typeof cameraActive === 'boolean') {
      this.setCameraButtonActive(cameraActive);
    }
    if (typeof shootActive === 'boolean') {
      this.setShootButtonActive(shootActive);
    }
    console.log("[ViewManager] UI updated after quest stage:", { postEnabled, cameraActive, shootActive });
  }

  // ------------------ Visual Effects and Notifications ------------------

  applyBackgroundTransition(color, duration) {
    document.body.style.transition = `background ${duration}ms`;
    document.body.style.background = color;
    setTimeout(() => {
      document.body.style.background = "";
    }, duration);
    console.log(`[ViewManager] Applied background transition with color ${color} for ${duration}ms.`);
  }

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
    console.log(`[ViewManager] Ghost appearance effect triggered for ghost ${ghostId}.`);
  }

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
    console.log("[ViewManager] Notification shown:", message);
  }

  // ------------------ Miscellaneous ------------------

  setControlsBlocked(shouldBlock) {
    if (this.controlsPanel) {
      this.controlsPanel.style.pointerEvents = shouldBlock ? "none" : "auto";
      console.log(`[ViewManager] Controls ${shouldBlock ? "blocked" : "unblocked"}.`);
    }
  }

  clearCache() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ action: 'CLEAR_CACHE' });
      console.log("Clear cache message sent to Service Worker.");
    } else {
      console.warn("No active Service Worker controller found.");
    }
  }
}