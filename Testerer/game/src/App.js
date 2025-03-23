// App.js
// Import utility modules and managers
import { ImageUtils } from './utils/ImageUtils.js';
import { VisualEffectsManager } from './managers/VisualEffectsManager.js';

import { SQLiteDataManager } from './managers/SQLiteDataManager.js';
import { DatabaseManager } from './managers/DatabaseManager.js';

import { StateManager } from './managers/StateManager.js';
import { ErrorManager } from './managers/ErrorManager.js';

import { ViewManager } from './managers/ViewManager.js';

import { LanguageManager } from './managers/LanguageManager.js';
// Use the updated version of CameraSectionManager (with extended camera methods)
import { CameraSectionManager } from './managers/CameraSectionManager.js';
import { ProfileManager } from './managers/ProfileManager.js';
import { ApartmentPlanManager } from './managers/ApartmentPlanManager.js';
import { GhostManager } from './managers/GhostManager.js';
import { EventManager } from './managers/EventManager.js';
import { QuestManager } from './managers/QuestManager.js';
import { GameEventManager } from './managers/GameEventManager.js';
import { ShowProfileModal } from './managers/ShowProfileModal.js';

// NEW IMPORTS FOR CHAT MODULE
import { ChatManager } from './managers/ChatManager.js';
import { ChatScenarioManager } from './managers/ChatScenarioManager.js';

/**
 * Main application class.
 * Responsible for initializing core managers, setting up the UI,
 * loading persisted state, and handling primary navigation and events.
 *
 * The constructor accepts an optional dependency object to support DI.
 * If a dependency is not provided, a new instance is created.
 *
 * NOTE: The new camera functionality is integrated into the updated CameraSectionManager,
 *       and the UI for extended camera modes is handled via the ViewManager (top controls).
 */
export class App {
  constructor(deps = {}) {
    // Initialize or inject ViewManager and bind UI events.
    this.viewManager = deps.viewManager || new ViewManager();
    this.viewManager.bindEvents(this);

    // Create or inject persistence managers for database operations.
    this.sqliteDataManager = deps.sqliteDataManager || new SQLiteDataManager();
    this.databaseManager = deps.databaseManager || new DatabaseManager(this.sqliteDataManager);

    // Application state variables.
    this.isCameraOpen = false;
    this.selfieData = null;

    // Initialize or inject core domain managers.
    this.languageManager = deps.languageManager || new LanguageManager('language-selector');
    // Use the updated CameraSectionManager.
    this.cameraSectionManager = deps.cameraSectionManager || new CameraSectionManager();
    // Set camera manager reference in ViewManager.
    this.viewManager.setCameraManager(this.cameraSectionManager);
    this.profileManager = deps.profileManager || new ProfileManager(this.sqliteDataManager);

    // Create or inject VisualEffectsManager instance.
    this.visualEffectsManager = deps.visualEffectsManager || new VisualEffectsManager(this, this.viewManager.controlsPanel);

    // Initialize or inject GhostManager.
    const savedSequenceIndex = parseInt(StateManager.get('currentSequenceIndex'), 10) || 0;
    this.ghostManager = deps.ghostManager || new GhostManager(savedSequenceIndex, this.profileManager, this);

    // Create or inject EventManager instance and pass required dependencies.
    this.eventManager = deps.eventManager || new EventManager(
      this.databaseManager,
      this.languageManager,
      this.ghostManager,
      this.visualEffectsManager
    );
    // Set cross-manager references.
    this.eventManager.viewManager = this.viewManager;
    this.ghostManager.eventManager = this.eventManager;

    // Initialize or inject QuestManager and GameEventManager.
    this.questManager = deps.questManager || new QuestManager(this.eventManager, this);
    this.gameEventManager = deps.gameEventManager || new GameEventManager(this.eventManager, this, this.languageManager);

    // Create or inject ShowProfileModal.
    this.showProfileModal = deps.showProfileModal || new ShowProfileModal(this);

    // Temporary canvas used for processing selfie images.
    this.tempCanvas = document.createElement("canvas");
    this.tempCtx = this.tempCanvas.getContext("2d");

    // ================================
    // NEW: Initialize ChatManager for independent chat functionality.
    // The chat module uses the TemplateEngine to load a chat fragment and update its content dynamically.
    // Pass databaseManager so that ChatManager can fetch chat messages from the DB.
    this.chatManager = deps.chatManager || new ChatManager({
      templateUrl: `${this.getBasePath()}/src/templates/chat_template.html`, // dynamic path determined by getBasePath()
      mode: 'full',
      databaseManager: this.databaseManager
    });
    // Optionally, initialize ChatScenarioManager if a scenario configuration is provided:
    // this.chatScenarioManager = deps.chatScenarioManager || new ChatScenarioManager(this.chatManager);
    // ================================

    // Begin application initialization.
    this.init();
  }

