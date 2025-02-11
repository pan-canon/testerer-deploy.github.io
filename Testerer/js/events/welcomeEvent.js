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
    // Получаем локализованный текст для приглашения (например, "Подойди к зеркалу")
    const mirrorQuestText = this.languageManager.locales[this.languageManager.getLanguage()]["mirror_quest"];
    
    // Логируем запись в дневнике с этим текстом (запись теперь создаётся от имени призрака)
    await this.addDiaryEntry(mirrorQuestText);
    
    // Вызываем визуальный эффект, например, эффект зеркала
    const effectsManager = new VisualEffectsManager();
    effectsManager.triggerMirrorEffect();
  }
}