import { BaseMirrorQuest } from './quests/baseMirrorQuest.js';
import { BaseRepeatingQuest } from './quests/baseRepeatingQuest.js';
import { FinalQuest } from './quests/finalQuest.js';

/**
 * QuestManager – A class for managing quests (mirror, repeating, final) in the application.
 */
export class QuestManager {
  /**
   * @param {EventManager} eventManager - The event manager for diary operations.
   * @param {App} appInstance - The main application instance.
   * @param {ProfileManager} [profileManager] - The profile manager (optional).
   */
  constructor(eventManager, appInstance, profileManager) {
    this.eventManager = eventManager;
    this.app = appInstance;
    this.profileManager = profileManager;

    // Initialize three quests.
    this.quests = [
      // Mirror quest.
      new BaseMirrorQuest(this.eventManager, this.app, {
        key: "mirror_quest"
      }),
      // Repeating quest (e.g., obtaining several letters).
      new BaseRepeatingQuest(this.eventManager, this.app, {
        key: "repeating_quest",
        totalStages: 5, // Alternatively, calculated based on the ghost's name.
        statusElementId: "repeating-quest-status",
        shootButtonId: "btn_shoot"
      }),
      // Final quest.
      new FinalQuest(this.eventManager, this.app, {
        key: "final_quest"
      })
    ];

    // Set up camera event listeners without automatically triggering quest chains.
    this.initCameraListeners();
  }

  /**
   * initCameraListeners – Sets up camera event listeners.
   * Instead of automatically triggering a quest's check loop,
   * these listeners only log the signals for external handling.
   */
  initCameraListeners() {
    const cameraManager = this.app.cameraSectionManager;
    if (!cameraManager) return;

    cameraManager.onVideoReady = () => {
      console.log("[QuestManager] onVideoReady signal received.");
      // External code can choose to act on this signal explicitly.
    };

    cameraManager.onCameraClosed = () => {
      console.log("[QuestManager] onCameraClosed signal received.");
      // External code can choose to act on this signal explicitly.
    };
  }

  /**
   * activateQuest – Finds the quest by key and calls its activate() method.
   * Activation now occurs only via explicit calls.
   * @param {string} key - The quest key to activate.
   */
  async activateQuest(key) {
    const quest = this.quests.find(q => q.key === key);
    if (!quest) {
      console.warn(`[QuestManager] Quest with key "${key}" not found.`);
      return;
    }
    await quest.activate();
    // Do not automatically call startCheckLoop here.
    // If a quest requires a check loop, it must be triggered explicitly.
  }

  /**
   * checkQuest – Checks the quest by calling its finish() method.
   * @param {string} key - The quest key to check.
   */
  async checkQuest(key) {
    const quest = this.quests.find(q => q.key === key);
    if (!quest) {
      console.warn(`[QuestManager] Cannot check quest "${key}": not found.`);
      return;
    }
    await quest.finish();
  }

  /**
   * handleShootMirrorQuest – Called when the "Shoot" button is clicked during the mirror quest.
   */
  async handleShootMirrorQuest() {
    console.log("[QuestManager] handleShootMirrorQuest() called.");
    await this.checkQuest("mirror_quest");
  }

  /**
   * handlePostButtonClick – Called when the "Post" button is clicked.
   * If mirrorQuestReady is true, explicitly triggers the mirror quest.
   */
  async handlePostButtonClick() {
    const isReady = localStorage.getItem("mirrorQuestReady") === "true";
    if (isReady) {
      localStorage.removeItem("mirrorQuestReady");
      this.updatePostButtonState();
      console.log("[QuestManager] Triggering mirror quest from handlePostButtonClick.");
      
      // Highlight the camera button.
      const cameraBtn = document.getElementById("toggle-camera");
      if (cameraBtn) cameraBtn.classList.add("glowing");

      await this.activateQuest("mirror_quest");
    } else {
      alert("Please wait for a ghost invitation to start the quest.");
    }
  }

  /**
   * updatePostButtonState – Enables or disables the "Post" button based on mirrorQuestReady.
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
   * updateCameraButtonState – Highlights the camera button if mirrorQuestActive is true.
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
   * triggerMirrorQuestIfActive – If mirrorQuestActive is true, explicitly check the mirror quest.
   */
  async triggerMirrorQuestIfActive() {
    if (localStorage.getItem("mirrorQuestActive") === "true") {
      console.log("[QuestManager] triggerMirrorQuestIfActive: finishing mirror_quest");
      await this.checkQuest("mirror_quest");
    }
  }

  /**
   * checkMirrorQuestOnCamera – A shortcut to check the mirror quest.
   */
  async checkMirrorQuestOnCamera() {
    await this.checkQuest("mirror_quest");
  }
}