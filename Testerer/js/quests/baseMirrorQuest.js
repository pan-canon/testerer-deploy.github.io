import { BaseEvent } from '../events/baseEvent.js';
import { ImageUtils } from '../utils/imageUtils.js';

/**
 * BaseMirrorQuest – Base class for the mirror quest.
 * Encapsulates the logic for comparing the current frame (canvas → grayscale → compare),
 * managing the check loop (startCheckLoop/stopCheckLoop), and updating the UI 
 * (status display, "Shoot" button) related to the mirror quest.
 */
export class BaseMirrorQuest extends BaseEvent {
  /**
   * @param {EventManager} eventManager - The diary/event manager.
   * @param {App} appInstance - The main application instance.
   * @param {Object} [config] - Optional configuration (e.g., UI element IDs).
   */
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

  /**
   * registerEvents – Registers any event listeners for UI elements.
   * (Optional: Can be extended to attach handlers directly here or via QuestManager.)
   */
  registerEvents() {
    // Listen to camera ready event
    document.addEventListener('cameraReady', () => {
      if (localStorage.getItem("mirrorQuestActive") === "true") {
        this.startCheckLoop(); // Start the check loop if the quest is active
      }
    });
  }

  /**
   * activate – Activates the mirror quest.
   * Logs the event in the diary (if not already logged) and sets the mirrorQuestActive flag.
   *
   * @returns {Promise<void>}
   */
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`Activating event: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key);
    }
    console.log("[BaseMirrorQuest] Mirror quest activated.");
    localStorage.setItem("mirrorQuestActive", "true");
  }

  /**
   * startCheckLoop – Starts an interval that checks every 2 seconds if the player is "in front of the mirror."
   * Updates the UI (status display and "Shoot" button) accordingly.
   */
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

  /**
   * stopCheckLoop – Stops the check loop and hides related UI elements.
   */
  stopCheckLoop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    const statusDiv = document.getElementById(this.statusElementId);
    if (statusDiv) {
      statusDiv.style.display = "none";
    }
    const shootBtn = document.getElementById(this.shootButtonId);
    if (shootBtn) {
      shootBtn.style.display = "none";
    }
  }

  /**
   * checkStatus – Checks if the player is "in front of the mirror" using frame comparison.
   * @returns {Promise<boolean>} True if similarity exceeds threshold, otherwise false.
   */
  async checkStatus() {
    console.log("[BaseMirrorQuest] checkStatus() -> compareFrameInternally()");
    return await this.compareFrameInternally();
  }

  /**
   * compareFrameInternally – Compares the current camera frame with the saved selfie.
   * @returns {Promise<boolean>} True if the similarity is above the threshold, else false.
   */
  async compareFrameInternally() {
    // If no selfie is saved, return false.
    if (!this.app.selfieData) {
      console.warn("[BaseMirrorQuest] ❌ No saved selfie (app.selfieData)");
      return false;
    }
    // Verify the camera is active.
    const videoEl = this.app.cameraSectionManager?.videoElement;
    if (!videoEl || !videoEl.srcObject) {
      console.warn("[BaseMirrorQuest] ❌ Camera is not active!");
      return false;
    }

    // Configure the canvas
    this.tempCanvas.width = videoEl.videoWidth || 640;
    this.tempCanvas.height = videoEl.videoHeight || 480;
    this.tempCtx.drawImage(videoEl, 0, 0, this.tempCanvas.width, this.tempCanvas.height);

    // Convert the image to grayscale
    const currentFrameData = ImageUtils.convertToGrayscale(this.tempCanvas);

    // Perform comparison using pixel-wise and histogram methods
    const matchPixel = ImageUtils.pixelWiseComparison(this.app.selfieData, currentFrameData);
    const matchHist = ImageUtils.histogramComparison(this.app.selfieData, currentFrameData);
    console.log(`[BaseMirrorQuest] pixel=${matchPixel.toFixed(2)}, hist=${matchHist.toFixed(2)}`);

    const success = (matchPixel > 0.6 && matchHist > 0.7);
    if (success) {
      // Save for diary reporting
      this.app.lastMirrorPhoto = currentFrameData;
    }
    return success;
  }

  /**
   * updateUIAfterFinish – Separates the UI updates after quest completion.
   * Displays appropriate messages and hides the status display after a delay.
   *
   * @param {boolean} success - Indicates whether the quest was successful.
   * New version of updateUIAfterFinish() that leaves the shoot button visible but disabled.
   */
  updateUIAfterFinish(success) {
    // Update status display with a message indicating success or failure.
    const statusDiv = document.getElementById("mirror-quest-status"); // Замените на ваш ID, если другой
    if (statusDiv) {
      statusDiv.textContent = success
        ? "✅ Mirror quest completed!"
        : "❌ Quest ignored!";
      // Optionally, fade out the status message after 2 seconds:
      setTimeout(() => {
        statusDiv.style.opacity = "0";
      }, 2000);
    }

    // Instead of hiding the shoot button, disable it so it remains visible.
    const shootBtn = document.getElementById("btn_shoot");
    if (shootBtn) {
      shootBtn.disabled = true;
      console.log("Mirror quest: Shoot button disabled after finishing quest.");
    }

    // Remove any glowing effect from the camera button.
    const cameraBtn = document.getElementById("toggle-camera");
    if (cameraBtn) {
      cameraBtn.classList.remove("glowing");
    }
  }

  /**
   * finish – Completes the mirror quest:
   *  1) Stops the check loop.
   *  2) Checks the status and logs the result.
   *  3) Removes the mirrorQuestActive flag and updates UI.
   *  4) On success, explicitly triggers the "post_mirror_event" via GameEventManager.
   *
   * @returns {Promise<void>}
   */
  async finish() {
    if (this.finished) return;
    this.finished = true;

    // Stop the mirror quest's check loop (e.g. frame comparison loop)
    this.stopCheckLoop();

    // Perform a final check to determine if the mirror quest succeeded
    const success = await this.checkStatus();

    // Get the current ghost and a random letter from its name (used in the diary entry)
    const ghost = this.app.ghostManager.getCurrentGhost();
    const randomLetter = ghost ? this.getRandomLetter(ghost.name) : "";

    // Log the result in the diary:
    // If success, include photo data if available; otherwise log failure message.
    if (success) {
      const photoData = this.app.lastMirrorPhoto
        ? ` [photo attached]\n${this.app.lastMirrorPhoto}`
        : "";
      await this.eventManager.addDiaryEntry(`user_post_success: ${randomLetter}${photoData}`, false);
    } else {
      await this.eventManager.addDiaryEntry(`user_post_failed: ${randomLetter}`, false);
    }

    // Update the UI after finishing the quest:
    // Instead of hiding the shoot button, we disable it so it remains visible.
    this.updateUIAfterFinish(success);

    // Remove the mirrorQuestActive flag and update the "Post" button state accordingly.
    localStorage.removeItem("mirrorQuestActive");
    this.app.questManager.updatePostButtonState();

    // If the quest was successful, explicitly trigger the next event (e.g. "post_mirror_event")
    if (success) {
      this.app.gameEventManager.activateEvent("post_mirror_event");
    }

  /**
   * getRandomLetter – Returns a random letter from the ghost's name.
   * @param {string} name - The ghost's name.
   * @returns {string} A random letter, or an empty string if none available.
   */
  getRandomLetter(name) {
    if (!name) return "";
    const letters = name.replace(/[^A-Za-zА-Яа-яЁё]/g, '').split('');
    if (!letters.length) return '';
    return letters[Math.floor(Math.random() * letters.length)];
  }
}