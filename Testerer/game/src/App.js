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
 * NOTE: All UI-related methods have been refactored to the ViewManager.
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
    this.cameraSectionManager = deps.cameraSectionManager || new CameraSectionManager();
    this.viewManager.setCameraManager(this.cameraSectionManager);
    this.profileManager = deps.profileManager || new ProfileManager(this.sqliteDataManager);

    // Create or inject VisualEffectsManager instance.
    this.visualEffectsManager = deps.visualEffectsManager || new VisualEffectsManager(this, this.viewManager.controlsPanel);

    // Initialize or inject GhostManager.
    const savedSequenceIndex = parseInt(StateManager.get('currentSequenceIndex'), 10) || 0;
    this.ghostManager = deps.ghostManager || new GhostManager(savedSequenceIndex, this.profileManager, this);

    // Create or inject EventManager instance and set cross-manager references.
    this.eventManager = deps.eventManager || new EventManager(
      this.databaseManager,
      this.languageManager,
      this.ghostManager,
      this.visualEffectsManager
    );
    this.eventManager.viewManager = this.viewManager;
    this.ghostManager.eventManager = this.eventManager;

    // Initialize or inject QuestManager and GameEventManager.
    this.questManager = deps.questManager || new QuestManager(this.eventManager, this);
    this.gameEventManager = deps.gameEventManager || new GameEventManager(this.eventManager, this, this.languageManager);

    // Create or inject ShowProfileModal.
    this.showProfileModal = deps.showProfileModal || new ShowProfileModal(this);

    // Initialize ChatManager for independent chat functionality.
    this.chatManager = deps.chatManager || new ChatManager({
      templateUrl: `${this.getBasePath()}/src/templates/chat_template.html`,
      mode: 'full'
    });
    // Optionally, initialize ChatScenarioManager if a scenario configuration is provided later.
    // this.chatScenarioManager = deps.chatScenarioManager || new ChatScenarioManager(this.chatManager);

    // Temporary canvas used for processing selfie images.
    this.tempCanvas = document.createElement("canvas");
    this.tempCtx = this.tempCanvas.getContext("2d");

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
      await this.viewManager.showMainScreen(this);
    } else {
      console.log("Profile not found, showing registration screen.");
      this.viewManager.showRegistrationScreen(this);
    }
  }
}