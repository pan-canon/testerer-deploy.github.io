import { WelcomeEvent } from './events/welcomeEvent.js';

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
      new WelcomeEvent(this.eventManager, this.app, this.languageManager)
      // В будущем можно добавить другие события
    ];
    this.currentEventIndex = 0;
  }

  /**
   * Активирует событие по его ключу.
   * @param {string} key – идентификатор события
   */
activateEvent(key) {
  if (key === "welcome") {
    // Активируем первое событие: просьба подойти к зеркалу
    this.app.eventManager.startEvent("welcome");
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
}