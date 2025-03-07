import { BaseEvent } from '../events/baseEvent.js';
import { ImageUtils } from '../utils/imageUtils.js';
import { StateManager } from '../stateManager.js';

/**
 * BaseMirrorQuest – Base class for the mirror quest.
 * Encapsulates the logic for comparing the current frame (canvas → grayscale → compare),
 * managing the check loop, and delegating UI updates to the ViewManager.
 */
export class BaseMirrorQuest extends BaseEvent {
  constructor(eventManager, appInstance, config = {}) {
    super(eventManager);
    this.app = appInstance;
    this.key = config.key || "mirror_quest"; // Allows overriding the key.
    this.doneKey = config.doneKey || "mirror_done";

    // Configuration for UI elements (identifiers used by ViewManager)
    this.statusElementId = config.statusElementId || "mirror-quest-status";
    this.shootButtonId = config.shootButtonId || "btn_shoot";

    this.checkInterval = null; // For startCheckLoop
    this.finished = false;

    // Canvas for frame comparison
    this.tempCanvas = document.createElement("canvas");
    this.tempCtx = this.tempCanvas.getContext("2d");

    this.registerEvents();
  }

  /**
   * registerEvents
   * If "mirrorQuestActive" flag is set, starts the check loop when camera becomes ready.
   */
  registerEvents() {
    document.addEventListener('cameraReady', () => {
      if (StateManager.get("mirrorQuestActive") === "true") {
        this.startCheckLoop();
      }
    });
  }

