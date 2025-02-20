import { WelcomeEvent } from './events/welcomeEvent.js';
import { FinalEvent } from './events/finalEvent.js';

export class GameEventManager {
  /**
   * Конструктор GameEventManager.
   * @param {EventManager} eventManager - Менеджер дневника, ответственный за работу с записями.
   * @param {App} appInstance - Ссылка на основной объект приложения.
   * @param {LanguageManager} languageManager - Менеджер локализации для перевода сообщений.
   *
   * Класс отвечает за последовательное выполнение игровых событий.
   * События добавляются в массив this.events, и после завершения текущего автоматически запускается следующее.
   */
  constructor(eventManager, appInstance, languageManager) {
    this.eventManager = eventManager;
    this.app = appInstance;
    this.languageManager = languageManager;
    
    // Массив событий, которые будут активированы последовательно.
    // Здесь по умолчанию включены приветственное событие и финальное событие.
    this.events = [
      new WelcomeEvent(this.eventManager, this.app, this.languageManager),
      new FinalEvent(this.eventManager, this.app, this.languageManager)
    ];
    
    // Индекс текущего события для последовательного запуска.
    this.currentEventIndex = 0;
  }

  /**
   * activateEvent – активирует событие по его ключу.
   * @param {string} key - Идентификатор события.
   * Если событие найдено в массиве, вызывается его метод activate(). После завершения 
   * текущего события автоматически запускается следующее (если оно есть).
   */
  async activateEvent(key) {
    const event = this.events.find(e => e.key === key);
    if (event) {
      await event.activate();
      this.currentEventIndex++;
      // Если есть следующее событие, активируем его.
      if (this.currentEventIndex < this.events.length) {
        await this.activateNextEvent();
      }
    } else {
      console.warn(`Событие с ключом "${key}" не найдено.`);
    }
  }

  /**
   * activateNextEvent – активирует следующее событие из списка.
   */
  async activateNextEvent() {
    const nextEvent = this.events[this.currentEventIndex];
    if (nextEvent) {
      await nextEvent.activate();
      this.currentEventIndex++;
    }
  }

  /**
   * startQuest – запускает квест для текущего призрака.
   * Получает текущего призрака из ghostManager, формирует ключ квеста
   * (например, "ghost_1_quest") и активирует соответствующее событие.
   * Если событие не найдено в массиве, запускается квест через QuestManager.
   * После завершения квеста, если есть ещё события, автоматически запускается следующее.
   */
  async startQuest() {
    const ghost = this.app.ghostManager.getCurrentGhost();
    const questKey = `ghost_${ghost.id}_quest`;
    const event = this.events.find(e => e.key === questKey);
    if (event) {
      await this.activateEvent(questKey);
    } else {
      console.log(`Пытаемся запустить квест "${questKey}" через QuestManager...`);
      await this.app.questManager.activateQuest(questKey);
    }
    if (this.currentEventIndex < this.events.length) {
      await this.activateNextEvent();
    }
  }

  /**
   * startMirrorQuest – запускает зеркальный квест.
   * Этот метод активирует событие с ключом "mirror_quest". После активации выводится сообщение,
   * что зеркальный квест запущен.
   */
  async startMirrorQuest() {
    await this.activateEvent('mirror_quest');
    console.log("🪞 Mirror Quest started.");
  }
}