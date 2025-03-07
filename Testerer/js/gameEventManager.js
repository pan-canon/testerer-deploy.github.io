// --- Event Modules ---
import { WelcomeEvent } from './events/welcomeEvent.js';
import { PostMirrorEvent } from './events/postMirrorEvent.js';
import { PostRepeatingEvent } from './events/postRepeatingEvent.js';
import { FinalEvent } from './events/finalEvent.js';

// --- State and Error Management ---
import { StateManager } from './stateManager.js';
import { ErrorManager } from './errorManager.js';

/**
 * GameEventManager class
 * Manages one-time game events (e.g., welcome, post-mirror, post-repeating, final).
 * It handles auto-launching the welcome event after registration by checking state flags
 * via StateManager, and activates events using the provided EventManager.
 */
export class GameEventManager {
  /**
   * @param {EventManager} eventManager - Manager for diary/event operations.
   * @param {App} appInstance - The main application instance.
   * @param {LanguageManager} languageManager - Localization manager.
   */
  constructor(eventManager, appInstance, languageManager) {
    this.eventManager = eventManager;
    this.app = appInstance;
    this.languageManager = languageManager;
    
    // Array of one-time events; order is not automatically chained.
    this.events = [
      new WelcomeEvent(this.eventManager, this.app, this.languageManager),
      new PostMirrorEvent(this.eventManager, this.app),
      new PostRepeatingEvent(this.eventManager, this.app),
      new FinalEvent(this.eventManager, this.app, this.languageManager)
    ];
  }

  /**
   * activateEvent
   * Activates the event corresponding to the given key.
   * This method only activates the specified event and does not trigger any subsequent events.
   *
   * @param {string} key - The unique key of the event to activate.
   */
  async activateEvent(key) {
    const event = this.events.find(e => e.key === key);
    if (event) {
      console.log(`Activating event '${key}'...`);
      await event.activate();
      console.log(`Event '${key}' activated.`);
    } else {
      ErrorManager.logError(`Event "${key}" not found in the list.`, "activateEvent");
    }
  }

  /**
   * startQuest
   * Example helper method to start a ghost quest.
   * It checks if an event exists for the ghost quest; if not, it directly starts the quest via QuestManager.
   */
  async startQuest() {
    const ghost = this.app.ghostManager.getCurrentGhost();
    const questKey = `ghost_${ghost.id}_quest`;
    const event = this.events.find(e => e.key === questKey);
    if (event) {
      await this.activateEvent(questKey);
    } else {
      await this.app.questManager.activateQuest(questKey);
    }
  }

  /**
   * startMirrorQuest
   * Helper method to explicitly start the mirror quest event.
   */
  async startMirrorQuest() {
    await this.activateEvent('mirror_quest');
    console.log("🪞 Mirror Quest started (event).");
  }
  
  /**
   * autoLaunchWelcomeEvent
   * Automatically launches the welcome event after registration.
   * It checks the "welcomeDone" flag using StateManager; if the flag is not set,
   * it launches the welcome event after a 5-second delay.
   * 
   * NEW: Before launching, the method sets the initial flag for the welcome event in GhostManager.
   * This flag is used later by QuestManager for determining the correct sequence.
   */
  async autoLaunchWelcomeEvent() {
    if (StateManager.get("welcomeDone") === "true") {
      console.log("Welcome event already completed; auto-launch skipped.");
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
        this.app.viewManager.setPostButtonEnabled(true);
      }
      return;
    }
    console.log("Auto-launching welcome event in 5 seconds...");
    setTimeout(async () => {
      this.app.ghostManager.updateEventStepStatus('welcome', 'in_progress');
      console.log("Welcome event status set to 'in_progress'.");
      await this.activateEvent("welcome");
    }, 5000);
  }
}