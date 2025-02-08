export class QuestManager {
  /**
   * @param {EventManager} eventManager – менеджер событий (для работы с дневником)
   * @param {App} appInstance – ссылка на основной объект App
   */
  constructor(eventManager, appInstance) {
    this.eventManager = eventManager;
    this.app = appInstance;
    // Регистрируем доступные квесты
    this.quests = [
      new MirrorQuest(this.eventManager, this.app)
      // В будущем можно добавить другие квесты
    ];
  }

  /**
   * Активирует квест по его ключу
   * @param {string} key
   */
  async activateQuest(key) {
    const quest = this.quests.find(q => q.key === key);
    if (quest) {
      await quest.activate();
    }
  }

  /**
   * Проверяет и завершает квест по ключу
   * @param {string} key
   */
  async checkQuest(key) {
    const quest = this.quests.find(q => q.key === key);
    if (quest) {
      await quest.finish();
    }
  }

  /**
   * Новый метод для обработки активации камеры.
   * Он делегирует запуск проверки конкретному квесту (например, зеркальному).
   */
  handleCameraActivated() {
    const mirrorQuest = this.quests.find(q => q.key === "mirror_quest");
    if (mirrorQuest) {
      mirrorQuest.activateOnCamera();
    }
  }
}
