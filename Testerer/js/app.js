import { ImageUtils } from './utils/imageUtils.js';
import { VisualEffectsManager } from './utils/visualEffectsManager.js';

import { SQLiteDataManager } from './SQLiteDataManager.js';
import { DatabaseManager } from './databaseManager.js';

import { StateManager } from './stateManager.js';
import { ErrorManager } from './errorManager.js';

import { ViewManager } from './viewManager.js';

import { LanguageManager } from './languageManager.js';
import { cameraSectionManager } from './cameraSectionManager.js';
import { ProfileManager } from './profileManager.js';
import { ApartmentPlanManager } from './apartmentPlanManager.js';
import { GhostManager } from './ghostManager.js';
import { EventManager } from './eventManager.js';
import { QuestManager } from './questManager.js';
import { GameEventManager } from './gameEventManager.js';
import { ShowProfileModal } from './showProfileModal.js';

export class App {
  constructor() {
    // Initialize the ViewManager and bind UI events to the application instance.
    this.viewManager = new ViewManager();
    this.viewManager.bindEvents(this);

    // Create persistence managers.
    this.sqliteDataManager = new SQLiteDataManager();
    this.databaseManager = new DatabaseManager(this.sqliteDataManager);

    // Application state variables.
    this.isCameraOpen = false;
    this.selfieData = null;

    // Initialize core domain managers.
    this.languageManager = new LanguageManager('language-selector');
    this.cameraSectionManager = new cameraSectionManager();
    this.profileManager = new ProfileManager(this.sqliteDataManager);

    // Create VisualEffectsManager instance and assign it so that events (e.g. welcome event) can access it.
    this.visualEffectsManager = new VisualEffectsManager(this, this.viewManager.controlsPanel);

    this.ghostManager = new GhostManager(null, this.profileManager, this);
    // Pass the same VisualEffectsManager instance to EventManager.
    this.eventManager = new EventManager(
      this.databaseManager,
      this.languageManager,
      this.ghostManager,
      this.visualEffectsManager
    );
    // Set cross-manager references.
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

  // Load previously saved application state.
  loadAppState() {
    const savedGhostId = StateManager.get('currentGhostId');
    if (savedGhostId) {
      this.ghostManager.setCurrentGhost(parseInt(savedGhostId));
    } else {
      this.ghostManager.setCurrentGhost(1);
    }
  }

  /**
   * init - Initializes the application.
   * After loading the state and initializing the database,
   * it calls QuestManager.syncQuestState() to synchronize quest state from the DB.
   */
  async init() {
    this.loadAppState();
    await this.databaseManager.initDatabasePromise;

    // Synchronize quest state from the database via QuestManager.
    await this.questManager.syncQuestState();

    this.viewManager.showToggleCameraButton();
    this.eventManager.updateDiaryDisplay();

    if (await this.profileManager.isProfileSaved()) {
      const profile = await this.profileManager.getProfile();
      console.log("Profile found:", profile);
      await this.showMainScreen();

      // The Post button state is now set by syncQuestState(), so we do not override it here.
      if (StateManager.get("registrationCompleted") === "true") {
        this.gameEventManager.autoLaunchWelcomeEvent();
      }
    } else {
      console.log("Profile not found, showing registration screen.");
      this.showRegistrationScreen();
    }
  }

  // Callback invoked by the ViewManager when registration form data is needed.
  goToApartmentPlanScreen() {
    const regData = this.viewManager.getRegistrationData();
    if (!regData) {
      ErrorManager.showError("Registration data missing.");
      return;
    }
    // Save registration data using StateManager.
    StateManager.set('regData', JSON.stringify(regData));
    this.viewManager.switchScreen('apartment-plan-screen', 'apartment-plan-buttons');
    if (!this.apartmentPlanManager) {
      this.apartmentPlanManager = new ApartmentPlanManager('apartment-plan-container', this.databaseManager, this);
    }
  }

  // Transition to the selfie capture screen.
  goToSelfieScreen() {
    this.viewManager.switchScreen('selfie-screen', 'selfie-buttons');
    this.viewManager.showGlobalCamera();
    // No need to call attachTo explicitly – startCamera() will auto-attach with proper options.
    this.cameraSectionManager.startCamera();
    this.viewManager.disableCompleteButton();
  }

  /**
   * captureSelfie - Captures an image from the active camera stream,
   * converts it to grayscale, updates the selfie preview, and enables the "Complete Registration" button.
   */
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
      // Create a temporary canvas to capture the current video frame.
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error("Failed to get 2D drawing context.");
      }
      // Draw the current frame of the video onto the canvas.
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert the captured frame to grayscale.
      const grayscaleData = ImageUtils.convertToGrayscale(canvas);
      
      // Update the selfie preview using ViewManager.
      this.viewManager.updateSelfiePreview(grayscaleData);
      
      // Enable the "Complete Registration" button.
      this.viewManager.enableCompleteButton();
      
      // Save the captured selfie data for later use.
      this.selfieData = grayscaleData;
      
      console.log("✅ Selfie captured successfully!");
    } catch (error) {
      ErrorManager.logError(error, "captureSelfie");
      ErrorManager.showError("Error capturing selfie! Please try again.");
    }
  }

  // Complete the registration process.
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

    // Stop the camera and hide the global camera view.
    this.cameraSectionManager.stopCamera();
    this.viewManager.hideGlobalCamera();

    await this.showMainScreen();

    // After registration, the Post button state is determined by quest state synchronization.
    // (welcomeDone is used only for initial welcome event activation.)
    
    // Auto-launch the welcome event after registration.
    this.gameEventManager.autoLaunchWelcomeEvent();
  }

  // Toggle between camera view and diary view.
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

  // Display the main screen after successful registration.
  async showMainScreen() {
    this.viewManager.switchScreen('main-screen', 'main-buttons');
    this.viewManager.showToggleCameraButton();
    // Set the Post button state based on the persisted quest state.
    if (StateManager.get("postButtonDisabled") === "true") {
      this.viewManager.setPostButtonEnabled(false);
    } else {
      this.viewManager.setPostButtonEnabled(true);
    }
    const profile = await this.profileManager.getProfile();
    if (profile) {
      this.viewManager.updateProfileDisplay(profile);
      this.selfieData = profile.selfie;
    }
  }

  // Show the registration screen and reset state flags for a new registration cycle.
  showRegistrationScreen() {
    // Reset state keys to ensure a clean registration process.
    StateManager.remove("welcomeDone");
    StateManager.remove("mirrorQuestReady");
    StateManager.remove("postButtonEnabled");
    StateManager.remove("regData");
    // Optionally, remove quest state if it exists.
    StateManager.remove("quest_state_repeating_quest");

    this.viewManager.switchScreen('registration-screen', 'registration-buttons');
  }

  // Export the profile data.
  exportProfile() {
    this.profileManager.exportProfileData(this.databaseManager, this.apartmentPlanManager);
  }

  // Import profile data from a selected file.
  importProfile() {
    const file = this.viewManager.getImportFile();
    if (!file) {
      ErrorManager.showError("Please select a profile file to import.");
      return;
    }
    this.profileManager.importProfileData(file, this.databaseManager, this.apartmentPlanManager);
  }
}