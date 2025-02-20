/**
 * BaseEvent – базовый класс для событий, реализующий общий функционал
 * активации и логирования события в дневнике. Используется в Observer Pattern,
 * где каждое событие уведомляет подписанные компоненты (например, UI дневника)
 * о произошедших изменениях.
 */
export class BaseEvent {
  /**
   * Конструктор базового события.
   * @param {EventManager} eventManager - экземпляр менеджера событий, отвечающий за работу с дневником.
   *
   * @property {string} key - Уникальный идентификатор события, который должен быть установлен в наследниках.
   */
  constructor(eventManager) {
    /** @type {EventManager} */
    this.eventManager = eventManager;
    // Ключ события; должен быть определен в классах-наследниках.
    this.key = "";
  }

  /**
   * activate – метод активации события.
   * Если событие с данным ключом ещё не зарегистрировано (не добавлено в дневник),
   * то событие логируется (записывается в дневник) через eventManager.
   *
   * @returns {Promise<void>} Асинхронное выполнение метода.
   */
  async activate() {
    // Если событие с таким ключом ещё не зарегистрировано в дневнике...
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`Активируем событие: ${this.key}`);
      // Регистрируем событие в дневнике (запись без флага "призрак" – пусть будет как пользовательское).
      await this.eventManager.addDiaryEntry(this.key);
    }
  }

  /**
   * addDiaryEntry – удобный метод для добавления произвольной записи в дневник.
   * Использует eventManager для добавления записи.
   *
   * @param {string} text - Текст записи, который будет добавлен в дневник.
   * @param {boolean} [isGhostPost=false] - Пометка, является ли это призрачным постом.
   * @returns {Promise<void>} Асинхронное выполнение метода.
   */
  async addDiaryEntry(text, isGhostPost = false) {
    await this.eventManager.addDiaryEntry(text, isGhostPost);
  }
}