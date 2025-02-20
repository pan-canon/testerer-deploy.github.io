import { BaseEvent } from './baseEvent.js';

/**
 * WelcomeEvent – событие приветствия, которое уведомляет пользователя о приглашении подойти к зеркалу.
 * Наследуется от BaseEvent и реализует логику активации через менеджер событий (EventManager).
 *
 * При активации события:
 * 1) Проверяется, не было ли оно ранее зарегистрировано.
 * 2) Если нет, добавляется запись "welcome" в дневник как призрачный пост.
 * 3) Устанавливается флаг "mirrorQuestReady" в localStorage, чтобы разблокировать кнопку "Запостить".
 * 4) Обновляется состояние кнопки "Запостить" через QuestManager.
 * 5) Запускается зеркальный визуальный эффект через VisualEffectsManager.
 */
export class WelcomeEvent extends BaseEvent {
  /**
   * @param {EventManager} eventManager – Менеджер для работы с дневником.
   * @param {App} appInstance – ссылка на основной объект приложения.
   * @param {LanguageManager} languageManager – менеджер локализации для перевода сообщений (необязательно).
   */
  constructor(eventManager, appInstance, languageManager) {
    super(eventManager);
    this.app = appInstance;
    this.languageManager = languageManager;
    this.key = "welcome";
  }

  /**
   * activate – переопределённый метод активации события "welcome".
   */
  async activate() {
    if (this.eventManager.isEventLogged(this.key)) {
      console.log("Событие 'welcome' уже зарегистрировано. Пропускаем активацию.");
      return;
    }

    console.log("Активируем событие 'welcome': регистрируем приглашение подойти к зеркалу");
    
    await this.eventManager.addDiaryEntry(this.key, true);
    
    localStorage.setItem("mirrorQuestReady", "true");
    
    this.app.questManager.updatePostButtonState();
    
    // Запускаем зеркальный визуальный эффект. Если камера не активна, эффект не будет запущен.
    this.app.visualEffectsManager.triggerMirrorEffect();
  }
}