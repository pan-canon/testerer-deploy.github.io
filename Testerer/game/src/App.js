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
 * App class
 *
 * Main application class responsible for initializing core managers,
 * loading persisted state, and coordinating business logic.
 * All UI-related operations (screen switching, chat UI updates, etc.) are delegated to the ViewManager.
 */
export class App {
  constructor(deps = {}) {
    // Initialize (or inject) ViewManager and bind UI events.
    this.viewManager = deps.viewManager || new ViewManager();
    this.viewManager.bindEvents(this);
    
    // Initialize persistence managers.
    this.sqliteDataManager = deps.sqliteDataManager || new SQLiteDataManager();
    this.databaseManager = deps.databaseManager || new DatabaseManager(this.sqliteDataManager);

    // Application state variables.
    this.isCameraOpen = false;
    this.selfieData = null;

    // Initialize core domain managers.
    this.languageManager = deps.languageManager || new LanguageManager('language-selector');
    this.cameraSectionManager = deps.cameraSectionManager || new CameraSectionManager();
    // Pass camera manager to ViewManager.
    this.viewManager.setCameraManager(this.cameraSectionManager);
    this.profileManager = deps.profileManager || new ProfileManager(this.sqliteDataManager);

    this.visualEffectsManager = deps.visualEffectsManager || new VisualEffectsManager(this, this.viewManager.controlsPanel);

    const savedSequenceIndex = parseInt(StateManager.get('currentSequenceIndex'), 10) || 0;
    this.ghostManager = deps.ghostManager || new GhostManager(savedSequenceIndex, this.profileManager, this);

    this.eventManager = deps.eventManager || new EventManager(
      this.databaseManager,
      this.languageManager,
      this.ghostManager,
      this.visualEffectsManager
    );
    // Set cross-manager references.
    this.eventManager.viewManager = this.viewManager;
    this.ghostManager.eventManager = this.eventManager;

    this.questManager = deps.questManager || new QuestManager(this.eventManager, this);
    this.gameEventManager = deps.gameEventManager || new GameEventManager(this.eventManager, this, this.languageManager);

    this.showProfileModal = deps.showProfileModal || new ShowProfileModal(this);

    // Temporary canvas for processing selfie images.
    this.tempCanvas = document.createElement("canvas");
    this.tempCtx = this.tempCanvas.getContext("2d");

    // ================================
    // NEW: Initialize ChatManager for independent chat functionality.
    this.chatManager = deps.chatManager || new ChatManager({
      templateUrl: `${this.getBasePath()}/src/templates/chat_template.html`,
      mode: 'full'
    });
    // Optionally, you can initialize ChatScenarioManager here if needed.
    // this.chatScenarioManager = deps.chatScenarioManager || new ChatScenarioManager(this.chatManager);
    // Delegate chat UI management to ViewManager.
    this.viewManager.setChatManager(this.chatManager);
    // ================================

    // Begin initialization.
    this.init();
  }

  /**
   * getBasePath - Returns the dynamic base URL (origin + path without the file name).
   * @returns {string} Base URL.
   */
  getBasePath() {
    const loc = window.location;
    const path = loc.pathname.substring(0, loc.pathname.lastIndexOf('/'));
    return loc.origin + path;
  }

  /**
   * loadAppState - Loads persisted application state (e.g. active ghost ID) from StateManager.
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
   * init - Asynchronously initializes the application.
   * Waits for the database to initialize, loads state, synchronizes quest state,
   * and then delegates screen display to ViewManager.
   */
  async init() {
    await this.databaseManager.initDatabasePromise;
    console.log("Database initialization complete.");

    this.loadAppState();

    await this.questManager.syncQuestState();
    this.questManager.restoreAllActiveQuests();

    // Delegate UI updates to ViewManager.
    this.viewManager.showToggleCameraButton();
    this.eventManager.updateDiaryDisplay();
    this.viewManager.createTopCameraControls();

    // Initialize chat UI.
    await this.chatManager.init();
    this.viewManager.initializeChat();

    // Check if a user profile is saved.
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
   * goToApartmentPlanScreen - Processes registration data and delegates screen switch.
   */
  goToApartmentPlanScreen() {
    const regData = this.viewManager.getRegistrationData();
    if (!regData) {
      ErrorManager.showError("Registration data missing.");
      return;
    }
    StateManager.set('regData', JSON.stringify(regData));
    // Delegate UI switching.
    this.viewManager.showApartmentPlanScreen();
    if (!this.apartmentPlanManager) {
      this.apartmentPlanManager = new ApartmentPlanManager('apartment-plan-container', this.databaseManager, this);
    }
  }

  /**
   * goToSelfieScreen - Delegates UI transition to the selfie capture screen.
   */
  goToSelfieScreen() {
    this.viewManager.showSelfieScreen();
    this.cameraSectionManager.startCamera();
    this.viewManager.disableCompleteButton();
  }

  /**
   * captureSelfie - Captures a selfie from the active camera stream, processes it,
   * and updates the selfie preview via ViewManager.
   */
  async captureSelfie() {
    console.log("Attempting to capture selfie...");
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
      
      // Convert the captured image to grayscale.
      const grayscaleData = ImageUtils.convertToGrayscale(canvas);
      
      // Update the selfie preview and enable complete button via ViewManager.
      this.viewManager.updateSelfiePreview(grayscaleData);
      this.viewManager.enableCompleteButton();
      
      this.selfieData = grayscaleData;
      console.log("Selfie captured successfully!");
    } catch (error) {
      ErrorManager.logError(error, "captureSelfie");
      ErrorManager.showError("Error capturing selfie! Please try again.");
    }
  }

  /**
   * completeRegistration - Completes registration by saving profile data,
   * stopping the camera, hiding the camera UI, and showing the main screen.
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

    // Stop the camera and hide its UI.
    this.cameraSectionManager.stopCamera();
    this.viewManager.hideGlobalCamera();

    await this.showMainScreen();
    // Auto-launch welcome event.
    this.gameEventManager.autoLaunchWelcomeEvent();
  }

  /**
   * toggleCameraView - Delegates the toggling between camera view and diary view to ViewManager.
   */
  async toggleCameraView() {
    if (!this.isCameraOpen) {
      console.log("Switching to camera view...");
      await this.viewManager.showCameraViewAsync();
      this.isCameraOpen = true;
    } else {
      console.log("Returning to diary view...");
      this.viewManager.showDiaryView();
      this.cameraSectionManager.stopCamera();
      this.isCameraOpen = false;
    }
  }

  /**
   * showMainScreen - Delegates display of the main screen to ViewManager.
   */
  async showMainScreen() {
    this.viewManager.showMainScreen();
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
   * showRegistrationScreen - Delegates display of the registration screen to ViewManager.
   */
  showRegistrationScreen() {
    // Clear transient state.
    StateManager.remove("welcomeDone");
    StateManager.remove("mirrorQuestReady");
    StateManager.remove("postButtonEnabled");
    StateManager.remove("regData");
    StateManager.remove("quest_state_repeating_quest");

    this.viewManager.showRegistrationScreen();
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
   * toggleChat - Delegates toggling of the chat section to ViewManager.
   */
  toggleChat() {
    this.viewManager.toggleChatSection();
  }
}