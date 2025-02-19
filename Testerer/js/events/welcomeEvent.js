import { BaseEvent } from './baseEvent.js';

/**
 * WelcomeEvent – событие приветствия, которое уведомляет пользователя о приглашении подойти к зеркалу.
 * Это событие наследуется от BaseEvent и реализует свою логику активации, используя методы
 * менеджера событий (EventManager) и визуальные эффекты.
 *
 * При активации:
 *  - Проверяется, зарегистрировано ли уже событие (чтобы избежать повторной активации).
 *  - Если нет, регистрируется запись с ключом "welcome" в дневнике.
 *  - Устанавливается флаг "mirrorQuestReady" в localStorage для активации последующего квеста.
 *  - Обновляется состояние кнопки "Запостить" через вызов метода updatePostButtonState() приложения.
 *  - Запускается визуальный эффект (зеркальный эффект) через VisualEffectsManager.
 */
export class WelcomeEvent extends BaseEvent {
  /**
   * Конструктор WelcomeEvent.
   * @param {EventManager} eventManager – менеджер для работы с дневником (EventManager).
   * @param {App} appInstance – ссылка на основной объект приложения.
   * @param {LanguageManager} languageManager – менеджер локализации для перевода сообщений.
   */
  constructor(eventManager, appInstance, languageManager) {
    super(eventManager); // Вызываем конструктор базового класса
    this.app = appInstance;
    this.languageManager = languageManager;
    // Устанавливаем уникальный ключ события. Этот ключ используется для проверки, было ли событие уже зарегистрировано.
    this.key = "welcome";
  }

  /**
   * activate – переопределенный метод активации события.
   *
   * При активации выполняются следующие шаги:
   * 1. Проверяется, зарегистрировано ли уже событие с ключом "welcome" в дневнике.
   *    Если да, выводится сообщение в консоль, и дальнейшая активация прекращается.
   * 2. Если событие еще не зарегистрировано:
   *    - Выводится сообщение о начале активации.
   *    - Регистрируется событие через eventManager.addDiaryEntry с флагом, что запись от призрака.
   *    - Устанавливается флаг "mirrorQuestReady" в localStorage для последующего запуска квеста.
   *    - Обновляется состояние кнопки "Запостить" в приложении.
   *    - Запускается визуальный эффект (зеркальный эффект) через VisualEffectsManager.
   *
   * @returns {Promise<void>} Promise, разрешающийся после выполнения всех действий активации.
   */
  async activate() {
    // Если событие "welcome" уже зарегистрировано в дневнике, пропускаем активацию.
    if (this.eventManager.isEventLogged(this.key)) {
      console.log("Событие 'welcome' уже зарегистрировано. Пропускаем активацию.");
      return;
    }
    console.log("Активируем событие 'welcome': регистрируем приглашение подойти к зеркалу");
    
    // Регистрируем событие с ключом "welcome". Второй параметр true означает, что запись помечается как событие от призрака.
    await this.eventManager.addDiaryEntry(this.key, true);
    
    // Устанавливаем флаг готовности для зеркального квеста.
    localStorage.setItem("mirrorQuestReady", "true");
    
    // Обновляем состояние кнопки "Запостить" в приложении, чтобы пользователь мог запустить квест.
    this.app.updatePostButtonState();
    
    // Создаем экземпляр VisualEffectsManager и запускаем зеркальный визуальный эффект.
    const effectsManager = this.app.visualEffectsManager;
    effectsManager.triggerMirrorEffect();
  }
}