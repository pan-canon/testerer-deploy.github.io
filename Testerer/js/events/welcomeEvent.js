// WelcomeEvent.js
import { BaseEvent } from './baseEvent.js';
import { VisualEffectsManager } from '../utils/visualEffectsManager.js';

export class WelcomeEvent extends BaseEvent {
  /**
   * @param {EventManager} eventManager – менеджер дневника
   * @param {App} appInstance – ссылка на приложение
   * @param {LanguageManager} languageManager – для локализации
   */
  constructor(eventManager, appInstance, languageManager) {
    super(eventManager);
    this.app = appInstance;
    this.languageManager = languageManager;
    this.key = "welcome"; // ключ события (используется для внутренней логики, можно оставить)
  }

  /**
   * При активации события запускается звонок через CallManager.
   * Обработчик нажатия кнопки «Ответить» задаётся здесь.
   */
  async activate() {
    // Не логируем запись сразу – запись появится только при ответе на звонок.
    console.log("Активируем событие 'welcome': инициируем звонок");
    this.app.callManager.startCall("welcome", {
      onAnswer: async () => {
        // Логируем запись с текстом "mirror_quest"
        const mirrorQuestText = this.languageManager.locales[this.languageManager.getLanguage()]["mirror_quest"];
        await this.eventManager.addDiaryEntry(mirrorQuestText);
        // Вызовем визуальный эффект через VisualEffectsManager
        const effectsManager = new VisualEffectsManager();
        effectsManager.triggerMirrorEffect();
      }
    });
  }
}