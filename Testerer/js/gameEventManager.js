import { WelcomeEvent } from './events/welcomeEvent.js';
// Импортируем новый объединённый класс, который заменяет прежний MirrorQuest и BaseQuest
import { BaseMirrorQuest } from './quests/baseMirrorQuest.js';

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
    // В массиве событий первым идёт WelcomeEvent, а затем наш объединённый зеркальный квест.
    this.events = [
      new WelcomeEvent(this.eventManager, this.app, this.languageManager),
      new BaseMirrorQuest(this.eventManager, this.app)
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
      // Если есть следующее событие, активируем его автоматически
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
   * Метод для активации событий, связанных с квестами (например, квест для текущего призрака).
   * После завершения одного квеста активируется следующее событие.
   */
  async startQuest() {
    const ghost = this.app.ghostManager.getCurrentGhost();  // Получаем текущего призрака
    const questKey = `ghost_${ghost.id}_quest`;

    // Активируем квест для текущего призрака
    await this.activateEvent(questKey);

    // После завершения квеста запускаем следующее событие (если оно есть)
    if (this.currentEventIndex < this.events.length) {
      await this.activateNextEvent();
    }
  }

  /**
   * Запускает зеркальный квест (активируется через событие в дневнике).
   */
  async startMirrorQuest() {
    // Ключ должен совпадать с ключом, заданным в BaseMirrorQuest (например, 'mirror_quest')
    await this.activateEvent('mirror_quest');
    console.log("🪞 Mirror Quest started.");
  }
}