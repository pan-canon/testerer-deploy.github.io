// File: src/di/DIContainer.js
// This DI container is responsible for instantiating and wiring all managers
// in the correct order for the application. It then returns the fully initialized App instance.

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
// ApartmentPlanManager is usually created on demand, so it's omitted here
import { GhostManager } from '../managers/GhostManager.js';
import { EventManager } from '../managers/EventManager.js';
import { QuestManager } from '../managers/QuestManager.js';
import { GameEventManager } from '../managers/GameEventManager.js';
import { ShowProfileModal } from '../managers/ShowProfileModal.js';

export class DIContainer {
  constructor() {
    // 1. Create basic managers.
    this.viewManager = new ViewManager();
    this.sqliteDataManager = new SQLiteDataManager();
    this.databaseManager = new DatabaseManager(this.sqliteDataManager);
    this.languageManager = new LanguageManager('language-selector');
    this.cameraSectionManager = new CameraSectionManager();
    this.viewManager.setCameraManager(this.cameraSectionManager);
    this.profileManager = new ProfileManager(this.sqliteDataManager);
    
    // VisualEffectsManager will receive the App reference later.
    this.visualEffectsManager = new VisualEffectsManager(null, this.viewManager.controlsPanel);
    
    // Initialize GhostManager with saved sequence index (default 0)
    const savedSequenceIndex = parseInt(StateManager.get('currentSequenceIndex'), 10) || 0;
    this.ghostManager = new GhostManager(savedSequenceIndex, this.profileManager, null);
    
    // Create EventManager instance and wire dependencies.
    this.eventManager = new EventManager(
      this.databaseManager,
      this.languageManager,
      this.ghostManager,
      this.visualEffectsManager
    );
    // Set cross-manager references.
    this.eventManager.viewManager = this.viewManager;
    this.ghostManager.eventManager = this.eventManager;
    
    // 2. Create the App instance first (without QuestManager, GameEventManager, and ShowProfileModal)
    // because these managers require a valid App instance.
    this.app = new App({
      viewManager: this.viewManager,
      sqliteDataManager: this.sqliteDataManager,
      databaseManager: this.databaseManager,
      languageManager: this.languageManager,
      cameraSectionManager: this.cameraSectionManager,
      profileManager: this.profileManager,
      visualEffectsManager: this.visualEffectsManager,
      ghostManager: this.ghostManager,
      eventManager: this.eventManager
      // QuestManager, GameEventManager, ShowProfileModal will be injected below.
    });
    
    // 3. Now that App exists, create the remaining managers.
    this.questManager = new QuestManager(this.eventManager, this.app);
    this.gameEventManager = new GameEventManager(this.eventManager, this.app, this.languageManager);
    this.showProfileModal = new ShowProfileModal(this.app);
    
    // 4. Inject these managers into the App instance.
    this.app.questManager = this.questManager;
    this.app.gameEventManager = this.gameEventManager;
    this.app.showProfileModal = this.showProfileModal;
    
    // 5. Update cross-manager references that depend on App.
    this.visualEffectsManager.app = this.app;
    this.ghostManager.app = this.app;
    this.eventManager.app = this.app;
    this.gameEventManager.app = this.app;
    this.showProfileModal.app = this.app;
    this.questManager.app = this.app;
    
    // 6. Finally, bind ViewManager events.
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