import { WelcomeEvent } from './events/welcomeEvent.js';
import { BaseMirrorQuest } from './quests/baseMirrorQuest.js';  // Импортируем новый квест с зеркалом
/*import { GhostEvent1 } from '../ghostEvent1.js';*/

export class GameEventManager {
  /**
   * @param {EventManager} eventManager – менеджер дневника
   * @param {App} appInstance – ссылка на приложение
   * @param {LanguageManager} languageManager – для локализации
   */
  constructor(eventManager, appInstance, languageManager) {
    this.eventManager = eventManager;
    this.app = appInstance;
    this.languageManager = languageManager;
    this.events = [
      new WelcomeEvent(this.eventManager, this.app, this.languageManager),
      new GhostEvent1(this.eventManager, this.app),
      // В будущем можно добавить другие события
    ];
    this.currentEventIndex = 0;  // Индекс текущего события
  }

  /**
   * Активирует событие по его ключу.
   * @param {string} key – идентификатор события
   */
  async activateEvent(key) {
    const event = this.events.find(e => e.key === key);
    if (event) {
      await event.activate();
      this.currentEventIndex++;
      // Автоматически активируем следующее событие после завершения текущего
      if (this.currentEventIndex < this.events.length) {
        await this.activateNextEvent();
      }
    } else {
      console.warn(`Событие с ключом "${key}" не найдено.`);
    }
  }

  /**
   * Активирует следующее событие в списке.
   */
  async activateNextEvent() {
    const nextEvent = this.events[this.currentEventIndex];
    if (nextEvent) {
      await nextEvent.activate();
    }
  }

  /**
   * Метод для активации событий, связанных с квестами (например, зеркальный квест).
   * После завершения одного квеста активируется новый.
   */
  async startQuest() {
    const ghost = this.app.ghostManager.getCurrentGhost();  // Получаем текущего призрака
    const questKey = `ghost_${ghost.id}_quest`;

    // Активируем квест для текущего призрака
    await this.activateEvent(questKey);

    // После завершения квеста и выполнения всех действий запускаем следующее событие
    if (this.currentEventIndex < this.events.length) {
      await this.activateNextEvent();
    }
  }

  /**
   * Запускаем квест с зеркалом (будет активирован через событие в дневнике).
   */
  async startMirrorQuest() {
    // Запускаем квест с зеркалом
    await this.activateEvent('mirror_quest');
    console.log("🪞 Mirror Quest started.");
  }
}