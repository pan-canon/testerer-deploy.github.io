import { BaseMirrorQuest } from './quests/baseMirrorQuest.js';
import { BaseRepeatingQuest } from './quests/baseRepeatingQuest.js';
import { FinalQuest } from './quests/finalQuest.js';

/**
 * QuestManager – A class for managing quests (mirror, repeating, final) in the application.
 * 
 * CURRENT CHANGE:
 * - Removed direct UI operations (e.g., updatePostButtonState, updateCameraButtonState).
 * - Delegates UI updates to the ViewManager via methods such as setPostButtonEnabled() and setCameraButtonHighlight().
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

    // Initialize quests: mirror, repeating, and final.
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
      // External code can act on this signal explicitly via ViewManager if needed.
    };

    cameraManager.onCameraClosed = () => {
      console.log("[QuestManager] onCameraClosed signal received.");
      // External code can act on this signal explicitly via ViewManager if needed.
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
    // Note: For quests requiring a check loop, it must be triggered explicitly.
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
   * Determines quest readiness and triggers the appropriate quest.
   * UI updates are delegated to the ViewManager.
   */
  async handlePostButtonClick() {
    // Assuming repeating quest is stored in this.repeatingQuest.
    const repeatingQuest = this.repeatingQuest;

    // If repeating quest exists and is finished, do not start a new cycle.
    if (repeatingQuest && repeatingQuest.finished) {
      alert("Repeating quest is finished. The final event has already been activated.");
      return;
    }
    
    // Check the readiness flag for the quest (using business logic).
    const isReady = localStorage.getItem("mirrorQuestReady") === "true";
    if (!isReady) {
      alert("Repeating quest is finished.");
      return;
    }
    
    // Remove the readiness flag to prevent repeated triggering.
    localStorage.removeItem("mirrorQuestReady");
    // Delegate UI update: disable the "Post" button via ViewManager.
    this.app.viewManager.setPostButtonEnabled(false);
    
    // Check if repeating mode is active.
    const isRepeating = localStorage.getItem("isRepeatingCycle") === "true";
    if (isRepeating) {
      console.log("[QuestManager] Triggering repeating quest from handlePostButtonClick.");
      await this.activateQuest("repeating_quest");
    } else {
      console.log("[QuestManager] Triggering mirror quest from handlePostButtonClick.");
      await this.activateQuest("mirror_quest");
    }
  }
  
  /*
   * The methods updatePostButtonState and updateCameraButtonState have been removed.
   * All UI updates should now be handled by the ViewManager.
   *
   * For example, instead of directly manipulating the "Post" button, call:
   *    this.app.viewManager.setPostButtonEnabled(isReady);
   *
   * Similarly, for the camera button highlight, call:
   *    this.app.viewManager.setCameraButtonHighlight(isActive);
   */
  
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