import { BaseEvent } from '../events/baseEvent.js';
import { ImageUtils } from '../utils/imageUtils.js';

/**
 * BaseMirrorQuest – Base class for the mirror quest.
 * Encapsulates the logic for comparing the current frame (canvas → grayscale → compare),
 * managing the check loop (startCheckLoop/stopCheckLoop), and updating the UI 
 * (status display, "Shoot" button) related to the mirror quest.
 */
export class BaseMirrorQuest extends BaseEvent {
  constructor(eventManager, appInstance, config = {}) {
    super(eventManager);
    this.app = appInstance;
    this.key = config.key || "mirror_quest"; // Allows overriding the key.
    this.doneKey = config.doneKey || "mirror_done";

    // UI element IDs
    this.statusElementId = config.statusElementId || "mirror-quest-status";
    this.shootButtonId = config.shootButtonId || "btn_shoot";

    // Auxiliary flags/variables
    this.checkInterval = null; // For startCheckLoop
    this.finished = false;

    // Canvas for frame comparison
    this.tempCanvas = document.createElement("canvas");
    this.tempCtx = this.tempCanvas.getContext("2d");

    this.registerEvents();
  }

  registerEvents() {
    // Listen to camera ready event
    document.addEventListener('cameraReady', () => {
      if (localStorage.getItem("mirrorQuestActive") === "true") {
        this.startCheckLoop(); // Start the check loop if the quest is active
      }
    });
  }

  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`Activating event: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key);
    }
    console.log("[BaseMirrorQuest] Mirror quest activated.");
    localStorage.setItem("mirrorQuestActive", "true");
  }

  startCheckLoop() {
    if (this.checkInterval) return; // Already running
    const statusDiv = document.getElementById(this.statusElementId);
    if (statusDiv) {
      statusDiv.style.display = "block";
      statusDiv.textContent = "No match...";
    }
    const shootBtn = document.getElementById(this.shootButtonId);
    if (shootBtn) {
      shootBtn.style.display = "inline-block";
      shootBtn.disabled = true;
      // When the shoot button is clicked, finish the quest.
      shootBtn.addEventListener("click", () => this.finish(), { once: true });
    }

    this.checkInterval = setInterval(async () => {
      const success = await this.checkStatus();
      if (statusDiv) {
        statusDiv.textContent = success
          ? "You are in front of the mirror!"
          : "No match...";
      }
      if (shootBtn) {
        shootBtn.disabled = !success;
      }
    }, 2000);
  }

  stopCheckLoop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    const statusDiv = document.getElementById(this.statusElementId);
    if (statusDiv) {
      statusDiv.style.display = "none";
    }
    // Не изменяем display shootBtn здесь – его состояние обновляется в updateUIAfterFinish()
  }

  async checkStatus() {
    console.log("[BaseMirrorQuest] checkStatus() -> compareFrameInternally()");
    return await this.compareFrameInternally();
  }

  async compareFrameInternally() {
    if (!this.app.selfieData) {
      console.warn("[BaseMirrorQuest] ❌ No saved selfie (app.selfieData)");
      return false;
    }
    const videoEl = this.app.cameraSectionManager?.videoElement;
    if (!videoEl || !videoEl.srcObject) {
      console.warn("[BaseMirrorQuest] ❌ Camera is not active!");
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
   * updateUIAfterFinish – Updates the UI after finishing the mirror quest.
   * Leaves the "Shoot" button visible but disabled.
   */
  updateUIAfterFinish(success) {
    const statusDiv = document.getElementById("mirror-quest-status");
    if (statusDiv) {
      statusDiv.textContent = success
        ? "✅ Mirror quest completed!"
        : "❌ Quest ignored!";
      setTimeout(() => {
        statusDiv.style.opacity = "0";
      }, 2000);
    }
    const shootBtn = document.getElementById("btn_shoot");
    if (shootBtn) {
      // Force the shoot button to remain visible but disable it.
      shootBtn.style.display = "inline-block";
      shootBtn.setAttribute("disabled", "true");
      shootBtn.style.pointerEvents = "none";
      console.log("Mirror quest: Shoot button disabled after finishing quest.");
    }
    const cameraBtn = document.getElementById("toggle-camera");
    if (cameraBtn) {
      cameraBtn.classList.remove("glowing");
    }
  }

  async finish() {
    if (this.finished) return;
    this.finished = true;
    this.stopCheckLoop();
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
    this.updateUIAfterFinish(success);
    localStorage.removeItem("mirrorQuestActive");
    this.app.questManager.updatePostButtonState();
    if (success) {
      this.app.gameEventManager.activateEvent("post_mirror_event");
    }
  }

  getRandomLetter(name) {
    if (!name) return "";
    const letters = name.replace(/[^A-Za-zА-Яа-яЁё]/g, '').split('');
    if (!letters.length) return '';
    return letters[Math.floor(Math.random() * letters.length)];
  }
}