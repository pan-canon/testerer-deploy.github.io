// Import utility modules and managers
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

/**
 * Main application class.
 * Responsible for initializing core managers, setting up the UI,
 * loading the persisted state, and handling primary navigation and events.
 */
export class App {
  constructor() {
    // Initialize ViewManager and bind UI events to the application instance.
    this.viewManager = new ViewManager();
    this.viewManager.bindEvents(this);

    // Create persistence managers for database operations.
    this.sqliteDataManager = new SQLiteDataManager();
    this.databaseManager = new DatabaseManager(this.sqliteDataManager);

    // Application state variables.
    this.isCameraOpen = false;
    this.selfieData = null;

    // Initialize core domain managers.
    this.languageManager = new LanguageManager('language-selector');
    this.cameraSectionManager = new cameraSectionManager();
    this.profileManager = new ProfileManager(this.sqliteDataManager);

    // Create VisualEffectsManager instance to handle UI visual effects.
    this.visualEffectsManager = new VisualEffectsManager(this, this.viewManager.controlsPanel);

    // Initialize GhostManager with a null eventManager initially (will be set later) and pass profileManager and app instance.
    this.ghostManager = new GhostManager(null, this.profileManager, this);
    
    // Create EventManager instance and pass required dependencies.
    this.eventManager = new EventManager(
      this.databaseManager,
      this.languageManager,
      this.ghostManager,
      this.visualEffectsManager
    );
    // Set cross-manager references.
    this.eventManager.viewManager = this.viewManager;
    this.ghostManager.eventManager = this.eventManager;

    // Initialize QuestManager and GameEventManager.
    this.questManager = new QuestManager(this.eventManager, this);
    this.gameEventManager = new GameEventManager(this.eventManager, this, this.languageManager);
    
    // Modal for profile display.
    this.showProfileModal = new ShowProfileModal(this);

    // Temporary canvas used for processing selfie images.
    this.tempCanvas = document.createElement("canvas");
    this.tempCtx = this.tempCanvas.getContext("2d");

    // Begin application initialization.
    this.init();
  }

  /**
   * loadAppState - Loads previously saved application state.
   * Retrieves the saved ghost ID from StateManager and sets the active ghost accordingly.
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
   * init - Initializes the application.
   * 
   * This method first awaits the completion of the database initialization,
   * then loads the saved application state (such as the active ghost) to ensure
   * that any state-saving calls occur only after the database is fully ready.
   * Finally, it synchronizes quest state from the database, updates the UI,
   * and either displays the main screen (if a profile exists) or shows the registration screen.
   */
  async init() {
    // Wait for database initialization to complete.
    await this.databaseManager.initDatabasePromise;
    console.log("Database initialization complete.");

    // Now that the database is ready, load the persisted application state.
    this.loadAppState();

    // Synchronize quest state from the database via QuestManager.
    await this.questManager.syncQuestState();

    // Update UI: Show the toggle camera button and update the diary display.
    this.viewManager.showToggleCameraButton();
    this.eventManager.updateDiaryDisplay();

    // Check if a user profile is already saved.
    if (await this.profileManager.isProfileSaved()) {
      const profile = await this.profileManager.getProfile();
      console.log("Profile found:", profile);
      await this.showMainScreen();

      // If registration is completed, auto-launch the welcome event.
      if (StateManager.get("registrationCompleted") === "true") {
        this.gameEventManager.autoLaunchWelcomeEvent();
      }
    } else {
      // If no profile is found, show the registration screen.
      console.log("Profile not found, showing registration screen.");
      this.showRegistrationScreen();
    }
  }

  /**
   * goToApartmentPlanScreen - Callback invoked by the ViewManager when registration form data is needed.
   * 
   * Retrieves registration data from the ViewManager, saves it via StateManager,
   * and then switches the screen to the apartment plan screen.
   */
  goToApartmentPlanScreen() {
    const regData = this.viewManager.getRegistrationData();
    if (!regData) {
      ErrorManager.showError("Registration data missing.");
      return;
    }
    // Save registration data as a JSON string.
    StateManager.set('regData', JSON.stringify(regData));
    this.viewManager.switchScreen('apartment-plan-screen', 'apartment-plan-buttons');
    if (!this.apartmentPlanManager) {
      this.apartmentPlanManager = new ApartmentPlanManager('apartment-plan-container', this.databaseManager, this);
    }
  }

