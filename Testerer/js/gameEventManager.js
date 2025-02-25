import { WelcomeEvent } from './events/welcomeEvent.js';
import { FinalEvent } from './events/finalEvent.js';
import { PostMirrorEvent } from './events/postMirrorEvent.js';
import { PostRepeatingEvent } from './events/postRepeatingEvent.js';

/**
 * GameEventManager – A class responsible for handling "short" (one-time) events.
 * Unlike larger quests (MirrorQuest, RepeatingQuest, FinalQuest),
 * these events simply trigger the start of the required quest or post.
 */
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
      console.warn(`[GameEventManager] Event "${key}" not found in the list.`);
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
}