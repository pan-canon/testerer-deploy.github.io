import { BaseMirrorQuest } from './quests/baseMirrorQuest.js';

/**
 * QuestManager – класс для управления квестами в приложении.
 *
 * Данный класс осуществляет регистрацию и управление доступными квестами,
 * предоставляет методы для их активации, проверки и завершения.
 * Он интегрирован с EventManager для регистрации событий в дневнике,
 * с основным объектом приложения (App) для доступа к общим функциям и с ProfileManager для сохранения прогресса.
 *
 * Реализуется своя версия паттерна Observer: изменение состояния квестов уведомляет подписанные компоненты.
 */
export class QuestManager {
  /**
   * Конструктор QuestManager.
   * @param {EventManager} eventManager - Менеджер событий (работа с дневником).
   * @param {App} appInstance - Основной объект приложения.
   * @param {ProfileManager} profileManager - Менеджер профиля, отвечающий за сохранение прогресса.
   *
   * При инициализации регистрируются доступные квесты. В текущей реализации добавлен только BaseMirrorQuest.
   */
  constructor(eventManager, appInstance, profileManager) {
    this.eventManager = eventManager;
    this.app = appInstance;
    this.profileManager = profileManager;
    
    // Регистрируем доступные квесты. В будущем сюда можно добавить новые квесты.
    this.quests = [
      new BaseMirrorQuest(this.eventManager, this.app)
    ];
  }

  /**
   * activateQuest – активирует квест по его уникальному ключу.
   * @param {string} key - Уникальный ключ квеста (например, "mirror_quest").
   *
   * Метод ищет квест с заданным ключом в массиве this.quests и, если он найден,
   * вызывает его метод activate() для начала квеста.
   *
   * @returns {Promise<void>}
   */
  async activateQuest(key) {
    const quest = this.quests.find(q => q.key === key);
    if (quest) {
      await quest.activate();
    }
  }

  /**
   * checkQuest – проверяет и завершает квест по его ключу.
   * @param {string} key - Уникальный ключ квеста.
   *
   * Метод ищет квест с указанным ключом и вызывает его метод finish(),
   * чтобы проверить условия квеста и зарегистрировать результат.
   *
   * @returns {Promise<void>}
   */
  async checkQuest(key) {
    const quest = this.quests.find(q => q.key === key);
    if (quest) {
      await quest.finish();
    }
  }

  /**
   * checkMirrorQuestOnCamera – удобный метод для проверки зеркального квеста.
   *
   * Вызывает метод checkQuest с ключом "mirror_quest".
   *
   * @returns {Promise<void>}
   */
  async checkMirrorQuestOnCamera() {
    await this.checkQuest("mirror_quest");
  }

  /**
   * triggerMirrorQuestIfActive – запускает проверку зеркального квеста,
   * если он активен. Например, этот метод можно вызвать после включения камеры.
   *
   * Проверяет флаг в localStorage (mirrorQuestActive); если он установлен, запускается проверка.
   *
   * @returns {Promise<void>}
   */
  async triggerMirrorQuestIfActive() {
    if (localStorage.getItem("mirrorQuestActive") === "true") {
      console.log("🪞 Активируем проверку зеркального квеста...");
      await this.checkMirrorQuestOnCamera();
    }
  }

  /**
   * checkAvailablePhenomena – проверяет доступные явления (phenomena) на основе текущей локации.
   *
   * Метод получает тип локации через ProfileManager, затем находит активного призрака
   * и сравнивает разрешённые явления для локации с теми, которые допускаются для данного призрака.
   *
   * Если обнаружено пересечение, выводит информацию в консоль.
   *
   * @returns {Promise<void>}
   */
  async checkAvailablePhenomena() {
    // Получаем текущий тип локации из ProfileManager.
    const locationType = this.profileManager.getLocationType();
    if (locationType) {
      console.log(`Текущая локация: ${locationType}`);
      // Определяем разрешённые явления для данной локации.
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
      // Извлекаем разрешённые явления для текущей локации.
      const locationPhenomena = locationAllowedPhenomena[locationType] || [];
      
      // Получаем текущего призрака из GhostManager.
      const ghost = this.app.ghostManager.getCurrentGhost();
      if (ghost) {
        // Предполагаем, что у объекта ghost есть свойство allowedPhenomena – массив явлений,
        // которые доступны для данного призрака.
        const intersection = ghost.allowedPhenomena.filter(p => locationPhenomena.includes(p));
        if (intersection.length > 0) {
          console.log(`Доступные явления: ${intersection}`);
          // Здесь можно добавить логику активации явлений, например, запуск определенного эффекта или уведомление.
        }
      }
    }
  }
}