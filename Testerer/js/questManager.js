import { BaseMirrorQuest }   from './quests/baseMirrorQuest.js';
import { BaseRepeatingQuest } from './quests/baseRepeatingQuest.js';
import { FinalQuest }         from './quests/finalQuest.js';

export class QuestManager {
  constructor(eventManager, appInstance, profileManager) {
    this.eventManager   = eventManager;
    this.app            = appInstance;
    this.profileManager = profileManager;

    this.quests = [
      new BaseMirrorQuest(this.eventManager, this.app, {
        key: "mirror_quest"
      }),
      new BaseRepeatingQuest(this.eventManager, this.app, {
        key: "repeating_quest",
        totalStages: 5  // к примеру, 5 раз надо «сфоткаться»
      }),
      new FinalQuest(this.eventManager, this.app, {
        key: "final_quest"
      })
    ];

    this.initCameraListeners();
  }

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
      if (mirrorQuest) mirrorQuest.stopCheckLoop();
    };
  }

  async activateQuest(key) {
    const quest = this.quests.find(q => q.key === key);
    if (!quest) {
      console.warn(`[QuestManager] Квест с ключом "${key}" не найден.`);
      return;
    }
    await quest.activate();
    
    // Зеркальному квесту сразу запускаем startCheckLoop (иначе пользователь не увидит «Нет совпадения»)
    if (key === "mirror_quest") {
      quest.startCheckLoop();
    }
    // Для repeating_quest тоже можно auto startCheckLoop
    if (key === "repeating_quest") {
      quest.startCheckLoop();
    }
  }

  async checkQuest(key) {
    const quest = this.quests.find(q => q.key === key);
    if (quest) {
      await quest.finish();
    }
  }

  /**
   * handleShootMirrorQuest – для кнопки «Заснять»,
   * когда мы хотим закрыть зеркальный квест.
   */
  async handleShootMirrorQuest() {
    console.log("[QuestManager] handleShootMirrorQuest()");
    await this.checkQuest("mirror_quest");
  }

  /**
   * handlePostButtonClick – если mirrorQuestReady=true, запускаем mirror_quest.
   */
  async handlePostButtonClick() {
    console.log("[QuestManager] handlePostButtonClick()");
    const isReady = (localStorage.getItem("mirrorQuestReady") === "true");
    if (isReady) {
      localStorage.removeItem("mirrorQuestReady");
      this.updatePostButtonState();

      console.log("Запуск зеркального квеста (пост от пользователя)");
      const camBtn = document.getElementById("toggle-camera");
      if (camBtn) camBtn.classList.add("glowing");

      await this.activateQuest("mirror_quest");
    } else {
      alert("Ждите приглашения от призрака для начала квеста.");
    }
  }

  updatePostButtonState() {
    const isReady = (localStorage.getItem("mirrorQuestReady") === "true");
    const postBtn = this.app.postBtn;
    if (postBtn) {
      postBtn.disabled = !isReady;
    }
    console.log("[QuestManager] updatePostButtonState =>", isReady);
  }

  updateCameraButtonState() {
    const cameraBtn = document.getElementById("toggle-camera");
    if (!cameraBtn) return;
    if (localStorage.getItem("mirrorQuestActive") === "true") {
      cameraBtn.classList.add("glowing");
    } else {
      cameraBtn.classList.remove("glowing");
    }
  }
}