import { WelcomeEvent } from './events/welcomeEvent.js';
import { BaseMirrorQuest } from './quests/baseMirrorQuest.js';  // Новый квест с зеркалом
// import { GhostEvent1 } from './events/ghostEvent1.js';

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
    // По умолчанию включаем приветственное событие. В будущем можно добавить другие события.
    this.events = [
      new WelcomeEvent(this.eventManager, this.app, this.languageManager)
      // Можно добавить другие события, например:
      // new BaseMirrorQuest(this.eventManager, this.app)
      // Активировать новую логику поверх текущей по готовности
      // new GhostEvent1(this.eventManager, this.app)
    ];
    
    // Индекс текущего события, который будет использоваться для последовательного запуска.
    this.currentEventIndex = 0;
  }

  /**
   * activateEvent – активирует событие по его ключу.
   * @param {string} key - Идентификатор события.
   * 
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
    }
  }

  /**
   * startQuest – запускает квест для текущего призрака.
   * 
   * Получает текущего призрака из ghostManager, формирует ключ квеста 
   * (например, "ghost_1_quest") и активирует соответствующее событие.
   * После завершения квеста, если есть еще события, автоматически запускается следующее.
   */
  async startQuest() {
    const ghost = this.app.ghostManager.getCurrentGhost();
    const questKey = `ghost_${ghost.id}_quest`;

    // Активируем событие, связанное с квестом для текущего призрака.
    await this.activateEvent(questKey);

    // Если есть ещё события, активируем следующее.
    if (this.currentEventIndex < this.events.length) {
      await this.activateNextEvent();
    }
  }

  /**
   * startMirrorQuest – запускает зеркальный квест.
   * 
   * Этот метод активирует событие с ключом "mirror_quest". После активации выводится сообщение,
   * что зеркальный квест запущен.
   */
  async startMirrorQuest() {
    await this.activateEvent('mirror_quest');
    console.log("🪞 Mirror Quest started.");
  }
}