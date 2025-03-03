import { WelcomeEvent } from './events/welcomeEvent.js';
import { PostMirrorEvent } from './events/postMirrorEvent.js';
import { PostRepeatingEvent } from './events/postRepeatingEvent.js';
import { FinalEvent } from './events/finalEvent.js';
import { StateManager } from './stateManager.js';
import { ErrorManager } from './errorManager.js';

export class GameEventManager {
  constructor(eventManager, appInstance, languageManager) {
    this.eventManager = eventManager;
    this.app = appInstance;
    this.languageManager = languageManager;
    
    // Array of one-time events; the order is not automatically chained.
    this.events = [
      new WelcomeEvent(this.eventManager, this.app, this.languageManager),
      new PostMirrorEvent(this.eventManager, this.app),
      new PostRepeatingEvent(this.eventManager, this.app),
      new FinalEvent(this.eventManager, this.app, this.languageManager)
    ];
  }

  /**
   * activateEvent – Activates the specified event by key.
   * This method only activates the given event and does not automatically trigger the next event.
   * @param {string} key - The unique key of the event to activate.
   */
  async activateEvent(key) {
    const event = this.events.find(e => e.key === key);
    if (event) {
      await event.activate();
      console.log(`Event '${key}' activated.`);
    } else {
      ErrorManager.logError(`Event "${key}" not found in the list.`, "activateEvent");
    }
  }

  /**
   * startQuest – Example helper method to start a ghost quest.
   * This method explicitly activates the event for the ghost quest, if available,
   * otherwise it starts the quest directly via QuestManager.
   */
  async startQuest() {
    const ghost = this.app.ghostManager.getCurrentGhost();
    const questKey = `ghost_${ghost.id}_quest`;
    const event = this.events.find(e => e.key === questKey);
    if (event) {
      await this.activateEvent(questKey);
    } else {
      // Alternatively, start the quest directly via QuestManager.
      await this.app.questManager.activateQuest(questKey);
    }
  }

  /**
   * startMirrorQuest – Example helper method to explicitly start the mirror quest event.
   */
  async startMirrorQuest() {
    await this.activateEvent('mirror_quest');
    console.log("🪞 Mirror Quest started (event).");
  }
  
  /**
   * autoLaunchWelcomeEvent – Automatically launches the welcome event after registration.
   * Checks for the presence of the "welcomeDone" flag; if absent, launches the welcome event
   * after a 5-second delay. Otherwise, ensures the "Post" button is enabled.
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
      await this.activateEvent("welcome");
    }, 5000);
  }
}