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
   * При активации события теперь не запускается звонок.
   * Вместо этого сразу регистрируется запись с предложением подойти к зеркалу,
   * а также запускается визуальный эффект.
   */
async activate() {
  console.log("Активируем событие 'welcome': регистрируем приглашение подойти к зеркалу");
  const mirrorQuestText = this.languageManager.locales[this.languageManager.getLanguage()]["mirror_quest"];
  await this.addDiaryEntry(mirrorQuestText);
  // Вместо автоматического активации квеста устанавливаем флаг готовности,
  // который позволяет кнопке «Запостить» стать активной.
  localStorage.setItem("mirrorQuestReady", "true");
  this.app.updatePostButtonState();
  const effectsManager = new VisualEffectsManager();
  effectsManager.triggerMirrorEffect();
}


}