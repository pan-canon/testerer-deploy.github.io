import { BaseEvent } from '../events/BaseEvent.js';
import { ImageUtils } from '../utils/ImageUtils.js';
import { StateManager } from '../managers/StateManager.js';

/**
 * BaseMirrorQuest – Base class for the mirror quest.
 * Encapsulates the logic for comparing the current frame (canvas → grayscale → compare),
 * managing the check loop, and delegating UI updates to the ViewManager.
 */
export class BaseMirrorQuest extends BaseEvent {
  constructor(eventManager, appInstance, config = {}) {
    super(eventManager);
    this.app = appInstance;
    this.key = config.key || 'mirror_quest'; // Allows overriding the key.
    this.doneKey = config.doneKey || 'mirror_done';

    // UI configuration (identifiers used by ViewManager)
    this.statusElementId = config.statusElementId || 'mirror-quest-status';
    this.shootButtonId = config.shootButtonId || 'btn_shoot';

    this.checkInterval = null; // For startCheckLoop
    this.finished = false;

    // Canvas for frame comparison
    this.tempCanvas = document.createElement('canvas');
    this.tempCtx = this.tempCanvas.getContext('2d');

    // Listen for camera readiness
    this.registerEvents();

    // Reactive start when activeQuestKey changes to this quest's key
    if (StateManager.subscribe) {
      StateManager.subscribe('activeQuestKey', newVal => {
        if (newVal === this.key) {
          this.startCheckLoop();
        }
      });
    }
  }

  /**
   * registerEvents
   * If the universal active quest key matches this quest's key,
   * starts the check loop when the camera becomes ready.
   */
  registerEvents() {
    document.addEventListener('cameraReady', () => {
      if (StateManager.get('activeQuestKey') === this.key) {
        this.startCheckLoop();
      }
    });
  }

  /**
   * activate
   * Activates the mirror quest if it is not yet logged and creates an "active" quest record in the database.
   * Note: The universal active quest key is set by the GhostManager/QuestManager.
   */
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`Activating event: ${this.key}`);
      await this.addDiaryEntry(this.key);
    }
    console.log('[BaseMirrorQuest] Mirror quest activated.');
    await this.app.databaseManager.saveQuestRecord({
      quest_key: this.key,
      status: 'active',
      current_stage: 1,
      total_stages: 1
    });
  }

  /**
   * startCheckLoop
   * Displays the mirror quest UI (via ViewManager) and starts a loop that checks
   * "compareFrameInternally" every 2 seconds.
   */
  startCheckLoop() {
    if (this.checkInterval) return;

    if (this.app.viewManager && typeof this.app.viewManager.startMirrorQuestUI === 'function') {
      this.app.viewManager.startMirrorQuestUI({
        statusElementId: this.statusElementId,
        shootButtonId: this.shootButtonId,
        onShoot: () => this.finish()
      });
    }

    this.checkInterval = setInterval(async () => {
      if (!this.app.isCameraOpen) {
        console.warn('[BaseMirrorQuest] Camera is not active - stopping check loop.');
        this.stopCheckLoop();
        return;
      }
      const success = await this.compareFrameInternally();
      if (this.app.viewManager && typeof this.app.viewManager.updateMirrorQuestStatus === 'function') {
        this.app.viewManager.updateMirrorQuestStatus(success, this.statusElementId, this.shootButtonId);
      }
    }, 2000);
  }

  /**
   * stopCheckLoop
   * Clears the interval and hides the quest UI via ViewManager.
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
   * compareFrameInternally
   * Captures the current camera frame, converts it to grayscale, compares it to the saved selfieData,
   * and returns a boolean indicating success or failure.
   */
  async compareFrameInternally() {
    if (!this.app.isCameraOpen) return false;
    if (!this.app.selfieData) return false;

    const videoEl = this.app.cameraSectionManager?.videoElement;
    if (!videoEl || !videoEl.srcObject) return false;

    this.tempCanvas.width = videoEl.videoWidth || 640;
    this.tempCanvas.height = videoEl.videoHeight || 480;
    this.tempCtx.drawImage(videoEl, 0, 0, this.tempCanvas.width, this.tempCanvas.height);

    const currentFrameData = ImageUtils.convertToGrayscale(this.tempCanvas);
    const matchPixel = ImageUtils.pixelWiseComparison(this.app.selfieData, currentFrameData);
    const matchHist = ImageUtils.histogramComparison(this.app.selfieData, currentFrameData);
    const success = matchPixel > 0.6 && matchHist > 0.7;
    if (success) this.app.lastMirrorPhoto = currentFrameData;
    return success;
  }

  /**
   * updateUIAfterFinish
   * Updates UI after quest completion.
   */
  updateUIAfterFinish(success) {
    if (this.app.viewManager && typeof this.app.viewManager.updateMirrorQuestUIAfterFinish === 'function') {
      this.app.viewManager.updateMirrorQuestUIAfterFinish(success, {
        statusElementId: this.statusElementId,
        shootButtonId: this.shootButtonId,
        cameraButtonId: 'toggle-camera'
      });
    }
  }

  /**
   * finish
   * Finalizes the mirror quest.
   */
  async finish() {
    if (this.finished) return;
    this.finished = true;
    this.stopCheckLoop();

    const success = await this.compareFrameInternally();
    const ghost = this.app.ghostManager.getCurrentGhost();
    const randomLetter = ghost ? this.getRandomLetter(ghost.name) : '';
    const entryText = success
      ? `user_post_success: ${randomLetter} [photo attached]\n${this.app.lastMirrorPhoto}`
      : `user_post_failed: ${randomLetter}`;

    await this.addDiaryEntry(entryText, false);
    this.updateUIAfterFinish(success);
    if (this.app.viewManager && typeof this.app.viewManager.setCameraButtonActive === 'function') {
      this.app.viewManager.setCameraButtonActive(false);
    }
    await this.app.databaseManager.saveQuestRecord({
      quest_key: this.key,
      status: 'finished',
      current_stage: 1,
      total_stages: 1
    });
    await this.app.questManager.syncQuestState();
    document.dispatchEvent(new CustomEvent('questCompleted', { detail: this.key }));
  }

  /**
   * getCurrentQuestStatus
   */
  async getCurrentQuestStatus() {
    const record = this.app.databaseManager.getQuestRecord(this.key);
    return {
      key: this.key,
      active: StateManager.get('activeQuestKey') === this.key,
      finished: this.finished,
      dbStatus: record ? record.status : 'not recorded'
    };
  }

  /**
   * getRandomLetter
   */
  getRandomLetter(name) {
    const letters = name.replace(/[^A-Za-zА-Яа-яЁё]/g, '').split('');
    return letters.length ? letters[Math.floor(Math.random() * letters.length)] : '';
  }
}