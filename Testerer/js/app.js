import { ImageUtils } from './utils/imageUtils.js';
import { VisualEffectsManager } from './utils/visualEffectsManager.js';
import { DatabaseManager } from './databaseManager.js';
import { LanguageManager } from './languageManager.js';
import { cameraSectionManager } from './cameraSectionManager.js';
import { ProfileManager } from './profileManager.js';
import { ApartmentPlanManager } from './apartmentPlanManager.js';
import { GhostManager } from './ghostManager.js';
import { EventManager } from './eventManager.js';
import { GameEventManager } from './gameEventManager.js';
import { QuestManager } from './questManager.js';
import { ShowProfileModal } from './showProfileModal.js';
import { ViewManager } from './viewManager.js'; // Centralized UI operations
import { SQLiteDataManager } from './SQLiteDataManager.js'; // Persistence via IndexedDB
import { StateManager } from './stateManager.js';
import { ErrorManager } from './errorManager.js';

/**
 * Main application class.
 * Manages screens (registration, selfie, main/blog), initializes managers 
 * and holds the user's selfie data.
 */
export class App {
  constructor() {
    // Initialize the ViewManager and bind its screen switching method globally.
    this.viewManager = new ViewManager();
    window.switchScreen = this.viewManager.switchScreen.bind(this.viewManager);

    // Create an instance of SQLiteDataManager for persistence.
    this.sqliteDataManager = new SQLiteDataManager();
    this.databaseManager = new DatabaseManager(this.sqliteDataManager);

    // Flag indicating whether camera mode is active.
    this.isCameraOpen = false;

    // Main DOM elements (used only when absolutely necessary).
    this.registrationScreen = document.getElementById('registration-screen');
    this.selfieScreen       = document.getElementById('selfie-screen');
    this.mainScreen         = document.getElementById('main-screen');

    // Registration elements.
    this.nameInput     = document.getElementById('player-name');
    this.genderSelect  = document.getElementById('player-gender');
    this.nextStepBtn   = document.getElementById('next-step-btn');
    this.captureBtn    = document.getElementById('capture-btn');
    this.selfiePreview = document.getElementById('selfie-preview');
    this.completeBtn   = document.getElementById('complete-registration');

    // Profile elements.
    this.profileNameElem  = document.getElementById('profile-name');
    this.profilePhotoElem = document.getElementById('profile-photo');

    // Reset/Export/Import buttons.
    this.resetBtn        = document.getElementById('reset-data');
    this.exportBtn       = document.getElementById('export-profile-btn');
    this.importFileInput = document.getElementById('import-file');
    this.importBtn       = document.getElementById('import-profile-btn');

    // "Post" button (visible only on main/blog screen).
    this.postBtn = document.getElementById('post-btn');

    // Controls panel and visual effects manager.
    this.controlsPanel = document.getElementById("controls-panel");
    this.visualEffectsManager = new VisualEffectsManager(this, this.controlsPanel);

    // Initialize managers: language, camera, profile, database.
    this.languageManager      = new LanguageManager('language-selector');
    this.cameraSectionManager = new cameraSectionManager();
    this.profileManager       = new ProfileManager(this.sqliteDataManager);

    // Initialize GhostManager and EventManager (interdependent).
    this.ghostManager = new GhostManager(null, this.profileManager, this);
    this.eventManager = new EventManager(
      this.databaseManager,
      this.languageManager,
      this.ghostManager,
      this.visualEffectsManager
    );
    // Pass ViewManager reference.
    this.eventManager.viewManager = this.viewManager;
    this.ghostManager.eventManager = this.eventManager;

    // Initialize QuestManager and GameEventManager.
    this.questManager     = new QuestManager(this.eventManager, this);
    this.gameEventManager = new GameEventManager(this.eventManager, this, this.languageManager);
    this.showProfileModal = new ShowProfileModal(this);

    // Temporary canvas for selfie processing.
    this.tempCanvas = document.createElement("canvas");
    this.tempCtx    = this.tempCanvas.getContext("2d");

    // Store user's selfie data.
    this.selfieData = null;

    this.bindEvents();
    this.init();
  }

  /**
   * loadAppState – Loads the application state from StateManager.
   */
  loadAppState() {
    const savedGhostId = StateManager.get('currentGhostId');
    if (savedGhostId) {
      this.ghostManager.setCurrentGhost(parseInt(savedGhostId));
    } else {
      this.ghostManager.setCurrentGhost(1);
    }
  }

