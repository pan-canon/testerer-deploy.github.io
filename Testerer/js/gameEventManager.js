// GameEventManager.js
import { WelcomeEvent } from './events/WelcomeEvent.js';

export class GameEventManager {
  /**
   * @param {EventManager} eventManager – менеджер для дневника
   * @param {App} appInstance – ссылка на приложение
   * @param {LanguageManager} languageManager – для локализации
   */
  constructor(eventManager, appInstance, languageManager) {
    this.eventManager = eventManager;
    this.app = appInstance;
    this.languageManager = languageManager;
    // Регистрируем доступные события
    this.events = [
      new WelcomeEvent(this.eventManager, this.app, this.languageManager)
      // В будущем можно добавить другие события
    ];
  }

  /**
   * Активирует событие по его ключу.
   * @param {string} key – идентификатор события
   */
  async activateEvent(key) {
    const event = this.events.find(e => e.key === key);
    if (event) {
      await event.activate();
    } else {
      console.warn(`Событие с ключом "${key}" не найдено.`);
    }
  }
}
