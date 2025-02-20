import { BaseMirrorQuest } from './quests/baseMirrorQuest.js';

/**
 * QuestManager – класс для управления квестами в приложении.
 * 
 * Перенесена логика "нажатия на кнопку «Запостить»" (handlePostButtonClick)
 * и "обновления кнопки «Запостить»" (updatePostButtonState), чтобы универсально
 * управлять запуском квестов без привязки к App.
 */
export class QuestManager {
  /**
   * @param {EventManager} eventManager - Менеджер событий (работа с дневником).
   * @param {App} appInstance - Основной объект приложения.
   * @param {ProfileManager} profileManager - (необязательный) Менеджер профиля.
   */
  constructor(eventManager, appInstance, profileManager) {
    this.eventManager = eventManager;
    this.app = appInstance;
    this.profileManager = profileManager;  // может быть не нужен

    // Регистрируем доступные квесты:
    this.quests = [
      new BaseMirrorQuest(this.eventManager, this.app)
    ];
  }

  /**
   * activateQuest – активирует квест по его уникальному ключу.
   * @param {string} key - Уникальный ключ квеста (например, "mirror_quest").
   */
  async activateQuest(key) {
    const quest = this.quests.find(q => q.key === key);
    if (quest) {
      await quest.activate();
    } else {
      console.warn(`[QuestManager] Квест с ключом "${key}" не найден.`);
    }
  }

  /**
   * checkQuest – проверяет и завершает квест по его ключу (finish()).
   * @param {string} key - Уникальный ключ квеста.
   */
  async checkQuest(key) {
    const quest = this.quests.find(q => q.key === key);
    if (quest) {
      await quest.finish();
    }
  }

  /**
   * handleShootMirrorQuest – метод для кнопки «Заснять»
   * (если пользователь нажимает на неё — завершаем mirror_quest).
   */
  async handleShootMirrorQuest() {
    console.log("[QuestManager] handleShootMirrorQuest()");

    // Завершаем зеркальный квест (если есть)
    await this.checkQuest("mirror_quest");

    // После завершения, UI в BaseMirrorQuest сам закрывается (stopCheckLoop)
    // Если нужна дополнительная логика – добавляйте здесь.
  }

  /**
   * handlePostButtonClick – обрабатывает нажатие на кнопку "Запостить":
   *   1) Если mirrorQuestReady == true, активируем зеркальный квест.
   *   2) Иначе – предупреждаем, что нужно дождаться призрака.
   */
  async handlePostButtonClick() {
    console.log("[QuestManager] handlePostButtonClick()");
    const isReady = localStorage.getItem("mirrorQuestReady") === "true";
    if (isReady) {
      // Сбрасываем флаг
      localStorage.removeItem("mirrorQuestReady");
      this.updatePostButtonState();

      console.log("Добавляем пост от пользователя (логика, если нужна)");

      // Подсвечиваем камеру, если хотим
      const cameraBtn = document.getElementById("toggle-camera");
      if (cameraBtn) {
        cameraBtn.classList.add("glowing");
      }

      // Активируем зеркальный квест
      await this.activateQuest("mirror_quest");
    } else {
      alert("Ждите приглашения от призрака для начала квеста.");
    }
  }

  /**
   * updatePostButtonState – универсально меняет состояние кнопки "Запостить"
   * (например, когда mirrorQuestReady = true/false).
   */
  updatePostButtonState() {
    const isReady = (localStorage.getItem("mirrorQuestReady") === "true");
    console.log("[QuestManager] updatePostButtonState:", isReady);

    // Доступаемся к postBtn из app
    const postBtn = this.app.postBtn;
    if (postBtn) {
      postBtn.disabled = !isReady;
    }
  }

  /**
   * triggerMirrorQuestIfActive – например, при включении камеры, 
   * проверяем localStorage и, если квест активен, проводим проверку / запускаем цикл.
   */
  async triggerMirrorQuestIfActive() {
    if (localStorage.getItem("mirrorQuestActive") === "true") {
      console.log("🪞 Активируем проверку зеркального квеста...");
      await this.checkQuest("mirror_quest");
    }
  }

  /**
   * checkMirrorQuestOnCamera – пример удобного метода 
   * (вызывает checkQuest("mirror_quest")).
   */
  async checkMirrorQuestOnCamera() {
    await this.checkQuest("mirror_quest");
  }

  /**
   * checkAvailablePhenomena – пример логики проверки доступных феноменов (из вашего кода).
   */
  async checkAvailablePhenomena() {
    const locationType = this.profileManager?.getLocationType?.();
    if (locationType) {
      console.log(`Текущая локация: ${locationType}`);
      const locationAllowedPhenomena = {
        "Кухня": ["call", "randomCall"],
        "Спальня": ["call", "randomCall"],
        // ...
      };
      const locationPhenomena = locationAllowedPhenomena[locationType] || [];
      const ghost = this.app.ghostManager.getCurrentGhost();
      if (ghost && ghost.allowedPhenomena) {
        const intersection = ghost.allowedPhenomena.filter(p => locationPhenomena.includes(p));
        if (intersection.length > 0) {
          console.log(`Доступные явления: ${intersection}`);
          // Запустить...
        }
      }
    }
  }
}