  /**
   * getBasePath - Returns the base path dynamically based on the current location.
   * No fixed paths are used.
   *
   * @returns {string} The base URL (origin + path without the file name).
   */
  getBasePath() {
    const loc = window.location;
    // Remove the last segment (filename) from pathname
    const path = loc.pathname.substring(0, loc.pathname.lastIndexOf('/'));
    return loc.origin + path;
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
   * This method awaits the database initialization,
   * then loads persisted state, synchronizes quest state, updates the UI,
   * and displays either the main screen or the registration screen.
   */
  async init() {
    // Wait for database initialization to complete.
    await this.databaseManager.initDatabasePromise;
    console.log("Database initialization complete.");

    // Load persisted application state.
    this.loadAppState();

    // Synchronize quest state via QuestManager.
    await this.questManager.syncQuestState();

    // Restore UI for all active quests.
    this.questManager.restoreAllActiveQuests();

    // Update UI: show toggle camera button and update diary display.
    this.viewManager.showToggleCameraButton();
    this.eventManager.updateDiaryDisplay();

    // Create top controls for extended camera modes.
    this.viewManager.createTopCameraControls();

    // Initialize ChatManager by loading the chat template.
    await this.chatManager.init();

    // Check if a user profile is already saved.
    if (await this.profileManager.isProfileSaved()) {
      const profile = await this.profileManager.getProfile();
      console.log("Profile found:", profile);
      await this.showMainScreen();
    } else {
      console.log("Profile not found, showing registration screen.");
      this.showRegistrationScreen();
    }
  }

  /**
   * goToApartmentPlanScreen - Callback invoked by the ViewManager when registration data is needed.
   * Retrieves registration data, saves it via StateManager, and switches to the apartment plan screen.
   */
  goToApartmentPlanScreen() {
    const regData = this.viewManager.getRegistrationData();
    if (!regData) {
      ErrorManager.showError("Registration data missing.");
      return;
    }
    StateManager.set('regData', JSON.stringify(regData));
    this.viewManager.switchScreen('apartment-plan-screen', 'apartment-plan-buttons');
    if (!this.apartmentPlanManager) {
      this.apartmentPlanManager = new ApartmentPlanManager('apartment-plan-container', this.databaseManager, this);
    }
  }

  /**
   * goToSelfieScreen - Transitions the UI to the selfie capture screen.
   * Displays the global camera view, starts the camera, and disables the complete registration button.
   */
  goToSelfieScreen() {
    this.viewManager.switchScreen('selfie-screen', 'selfie-buttons');
    this.viewManager.showGlobalCamera();
    this.cameraSectionManager.startCamera();
    this.viewManager.disableCompleteButton();
  }

  /**
   * captureSelfie - Captures an image from the active camera stream.
   * Converts the frame to grayscale using ImageUtils, updates the selfie preview,
   * enables the "Complete Registration" button, and stores the selfie data.
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
      
      // Update selfie preview via ViewManager.
      this.viewManager.updateSelfiePreview(grayscaleData);
      
      // Enable the "Complete Registration" button.
      this.viewManager.enableCompleteButton();
      
      // Save the processed selfie data.
      this.selfieData = grayscaleData;
      
      console.log("✅ Selfie captured successfully!");
    } catch (error) {
      ErrorManager.logError(error, "captureSelfie");
      ErrorManager.showError("Error capturing selfie! Please try again.");
    }
  }

  /**
   * completeRegistration - Completes the registration process.
   * Validates captured selfie and registration data, saves profile via ProfileManager,
   * stops the camera, hides the global camera view, and shows the main screen.
   * Finally, auto-launches the welcome event.
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
   * If the camera is not open, starts it and waits for metadata;
   * otherwise, stops the camera and shows the diary.
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
   * Switches to the main screen, updates the toggle camera button, and sets the "Post" button state.
   */
  async showMainScreen() {
    this.viewManager.switchScreen('main-screen', 'main-buttons');
    this.viewManager.showToggleCameraButton();
    if (StateManager.get("mirrorQuestReady") === "true") {
      this.viewManager.setPostButtonEnabled(true);
    } else {
      this.viewManager.setPostButtonEnabled(false);
    }
    const profile = await this.profileManager.getProfile();
    if (profile) {
      this.viewManager.updateProfileDisplay(profile);
      this.selfieData = profile.selfie;
    }
  }

  /**
   * showRegistrationScreen - Displays the registration screen and resets transient state.
   */
  showRegistrationScreen() {
    StateManager.remove("welcomeDone");
    StateManager.remove("mirrorQuestReady");
    StateManager.remove("postButtonEnabled");
    StateManager.remove("regData");
    StateManager.remove("quest_state_repeating_quest");

    this.viewManager.switchScreen('registration-screen', 'registration-buttons');
  }

  /**
   * exportProfile - Exports the profile data.
   */
  exportProfile() {
    this.profileManager.exportProfileData(this.databaseManager, this.apartmentPlanManager);
  }

  /**
   * importProfile - Imports profile data from a selected file.
   */
  importProfile() {
    const file = this.viewManager.getImportFile();
    if (!file) {
      ErrorManager.showError("Please select a profile file to import.");
      return;
    }
    this.profileManager.importProfileData(file, this.databaseManager, this.apartmentPlanManager);
  }

  /**
   * toggleChat - Toggles the display of the chat section.
   * When the chat button is clicked, this method shows or hides the chat interface.
   */
  toggleChat() {
    if (this.chatManager && this.chatManager.container) {
      if (this.chatManager.container.style.display === 'block') {
        this.chatManager.hide();
      } else {
        this.chatManager.show();
      }
    } else {
      console.error("ChatManager is not initialized or chat container not found.");
    }
  }
}