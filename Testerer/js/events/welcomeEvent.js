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
  // Если событие уже активно, ничего не делаем
  if (localStorage.getItem("mirrorQuestActive") === "true") {
    console.log("Событие 'welcome' уже активно – пропускаем повторную активацию.");
    return;
  }
  console.log("Активируем событие 'welcome': регистрируем приглашение подойти к зеркалу");
  // Получаем локализованный текст для приглашения (например, "Подойди к зеркалу")
  const mirrorQuestText = this.languageManager.locales[this.languageManager.getLanguage()]["mirror_quest"];
    
  // Добавляем запись в дневнике с этим текстом
  await this.addDiaryEntry(mirrorQuestText);
    
  // Устанавливаем флаг активности зеркального квеста и обновляем состояние кнопки "Запостить"
  localStorage.setItem("mirrorQuestActive", "true");
  this.app.updatePostButtonState();
    
  // Вызываем визуальный эффект (например, эффект зеркала)
  const effectsManager = new VisualEffectsManager();
  effectsManager.triggerMirrorEffect();
}

}