import { WelcomeEvent } from '../events/WelcomeEvent.js';
import { PostMirrorEvent } from '../events/PostMirrorEvent.js';
import { PostRepeatingEvent } from '../events/PostRepeatingEvent.js';
import { FinalEvent } from '../events/FinalEvent.js';

// --- State and Error Management ---
import { StateManager } from './StateManager.js';
import { ErrorManager } from './ErrorManager.js';

/**
 * GameEventManager class
 * Manages one-time game events (e.g., welcome, post-mirror, post-repeating, final).
 * It handles auto-launching the welcome event after registration by checking state flags
 * via StateManager, and activates events using the provided EventManager.
 *
 * NOTE: Sequential linking of events and quests is now handled by GhostManager.
 *       This class is solely responsible for activating a specific event by its key.
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
    
    // List of one-time events (welcome, postMirror, postRepeating, final).
    this.events = [
      new WelcomeEvent(this.eventManager, this.app, this.languageManager),
      new PostMirrorEvent(this.eventManager, this.app),
      new PostRepeatingEvent(this.eventManager, this.app),
      new FinalEvent(this.eventManager, this.app, this.languageManager)
    ];
  }

  /**
   * activateEvent
   * Activates an event by its key.
   * Does not automatically trigger subsequent events (sequence is managed by GhostManager).
   *
   * If the key is dynamic (e.g. "post_repeating_event_stage_X"), then the PostRepeatingEvent instance is used.
   *
   * @param {string} key - The event key.
   */
  async activateEvent(key) {
    // Try to find event by exact key.
    let event = this.events.find(e => e.key === key);
    // If not found and key starts with "post_repeating_event", use the PostRepeatingEvent instance.
    if (!event && key.startsWith("post_repeating_event")) {
      event = this.events.find(e => e.key === "post_repeating_event");
    }
    if (event) {
      await event.activate(key);
      console.log(`Event '${key}' activated.`);
    } else {
      ErrorManager.logError(`Event "${key}" not found in the list.`, "activateEvent");
    }
  }

  /**
   * startQuest
   * Example helper method for starting a ghost quest.
   * Checks if an event with a specific key exists for the ghost (e.g., ghost_1_quest, ghost_2_quest, etc.).
   * If not, starts the quest directly via QuestManager.
   */
  async startQuest() {
    const ghost = this.app.ghostManager.getCurrentGhost();
    const questKey = `ghost_${ghost.id}_quest`;
    const event = this.events.find(e => e.key === questKey);
    if (event) {
      await this.activateEvent(questKey);
    } else {
      // If no matching event is found, directly activate the quest.
      await this.app.questManager.activateQuest(questKey);
    }
  }

  /**
   * startMirrorQuest
   * Helper method for explicitly starting the mirror quest (if needed).
   */
  async startMirrorQuest() {
    await this.activateEvent('mirror_quest');
    console.log("🪞 Mirror Quest started (event).");
  }
  
  /**
   * autoLaunchWelcomeEvent
   * Automatically launches the welcome event (after 5 seconds) post-registration,
   * if the "welcomeDone" flag is not set.
   *
   * NOTE: Previously, this method also enabled the "Post" button if welcomeDone === "true".
   * Now that code has been removed to prevent premature activation.
   */
  async autoLaunchWelcomeEvent() {
    if (StateManager.get("welcomeDone") === "true") {
      console.log("Welcome event already completed; auto-launch skipped.");
      return;
    }
    console.log("Auto-launching welcome event in 5 seconds...");
    setTimeout(async () => {
      await this.activateEvent("welcome");
    }, 5000);
  }
}