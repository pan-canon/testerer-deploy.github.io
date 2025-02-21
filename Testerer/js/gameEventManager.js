import { WelcomeEvent } from './events/welcomeEvent.js';
import { FinalEvent }   from './events/finalEvent.js';

/**
 * GameEventManager – отвечает за короткие события (Welcome, Final...).
 * При завершении одного события может запускать следующее.
 */
export class GameEventManager {
  constructor(eventManager, appInstance, languageManager) {
    this.eventManager    = eventManager;
    this.app             = appInstance;
    this.languageManager = languageManager;
    
    // Список «коротких» событий:
    this.events = [
      new WelcomeEvent(this.eventManager, this.app, this.languageManager),
      new FinalEvent(this.eventManager, this.app, this.languageManager)
    ];
    
    this.currentEventIndex = 0;
  }

  /**
   * activateEvent(key): ищем событие в this.events, активируем, сдвигаем currentEventIndex.
   */
  async activateEvent(key) {
    const event = this.events.find(e => e.key === key);
    if (event) {
      await event.activate();
      this.currentEventIndex++;
      if (this.currentEventIndex < this.events.length) {
        await this.activateNextEvent();
      }
    } else {
      console.warn(`Событие с ключом "${key}" не найдено в GameEventManager.`);
    }
  }

  /**
   * activateNextEvent: запускает следующее событие по currentEventIndex, если есть.
   */
  async activateNextEvent() {
    const nextEvent = this.events[this.currentEventIndex];
    if (nextEvent) {
      await nextEvent.activate();
      this.currentEventIndex++;
    }
  }

  /**
   * startQuest – пример, если вдруг хотим запускать квест через события;
   * Но фактически квесты запускает QuestManager, так что можно не использовать.
   */
  async startQuest() {
    const ghost = this.app.ghostManager.getCurrentGhost();
    const questKey = `ghost_${ghost.id}_quest`;
    // Пытаемся найти событие с таким ключом
    const event = this.events.find(e => e.key === questKey);
    if (event) {
      await this.activateEvent(questKey);
    } else {
      // Если в events нет, вызываем QuestManager
      await this.app.questManager.activateQuest(questKey);
    }
    if (this.currentEventIndex < this.events.length) {
      await this.activateNextEvent();
    }
  }

  /**
   * startMirrorQuest – если хотите коротким событием, можно было бы через event.
   * Но у нас уже есть квест "mirror_quest" в QuestManager.
   */
  async startMirrorQuest() {
    await this.activateEvent('mirror_quest');
    console.log("🪞 Mirror Quest started via GameEventManager.");
  }
}