import { BaseMirrorQuest } from './quests/baseMirrorQuest.js';
import { BaseRepeatingQuest } from './quests/baseRepeatingQuest.js';
import { FinalQuest } from './quests/finalQuest.js';

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
    this.eventManager   = eventManager;
    this.app            = appInstance;
    this.profileManager = profileManager;

    // В будущем можете регистрировать квесты динамически или настраивать их в конфигурации
    this.quests = [
      new BaseMirrorQuest(this.eventManager, this.app),
      new BaseRepeatingQuest(this.eventManager, this.app, { key: 'repeating_quest' }),
      new FinalQuest(this.eventManager, this.app, { key: 'final_quest' })
    ];

    // Подписываемся на события камеры (готовность видеопотока / закрытие камеры)
    this.initCameraListeners();
  }

  /**
   * initCameraListeners – подписывается на события готовности видеопотока и закрытия камеры.
   * В текущем примере автоматически запускаем цикл проверки зеркального квеста,
   * если "mirrorQuestActive" установлен в localStorage.
   */
  initCameraListeners() {
    const cameraManager = this.app.cameraSectionManager;
    if (!cameraManager) return;

    cameraManager.onVideoReady = () => {
      console.log("QuestManager: видео готово.");
      // Можно проверить, не только зеркальный квест, но и другие, которым нужна камера
      const mirrorQuest = this.quests.find(q => q.key === "mirror_quest");
      if (mirrorQuest && localStorage.getItem("mirrorQuestActive") === "true") {
        mirrorQuest.startCheckLoop();
      }
    };

    cameraManager.onCameraClosed = () => {
      console.log("QuestManager: камера закрыта.");
      // Останавливаем цикл зеркального квеста (и/или других, если нужно)
      const mirrorQuest = this.quests.find(q => q.key === "mirror_quest");
      if (mirrorQuest) {
        mirrorQuest.stopCheckLoop();
      }
    };
  }

  /**
   * activateQuest – активирует квест по его уникальному ключу.
   * @param {string} key - Уникальный ключ квеста (например, "mirror_quest", "repeating_quest", "final_quest").
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
   * checkQuest – проверяет и завершает квест по его ключу, вызывая finish().
   * @param {string} key - Уникальный ключ квеста.
   */
  async checkQuest(key) {
    const quest = this.quests.find(q => q.key === key);
    if (quest) {
      await quest.finish();
    } else {
      console.warn(`[QuestManager] Не могу проверить квест с ключом "${key}": не найден.`);
    }
  }

  /**
   * handleShootMirrorQuest – (пример) метод для кнопки «Заснять» зеркального квеста.
   * Если хотите «универсальную» кнопку Заснять – нужно сделать логику более гибкой
   * (например, find all quests with shootEnabled = true).
   */
  async handleShootMirrorQuest() {
    console.log("[QuestManager] handleShootMirrorQuest()");
    await this.checkQuest("mirror_quest");
  }

  /**
   * handlePostButtonClick – обрабатывает нажатие на кнопку "Запостить":
   *   1) Если флаг mirrorQuestReady равен true, сбрасываем его и активируем зеркальный квест (пример).
   *   2) Иначе, предупреждаем пользователя.
   *
   * В дальнейшем, если у вас есть повторяющийся квест или другой,
   * можно добавить дополнительную логику для них.
   */
  async handlePostButtonClick() {
    console.log("[QuestManager] handlePostButtonClick()");
    const isReady = localStorage.getItem("mirrorQuestReady") === "true";
    if (isReady) {
      // Сбрасываем флаг, чтобы избежать повторной активации
      localStorage.removeItem("mirrorQuestReady");
      this.updatePostButtonState();

      console.log("Запуск зеркального квеста (пост от пользователя)");

      // Подсвечиваем кнопку "toggle-camera" (пример)
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
   * Если в будущем будут другие квесты, нужен более универсальный механизм (флаги / конфиг).
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
   * в зависимости от того, активен ли зеркальный квест (mirrorQuestActive).
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
   * triggerMirrorQuestIfActive – при включении камеры (или по запросу) проверяет localStorage,
   * и если флаг mirrorQuestActive установлен, запускает зеркальный квест (finish).
   * Пример утилитарного метода, если хотите вызвать извне.
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
      console.log(`Текущая локация: ${locationType}`);
      const locationAllowedPhenomena = {
        "Кухня":   ["call", "randomCall"],
        "Спальня": ["call", "randomCall"],
        // Дополнительные локации и явления можно добавить здесь
      };
      const locationPhenomena = locationAllowedPhenomena[locationType] || [];
      const ghost = this.app.ghostManager.getCurrentGhost();
      if (ghost && ghost.allowedPhenomena) {
        const intersection = ghost.allowedPhenomena.filter(p => locationPhenomena.includes(p));
        if (intersection.length > 0) {
          console.log(`Доступные явления: ${intersection}`);
          // Здесь можно запустить дополнительную логику (например, эффект или уведомление)
        }
      }
    }
  }
}