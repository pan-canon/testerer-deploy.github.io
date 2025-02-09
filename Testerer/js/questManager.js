// /js/questManager.js
import { MirrorQuest } from './quests/mirrorQuest.js';

export class QuestManager {
  /**
   * @param {EventManager} eventManager – менеджер событий (для работы с дневником)
   * @param {App} appInstance – ссылка на основной объект App
   */
  constructor(eventManager, appInstance, profileManager) {
    this.eventManager = eventManager;
    this.app = appInstance;
    this.profileManager = profileManager;
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

  /**
   * Проверка доступных явлений на основе текущей локации.
   */
  async checkAvailablePhenomena() {
    const locationType = this.profileManager.getLocationType();
    if (locationType) {
      console.log(`Текущая локация: ${locationType}`);
      // Механизм определения явлений на основе локации
      const ghost = this.app.ghostManager.getCurrentGhost();
      if (ghost) {
        const locationAllowedPhenomena = {
          "Кухня": ["call", "randomCall"],
          "Спальня": ["call", "randomCall"],
          "Гостиная": ["call", "randomCall"],
          "Ванная": ["call", "randomCall"],
          "Коридор": ["call", "randomCall"],
          "Другое": ["call", "randomCall"],
          "Подъезд": ["call", "randomCall"],
          "Кабинет": ["call", "randomCall"],
          "Библиотека": ["call", "randomCall"],
          "Детская": ["call", "randomCall"],
          "Кладовая": ["call", "randomCall"],
          "Гараж": ["call", "randomCall"]
        };
        const locationPhenomena = locationAllowedPhenomena[locationType] || [];
        const intersection = ghost.allowedPhenomena.filter(p => locationPhenomena.includes(p));
        if (intersection.length > 0) {
          console.log(`Доступные явления: ${intersection}`);
          // Здесь можно реализовать логику активации этих явлений
        }
      }
    }
  }
}