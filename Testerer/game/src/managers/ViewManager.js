// ViewManager.js
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

    // --- Additional Control Buttons ---
    this.resetDataBtn = document.getElementById("reset-data");
    this.exportProfileBtn = document.getElementById("export-profile-btn");
    this.updateBtn = document.getElementById("update-btn");

    // --- Chat Button Container ---
    // (There must be an element with id "chat-btn" inside the container "chat-button-container")
    // The chat container remains visible by default.

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
   * Sets the camera manager instance (e.g., an instance of CameraSectionManager)
   * to allow unified access to camera methods.
   *
   * @param {Object} cameraManager - The camera manager instance.
   */
  setCameraManager(cameraManager) {
    this.cameraManager = cameraManager;
    console.log("[ViewManager] Camera manager set.");
  }

  /**
   * startCameraWithOptions
   * Wrapper method to start the camera with given options.
   *
   * @param {Object} options - CSS style properties for the video element.
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
   * Hides the "Post" button.
   */
  hidePostButton() {
    if (this.postBtn) {
      this.postBtn.style.display = 'none';
      console.log("[ViewManager] Post button hidden.");
    }
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
        app.viewManager.goToApartmentPlanScreen(app);
        console.log("[ViewManager] Next step button clicked.");
      });
    }
    if (this.captureBtn) {
      this.captureBtn.addEventListener("click", () => {
        console.log("Capture button clicked. Triggering captureSelfie().");
        app.viewManager.captureSelfie(app);
      });
    }
    if (this.completeBtn) {
      this.completeBtn.addEventListener("click", () => {
        console.log("Complete Registration button clicked. Triggering completeRegistration().");
        app.viewManager.completeRegistration(app);
      });
    }
    // "Post" button click calls GhostManager.handlePostButtonClick()
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
        app.viewManager.exportProfile(app);
      });
    }
    if (this.updateBtn) {
      this.updateBtn.addEventListener("click", () => {
        console.log("Update button clicked.");
        this.clearCache();
      });
    }
    if (this.toggleCameraBtn) {
      this.toggleCameraBtn.addEventListener("click", () => app.viewManager.toggleCameraView(app));
    }
    if (this.toggleDiaryBtn) {
      this.toggleDiaryBtn.addEventListener("click", () => app.viewManager.toggleCameraView(app));
    }
    // Bind chat button event.
    const chatBtn = document.getElementById("chat-btn");
    if (chatBtn) {
      chatBtn.addEventListener("click", () => {
        console.log("Chat button clicked. Triggering toggleChat().");
        app.viewManager.toggleChat(app);
      });
    } else {
      console.error("Chat button (id='chat-btn') not found in the DOM.");
    }
  }

  /**
   * getRegistrationData
   * Retrieves registration data from the form.
   *
   * @returns {Object|null} Registration data object or null if form elements are missing.
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

  /**
   * updateSelfiePreview
   * Updates the selfie preview image.
   *
   * @param {string} imageData - Data URL for the selfie image.
   */
  updateSelfiePreview(imageData) {
    if (this.selfiePreview) {
      this.selfiePreview.src = imageData;
      this.selfiePreview.style.display = 'block';
      console.log("[ViewManager] Selfie preview updated.");
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
      console.log("[ViewManager] Complete button enabled.");
    }
  }

  /**
   * disableCompleteButton
   * Disables the "Complete Registration" button.
   */
  disableCompleteButton() {
    if (this.completeBtn) {
      this.completeBtn.disabled = true;
      console.log("[ViewManager] Complete button disabled.");
    }
  }

  /**
   * getSelfieSource
   * Returns the current selfie image source.
   *
   * @returns {string} Data URL of the selfie image.
   */
  getSelfieSource() {
    return this.selfiePreview ? this.selfiePreview.src : "";
  }

  /**
   * getImportFile
   * Retrieves the selected file for profile import.
   *
   * @returns {File|null} The selected file or null if none.
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
   * Displays the toggle camera button.
   */
  showToggleCameraButton() {
    if (this.toggleCameraBtn) {
      this.toggleCameraBtn.style.display = 'inline-block';
      console.log("[ViewManager] Toggle Camera button shown.");
    }
  }

  /**
   * showPostButton
   * Displays the Post button.
   */
  showPostButton() {
    if (this.postBtn) {
      this.postBtn.style.display = 'inline-block';
      console.log("[ViewManager] Post button shown.");
    }
  }

  /**
   * hidePostButton
   * Hides the Post button.
   */
  hidePostButton() {
    if (this.postBtn) {
      this.postBtn.style.display = 'none';
      console.log("[ViewManager] Post button hidden.");
    }
  }

  /**
   * showDiaryView
   * Switches the view to show the diary.
   */
  showDiaryView() {
    this.switchUniversalSection("main-screen");
    console.log("[ViewManager] Diary view shown.");
  }

  /**
   * showCameraView
   * Switches the view to show the global camera.
   */
  showCameraView() {
    this.switchUniversalSection("global-camera");
    console.log("[ViewManager] Camera view shown.");
  }

  /**
   * showGlobalCamera
   * Displays the global camera element.
   */
  showGlobalCamera() {
    if (this.globalCamera) {
      this.globalCamera.style.display = 'block';
      console.log("[ViewManager] Global camera displayed.");
    } else {
      ErrorManager.logError("Global camera element not found.", "showGlobalCamera");
    }
  }

  /**
   * hideGlobalCamera
   * Hides the global camera element.
   */
  hideGlobalCamera() {
    if (this.globalCamera) {
      this.globalCamera.style.display = 'none';
      console.log("[ViewManager] Global camera hidden.");
    } else {
      ErrorManager.logError("Global camera element not found.", "hideGlobalCamera");
    }
  }

  // ------------------ Profile Display Operations ------------------

  /**
   * updateProfileDisplay
   * Updates the profile display with the given profile data.
   *
   * @param {Object} profile - The profile data.
   */
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

  // ------------------ Screen Switching ------------------

  /**
   * switchScreen
   * Hides all sections and shows the target screen.
   *
   * @param {string} screenId - The ID of the screen to show.
   * @param {string} buttonsGroupId - The ID of the controls group to display.
   */
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
    // Ensure chat button container is always visible regardless of registration status
    const chatContainer = document.getElementById("chat-button-container");
    if (chatContainer) {
      chatContainer.style.display = 'flex';
      chatContainer.style.pointerEvents = 'auto';
      console.log("[ViewManager] Chat button container set to visible.");
    }
  }

  /**
   * switchUniversalSection - Universally switches between blog, camera, and chat sections.
   * When one of these sections is opened, the other two are automatically hidden.
   *
   * @param {string} sectionId - The ID of the section to display ("main-screen", "global-camera", or "chat-section").
   */
  switchUniversalSection(sectionId) {
    const blog = document.getElementById("main-screen");
    const chat = document.getElementById("chat-section");
    const camera = document.getElementById("global-camera");
    if (blog) blog.style.display = (sectionId === "main-screen") ? "block" : "none";
    if (chat) chat.style.display = (sectionId === "chat-section") ? "block" : "none";
    if (camera) camera.style.display = (sectionId === "global-camera") ? "block" : "none";
    console.log(`[ViewManager] Universal section switched to: ${sectionId}`);
  }

  // ------------------ Button State Management ------------------

  /**
   * setPostButtonEnabled
   * Enables or disables the "Post" button.
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

  stopMirrorQuestUI(statusElementId) {
    const statusElem = document.getElementById(statusElementId);
    if (statusElem) {
      statusElem.style.display = "none";
    }
    this.setCameraButtonActive(false);
    this.setShootButtonActive(false);
    console.log("[ViewManager] Mirror quest UI stopped.");
  }

  // ------------------ Repeating Quest UI ------------------

  /**
   * startRepeatingQuestUI
   * Initializes the UI for a repeating quest stage.
   *
   * @param {object} options - Options including:
   *   - statusElementId: the ID of the status element.
   *   - shootButtonId: the ID of the Shoot button.
   *   - stage: current stage number.
   *   - totalStages: total number of stages.
   *   - onShoot: callback to execute when Shoot is pressed.
   *   - quest: the current repeating quest instance.
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

  /**
   * updateUIAfterQuestStage
   * Updates multiple UI elements after a quest stage completion.
   *
   * @param {object} config - Configuration object with properties: postEnabled, cameraActive, shootActive.
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

  // ------------------ Top Controls for Extended Camera Modes ------------------

  /**
   * createTopCameraControls
   * Dynamically creates a top panel with buttons for AR mode, AI detection, and filter selection.
   */
  createTopCameraControls() {
    // Remove existing top controls if present
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

    // AR Mode Button
    const arBtn = document.createElement("button");
    arBtn.className = "button is-info";
    arBtn.innerText = "AR Mode";
    arBtn.onclick = () => {
      if (this.cameraManager) {
        this.cameraManager.startARMode();
      }
    };
    topControls.appendChild(arBtn);

    // AI Detection Button
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

    // Filter Buttons
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

  // ------------------ Visual Effects and Notifications ------------------

  /**
   * applyBackgroundTransition
   * Applies a background transition to the body.
   *
   * @param {string} color - Target background color.
   * @param {number} duration - Transition duration in milliseconds.
   */
  applyBackgroundTransition(color, duration) {
    document.body.style.transition = `background ${duration}ms`;
    document.body.style.background = color;
    setTimeout(() => {
      document.body.style.background = "";
    }, duration);
    console.log(`[ViewManager] Applied background transition with color ${color} for ${duration}ms.`);
  }

  /**
   * showGhostAppearanceEffect
   * Displays a ghost appearance effect.
   *
   * @param {string} ghostId - Identifier for the ghost image.
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
    console.log(`[ViewManager] Ghost appearance effect triggered for ghost ${ghostId}.`);
  }

  /**
   * showNotification
   * Displays a notification message.
   *
   * @param {string} message - Notification message.
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
    console.log("[ViewManager] Notification shown:", message);
  }

  // ------------------ Miscellaneous ------------------

  /**
   * setControlsBlocked
   * Blocks or unblocks interaction with the controls panel.
   *
   * @param {boolean} shouldBlock - True to block, false to unblock.
   */
  setControlsBlocked(shouldBlock) {
    if (this.controlsPanel) {
      this.controlsPanel.style.pointerEvents = shouldBlock ? "none" : "auto";
      console.log(`[ViewManager] Controls ${shouldBlock ? "blocked" : "unblocked"}.`);
    }
  }

  /**
   * clearCache
   * Sends a message to clear the service worker cache.
   */
  clearCache() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ action: 'CLEAR_CACHE' });
      console.log("Clear cache message sent to Service Worker.");
    } else {
      console.warn("No active Service Worker controller found.");
    }
  }

  // -------------- Moved UI Methods from App.js --------------

  /**
   * goToApartmentPlanScreen
   * Transitions UI to the apartment plan screen.
   *
   * @param {App} app - The main application instance.
   */
  goToApartmentPlanScreen(app) {
    const regData = this.getRegistrationData();
    if (!regData) {
      ErrorManager.showError("Registration data missing.");
      return;
    }
    StateManager.set('regData', JSON.stringify(regData));
    this.switchScreen('apartment-plan-screen', 'apartment-plan-buttons');
    if (!app.apartmentPlanManager) {
      app.apartmentPlanManager = new ApartmentPlanManager('apartment-plan-container', app.databaseManager, app);
    }
    console.log("[ViewManager] Navigated to Apartment Plan screen.");
  }

  /**
   * goToSelfieScreen
   * Transitions UI to the selfie capture screen.
   *
   * @param {App} app - The main application instance.
   */
  goToSelfieScreen(app) {
    this.switchScreen('selfie-screen', 'selfie-buttons');
    this.showGlobalCamera();
    app.cameraSectionManager.startCamera();
    this.disableCompleteButton();
    console.log("[ViewManager] Navigated to Selfie Capture screen.");
  }

  /**
   * captureSelfie
   * Captures a selfie from the active camera stream,
   * converts it to grayscale, updates the selfie preview,
   * and enables the "Complete Registration" button.
   *
   * @param {App} app - The main application instance.
   */
  async captureSelfie(app) {
    console.log("📸 Attempting to capture selfie...");
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
      
      // Convert the captured frame to grayscale.
      const grayscaleData = ImageUtils.convertToGrayscale(canvas);
      
      // Update selfie preview.
      this.updateSelfiePreview(grayscaleData);
      
      // Enable the "Complete Registration" button.
      this.enableCompleteButton();
      
      // Save the processed selfie data.
      app.selfieData = grayscaleData;
      
      console.log("✅ Selfie captured successfully!");
    } catch (error) {
      ErrorManager.logError(error, "captureSelfie");
      ErrorManager.showError("Error capturing selfie! Please try again.");
    }
  }

  /**
   * completeRegistration
   * Completes user registration by validating data, saving the profile,
   * stopping the camera, and transitioning to the main screen.
   *
   * @param {App} app - The main application instance.
   */
  async completeRegistration(app) {
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
    await app.profileManager.saveProfile(profile);
    StateManager.set("registrationCompleted", "true");
    app.cameraSectionManager.stopCamera();
    this.hideGlobalCamera();
    await this.showMainScreen(app);
    app.gameEventManager.autoLaunchWelcomeEvent();
    console.log("[ViewManager] Registration completed, transitioned to Main screen.");
  }

  /**
   * toggleCameraView
   * Toggles between camera view and diary view.
   *
   * @param {App} app - The main application instance.
   */
  async toggleCameraView(app) {
    if (!app.isCameraOpen) {
      console.log("📸 Switching to camera view...");
      this.switchUniversalSection("global-camera");
      await app.cameraSectionManager.startCamera();
      await new Promise(resolve => {
        const vid = app.cameraSectionManager.videoElement;
        if (vid.readyState >= 2) {
          resolve();
        } else {
          vid.onloadedmetadata = () => resolve();
        }
      });
      console.log("Video ready:", app.cameraSectionManager.videoElement.videoWidth, app.cameraSectionManager.videoElement.videoHeight);
      app.isCameraOpen = true;
    } else {
      console.log("📓 Returning to diary view...");
      this.switchUniversalSection("main-screen");
      app.cameraSectionManager.stopCamera();
      app.isCameraOpen = false;
    }
  }

  /**
   * showMainScreen
   * Displays the main (blog/diary) screen.
   *
   * @param {App} app - The main application instance.
   */
  async showMainScreen(app) {
    this.switchUniversalSection("main-screen");
    this.showToggleCameraButton();
    if (StateManager.get("mirrorQuestReady") === "true") {
      this.setPostButtonEnabled(true);
    } else {
      this.setPostButtonEnabled(false);
    }
    const profile = await app.profileManager.getProfile();
    if (profile) {
      this.updateProfileDisplay(profile);
      app.selfieData = profile.selfie;
    }
    console.log("[ViewManager] Main screen displayed.");
  }

  /**
   * showRegistrationScreen
   * Displays the registration screen.
   *
   * @param {App} app - The main application instance.
   */
  showRegistrationScreen(app) {
    StateManager.remove("welcomeDone");
    StateManager.remove("mirrorQuestReady");
    StateManager.remove("postButtonEnabled");
    StateManager.remove("regData");
    StateManager.remove("quest_state_repeating_quest");
    this.switchScreen('registration-screen', 'registration-buttons');
    console.log("[ViewManager] Registration screen displayed.");
  }

  /**
   * exportProfile
   * Initiates profile export.
   *
   * @param {App} app - The main application instance.
   */
  exportProfile(app) {
    app.profileManager.exportProfileData(app.databaseManager, app.apartmentPlanManager);
    console.log("[ViewManager] Profile export initiated.");
  }

  /**
   * importProfile
   * Initiates profile import from a selected file.
   *
   * @param {App} app - The main application instance.
   */
  importProfile(app) {
    const file = this.getImportFile();
    if (!file) {
      ErrorManager.showError("Please select a profile file to import.");
      return;
    }
    app.profileManager.importProfileData(file, app.databaseManager, app.apartmentPlanManager);
    console.log("[ViewManager] Profile import initiated.");
  }

  /**
   * toggleChat
   * Toggles the display of the chat section.
   *
   * @param {App} app - The main application instance.
   */
  toggleChat(app) {
    if (app.chatManager && app.chatManager.container) {
      if (app.chatManager.container.style.display === 'block') {
        app.chatManager.hide();
        console.log("[ViewManager] Chat section hidden.");
      } else {
        this.switchUniversalSection("chat-section");
        app.chatManager.show();
        console.log("[ViewManager] Chat section displayed.");
      }
    } else {
      console.error("ChatManager is not initialized or chat container not found.");
    }
  }
  
  // ------------------ End of Moved UI Methods ------------------
  
  // (The rest of the file remains unchanged.)
}