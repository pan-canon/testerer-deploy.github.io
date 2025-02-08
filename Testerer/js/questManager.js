import { MirrorQuest } from './quests/mirrorQuest.js';

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
      // В будущем сюда можно добавить новые квесты
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
   * Удобный метод для проверки зеркального квеста
   */
  async checkMirrorQuestOnCamera() {
    await this.checkQuest("mirror_quest");
  }

  /**
   * Запускает проверку зеркального квеста, если он активен (например, после включения камеры)
   */
  async triggerMirrorQuestIfActive() {
    if (localStorage.getItem("mirrorQuestActive") === "true") {
      console.log("🪞 Активируем проверку зеркального квеста...");
      await this.checkMirrorQuestOnCamera();
    }
  }
}
