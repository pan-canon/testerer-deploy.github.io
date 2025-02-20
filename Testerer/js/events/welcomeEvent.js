import { BaseEvent } from './baseEvent.js';
 
/**
 * WelcomeEvent – событие приветствия, которое уведомляет пользователя о приглашении подойти к зеркалу.
 * Наследуется от BaseEvent и реализует логику активации через менеджер событий (EventManager).
 *
 * При активации события:
 *  1) Проверяем, не было ли оно ранее зарегистрировано (isEventLogged).
 *  2) Если нет, добавляем запись "welcome" в дневник (как призрачный пост).
 *  3) Устанавливаем флаг "mirrorQuestReady" в localStorage, чтобы кнопка "Запостить" разблокировалась.
 *  4) Обновляем состояние кнопки "Запостить" через QuestManager (updatePostButtonState).
 *  5) Запускаем визуальный эффект (зеркальный эффект) через VisualEffectsManager.
 */
export class WelcomeEvent extends BaseEvent {
  /**
   * @param {EventManager} eventManager – Менеджер для работы с дневником (EventManager).
   * @param {App} appInstance – ссылка на основной объект приложения.
   * @param {LanguageManager} languageManager – менеджер локализации для перевода сообщений (необязательно).
   */
  constructor(eventManager, appInstance, languageManager) {
    super(eventManager);
    this.app = appInstance;
    this.languageManager = languageManager;
    // Устанавливаем уникальный ключ события "welcome".
    this.key = "welcome";
  }

  /**
   * activate – переопределенный метод активации события 'welcome'.
   *
   * Шаги:
   *  1) Если событие "welcome" уже есть в дневнике, завершаем без действий.
   *  2) Иначе, добавляем запись в дневник как призрачный пост.
   *  3) Устанавливаем 'mirrorQuestReady' = true, чтобы разрешить квест (кнопку "Запостить").
   *  4) Вызываем this.app.questManager.updatePostButtonState(), чтобы разблокировать "Запостить".
   *  5) Запускаем зеркальный визуальный эффект (triggerMirrorEffect).
   */
  async activate() {
    // 1) Если событие "welcome" уже зарегистрировано, выходим.
    if (this.eventManager.isEventLogged(this.key)) {
      console.log("Событие 'welcome' уже зарегистрировано. Пропускаем активацию.");
      return;
    }

    console.log("Активируем событие 'welcome': регистрируем приглашение подойти к зеркалу");
    
    // 2) Добавляем запись 'welcome' в дневник как призрачный пост (true).
    await this.eventManager.addDiaryEntry(this.key, true);
    
    // 3) Устанавливаем флаг готовности mirrorQuestReady в localStorage.
    localStorage.setItem("mirrorQuestReady", "true");
    
    // 4) Обновляем состояние кнопки "Запостить" 
    // (т.к. логика кнопки перенесена в QuestManager).
    this.app.questManager.updatePostButtonState();
    
    // 5) Запускаем зеркальный визуальный эффект.
    this.app.visualEffectsManager.triggerMirrorEffect();
  }
}