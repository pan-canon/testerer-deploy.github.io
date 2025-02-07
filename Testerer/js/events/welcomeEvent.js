// WelcomeEvent.js
import { BaseEvent } from './baseEvent.js';

export class WelcomeEvent extends BaseEvent {
  /**
   * @param {EventManager} eventManager – менеджер для работы с дневником
   * @param {App} appInstance – ссылка на основной объект приложения
   * @param {LanguageManager} languageManager – для локализации
   */
  constructor(eventManager, appInstance, languageManager) {
    super(eventManager);
    this.app = appInstance;
    this.languageManager = languageManager;
    this.key = "welcome"; // новый ключ события
  }

  /**
   * При активации события логируем его и запускаем звонок через CallManager.
   */
async activate() {
  // Не логируем запись сразу – дождёмся ответа на звонок.
  console.log("Активируем событие 'welcome': инициируем звонок");
  this.app.callManager.startCall("welcome");
}

}