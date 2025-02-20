import { WelcomeEvent } from './events/welcomeEvent.js';
// Сюда же можно импортировать другие события (FinalEvent и т.д.), если нужны
// import { FinalEvent } from './events/finalEvent.js';

/**
 * GameEventManager – класс, отвечающий за последовательное выполнение игровых (коротких) событий.
 * Сюда можно добавить события, которые НЕ являются квестами. 
 * Квесты (MirrorQuest, RepeatingQuest, FinalQuest) лежат в QuestManager.
 */
export class GameEventManager {
  /**
   * Конструктор GameEventManager.
   * @param {EventManager} eventManager - Менеджер дневника, ответственный за работу с записями.
   * @param {App} appInstance - Ссылка на основной объект приложения.
   * @param {LanguageManager} languageManager - Менеджер локализации для перевода сообщений.
   *
   * Данный класс отвечает за последовательное выполнение игровых событий, перечисленных в this.events.
   * После завершения одного события автоматически запускается следующее (если оно есть).
   */
  constructor(eventManager, appInstance, languageManager) {
    this.eventManager    = eventManager;
    this.app             = appInstance;
    this.languageManager = languageManager;
    
    // Массив "коротких" событий, которые идут последовательно.
    // По умолчанию включаем приветственное событие (WelcomeEvent).
    // При желании добавьте другие события, например FinalEvent.
    this.events = [
      new WelcomeEvent(this.eventManager, this.app, this.languageManager),
      new GhostFinalEvent(this.eventManager, this.app, this.languageManager)
    ];
    
    // Индекс текущего события (для последовательного запуска).
    this.currentEventIndex = 0;
  }

  /**
   * activateEvent – активирует событие по его ключу (this.events[i].key).
   * Если событие найдено, вызываем его activate(). После завершения
   * текущего события увеличиваем currentEventIndex и можем активировать следующее.
   *
   * @param {string} key - Идентификатор (this.events[i].key).
   */
  async activateEvent(key) {
    const event = this.events.find(e => e.key === key);
    if (event) {
      // Активируем событие
      await event.activate();

      // Переходим к следующему событию в массиве
      this.currentEventIndex++;
      // Если есть следующее событие, активируем
      if (this.currentEventIndex < this.events.length) {
        await this.activateNextEvent();
      }
    } else {
      console.warn(`Событие с ключом "${key}" не найдено в this.events.`);
    }
  }

  /**
   * activateNextEvent – активирует следующее событие из списка this.events,
   * исходя из currentEventIndex.
   */
  async activateNextEvent() {
    const nextEvent = this.events[this.currentEventIndex];
    if (nextEvent) {
      await nextEvent.activate();
      this.currentEventIndex++;
    }
  }

  /**
   * startQuest – пример метода для запуска квеста текущего призрака.
   * Изначально тут предполагалась логика "ghost_{id}_quest" как событие.
   * Но теперь квесты обслуживаются QuestManager. 
   * Можно либо убрать этот метод, либо адаптировать под:
   *   this.app.questManager.activateQuest(`ghost_${ghost.id}_quest`);
   */
  async startQuest() {
    const ghost = this.app.ghostManager.getCurrentGhost();
    const questKey = `ghost_${ghost.id}_quest`;

    // Если у вас действительно есть событие c таким key в this.events – активируем как событие:
    const event = this.events.find(e => e.key === questKey);
    if (event) {
      await this.activateEvent(questKey);
    } else {
      // ИЛИ: если это квест в QuestManager:
      console.log(`Пытаемся запустить квест "${questKey}" через QuestManager...`);
      await this.app.questManager.activateQuest(questKey);
    }

    // При желании активируем следующее событие
    if (this.currentEventIndex < this.events.length) {
      await this.activateNextEvent();
    }
  }

  /**
   * startMirrorQuest – запускает зеркальный квест. Раньше это делали как событие,
   * но теперь MirrorQuest лежит в QuestManager. Поэтому просто дергаем questManager.
   */
  async startMirrorQuest() {
    await this.app.questManager.activateQuest("mirror_quest");
    console.log("🪞 Mirror Quest started (via QuestManager).");
  }
}