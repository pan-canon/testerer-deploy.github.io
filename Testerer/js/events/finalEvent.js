import { BaseEvent } from './baseEvent.js';

/**
 * FinalEvent – пример завершающего события (финала),
 * которое логируется в дневник и может сигнализировать о том,
 * что сценарий призрака (или всей игры) подошёл к концу.
 */
export class FinalEvent extends BaseEvent {
  /**
   * @param {EventManager} eventManager – Менеджер дневника (EventManager).
   * @param {App} appInstance – Основной объект приложения.
   * @param {LanguageManager} [languageManager] – Менеджер локализации (необязательно).
   */
  constructor(eventManager, appInstance, languageManager) {
    super(eventManager);
    this.app = appInstance;
    this.languageManager = languageManager;

    // Уникальный ключ финального события.
    // Можно назвать 'final_event' или что-то похожее.
    this.key = "final_event";
  }

  /**
   * activate – переопределённый метод активации финального события.
   * Здесь можно делать публикацию поста "конец игры", менять UI, и т.д.
   */
  async activate() {
    // Проверяем, не было ли уже события:
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`Событие '${this.key}' уже зарегистрировано, пропускаем.`);
      return;
    }

    console.log(`Активируем финальное событие: '${this.key}'`);
    // Публикуем запись "final_event" в дневник (как призрачный пост, например).
    await this.eventManager.addDiaryEntry(this.key, true);

    // Допустим, ставим флаг, что игра/призрак завершены
    localStorage.setItem("gameFinalized", "true");

    // Можно запустить визуальный эффект: "исчезновение призрака"
    this.app.visualEffectsManager.triggerGhostAppearanceEffect("ghost_fade_out");

    // Либо показать сообщение/alert
    alert("🎉 Поздравляем, сценарий завершён!");

    // Если нужно — отключаем UI кнопок и т.д.
    // this.app.controlsPanel.style.display = "none";
  }
}