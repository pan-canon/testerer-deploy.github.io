// ViewManager.js
import { StateManager } from './StateManager.js';
import { ErrorManager } from './ErrorManager.js';
import { ImageUtils } from '../utils/ImageUtils.js';
import { ApartmentPlanManager } from './ApartmentPlanManager.js'; // Import from the managers folder

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
 * All UI updates and DOM manipulations are centralized here.
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

    // --- Additional Control Buttons ---
    this.resetDataBtn = document.getElementById("reset-data");
    this.exportProfileBtn = document.getElementById("export-profile-btn");
    this.updateBtn = document.getElementById("update-btn");

    // --- Chat Button Container ---
    // Chat container is assumed to be always visible.
    
    // --- Camera Manager Reference (set externally) ---
    this.cameraManager = null;

    // Disable "Post" button by default.
    if (this.postBtn) {
      this.postBtn.disabled = true;
      StateManager.set("postButtonDisabled", "true");
      console.log("[ViewManager] Post button disabled on initialization.");
    }
  }

  /**
   * setCameraManager
   * Sets the camera manager instance.
   */
  setCameraManager(cameraManager) {
    this.cameraManager = cameraManager;
    console.log("[ViewManager] Camera manager set.");
  }

  /**
   * bindEvents
   * Binds event listeners for UI elements.
   *
   * @param {App} app - The main application instance.
   */
  bindEvents(app) {
    const checkRegistrationValidity = () => {
      const nameValid = this.nameInput && this.nameInput.value.trim().length > 0;
      const genderValid = this.genderSelect && this.genderSelect.value !== "";
      const languageValid = this.languageSelector && this.languageSelector.value !== "";
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
        this.goToApartmentPlanScreen(app);
        console.log("[ViewManager] Next step button clicked.");
      });
    }
    if (this.captureBtn) {
      this.captureBtn.addEventListener("click", () => {
        console.log("Capture button clicked. Triggering captureSelfie().");
        this.captureSelfie(app);
      });
    }
    if (this.completeBtn) {
      this.completeBtn.addEventListener("click", () => {
        console.log("Complete Registration button clicked. Triggering completeRegistration().");
        this.completeRegistration(app);
      });
    }
    if (this.postBtn) {
      this.postBtn.addEventListener("click", () => {
        console.log("Post button clicked. Triggering app.ghostManager.handlePostButtonClick().");
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
        this.exportProfile(app);
      });
    }
    if (this.updateBtn) {
      this.updateBtn.addEventListener("click", () => {
        console.log("Update button clicked.");
        this.clearCache();
      });
    }
    if (this.toggleCameraBtn) {
      this.toggleCameraBtn.addEventListener("click", () => {
        this.toggleCameraView(app);
      });
    }
    if (this.toggleDiaryBtn) {
      this.toggleDiaryBtn.addEventListener("click", () => {
        this.toggleCameraView(app);
      });
    }
    const chatBtn = document.getElementById("chat-btn");
    if (chatBtn) {
      chatBtn.addEventListener("click", () => {
        console.log("Chat button clicked. Triggering toggleChat().");
        this.toggleChat(app);
      });
    } else {
      console.error("Chat button (id='chat-btn') not found in the DOM.");
    }
  }

  // ------------------ Diary Rendering Operations ------------------

  /**
   * renderDiary
   * Renders the diary entries.
   *
   * @param {Array} entries - Array of diary entry objects.
   * @param {string} currentLanguage - The current language code.
   * @param {Object} effectsManager - The VisualEffectsManager instance.
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
    console.log("[ViewManager] Diary updated.");
  }

  // ---------- Registration and Screen Switching Methods ----------

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
          if (td) td.style.display = "none";
          const shootBtn = targetGroup.querySelector("#btn_shoot");
          if (shootBtn) shootBtn.style.display = "none";
        }
        console.log(`[ViewManager] Controls panel updated for group: ${buttonsGroupId}`);
      }
    }
    const chatContainer = document.getElementById("chat-button-container");
    if (chatContainer) {
      chatContainer.style.display = 'flex';
      chatContainer.style.pointerEvents = 'auto';
      console.log("[ViewManager] Chat button container set to visible.");
    }
  }

  showToggleCameraButton() {
    if (this.toggleCameraBtn) {
      this.toggleCameraBtn.style.display = 'inline-block';
      console.log("[ViewManager] Toggle Camera button shown.");
    }
  }

  // ---------- Profile Display Methods ----------

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

  // ---------- Selfie Preview and Complete Button Methods ----------

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

  // ---------- Global Camera and Diary View Methods ----------

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

  showDiaryView() {
    const diary = document.getElementById("diary");
    if (diary && this.globalCamera) {
      diary.style.display = "block";
      this.globalCamera.style.display = "none";
      if (this.toggleCameraBtn) this.toggleCameraBtn.style.display = 'inline-block';
      if (this.toggleDiaryBtn) this.toggleDiaryBtn.style.display = "none";
      const shootBtn = document.getElementById("btn_shoot");
      if (shootBtn) shootBtn.style.display = "none";
      this.showPostButton();
      console.log("[ViewManager] Switched to diary view.");
    }
  }

  showCameraView() {
    const diary = document.getElementById("diary");
    if (diary && this.globalCamera) {
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

  // ---------- Button State Methods ----------

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
        StateManager.set("postButtonDisabled", isEnabled ? "false" : "true");
        console.log(`[ViewManager] Post button set to ${isEnabled ? "enabled" : "disabled"}.`);
      }
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

  // ---------- Apartment Plan UI ----------

  setApartmentPlanNextButtonEnabled(isEnabled) {
    const nextBtn = document.getElementById("apartment-plan-next-btn");
    if (nextBtn) {
      nextBtn.disabled = !isEnabled;
      console.log(`Apartment Plan Next button is now ${isEnabled ? "enabled" : "disabled"}.`);
    } else {
      ErrorManager.logError("Apartment plan Next button not found.", "setApartmentPlanNextButtonEnabled");
    }
  }

  // ---------- Mirror Quest UI ----------

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

  stopMirrorQuestUI(statusElementId) {
    const statusElem = document.getElementById(statusElementId);
    if (statusElem) {
      statusElem.style.display = "none";
    }
    this.setCameraButtonActive(false);
    this.setShootButtonActive(false);
    console.log("[ViewManager] Mirror quest UI stopped.");
  }

  // ---------- Repeating Quest UI ----------

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
      shootBtn.onclick = () => {
        if (options.quest && options.quest.finished) {
          console.log("[ViewManager] Quest is finished; Shoot button click ignored.");
          return;
        }
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

  stopRepeatingQuestUI(statusElementId) {
    const statusElem = document.getElementById(statusElementId);
    if (statusElem) {
      statusElem.style.display = "none";
    }
    this.setCameraButtonActive(false);
    this.setShootButtonActive(false);
    console.log("[ViewManager] Repeating quest UI stopped.");
  }

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

  // ---------- Top Controls for Extended Camera Modes ----------

  createTopCameraControls() {
    const existing = document.getElementById("top-camera-controls");
    if (existing) existing.remove();

    const topControls = document.createElement("div");
    topControls.id = "top-camera-controls";
    Object.assign(topControls.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      padding: "10px",
      background: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      zIndex: "2100"
    });

    const arBtn = document.createElement("button");
    arBtn.className = "button is-info";
    arBtn.innerText = "AR Mode";
    arBtn.onclick = () => {
      if (this.cameraManager) {
        this.cameraManager.startARMode();
      }
    };
    topControls.appendChild(arBtn);

    const aiBtn = document.createElement("button");
    aiBtn.className = "button is-primary";
    aiBtn.style.marginLeft = "10px";
    aiBtn.innerText = "Start AI Detection";
    aiBtn.onclick = () => {
      if (this.cameraManager) {
        this.cameraManager.startAIDetection();
      }
    };
    topControls.appendChild(aiBtn);

    const nightVisionBtn = document.createElement("button");
    nightVisionBtn.className = "button is-warning";
    nightVisionBtn.style.marginLeft = "10px";
    nightVisionBtn.innerText = "Night Vision";
    nightVisionBtn.onclick = () => {
      if (this.cameraManager) {
        this.cameraManager.applyFilter('nightVision');
      }
    };
    topControls.appendChild(nightVisionBtn);

    const blackWhiteBtn = document.createElement("button");
    blackWhiteBtn.className = "button is-warning";
    blackWhiteBtn.style.marginLeft = "10px";
    blackWhiteBtn.innerText = "Black & White";
    blackWhiteBtn.onclick = () => {
      if (this.cameraManager) {
        this.cameraManager.applyFilter('blackWhite');
      }
    };
    topControls.appendChild(blackWhiteBtn);

    const clearFilterBtn = document.createElement("button");
    clearFilterBtn.className = "button";
    clearFilterBtn.style.marginLeft = "10px";
    clearFilterBtn.innerText = "Clear Filter";
    clearFilterBtn.onclick = () => {
      if (this.cameraManager) {
        this.cameraManager.applyFilter('');
      }
    };
    topControls.appendChild(clearFilterBtn);

    document.body.appendChild(topControls);
    console.log("[ViewManager] Top camera controls created.");
  }

  // ---------- Visual Effects and Notifications ----------

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

  // ---------- New UI Methods (moved from App) ----------

  goToApartmentPlanScreen(app) {
    const regData = this.getRegistrationData();
    if (!regData) {
      ErrorManager.showError("Registration data missing.");
      return;
    }
    StateManager.set('regData', JSON.stringify(regData));
    this.switchScreen('apartment-plan-screen', 'apartment-plan-buttons');
    // Instantiate ApartmentPlanManager if not already created.
    if (!app.apartmentPlanManager) {
      app.apartmentPlanManager = new ApartmentPlanManager('apartment-plan-container', app.databaseManager, app);
    }
  }

  goToSelfieScreen(app) {
    this.switchScreen('selfie-screen', 'selfie-buttons');
    this.showGlobalCamera();
    if (app.cameraSectionManager) {
      app.cameraSectionManager.startCamera();
    }
    this.disableCompleteButton();
  }

  captureSelfie(app) {
    const video = app.cameraSectionManager.videoElement;
    if (!video || !video.srcObject) {
      ErrorManager.logError("Camera is not active!", "captureSelfie");
      ErrorManager.showError("Error: Camera is not active.");
      return;
    }
    if (video.readyState < 2) {
      ErrorManager.logError("Camera is not ready yet.", "captureSelfie");
      ErrorManager.showError("Please wait for the camera to load.");
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error("Failed to get 2D drawing context.");
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const grayscaleData = ImageUtils.convertToGrayscale(canvas);
      this.updateSelfiePreview(grayscaleData);
      this.enableCompleteButton();
      app.selfieData = grayscaleData;
      console.log("✅ Selfie captured successfully!");
    } catch (error) {
      ErrorManager.logError(error, "captureSelfie");
      ErrorManager.showError("Error capturing selfie! Please try again.");
    }
  }

  completeRegistration(app) {
    const selfieSrc = this.getSelfieSource();
    if (!selfieSrc || selfieSrc === "") {
      ErrorManager.showError("Please capture your selfie before completing registration.");
      return;
    }
    const regDataStr = StateManager.get('regData');
    if (!regDataStr) {
      ErrorManager.showError("Registration data missing.");
      return;
    }
    const regData = JSON.parse(regDataStr);
    const profile = {
      name: regData.name,
      gender: regData.gender,
      language: regData.language,
      selfie: selfieSrc
    };
    app.profileManager.saveProfile(profile).then(() => {
      StateManager.set("registrationCompleted", "true");
      app.cameraSectionManager.stopCamera();
      this.hideGlobalCamera();
      this.switchScreen('main-screen', 'main-buttons');
      this.showToggleCameraButton();
      if (StateManager.get("mirrorQuestReady") === "true") {
        this.setPostButtonEnabled(true);
      } else {
        this.setPostButtonEnabled(false);
      }
      app.profileManager.getProfile().then((profile) => {
        this.updateProfileDisplay(profile);
        app.selfieData = profile.selfie;
      });
      app.gameEventManager.autoLaunchWelcomeEvent();
    });
  }

  toggleCameraView(app) {
    if (!app.isCameraOpen) {
      this.showCameraView();
      app.cameraSectionManager.startCamera().then(() => {
        app.isCameraOpen = true;
      });
    } else {
      this.showDiaryView();
      app.cameraSectionManager.stopCamera();
      app.isCameraOpen = false;
    }
  }

  exportProfile(app) {
    app.profileManager.exportProfileData(app.databaseManager, app.apartmentPlanManager);
  }

  importProfile(app) {
    const file = this.getImportFile();
    if (!file) {
      ErrorManager.showError("Please select a profile file to import.");
      return;
    }
    app.profileManager.importProfileData(file, app.databaseManager, app.apartmentPlanManager);
  }

  toggleChat(app) {
    if (app.chatManager && app.chatManager.container) {
      if (app.chatManager.container.style.display === 'block') {
        app.chatManager.hide();
      } else {
        app.chatManager.show();
      }
    } else {
      console.error("ChatManager is not initialized or chat container not found.");
    }
  }

  // ---------- New Method: showLocationTypeModal ----------

  /**
   * showLocationTypeModal – Displays a modal window for selecting the location type.
   * @param {Function} onConfirm - Callback invoked with the selected type.
   * @param {Function} onCancel - Callback invoked if selection is cancelled.
   */
  showLocationTypeModal(onConfirm, onCancel) {
    const modalOverlay = document.createElement("div");
    modalOverlay.id = "location-type-modal-overlay";
    Object.assign(modalOverlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: "3000"
    });
    
    const modal = document.createElement("div");
    modal.id = "location-type-modal";
    Object.assign(modal.style, {
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "8px",
      maxWidth: "400px",
      width: "90%",
      textAlign: "center"
    });
    
    const title = document.createElement("h3");
    title.textContent = "Select location type";
    modal.appendChild(title);
    
    const selectElem = document.createElement("select");
    const locationTypes = [
      "Kitchen", "Bedroom", "Living Room", "Bathroom", "Corridor", "Other",
      "Entrance", "Office", "Library", "Kids Room", "Storage", "Garage"
    ];
    locationTypes.forEach(type => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      selectElem.appendChild(option);
    });
    selectElem.value = "Other";
    selectElem.style.marginBottom = "15px";
    selectElem.style.display = "block";
    selectElem.style.width = "100%";
    modal.appendChild(selectElem);
    
    const btnContainer = document.createElement("div");
    btnContainer.style.marginTop = "15px";
    
    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "Confirm";
    confirmBtn.style.marginRight = "10px";
    confirmBtn.addEventListener("click", () => {
      console.log("Confirm button clicked, selected type:", selectElem.value);
      const selectedType = selectElem.value;
      if (onConfirm) onConfirm(selectedType);
      setTimeout(() => {
        modalOverlay.remove();
      }, 50);
    });
    btnContainer.appendChild(confirmBtn);
    
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => {
      console.log("Cancel button clicked.");
      if (onCancel) onCancel();
      modalOverlay.remove();
    });
    btnContainer.appendChild(cancelBtn);
    
    modal.appendChild(btnContainer);
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
  }
}