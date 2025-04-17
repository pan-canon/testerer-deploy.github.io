import { StateManager } from './StateManager.js';
import { ErrorManager } from './ErrorManager.js';
import { ImageUtils } from '../utils/ImageUtils.js';
import { ApartmentPlanManager } from './ApartmentPlanManager.js';
import { TemplateEngine } from '../utils/TemplateEngine.js';

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
  constructor(appInstance) {
    this.app = appInstance;
    // --- Cache static UI elements from index.html ---
    this.controlsPanel = document.getElementById("controls-panel");
    this.languageSelector = document.getElementById('language-selector');
    this.globalCamera = document.getElementById("global-camera");
    this.postBtn = document.getElementById("post-btn");
    this.toggleCameraBtn = document.getElementById("toggle-camera");
    this.toggleDiaryBtn = document.getElementById("toggle-diary");
    this.resetDataBtn = document.getElementById("reset-data");
    this.exportProfileBtn = document.getElementById("export-profile-btn");
    this.updateBtn = document.getElementById("update-btn");
    
    // Initially, we assign the diaryContainer from the hidden placeholder
    this.diaryContainer = document.getElementById("diary");

    this.cameraManager = null;
    this.languageManager = null;

    // Disable "Post" button initially.
    if (this.postBtn) {
      this.postBtn.disabled = true;
      // Use universal flag storage; initial state is disabled.
      StateManager.set("postButtonDisabled", "true");
      console.log("[ViewManager] Post button disabled on initialization.");
    }
  }

  getBasePath() {
    const loc = window.location;
    const path = loc.pathname.substring(0, loc.pathname.lastIndexOf('/'));
    return loc.origin + path;
  }

  setCameraManager(cameraManager) {
    this.cameraManager = cameraManager;
    console.log("[ViewManager] Camera manager set.");
  }

  setLanguageManager(languageManager) {
    this.languageManager = languageManager;
  }

  getRegistrationData() {
    if (!this.nameInput || !this.genderSelect) {
      return null;
    }
    return {
      name: this.nameInput.value.trim(),
      gender: this.genderSelect.value.trim(),
      language: this.languageSelector ? this.languageSelector.value : 'en'
    };
  }

  bindEvents(app) {
    if (this.languageSelector) {
      this.languageSelector.addEventListener('change', () => {
        console.log("Language select changed:", this.languageSelector.value);
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
    const chatBtn = document.getElementById("chat-btn");
    if (chatBtn) {
      chatBtn.addEventListener("click", () => {
        console.log("Chat button clicked. Triggering toggleChat().");
        this.toggleChat(app);
      });
    } else {
      console.error("Chat button (id='chat-btn') not found in the DOM.");
    }

    // >>> Add missing event listener for the Post button.
    if (this.postBtn) {
      this.postBtn.addEventListener("click", () => {
        console.log("Post button clicked. Delegating to ghostManager.handlePostButtonClick()...");
        app.ghostManager.handlePostButtonClick();
      });
    } else {
      console.error("Post button (id='post-btn') not found in the DOM.");
    }
  }

  // ------------------ Dynamic Template Loading Methods ------------------

  async loadTemplate(screenId, data = {}) {
    const basePath = this.getBasePath();
    const templateUrl = `${basePath}/src/templates/${screenId}_template.html`;
    try {
      const response = await fetch(templateUrl);
      if (!response.ok) {
        throw new Error(`Failed to load template: ${templateUrl}`);
      }
      const templateText = await response.text();
      const renderedHTML = TemplateEngine.render(templateText, data);
      const container = document.getElementById("global-content");
      if (container) {
        container.innerHTML += renderedHTML;
        const newScreen = container.lastElementChild;
        console.log(`[ViewManager] Loaded template for screen: ${screenId}`);
        if (this.languageManager && typeof this.languageManager.updateContainerLanguage === 'function') {
          this.languageManager.updateContainerLanguage(newScreen);
        }
        // APPLY VISUAL EFFECTS TO NEW ELEMENTS IN THE LOADED SCREEN
        if (this.app && this.app.visualEffectsManager && typeof this.app.visualEffectsManager.applyEffectsToNewElements === 'function') {
          const newElements = newScreen.querySelectorAll("[data-animate-on-board='true']");
          this.app.visualEffectsManager.applyEffectsToNewElements(newElements);
        }
        return newScreen;
      } else {
        throw new Error("Global content container (id='global-content') not found.");
      }
    } catch (error) {
      ErrorManager.logError(error, "loadTemplate");
      return null;
    }
  }

  /**
   * switchScreen
   * Switches the UI to the target screen. If the screen element does not exist,
   * it dynamically loads the template from the templates folder.
   * Also re-binds dynamic event handlers for newly loaded screens
   * and toggles the global language selector (on landing only).
   *
   * @param {string} screenId - The id of the target screen.
   * @param {string} buttonsGroupId - The id of the control button group to display.
   * @param {App} [app] - The main application instance (if needed for event callbacks).
   */
  async switchScreen(screenId, buttonsGroupId, app) {
    // Hide all sections
    document.querySelectorAll('section').forEach(section => {
      section.style.display = 'none';
    });
    let targetScreen = document.getElementById(screenId);
    if (!targetScreen) {
      // If not found, load the template dynamically.
      targetScreen = await this.loadTemplate(screenId, {});
      if (!targetScreen) {
        console.error(`[ViewManager] Failed to load screen: ${screenId}`);
        return;
      }
    }
    targetScreen.style.display = 'block';
    console.log(`[ViewManager] Switched to screen: ${screenId}`);

    // APPLY VISUAL EFFECTS TO NEW ELEMENTS IN THE SWITCHED SCREEN
    if (this.app && this.app.visualEffectsManager && typeof this.app.visualEffectsManager.applyEffectsToNewElements === 'function') {
      const newElements = targetScreen.querySelectorAll("[data-animate-on-board='true']");
      this.app.visualEffectsManager.applyEffectsToNewElements(newElements);
    }

    // If main-screen, update diaryContainer to the newly loaded #diary
    if (screenId === "main-screen") {
      const diaryElem = targetScreen.querySelector('#diary');
      if (diaryElem) {
        this.diaryContainer = diaryElem;
        console.log("[ViewManager] Updated diary container for main-screen.");
        await this.loadLatestDiaryPosts();
      }
    }

    // If landing-screen, bind the start-registration button
    if (screenId === "landing-screen") {
      const startRegistrationBtn = targetScreen.querySelector('#start-registration-btn');
      if (startRegistrationBtn) {
        startRegistrationBtn.addEventListener('click', () => {
          this.switchScreen('registration-screen', 'registration-buttons', app);
          console.log("[ViewManager] Start registration button clicked, switching to registration screen.");
        });
      }
    }

    // If registration-screen, re-assign dynamic fields and event handlers
    if (screenId === "registration-screen") {
      this.nameInput = targetScreen.querySelector('#player-name');
      this.genderSelect = targetScreen.querySelector('#player-gender');
      this.nextStepBtn = targetScreen.querySelector('#next-step-btn');

      const checkRegistrationValidity = () => {
        const nameValid = this.nameInput && this.nameInput.value.trim().length > 0;
        const genderValid = this.genderSelect && this.genderSelect.value !== "";
        if (this.nextStepBtn) {
          this.nextStepBtn.disabled = !(nameValid && genderValid);
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
      if (this.nextStepBtn) {
        this.nextStepBtn.addEventListener('click', async () => {
          await this.goToApartmentPlanScreen(app);
          console.log("[ViewManager] Registration next button clicked. Moving to apartment plan screen.");
        });
      }
    }

    // If selfie-screen: the capture and complete buttons are static in index.html
    if (screenId === "selfie-screen") {
      const captureBtn = document.getElementById('capture-btn');
      if (captureBtn) {
        captureBtn.onclick = () => {
          console.log("Capture button clicked. Capturing selfie...");
          this.captureSelfie(app);
        };
      } else {
        console.error("Capture button (id='capture-btn') not found in the DOM.");
      }
      const completeBtn = document.getElementById('complete-registration');
      if (completeBtn) {
        completeBtn.onclick = () => {
          console.log("Complete registration button clicked.");
          this.completeRegistration(app);
        };
      } else {
        console.error("Complete registration button (id='complete-registration') not found in the DOM.");
      }
    }

    // If apartment-plan-screen
    if (screenId === "apartment-plan-screen" && app) {
      const prevFloorBtn = document.getElementById("prev-floor-btn");
      if (prevFloorBtn) {
        prevFloorBtn.addEventListener("click", () => {
          if (app.apartmentPlanManager) {
            app.apartmentPlanManager.prevFloor();
          }
        });
      }
      const nextFloorBtn = document.getElementById("next-floor-btn");
      if (nextFloorBtn) {
        nextFloorBtn.addEventListener("click", () => {
          if (app.apartmentPlanManager) {
            app.apartmentPlanManager.nextFloor();
          }
        });
      }
      const planNextBtn = targetScreen.querySelector('#apartment-plan-next-btn');
      if (planNextBtn) {
        planNextBtn.addEventListener('click', () => {
          console.log("Apartment Plan next button clicked. Going to selfie screen.");
          this.goToSelfieScreen(app);
        });
      }
    }

    // Hide all groups in the controls panel, then show the relevant group
    document.querySelectorAll('#controls-panel > .buttons').forEach(group => {
      group.style.display = 'none';
      group.style.pointerEvents = 'none';
    });
    if (buttonsGroupId) {
      const targetGroup = document.getElementById(buttonsGroupId);
      if (targetGroup) {
        targetGroup.style.display = 'flex';
        targetGroup.style.pointerEvents = 'auto';
        // On main-screen, hide toggle-diary and btn_shoot to avoid confusion
        if (screenId === "main-screen") {
          const td = targetGroup.querySelector("#toggle-diary");
          if (td) td.style.display = "none";
          const shootBtn = targetGroup.querySelector("#btn_shoot");
          if (shootBtn) shootBtn.style.display = "none";
        }
        console.log(`[ViewManager] Controls panel updated for group: ${buttonsGroupId}`);
      }
    }

    // Make the chat button visible
    const chatContainer = document.getElementById("chat-button-container");
    if (chatContainer) {
      chatContainer.style.display = 'flex';
      chatContainer.style.pointerEvents = 'auto';
      console.log("[ViewManager] Chat button container set to visible.");
    }

    // Show/hide the global language container depending on the screen
    const languageContainer = document.getElementById("language-container");
    if (languageContainer) {
      if (screenId === "landing-screen") {
        languageContainer.style.display = "block";
      } else {
        languageContainer.style.display = "none";
      }
    }
  }

  showToggleCameraButton() {
    if (this.toggleCameraBtn) {
      this.toggleCameraBtn.style.display = 'inline-block';
      console.log("[ViewManager] Toggle Camera button shown.");
    }
  }

  updateProfileDisplay(profile) {
    const profileNameElem = document.getElementById('profile-name');
    const profilePhotoElem = document.getElementById('profile-photo');
    if (profileNameElem) {
      profileNameElem.textContent = profile.name;
    }
    if (profilePhotoElem) {
      profilePhotoElem.src = profile.selfie;
      profilePhotoElem.style.display = 'block';
    }
    console.log("[ViewManager] Profile display updated.");
  }

  updateSelfiePreview(imageData) {
    const selfiePreview = document.getElementById('selfie-thumbnail');
    if (selfiePreview) {
      selfiePreview.src = imageData;
      selfiePreview.style.display = 'block';
      console.log("[ViewManager] Selfie preview updated.");
    } else {
      ErrorManager.logError("Selfie preview element not found.", "updateSelfiePreview");
    }
  }

  enableCompleteButton() {
    const completeBtn = document.getElementById('complete-registration');
    if (completeBtn) {
      completeBtn.disabled = false;
      console.log("[ViewManager] Complete button enabled.");
    }
  }

  disableCompleteButton() {
    const completeBtn = document.getElementById('complete-registration');
    if (completeBtn) {
      completeBtn.disabled = true;
      console.log("[ViewManager] Complete button disabled.");
    }
  }

  getSelfieSource() {
    const selfiePreview = document.getElementById('selfie-thumbnail');
    return selfiePreview ? selfiePreview.src : "";
  }

  getImportFile() {
    const importFileInput = document.getElementById('import-file');
    if (importFileInput && importFileInput.files.length > 0) {
      return importFileInput.files[0];
    }
    return null;
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

  /**
   * setPostButtonEnabled
   * Sets the Post button state.
   * The passed parameter (isEnabled) is assumed to be pre-computed based on the universal quest state,
   * such as the presence of an active quest key ("activeQuestKey").
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

  /**
   * setCameraButtonActive
   * Sets the active state of the camera button.
   */
  setCameraButtonActive(isActive) {
    const cameraBtn = document.getElementById("toggle-camera");
    if (cameraBtn) {
      if (isActive) {
        cameraBtn.classList.add("active");
      } else {
        cameraBtn.classList.remove("active");
      }
      // Optionally, you might remove the old fixed key and rely on universal state instead.
      StateManager.set("cameraButtonActive", JSON.stringify(isActive));
      console.log(`[ViewManager] Camera button active state set to ${isActive}.`);
    }
  }

  /**
   * restoreCameraButtonState
   * Restores the camera button state based on the universal quest state ("activeQuestKey").
   */
  restoreCameraButtonState() {
    const activeQuestKey = StateManager.get("activeQuestKey");
    // If an active quest is present, assume camera button should be active.
    const isActive = activeQuestKey ? true : false;
    this.setCameraButtonActive(isActive);
    console.log("[ViewManager] Camera button state restored using activeQuestKey:", isActive);
  }

  /**
   * setShootButtonActive
   * Sets the active state of the Shoot button.
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
      // Optionally, store the state using the universal key mechanism.
      StateManager.set("shootButtonActive", JSON.stringify(isActive));
      console.log(`[ViewManager] Shoot button active state set to ${isActive}.`);
    } else {
      ErrorManager.logError("Shoot button not found.", "setShootButtonActive");
    }
  }

  /**
   * restoreShootButtonState
   * Restores the Shoot button state based on the universal quest state ("activeQuestKey").
   */
  restoreShootButtonState() {
    const activeQuestKey = StateManager.get("activeQuestKey");
    const isActive = activeQuestKey ? true : false;
    this.setShootButtonActive(isActive);
    console.log("[ViewManager] Shoot button state restored using activeQuestKey:", isActive);
  }

  setApartmentPlanNextButtonEnabled(isEnabled) {
    const nextBtn = document.getElementById("apartment-plan-next-btn");
    if (nextBtn) {
      nextBtn.disabled = !isEnabled;
      console.log(`Apartment Plan Next button is now ${isEnabled ? "enabled" : "disabled"}.`);
    } else {
      ErrorManager.logError("Apartment plan Next button not found.", "setApartmentPlanNextButtonEnabled");
    }
  }

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

  // ------------------ Modified goToApartmentPlanScreen ------------------
  async goToApartmentPlanScreen(app) {
    const regData = this.getRegistrationData();
    if (!regData) {
      ErrorManager.showError("Registration data missing.");
      return;
    }
    StateManager.set('regData', JSON.stringify(regData));
    // Await the template loading so that the container is in the DOM.
    await this.switchScreen('apartment-plan-screen', 'apartment-plan-buttons', app);
    if (!app.apartmentPlanManager) {
      app.apartmentPlanManager = new ApartmentPlanManager('apartment-plan-container', app.databaseManager, app);
    }
  }
  // --------------------------------------------------------------------

  goToSelfieScreen(app) {
    this.switchScreen('selfie-screen', 'selfie-buttons', app);
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
      language: this.languageSelector ? this.languageSelector.value : 'en',
      selfie: selfieSrc
    };
    app.profileManager.saveProfile(profile).then(() => {
      StateManager.set("registrationCompleted", "true");
      app.cameraSectionManager.stopCamera();
      this.hideGlobalCamera();
      this.switchScreen('main-screen', 'main-buttons', app);
      this.showToggleCameraButton();
      // Use universal activeQuestKey to determine Post button state.
      const activeQuestKey = StateManager.get("activeQuestKey");
      this.setPostButtonEnabled(!!activeQuestKey);
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

  /**
   * renderDiary
   * Renders the diary entries from the database into the diary container.
   * Now checks if entry text *contains* base64 data (`data:image`) anywhere;
   * if found, we separate text + image and render them properly.
   */
  renderDiary(entries, currentLanguage, visualEffectsManager) {
    if (!this.diaryContainer) {
      console.error("Diary container not set. Cannot render diary entries.");
      return;
    }
    this.diaryContainer.innerHTML = "";
    if (!entries || entries.length === 0) {
      const emptyMessage = (this.languageManager && this.languageManager.translate("no_diary_entries", "Diary is empty.")) || "Diary is empty.";
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "diary-empty";
      emptyDiv.textContent = emptyMessage;
      this.diaryContainer.appendChild(emptyDiv);
      console.log("[ViewManager] No diary entries found.");
      return;
    }

    entries.forEach(entry => {
      // CHANGED PART: Now we check for 'data:image' anywhere in the string.
      let rendered;
      if (entry.entry.includes("data:image")) {
        // Assume maximum one image per entry.
        // Split entry into lines to extract base64 string.
        const lines = entry.entry.split("\n");
        // Find the first line that starts with data:image.
        let base64Line = lines.find(line => line.trim().startsWith("data:image"));

        // Join the remaining lines as text (or take the first line before the data:image line).
        let textLines = lines.filter(line => !line.trim().startsWith("data:image")).join("\n");

        // If no base64 line was found, fallback to regular text.
        if (!base64Line) {
          // Regular text template with animate attribute
          const diaryEntryTemplate = `
            <div class="diary-entry {{postClass}}" data-animate-on-board="true">
              <p>{{entry}}</p>
              <span class="diary-timestamp">{{timestamp}}</span>
            </div>
          `;
          rendered = TemplateEngine.render(diaryEntryTemplate, {
            postClass: entry.postClass,
            entry: entry.entry,
            timestamp: entry.timestamp
          });
        } else {
          // Template for diary entry with an image
          const entryWithImageTemplate = `
            <div class="diary-entry {{postClass}}" data-animate-on-board="true">
              <p>{{text}}</p>
              <img src="{{img}}" alt="Diary Image" />
              <span class="diary-timestamp">{{timestamp}}</span>
            </div>
          `;
          rendered = TemplateEngine.render(entryWithImageTemplate, {
            postClass: entry.postClass,
            text: textLines,
            img: base64Line.trim(),
            timestamp: entry.timestamp
          });
        }
      } else {
        // Regular diary entry template with animate attribute
        const diaryEntryTemplate = `
          <div class="diary-entry {{postClass}}" data-animate-on-board="true">
            <p>{{entry}}</p>
            <span class="diary-timestamp">{{timestamp}}</span>
          </div>
        `;
        rendered = TemplateEngine.render(diaryEntryTemplate, {
          postClass: entry.postClass,
          entry: entry.entry,
          timestamp: entry.timestamp
        });
      }

      this.diaryContainer.innerHTML += rendered;
    });
    console.log(`[ViewManager] Diary updated with ${entries.length} entries.`);
  }

  /**
   * Loads and renders the latest `limit` diary posts.
   * Falls back to empty list if DB is empty.
   */
  async loadLatestDiaryPosts(limit = 3) {
    const all = await this.app.databaseManager.getDiaryEntries();
    const latest = all.slice(-limit).reverse(); // newest first
    this.renderDiary(latest, this.app.languageManager.getLanguage(), this.app.visualEffectsManager);
  }

  /**
   * Inserts a single diary post without re‑rendering the whole list.
   * @param {Object} entryData {text, img, timestamp, postClass}
   */
  async addSingleDiaryPost(entryData) {
    if (!this.diaryContainer) return;

    // Build optional <img> tag once
    const imgTag = entryData.img ? `<img src="${entryData.img}" alt="Diary image" />` : "";
    const html = await TemplateEngine.renderFile(
      "./src/templates/diaryentry_screen-template.html",
      { ...entryData, imgTag }
    );

    // prepend so newest on top
    this.diaryContainer.insertAdjacentHTML("afterbegin", html);

    const p = this.diaryContainer.querySelector('.diary-entry:first-child p[data-animate-on-board="true"]');
    if (p && this.app.visualEffectsManager) {
      this.app.visualEffectsManager.applyEffectsToNewElements([p]);
    }
  }

  async loadEarlierDiaryPosts(step = 3) {
    const displayed = this.diaryContainer.querySelectorAll('.diary-entry').length;
    const all = await this.app.databaseManager.getDiaryEntries();
    const nextChunk = all.slice(Math.max(0, all.length - displayed - step), all.length - displayed);
    // Append **after** existing entries
    nextChunk.reverse().forEach(async (item) => {
      const html = await TemplateEngine.renderFile(
        "./src/templates/diaryentry_screen-template.html",
        item
      );
      this.diaryContainer.insertAdjacentHTML("beforeend", html);
    });
  }
}