  /**
   * activate
   * Activates the mirror quest if not yet logged, sets mirrorQuestActive,
   * creates an "active" quest record in DB.
   */
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`Activating event: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key);
    }
    console.log("[BaseMirrorQuest] Mirror quest activated.");
    StateManager.set("mirrorQuestActive", "true");

    // Save quest record as active
    await this.app.databaseManager.saveQuestRecord({
      quest_key: this.key,
      status: "active",
      current_stage: 1,
      total_stages: 1
    });
  }

  /**
   * startCheckLoop
   * Shows UI for mirror quest (via ViewManager) and starts a loop checking "compareFrameInternally" every 2s.
   */
  startCheckLoop() {
    if (this.checkInterval) return; // Already running.

    if (this.app.viewManager && typeof this.app.viewManager.startMirrorQuestUI === 'function') {
      this.app.viewManager.startMirrorQuestUI({
        statusElementId: this.statusElementId,
        shootButtonId: this.shootButtonId,
        onShoot: () => this.finish() // When user clicks shoot
      });
    }

    this.checkInterval = setInterval(async () => {
      if (!this.app.isCameraOpen) {
        console.warn("[BaseMirrorQuest] Camera is not active - stopping check loop.");
        this.stopCheckLoop();
        return;
      }
      const success = await this.checkStatus();
      if (this.app.viewManager && typeof this.app.viewManager.updateMirrorQuestStatus === 'function') {
        this.app.viewManager.updateMirrorQuestStatus(success, this.statusElementId, this.shootButtonId);
      }
    }, 2000);
  }

  /**
   * stopCheckLoop
   * Clears the interval, hides quest UI via ViewManager.
   */
  stopCheckLoop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.app.viewManager && typeof this.app.viewManager.stopMirrorQuestUI === 'function') {
      this.app.viewManager.stopMirrorQuestUI(this.statusElementId);
    }
  }

  /**
   * checkStatus
   * Uses compareFrameInternally to decide if the user is "in front of the mirror."
   */
  async checkStatus() {
    console.log("[BaseMirrorQuest] checkStatus() -> compareFrameInternally()");
    return await this.compareFrameInternally();
  }

  /**
   * compareFrameInternally
   * Grabs the current camera frame, compares to app.selfieData, returns boolean success/fail.
   */
  async compareFrameInternally() {
    if (!this.app.isCameraOpen) {
      console.warn("[BaseMirrorQuest] Camera is not active (app.isCameraOpen false)");
      return false;
    }
    if (!this.app.selfieData) {
      console.warn("[BaseMirrorQuest] No saved selfie (app.selfieData)");
      return false;
    }
    const videoEl = this.app.cameraSectionManager?.videoElement;
    if (!videoEl || !videoEl.srcObject) {
      console.warn("[BaseMirrorQuest] Camera is not active!");
      return false;
    }

    this.tempCanvas.width = videoEl.videoWidth || 640;
    this.tempCanvas.height = videoEl.videoHeight || 480;
    this.tempCtx.drawImage(videoEl, 0, 0, this.tempCanvas.width, this.tempCanvas.height);

    const currentFrameData = ImageUtils.convertToGrayscale(this.tempCanvas);
    const matchPixel = ImageUtils.pixelWiseComparison(this.app.selfieData, currentFrameData);
    const matchHist = ImageUtils.histogramComparison(this.app.selfieData, currentFrameData);
    console.log(`[BaseMirrorQuest] pixel=${matchPixel.toFixed(2)}, hist=${matchHist.toFixed(2)}`);
    const success = (matchPixel > 0.6 && matchHist > 0.7);

    if (success) {
      this.app.lastMirrorPhoto = currentFrameData;
    }
    return success;
  }

  /**
   * updateUIAfterFinish
   * Calls a custom "updateMirrorQuestUIAfterFinish" in ViewManager (if exists).
   * 
   * @param {boolean} success - was the final check successful?
   */
  updateUIAfterFinish(success) {
    if (this.app.viewManager && typeof this.app.viewManager.updateMirrorQuestUIAfterFinish === 'function') {
      this.app.viewManager.updateMirrorQuestUIAfterFinish(success, {
        statusElementId: this.statusElementId,
        shootButtonId: this.shootButtonId,
        cameraButtonId: "toggle-camera"
      });
    }
  }

  /**
   * finish
   * - Stop check loop
   * - Compare final frame (optional)
   * - Log diary entry (success/fail)
   * - UI cleanup
   * - Clear mirrorQuestActive
   * - Mark quest as finished in DB
   * - Trigger next event if success
   * - [ADDED] syncQuestState to refresh UI (enable Post if quest done)
   */
  async finish() {
    if (this.finished) return;
    this.finished = true;

    this.stopCheckLoop();  // Отключаем UI квеста

    const success = await this.checkStatus(); 
    const ghost = this.app.ghostManager.getCurrentGhost();
    const randomLetter = ghost ? this.getRandomLetter(ghost.name) : "";

    if (success) {
      const photoData = this.app.lastMirrorPhoto
        ? ` [photo attached]\n${this.app.lastMirrorPhoto}`
        : "";
      await this.eventManager.addDiaryEntry(`user_post_success: ${randomLetter}${photoData}`, false);
    } else {
      await this.eventManager.addDiaryEntry(`user_post_failed: ${randomLetter}`, false);
    }

    // UI updates (e.g., disabling camera highlights)
    this.updateUIAfterFinish(success);

    // Сбрасываем кнопку «Открыть камеру», если нужно
    if (this.app.viewManager && typeof this.app.viewManager.setCameraButtonActive === 'function') {
      this.app.viewManager.setCameraButtonActive(false);
    }

    // Убираем флаг "mirrorQuestActive"
    StateManager.remove("mirrorQuestActive");

    // Отмечаем квест в БД как finished
    await this.app.databaseManager.saveQuestRecord({
      quest_key: this.key,
      status: "finished",
      current_stage: 1,
      total_stages: 1
    });

    // Если успешно - запускаем post_mirror_event
    if (success) {
      this.app.gameEventManager.activateEvent("post_mirror_event");
    }

    // ADDED: Чтобы кнопка «Пост» обновилась без перезагрузки
    // (если нет других активных квестов, она включится)
    await this.app.questManager.syncQuestState();
  }

  /**
   * getCurrentQuestStatus
   * Returns quest state from DB + local "finished" and "mirrorQuestActive" flags.
   */
  async getCurrentQuestStatus() {
    const record = this.app.databaseManager.getQuestRecord(this.key);
    const activeFlag = StateManager.get("mirrorQuestActive") === "true";
    return {
      key: this.key,
      active: activeFlag,
      finished: this.finished,
      dbStatus: record ? record.status : "not recorded"
    };
  }

  /**
   * getRandomLetter
   * Utility: returns a random letter from ghost's name.
   */
  getRandomLetter(name) {
    if (!name) return "";
    const letters = name.replace(/[^A-Za-zА-Яа-яЁё]/g, '').split('');
    if (!letters.length) return '';
    return letters[Math.floor(Math.random() * letters.length)];
  }
}