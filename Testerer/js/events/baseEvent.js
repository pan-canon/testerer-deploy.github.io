// BaseEvent.js
export class BaseEvent {
  /**
   * @param {EventManager} eventManager – менеджер для работы с дневником
   */
  constructor(eventManager) {
    this.eventManager = eventManager;
    this.key = ""; // уникальный идентификатор события
  }

  /**
   * Активирует событие: если ещё не зарегистрировано, логирует его в дневнике.
   */
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`Активируем событие: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key);
    }
  }
}
