// File: src/App.js

import { BASE_PATH, COCO_SSD_MODEL } from './config/paths.js';
import { ImageUtils } from './utils/ImageUtils.js';
import { VisualEffectsManager } from './managers/VisualEffectsManager.js';

import { SQLiteDataManager } from './managers/SQLiteDataManager.js';
import { DatabaseManager } from './managers/DatabaseManager.js';

import { StateManager } from './managers/StateManager.js';
import { ErrorManager } from './managers/ErrorManager.js';

import { ViewManager } from './managers/ViewManager.js';

import { LanguageManager } from './managers/LanguageManager.js';
import { CameraSectionManager } from './managers/CameraSectionManager.js';
import { ProfileManager } from './managers/ProfileManager.js';
import { GhostManager } from './managers/GhostManager.js';
import { EventManager } from './managers/EventManager.js';
import { QuestManager } from './managers/QuestManager.js';
import { GameEventManager } from './managers/GameEventManager.js';
import { ShowProfileModal } from './managers/ShowProfileModal.js';

/**
 * Main application class.
 * This class initializes core managers, sets up the UI, loads persisted state.
 */
export class App {
  constructor(deps = {}) {
    // Initialize or inject ViewManager and bind UI events.
    this.viewManager = deps.viewManager || new ViewManager(this);
    this.viewManager.bindEvents(this);

    // Create or inject persistence managers.
    this.sqliteDataManager = deps.sqliteDataManager || new SQLiteDataManager();
    this.databaseManager   = deps.databaseManager || new DatabaseManager(this.sqliteDataManager);

    // Application state variables.
    this.isCameraOpen = false;
    this.selfieData   = null;

    // Initialize core domain managers.
    this.languageManager       = deps.languageManager || new LanguageManager('language-selector');
    this.viewManager.setLanguageManager(this.languageManager);
    this.cameraSectionManager  = deps.cameraSectionManager || new CameraSectionManager();
    this.viewManager.setCameraManager(this.cameraSectionManager);
    this.profileManager        = deps.profileManager || new ProfileManager(this.sqliteDataManager);
    this.visualEffectsManager  = deps.visualEffectsManager || new VisualEffectsManager(this, this.viewManager.controlsPanel);

    const savedSequenceIndex = parseInt(StateManager.get('currentSequenceIndex'), 10) || 0;
    this.ghostManager = deps.ghostManager || new GhostManager(savedSequenceIndex, this.profileManager, this);

    // Create EventManager first (handles diary operations, persists posts, etc.).
    this.eventManager = deps.eventManager || new EventManager(
      this.databaseManager,
      this.languageManager,
      this.ghostManager,
      this.visualEffectsManager
    );
    this.eventManager.viewManager = this.viewManager;
    this.ghostManager.eventManager  = this.eventManager;

    // Then create GameEventManager (wraps EventManager, loads event classes, etc.).
    this.gameEventManager = deps.gameEventManager || new GameEventManager(
      this.eventManager,
      this,
      this.languageManager
    );

    // Now pass GameEventManager into QuestManager (so activateEvent is available).
    this.questManager = deps.questManager || new QuestManager(
      this.eventManager,
      this.gameEventManager,
      this
    );

    this.showProfileModal = deps.showProfileModal || new ShowProfileModal(this);

    // Begin application initialization.
    this.init();
  }

  /**
   * Loads previously saved application state.
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
   * Initializes the application.
   */
  async init() {
    await this.databaseManager.initDatabasePromise;
    console.log("Database initialization complete.");
    this.loadAppState();

    // Preload AI model before any camera usage
    await this.cameraSectionManager.preloadModel();
    await this.questManager.syncQuestState();
    this.questManager.restoreAllActiveQuests();

    // If the camera was marked as open before reload, restore the button state,
    // but do NOT reopen the camera or call getUserMedia automatically.
    if (StateManager.isCameraOpen()) {
      this.viewManager.setCameraButtonActive(true);
      console.log("Camera button active state restored based on saved state.");
    }

    this.viewManager.showToggleCameraButton();
    this.viewManager.createTopCameraControls();

    // If a profile exists, switch to main screen (and only then re-call updateDiaryDisplay).
    // IMPORTANT: Pass `this` as the third param so `ViewManager` can reference your main app instance.
    if (await this.profileManager.isProfileSaved()) {
      const profile = await this.profileManager.getProfile();
      console.log("Profile found:", profile);

      await this.viewManager.switchScreen('main-screen', 'main-buttons', this);
      this.viewManager.showToggleCameraButton();

      // Read state from previous save
      const postButtonDisabled = StateManager.get("postButtonDisabled") === "true";
      this.viewManager.setPostButtonEnabled(!postButtonDisabled);

      this.viewManager.updateProfileDisplay(profile);
      this.selfieData = profile.selfie;

      // Render only the latest posts (lazy mode)
      await this.viewManager.loadLatestDiaryPosts();
    } else {
      console.log("Profile not found, showing landing screen.");

      // ALSO pass `this` here. Without it, `app` will be undefined in `ViewManager`.
      await this.viewManager.switchScreen('landing-screen', 'landing-buttons', this);
    }

    // In src/App.js, at the very end of init():
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.style.display = 'none';
      console.log("[App] Preloader hidden after AI model preload and app init.");
    }
  }
}