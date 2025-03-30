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
// Note: The ApartmentPlanManager import is now removed from App.js,
// because all apartment plan UI logic is delegated to the ViewManager.
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
 * NOTE: All UI operations have been moved to the ViewManager module.
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

    // NEW: Initialize ChatManager for independent chat functionality.
    this.chatManager = deps.chatManager || new ChatManager({
      templateUrl: `${this.getBasePath()}/src/templates/chat_template.html`,
      mode: 'full',
      databaseManager: this.databaseManager
    });
    // Optionally, initialize ChatScenarioManager if needed.
    // this.chatScenarioManager = deps.chatScenarioManager || new ChatScenarioManager(this.chatManager);

    // Begin application initialization.
    this.init();
  }

  /**
   * getBasePath - Returns the base path dynamically based on the current location.
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
   */
  async init() {
    await this.databaseManager.initDatabasePromise;
    console.log("Database initialization complete.");

    this.loadAppState();

    await this.questManager.syncQuestState();
    this.questManager.restoreAllActiveQuests();

    this.viewManager.showToggleCameraButton();
    this.eventManager.updateDiaryDisplay();

    this.viewManager.createTopCameraControls();

    await this.chatManager.init();

    if (await this.profileManager.isProfileSaved()) {
      const profile = await this.profileManager.getProfile();
      console.log("Profile found:", profile);
      // Show main screen via ViewManager
      this.viewManager.switchScreen('main-screen', 'main-buttons');
      this.viewManager.showToggleCameraButton();
      if (StateManager.get("mirrorQuestReady") === "true") {
        this.viewManager.setPostButtonEnabled(true);
      } else {
        this.viewManager.setPostButtonEnabled(false);
      }
      this.viewManager.updateProfileDisplay(profile);
      this.selfieData = profile.selfie;
    } else {
      console.log("Profile not found, showing registration screen.");
      this.viewManager.switchScreen('registration-screen', 'registration-buttons');
    }
  }
}