// DIContainer.js
// This DI container is responsible for instantiating and wiring all managers
// in the correct order for the application. It then returns the initialized App instance.

import { App } from '../App.js';
import { ImageUtils } from '../utils/ImageUtils.js';
import { VisualEffectsManager } from '../managers/VisualEffectsManager.js';

import { SQLiteDataManager } from '../managers/SQLiteDataManager.js';
import { DatabaseManager } from '../managers/DatabaseManager.js';

import { StateManager } from '../managers/StateManager.js';
import { ErrorManager } from '../managers/ErrorManager.js';

import { ViewManager } from '../managers/ViewManager.js';

import { LanguageManager } from '../managers/LanguageManager.js';
import { CameraSectionManager } from '../managers/CameraSectionManager.js';
import { ProfileManager } from '../managers/ProfileManager.js';
import { ApartmentPlanManager } from '../managers/ApartmentPlanManager.js';
import { GhostManager } from '../managers/GhostManager.js';
import { EventManager } from '../managers/EventManager.js';
import { QuestManager } from '../managers/QuestManager.js';
import { GameEventManager } from '../managers/GameEventManager.js';
import { ShowProfileModal } from '../managers/ShowProfileModal.js';

export class DIContainer {
  constructor() {
    // Create ViewManager and bind its events later in App
    this.viewManager = new ViewManager();

    // Create persistence managers
    this.sqliteDataManager = new SQLiteDataManager();
    this.databaseManager = new DatabaseManager(this.sqliteDataManager);

    // Create domain managers and set initial state variables
    this.languageManager = new LanguageManager('language-selector');
    // Use the updated CameraSectionManager (extended functionality integrated)
    this.cameraSectionManager = new CameraSectionManager();
    // Set camera manager reference in ViewManager
    this.viewManager.setCameraManager(this.cameraSectionManager);

    this.profileManager = new ProfileManager(this.sqliteDataManager);

    // Create VisualEffectsManager; pass reference to App later (set to null for now)
    this.visualEffectsManager = new VisualEffectsManager(null, this.viewManager.controlsPanel);

    // Initialize GhostManager with saved sequence index from StateManager (default 0)
    const savedSequenceIndex = parseInt(StateManager.get('currentSequenceIndex'), 10) || 0;
    this.ghostManager = new GhostManager(savedSequenceIndex, this.profileManager, null);

    // Create EventManager instance and wire dependencies
    this.eventManager = new EventManager(
      this.databaseManager,
      this.languageManager,
      this.ghostManager,
      this.visualEffectsManager
    );
    // Cross-manager reference: set viewManager in eventManager, and assign eventManager to ghostManager.
    this.eventManager.viewManager = this.viewManager;
    this.ghostManager.eventManager = this.eventManager;

    // Initialize QuestManager and GameEventManager.
    this.questManager = new QuestManager(this.eventManager, null);
    this.gameEventManager = new GameEventManager(this.eventManager, null, this.languageManager);

    // Create ShowProfileModal
    this.showProfileModal = new ShowProfileModal(null);

    // Now create the main App instance.
    // Note: The current App constructor creates its own instances,
    // so here we override its properties with our DI container instances.
    this.app = new App();

    // Inject our DI instances into the App instance.
    this.app.viewManager = this.viewManager;
    this.app.sqliteDataManager = this.sqliteDataManager;
    this.app.databaseManager = this.databaseManager;
    this.app.languageManager = this.languageManager;
    this.app.cameraSectionManager = this.cameraSectionManager;
    this.app.profileManager = this.profileManager;
    this.app.visualEffectsManager = this.visualEffectsManager;
    this.app.ghostManager = this.ghostManager;
    this.app.eventManager = this.eventManager;
    this.app.questManager = this.questManager;
    this.app.gameEventManager = this.gameEventManager;
    this.app.showProfileModal = this.showProfileModal;

    // Now update cross-manager references that depend on App.
    // For example, VisualEffectsManager and ShowProfileModal need reference to App.
    this.visualEffectsManager.app = this.app;
    this.ghostManager.app = this.app;
    this.gameEventManager.app = this.app;
    this.showProfileModal.app = this.app;
    this.questManager.app = this.app;
    
    // Finally, bind ViewManager events.
    this.viewManager.bindEvents(this.app);

    console.log("DIContainer: All dependencies initialized.");
  }

  /**
   * Returns the fully initialized App instance.
   * @returns {App} The main application instance.
   */
  getApp() {
    return this.app;
  }
}