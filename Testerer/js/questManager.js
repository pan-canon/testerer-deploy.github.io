import { BaseMirrorQuest } from './quests/baseMirrorQuest.js';
import { BaseRepeatingQuest } from './quests/baseRepeatingQuest.js';
import { FinalQuest } from './quests/finalQuest.js';

/**
 * QuestManager – класс для управления квестами (зеркальный, повторяющийся, финальный) в приложении.
 */
export class QuestManager {
  /**
   * @param {EventManager} eventManager - Менеджер событий (работа с дневником).
   * @param {App} appInstance - Основной объект приложения.
   * @param {ProfileManager} [profileManager] - Менеджер профиля (необязательный).
   */
  constructor(eventManager, appInstance, profileManager) {
    this.eventManager   = eventManager;
    this.app            = appInstance;
    this.profileManager = profileManager;

    // Регистрируем три квеста
    this.quests = [
      // Зеркальный квест (как и было)
      new BaseMirrorQuest(this.eventManager, this.app, {
        key: "mirror_quest"
      }),
      // Повторяющийся квест (получаем несколько букв)
      new BaseRepeatingQuest(this.eventManager, this.app, {
        key: "repeating_quest",
        totalStages: 5, // или высчитываем по имени призрака
        statusElementId: "repeating-quest-status",
        shootButtonId:   "btn_shoot"
      }),
      // Финальный квест
      new FinalQuest(this.eventManager, this.app, {
        key: "final_quest"
      })
    ];

    // Подписка на события камеры
    this.initCameraListeners();
  }

  /**
   * initCameraListeners – если mirrorQuestActive=true, запускаем MirrorQuest.startCheckLoop,
   * при закрытии камеры – stopCheckLoop и т.д.
   */
  initCameraListeners() {
    const cameraManager = this.app.cameraSectionManager;
    if (!cameraManager) return;

    cameraManager.onVideoReady = () => {
      console.log("[QuestManager] onVideoReady");
      const mirrorQuest = this.quests.find(q => q.key === "mirror_quest");
      if (mirrorQuest && localStorage.getItem("mirrorQuestActive") === "true") {
        mirrorQuest.startCheckLoop();
      }
    };

    cameraManager.onCameraClosed = () => {
      console.log("[QuestManager] onCameraClosed");
      const mirrorQuest = this.quests.find(q => q.key === "mirror_quest");
      if (mirrorQuest) {
        mirrorQuest.stopCheckLoop();
      }
      // При желании также stopCheckLoop у повторяющегося квеста, если нужно
    };
  }

  /**
   * activateQuest – ищем квест по ключу, вызываем activate().
   */
  async activateQuest(key) {
    const quest = this.quests.find(q => q.key === key);
    if (!quest) {
      console.warn(`[QuestManager] Квест с ключом "${key}" не найден.`);
      return;
    }
    await quest.activate();

    // Если это зеркальный квест – можем startCheckLoop (или startCheckLoop внутри activate())
    if (key === "mirror_quest") {
      const mirrorQuest = quest;
      mirrorQuest.startCheckLoop();
    } 
    // Если это повторяющийся квест – тоже можем запускать startCheckLoop (или внутри activate())
    else if (key === "repeating_quest") {
      const repeatingQuest = quest;
      repeatingQuest.startCheckLoop();
    }
    // Если финальный квест – обычно нет checkLoop
  }

  /**
   * checkQuest – проверяет квест (вызывает finish())
   */
  async checkQuest(key) {
    const quest = this.quests.find(q => q.key === key);
    if (!quest) {
      console.warn(`[QuestManager] Не могу проверить квест "${key}": не найден.`);
      return;
    }
    await quest.finish();
  }

  /**
   * handleShootMirrorQuest – вызывается при клике на «Заснять» в зеркальном квесте.
   */
  async handleShootMirrorQuest() {
    console.log("[QuestManager] handleShootMirrorQuest()");
    await this.checkQuest("mirror_quest");
  }

  /**
   * handlePostButtonClick – если mirrorQuestReady=true, запускаем зеркальный квест.
   */
  async handlePostButtonClick() {
    const isReady = localStorage.getItem("mirrorQuestReady") === "true";
    if (isReady) {
      localStorage.removeItem("mirrorQuestReady");
      this.updatePostButtonState();
      console.log("[QuestManager] Запуск зеркального квеста из handlePostButtonClick()");
      
      // Подсвечиваем камеру
      const cameraBtn = document.getElementById("toggle-camera");
      if (cameraBtn) cameraBtn.classList.add("glowing");

      await this.activateQuest("mirror_quest");
    } else {
      alert("Ждите приглашения от призрака для начала квеста.");
    }
  }

  /**
   * updatePostButtonState – включает/выключает кнопку «Запостить» в зависимости от mirrorQuestReady.
   */
  updatePostButtonState() {
    const isReady = localStorage.getItem("mirrorQuestReady") === "true";
    const postBtn = this.app.postBtn;
    if (postBtn) {
      postBtn.disabled = !isReady;
    }
    console.log("[QuestManager] updatePostButtonState =>", isReady);
  }

  /**
   * updateCameraButtonState – подсвечивает камеру, если mirrorQuestActive=true.
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
   * triggerMirrorQuestIfActive – если mirrorQuestActive=true, checkQuest("mirror_quest")
   */
  async triggerMirrorQuestIfActive() {
    if (localStorage.getItem("mirrorQuestActive") === "true") {
      console.log("[QuestManager] triggerMirrorQuestIfActive => finish mirror_quest");
      await this.checkQuest("mirror_quest");
    }
  }

  /**
   * checkMirrorQuestOnCamera – shortcut для checkQuest("mirror_quest")
   */
  async checkMirrorQuestOnCamera() {
    await this.checkQuest("mirror_quest");
  }
}