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

export class App {
  constructor() {
    // Initialize the ViewManager and delegate UI event binding.
    this.viewManager = new ViewManager();
    this.viewManager.bindEvents(this);

    // Create persistence managers.
    this.sqliteDataManager = new SQLiteDataManager();
    this.databaseManager = new DatabaseManager(this.sqliteDataManager);

    // Application state.
    this.isCameraOpen = false;
    this.selfieData = null;

    // Initialize core managers.
    this.languageManager = new LanguageManager('language-selector');
    this.cameraSectionManager = new cameraSectionManager();
    this.profileManager = new ProfileManager(this.sqliteDataManager);

    this.ghostManager = new GhostManager(null, this.profileManager, this);
    this.eventManager = new EventManager(
      this.databaseManager,
      this.languageManager,
      this.ghostManager,
      new VisualEffectsManager(this, this.viewManager.getControlsPanel())
    );
    // Delegate ViewManager reference.
    this.eventManager.viewManager = this.viewManager;
    this.ghostManager.eventManager = this.eventManager;

    this.questManager = new QuestManager(this.eventManager, this);
    this.gameEventManager = new GameEventManager(this.eventManager, this, this.languageManager);
    this.showProfileModal = new ShowProfileModal(this);

    // Temporary canvas for selfie processing.
    this.tempCanvas = document.createElement("canvas");
    this.tempCtx = this.tempCanvas.getContext("2d");

    this.init();
  }

  loadAppState() {
    const savedGhostId = StateManager.get('currentGhostId');
    if (savedGhostId) {
      this.ghostManager.setCurrentGhost(parseInt(savedGhostId));
    } else {
      this.ghostManager.setCurrentGhost(1);
    }
  }

  async init() {
    this.loadAppState();
    await this.databaseManager.initDatabasePromise;

    this.viewManager.showToggleCameraButton();
    this.eventManager.updateDiaryDisplay();

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

  // Callback invoked by ViewManager when registration form data is needed.
  goToApartmentPlanScreen() {
    const regData = this.viewManager.getRegistrationData();
    if (!regData) {
      ErrorManager.showError("Registration data missing.");
      return;
    }
    StateManager.set('regData', JSON.stringify(regData));
    this.viewManager.switchScreen('apartment-plan-screen', 'apartment-plan-buttons');
    if (!this.apartmentPlanManager) {
      this.apartmentPlanManager = new ApartmentPlanManager('apartment-plan-container', this.databaseManager);
    }
  }

  goToSelfieScreen() {
    this.viewManager.switchScreen('selfie-screen', 'selfie-buttons');
    this.viewManager.showGlobalCamera();
    this.cameraSectionManager.attachTo('global-camera', {
      width: "100%",
      height: "100%",
      filter: "grayscale(100%)"
    });
    this.cameraSectionManager.startCamera();
    this.viewManager.disableCompleteButton();
  }

  async captureSelfie() {
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
      this.viewManager.updateSelfiePreview(grayscaleData);
      this.viewManager.enableCompleteButton();
      this.selfieData = grayscaleData;
      console.log("✅ Selfie captured successfully!");
    } catch (error) {
      ErrorManager.logError(error, "captureSelfie");
      ErrorManager.showError("Error capturing selfie! Please try again.");
    }
  }

  async completeRegistration() {
    const selfieSrc = this.viewManager.getSelfieSource();
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

  showRegistrationScreen() {
    this.viewManager.switchScreen('registration-screen', 'registration-buttons');
  }

  exportProfile() {
    this.profileManager.exportProfileData(this.databaseManager, this.apartmentPlanManager);
  }

  importProfile() {
    const file = this.viewManager.getImportFile();
    if (!file) {
      ErrorManager.showError("Please select a profile file to import.");
      return;
    }
    this.profileManager.importProfileData(file, this.databaseManager, this.apartmentPlanManager);
  }
}