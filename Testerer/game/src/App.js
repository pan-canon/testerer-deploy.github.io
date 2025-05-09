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
import { CameraSectionManager } from './managers/CameraSectionManager.js';
import { ProfileManager } from './managers/ProfileManager.js';
import { GhostManager } from './managers/GhostManager.js';
import { EventManager } from './managers/EventManager.js';
import { QuestManager } from './managers/QuestManager.js';
import { GameEventManager } from './managers/GameEventManager.js';
import { ShowProfileModal } from './managers/ShowProfileModal.js';

// NEW IMPORTS FOR CHAT MODULE using the wrapper for simplified instantiation
import { ChatManager } from './managers/ChatManager.js';

/**
 * Main application class.
 * This class initializes core managers, sets up the UI,
 * loads persisted state, and launches the test chat section ("support").
 *
 * All chat-related logic (state management, dialogue, localization)
 * is encapsulated within ChatManager.
 */
export class App {
  constructor(deps = {}) {
    // Initialize or inject ViewManager and bind UI events.
    this.viewManager = deps.viewManager || new ViewManager(this);
    this.viewManager.bindEvents(this);

    // Create or inject persistence managers.
    this.sqliteDataManager = deps.sqliteDataManager || new SQLiteDataManager();
    this.databaseManager = deps.databaseManager || new DatabaseManager(this.sqliteDataManager);

    // Application state variables.
    this.isCameraOpen = false;
    this.selfieData = null;

    // Initialize core domain managers.
    this.languageManager = deps.languageManager || new LanguageManager('language-selector');
    this.cameraSectionManager = deps.cameraSectionManager || new CameraSectionManager();
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
    this.eventManager.viewManager = this.viewManager;
    this.ghostManager.eventManager = this.eventManager;
    this.questManager = deps.questManager || new QuestManager(this.eventManager, this);
    this.gameEventManager = deps.gameEventManager || new GameEventManager(this.eventManager, this, this.languageManager);
    this.showProfileModal = deps.showProfileModal || new ShowProfileModal(this);

    // Initialize ChatManager for the "support" chat section using the wrapper.
    this.chatManager = deps.chatManager || ChatManager.createChatManagerWrapper({
      databaseManager: this.databaseManager,
      languageManager: this.languageManager,
      sectionKey: 'support'
    });

    // Begin application initialization.
    this.init();
  }

  /**
   * Returns the base URL dynamically.
   *
   * @returns {string} The base URL (origin + path without the file name).
   */
  getBasePath() {
    const loc = window.location;
    const path = loc.pathname.substring(0, loc.pathname.lastIndexOf('/'));
    return loc.origin + path;
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
   * Among other tasks, this method launches the support chat section.
   */
  async init() {
    await this.databaseManager.initDatabasePromise;
    console.log("Database initialization complete.");
    this.loadAppState();
    await this.questManager.syncQuestState();
    this.questManager.restoreAllActiveQuests();
    // Если перед перезагрузкой камера помечена как активная — просто подсветим кнопку,
    // но НЕ будем её автоматически открывать и не запускать getUserMedia.
    if (StateManager.isCameraOpen()) {
      this.viewManager.setCameraButtonActive(true);
      console.log("Camera button active state restored based on saved state.");
    }

    this.viewManager.showToggleCameraButton();
    this.viewManager.createTopCameraControls();

    // Initialize the chat section for "support"
    await this.chatManager.init();
    // Schedule support chat conversation to start after 5 seconds.
    this.chatManager.scheduleConversationStartIfInactive(5000);

    // If a profile exists, switch to main screen (and only then re-call updateDiaryDisplay).
    // IMPORTANT: Pass `this` as the third param so `ViewManager` can reference your main app instance.
    if (await this.profileManager.isProfileSaved()) {
      const profile = await this.profileManager.getProfile();
      console.log("Profile found:", profile);

      await this.viewManager.switchScreen('main-screen', 'main-buttons', this);
      this.viewManager.showToggleCameraButton();

      // Читаем состояние из предыдущего сохранения
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
  }
}