  /**
   * goToSelfieScreen - Transitions the UI to the selfie capture screen.
   * 
   * Switches the screen, shows the global camera view, starts the camera, and disables the complete registration button.
   */
  goToSelfieScreen() {
    this.viewManager.switchScreen('selfie-screen', 'selfie-buttons');
    this.viewManager.showGlobalCamera();
    // startCamera() will auto-attach the video element with proper options.
    this.cameraSectionManager.startCamera();
    this.viewManager.disableCompleteButton();
  }

  /**
   * captureSelfie - Captures an image from the active camera stream.
   * 
   * The method converts the captured frame to grayscale, updates the selfie preview via ViewManager,
   * enables the "Complete Registration" button, and stores the selfie data for later use.
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
      // Draw the current frame from the video onto the canvas.
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert the captured frame to grayscale using ImageUtils.
      const grayscaleData = ImageUtils.convertToGrayscale(canvas);
      
      // Update the selfie preview image in the UI.
      this.viewManager.updateSelfiePreview(grayscaleData);
      
      // Enable the "Complete Registration" button.
      this.viewManager.enableCompleteButton();
      
      // Save the processed selfie data for later use (e.g., profile creation).
      this.selfieData = grayscaleData;
      
      console.log("✅ Selfie captured successfully!");
    } catch (error) {
      ErrorManager.logError(error, "captureSelfie");
      ErrorManager.showError("Error capturing selfie! Please try again.");
    }
  }

  /**
   * completeRegistration - Completes the registration process.
   * 
   * Validates that a selfie has been captured and registration data is available.
   * Then it saves the profile via ProfileManager, updates the registration state,
   * stops the camera, hides the global camera view, and transitions to the main screen.
   * Finally, it auto-launches the welcome event.
   */
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

    // Auto-launch the welcome event after registration.
    this.gameEventManager.autoLaunchWelcomeEvent();
  }

  /**
   * toggleCameraView - Toggles between camera view and diary view.
   * 
   * If the camera is not open, switches to the camera view, starts the camera, and waits for video metadata.
   * Otherwise, switches back to the diary view and stops the camera.
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
   * showMainScreen - Displays the main screen after successful registration.
   * 
   * Switches to the main screen, updates the toggle camera button,
   * and sets the "Post" button state based on the persisted quest state.
   */
  async showMainScreen() {
    this.viewManager.switchScreen('main-screen', 'main-buttons');
    this.viewManager.showToggleCameraButton();
    // Set the "Post" button state according to the saved quest state.
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

  /**
   * showRegistrationScreen - Displays the registration screen and resets state keys.
   * 
   * Clears transient state keys via StateManager to ensure a clean registration cycle,
   * then switches to the registration screen.
   */
  showRegistrationScreen() {
    // Reset state keys for a clean registration process.
    StateManager.remove("welcomeDone");
    StateManager.remove("mirrorQuestReady");
    StateManager.remove("postButtonEnabled");
    StateManager.remove("regData");
    // Optionally, remove repeating quest state if it exists.
    StateManager.remove("quest_state_repeating_quest");

    this.viewManager.switchScreen('registration-screen', 'registration-buttons');
  }

  /**
   * exportProfile - Exports the profile data.
   * 
   * Delegates the export operation to ProfileManager along with required managers.
   */
  exportProfile() {
    this.profileManager.exportProfileData(this.databaseManager, this.apartmentPlanManager);
  }

  /**
   * importProfile - Imports profile data from a selected file.
   * 
   * Retrieves the file via ViewManager and delegates the import operation to ProfileManager.
   */
  importProfile() {
    const file = this.viewManager.getImportFile();
    if (!file) {
      ErrorManager.showError("Please select a profile file to import.");
      return;
    }
    this.profileManager.importProfileData(file, this.databaseManager, this.apartmentPlanManager);
  }
}