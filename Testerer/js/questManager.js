import { BaseMirrorQuest } from './quests/baseMirrorQuest.js';
 
/**
 * QuestManager – класс для управления квестами в приложении.
 *
 * Логика нажатия на кнопку «Запостить» (handlePostButtonClick)
 * и обновления её состояния (updatePostButtonState) вынесена сюда, чтобы
 * обеспечить универсальное управление запуском квестов без прямой зависимости от App.
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
    this.profileManager = profileManager;

    // Регистрируем доступные квесты. В данном случае – базовый зеркальный квест.
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
      console.warn([QuestManager] Квест с ключом "${key}" не найден.);
    }
  }

  /**
   * checkQuest – проверяет и завершает квест по его ключу, вызывая finish().
   * @param {string} key - Уникальный ключ квеста.
   */
  async checkQuest(key) {
    const quest = this.quests.find(q => q.key === key);
    if (quest) {
      await quest.finish();
    }
  }

  /**
   * handleShootMirrorQuest – метод для кнопки «Заснять».
   * Вызывается, когда пользователь нажимает на «Заснять» на экране камеры.
   * Завершается зеркальный квест (через finish()).
   */
  async handleShootMirrorQuest() {
    console.log("[QuestManager] handleShootMirrorQuest()");
    await this.checkQuest("mirror_quest");
  }

  /**
   * handlePostButtonClick – обрабатывает нажатие на кнопку "Запостить":
   *   1) Если флаг mirrorQuestReady равен true, сбрасываем его, обновляем состояние кнопки,
   *      подсвечиваем камеру и активируем зеркальный квест.
   *   2) Если флаг не установлен, выводим предупреждение.
   */
  async handlePostButtonClick() {
    console.log("[QuestManager] handlePostButtonClick()");
    const isReady = localStorage.getItem("mirrorQuestReady") === "true";
    if (isReady) {
      // Сбрасываем флаг, чтобы избежать повторной активации
      localStorage.removeItem("mirrorQuestReady");
      this.updatePostButtonState();

      console.log("Запуск зеркального квеста (пост от пользователя)");

      // Подсвечиваем кнопку "toggle-camera" (если необходимо)
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
   * updatePostButtonState – обновляет состояние кнопки "Запостить"
   * в зависимости от того, установлен ли флаг mirrorQuestReady.
   */
  updatePostButtonState() {
    const isReady = localStorage.getItem("mirrorQuestReady") === "true";
    console.log("[QuestManager] updatePostButtonState:", isReady);

    const postBtn = this.app.postBtn;
    if (postBtn) {
      postBtn.disabled = !isReady;
    }
  }

  /**
   * updateCameraButtonState – обновляет состояние кнопки "toggle-camera"
   * в зависимости от того, активен ли зеркальный квест.
   */
  updateCameraButtonState() {
    const cameraBtn = document.getElementById("toggle-camera");
    if (!cameraBtn) return;
    if (localStorage.getItem("mirrorQuestActive") === "true") {
      cameraBtn.classList.add("glowing");
    } else {
      cameraBtn.classList.remove("glowing");
    }
  }

  /**
   * triggerMirrorQuestIfActive – при включении камеры проверяет localStorage,
   * и если флаг mirrorQuestActive установлен, запускает проверку квеста.
   */
  async triggerMirrorQuestIfActive() {
    if (localStorage.getItem("mirrorQuestActive") === "true") {
      console.log("🪞 Активируем проверку зеркального квеста...");
      await this.checkQuest("mirror_quest");
    }
  }

  /**
   * checkMirrorQuestOnCamera – удобный метод для проверки зеркального квеста на камере.
   * Вызывает checkQuest с ключом "mirror_quest".
   */
  async checkMirrorQuestOnCamera() {
    await this.checkQuest("mirror_quest");
  }

  /**
   * checkAvailablePhenomena – пример логики проверки доступных феноменов
   * на основе типа локации и разрешённых явлений для текущего призрака.
   */
  async checkAvailablePhenomena() {
    const locationType = this.profileManager?.getLocationType?.();
    if (locationType) {
      console.log(Текущая локация: ${locationType});
      const locationAllowedPhenomena = {
        "Кухня": ["call", "randomCall"],
        "Спальня": ["call", "randomCall"],
        // Дополнительные локации и явления можно добавить здесь
      };
      const locationPhenomena = locationAllowedPhenomena[locationType] || [];
      const ghost = this.app.ghostManager.getCurrentGhost();
      if (ghost && ghost.allowedPhenomena) {
        const intersection = ghost.allowedPhenomena.filter(p => locationPhenomena.includes(p));
        if (intersection.length > 0) {
          console.log(Доступные явления: ${intersection});
          // Здесь можно запустить дополнительную логику (например, эффект или уведомление)
        }
      }
    }
  }
}