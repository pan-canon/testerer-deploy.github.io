import { WelcomeEvent } from './events/welcomeEvent.js';
import { FinalEvent } from './events/finalEvent.js';
import { PostMirrorEvent } from './events/postMirrorEvent.js';
import { PostRepeatingEvent } from './events/postRepeatingEvent.js';

/**
 * GameEventManager – класс, отвечающий за “короткие” (одноразовые) события.
 * В отличие от больших квестов (MirrorQuest, RepeatingQuest, FinalQuest),
 * эти события лишь вызывают запуск нужного квеста или делают дополнительный пост.
 */
export class GameEventManager {
  constructor(eventManager, appInstance, languageManager) {
    this.eventManager    = eventManager;
    this.app             = appInstance;
    this.languageManager = languageManager;
    
    // Последовательность коротких событий (возможна любая логика порядка)
    this.events = [
      new WelcomeEvent(this.eventManager, this.app, this.languageManager),
      new PostMirrorEvent(this.eventManager, this.app),
      new PostRepeatingEvent(this.eventManager, this.app),
      new FinalEvent(this.eventManager, this.app, this.languageManager)
    ];
    
    this.currentEventIndex = 0;
  }

  async activateEvent(key) {
    const event = this.events.find(e => e.key === key);
    if (event) {
      await event.activate();
      this.currentEventIndex++;
      if (this.currentEventIndex < this.events.length) {
        await this.activateNextEvent();
      }
    } else {
      console.warn(`[GameEventManager] Событие "${key}" не найдено в списке.`);
    }
  }

  async activateNextEvent() {
    const nextEvent = this.events[this.currentEventIndex];
    if (nextEvent) {
      await nextEvent.activate();
      this.currentEventIndex++;
    }
  }

  // Примеры вспомогательных методов
  async startQuest() {
    const ghost = this.app.ghostManager.getCurrentGhost();
    const questKey = `ghost_${ghost.id}_quest`;
    const event = this.events.find(e => e.key === questKey);
    if (event) {
      await this.activateEvent(questKey);
    } else {
      // Либо запускаем квест напрямую
      await this.app.questManager.activateQuest(questKey);
    }
    if (this.currentEventIndex < this.events.length) {
      await this.activateNextEvent();
    }
  }

  async startMirrorQuest() {
    await this.activateEvent('mirror_quest');
    console.log("🪞 Mirror Quest started (event).");
  }
}