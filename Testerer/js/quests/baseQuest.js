export class BaseQuest {
  /**
   * @param {EventManager} eventManager – менеджер событий (для работы с дневником)
   */
  constructor(eventManager) {
    this.eventManager = eventManager;
    this.key = "";      // Уникальный идентификатор квеста (например, "mirror_quest")
    this.doneKey = "";  // Идентификатор завершения (например, "mirror_done")
  }

  /**
   * Метод активации квеста. Можно переопределять в наследниках.
   */
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`🔔 Активируем квест: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key);
    }
  }

  /**
   * Метод проверки статуса квеста. По умолчанию возвращает false.
   * Наследники должны реализовать свою проверку.
   */
  async checkStatus() {
    return false;
  }

  /**
   * Метод завершения квеста. Вызывает checkStatus и, если квест выполнен, добавляет запись о завершении.
   */
  async finish() {
    const success = await this.checkStatus();
    if (success) {
      if (!this.eventManager.isEventLogged(this.doneKey)) {
        await this.eventManager.addDiaryEntry(this.doneKey);
      }
      alert("✅ Задание выполнено!");
    } else {
      alert("❌ Нет совпадения! Попробуйте ещё раз!");
    }
  }
}