  /**
   * init – Asynchronously initializes the application.
   */
  async init() {
    this.loadAppState();
    await this.databaseManager.initDatabasePromise;

    // Delegate toggle-camera button display to ViewManager.
    this.viewManager.showToggleCameraButton();

    // Update the diary display.
    this.eventManager.updateDiaryDisplay();

    // Check for profile existence.
    if (await this.profileManager.isProfileSaved()) {
      const profile = await this.profileManager.getProfile();
      console.log("Profile found:", profile);
      await this.showMainScreen();

      if (StateManager.get("welcomeDone") === "true") {
        this.viewManager.setPostButtonEnabled(true);
        StateManager.set("postButtonEnabled", "true");
      }
      
      if (StateManager.get("registrationCompleted") === "true") {
        this.gameEventManager.autoLaunchWelcomeEvent();
      }
    } else {
      console.log("Profile not found, showing registration screen.");
      this.showRegistrationScreen();
    }
  }

  /**
   * bindEvents – Attaches event listeners to UI elements.
   */
  bindEvents() {
    // Registration fields.
    this.nameInput.addEventListener('input', () => {
      console.log("Name input changed:", this.nameInput.value);
      this.validateRegistration();
    });
    this.genderSelect.addEventListener('change', () => {
      console.log("Gender select changed:", this.genderSelect.value);
      this.validateRegistration();
    });

    // "Next" button (Registration -> Apartment Plan).
    if (this.nextStepBtn) {
      this.nextStepBtn.addEventListener('click', () => {
        console.log("Next button clicked");
        this.goToApartmentPlanScreen();
      });
    }

    // Selfie, registration, reset, export, import and profile modal events.
    this.captureBtn.addEventListener('click', () => this.captureSelfie());
    this.completeBtn.addEventListener('click', () => this.completeRegistration());
    this.resetBtn.addEventListener('click', () => this.profileManager.resetProfile());
    this.exportBtn.addEventListener('click', () => this.exportProfile());
    this.importBtn.addEventListener('click', () => this.importProfile());
    this.profilePhotoElem.addEventListener("click", () => this.showProfileModal.show());

    // Screen transitions and floor navigation.
    document.getElementById("apartment-plan-next-btn").addEventListener("click", () => this.goToSelfieScreen());
    document.getElementById("prev-floor-btn").addEventListener("click", () => {
      if (this.apartmentPlanManager) {
        this.apartmentPlanManager.prevFloor();
      }
    });
    document.getElementById("next-floor-btn").addEventListener("click", () => {
      if (this.apartmentPlanManager) {
        this.apartmentPlanManager.nextFloor();
      }
    });

    // Toggle between camera and diary views.
    document.getElementById("toggle-camera").addEventListener("click", () => this.toggleCameraView());
    document.getElementById("toggle-diary").addEventListener("click", () => this.toggleCameraView());

    // "Post" button – delegate logic to QuestManager.
    if (this.postBtn) {
      this.postBtn.addEventListener('click', () => {
        this.questManager.handlePostButtonClick();
      });
    }

    // "Shoot" button – delegate logic to QuestManager.
    const shootBtn = document.getElementById("btn_shoot");
    if (shootBtn) {
      shootBtn.addEventListener("click", () => {
        this.questManager.handleShootMirrorQuest();
      });
    }
  }

  /**
   * validateRegistration – Checks that both "Name" and "Gender" fields are filled.
   */
  validateRegistration() {
    const isValid = (
      this.nameInput.value.trim() !== "" &&
      this.genderSelect.value !== ""
    );
    console.log("validateRegistration:", isValid);
    this.nextStepBtn.disabled = !isValid;
  }

  /**
   * goToApartmentPlanScreen – Saves registration data and switches to the apartment plan screen.
   */
  goToApartmentPlanScreen() {
    const regData = {
      name: this.nameInput.value.trim(),
      gender: this.genderSelect.value,
      language: document.getElementById('language-selector').value
    };
    StateManager.set('regData', JSON.stringify(regData));
    this.viewManager.switchScreen('apartment-plan-screen', 'apartment-plan-buttons');
    if (!this.apartmentPlanManager) {
      this.apartmentPlanManager = new ApartmentPlanManager('apartment-plan-container', this.databaseManager);
    }
  }

