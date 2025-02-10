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
    this.key = "welcome"; // ключ события
  }

  /**
   * При активации события запускается звонок через CallManager.
   * Обработчик нажатия кнопки «Ответить» задаётся здесь.
   */
async activate() {
  console.log("Активируем событие 'welcome': инициируем звонок");
  // Вместо прямого вызова звонка, добавляем его через CallManager
  this.app.callManager.startCall("welcome", {
    onAnswer: async () => {
      // Логируем запись с текстом "mirror_quest"
      const mirrorQuestText = this.languageManager.locales[this.languageManager.getLanguage()]["mirror_quest"];
      await this.addDiaryEntry(mirrorQuestText);
      // Вызовем визуальный эффект через VisualEffectsManager
      const effectsManager = new VisualEffectsManager();
      effectsManager.triggerMirrorEffect();
    }
  });
}

}