  /**
   * goToSelfieScreen – Switches to the selfie screen using ViewManager and starts the camera.
   */
  goToSelfieScreen() {
    this.viewManager.switchScreen('selfie-screen', 'selfie-buttons');
    this.viewManager.showGlobalCamera();
    this.cameraSectionManager.attachTo('global-camera', {
      width: "100%",
      height: "100%",
      filter: "grayscale(100%)"
    });
    this.cameraSectionManager.startCamera();
    this.completeBtn.disabled = true;
  }

  /**
   * captureSelfie – Captures a snapshot from the camera, converts it to grayscale,
   * displays the thumbnail and stores the selfie data.
   */
  captureSelfie() {
    console.log("📸 Attempting to capture selfie...");
    const video = this.cameraSectionManager.videoElement;
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
      const thumbnail = document.getElementById('selfie-thumbnail');
      thumbnail.src = grayscaleData;
      thumbnail.style.display = 'block';
      this.completeBtn.disabled = false;
      this.selfieData = grayscaleData;
      console.log("✅ Selfie captured successfully!");
    } catch (error) {
      ErrorManager.logError(error, "captureSelfie");
      ErrorManager.showError("Error capturing selfie! Please try again.");
    }
  }

  /**
   * completeRegistration – Completes registration: saves profile, stops camera,
   * switches to main screen and triggers WelcomeEvent.
   */
  async completeRegistration() {
    const selfieSrc = (this.selfiePreview?.src || document.getElementById('selfie-thumbnail').src);
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
    await this.profileManager.saveProfile(profile);
    StateManager.set("registrationCompleted", "true");

    this.cameraSectionManager.stopCamera();
    this.viewManager.hideGlobalCamera();

    await this.showMainScreen();

    if (StateManager.get("welcomeDone") === "true") {
      this.viewManager.setPostButtonEnabled(true);
      StateManager.set("postButtonEnabled", "true");
    } else {
      StateManager.set("postButtonEnabled", "false");
    }

    this.gameEventManager.autoLaunchWelcomeEvent();
  }

  /**
   * toggleCameraView – Toggles between camera view and diary view via ViewManager.
   */
  async toggleCameraView() {
    if (!this.isCameraOpen) {
      console.log("📸 Switching to camera view...");
      this.viewManager.showCameraView();
      await this.cameraSectionManager.startCamera();
      await new Promise(resolve => {
        const vid = this.cameraSectionManager.videoElement;
        if (vid.readyState >= 2) {
          resolve();
        } else {
          vid.onloadedmetadata = () => resolve();
        }
      });
      console.log("Video ready:", this.cameraSectionManager.videoElement.videoWidth, this.cameraSectionManager.videoElement.videoHeight);
      this.isCameraOpen = true;
    } else {
      console.log("📓 Returning to diary view...");
      this.viewManager.showDiaryView();
      this.cameraSectionManager.stopCamera();
      this.isCameraOpen = false;
    }
  }

  /**
   * showMainScreen – Switches to the main (diary) screen using ViewManager and updates profile display.
   */
  async showMainScreen() {
    this.viewManager.switchScreen('main-screen', 'main-buttons');
    this.viewManager.showToggleCameraButton();
    this.viewManager.showPostButton();
    const profile = await this.profileManager.getProfile();
    if (profile) {
      this.viewManager.updateProfileDisplay(profile);
      this.selfieData = profile.selfie;
    }
  }

  /**
   * showRegistrationScreen – Switches to the registration screen via ViewManager.
   */
  showRegistrationScreen() {
    this.viewManager.switchScreen('registration-screen', 'registration-buttons');
  }

  /**
   * exportProfile – Exports profile and diary data.
   */
  exportProfile() {
    this.profileManager.exportProfileData(this.databaseManager, this.apartmentPlanManager);
  }

  /**
   * importProfile – Imports profile data from a file.
   */
  importProfile() {
    if (this.importFileInput.files.length === 0) {
      ErrorManager.showError("Please select a profile file to import.");
      return;
    }
    const file = this.importFileInput.files[0];
    this.profileManager.importProfileData(file, this.databaseManager, this.apartmentPlanManager);
  }
}