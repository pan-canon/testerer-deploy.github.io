// CameraSectionManager.js
import { ErrorManager } from './ErrorManager.js';
import { COCO_SSD_MODEL } from '../config/paths.js';

export class CameraSectionManager {
  /**
   * Constructor for CameraSectionManager.
   * Initializes:
   * - videoElement: Created dynamically on the first call to attachTo().
   * - stream: Stores the MediaStream obtained from getUserMedia.
   * - onVideoReady: Callback invoked when the video stream is ready (after loadedmetadata event).
   * - onCameraClosed: Callback invoked after the camera is stopped.
   */
  constructor() {
    this.videoElement = null;
    this.stream = null;
    this.onVideoReady = null;
    this.onCameraClosed = null;

    // New properties for extended functionality
    this.isDetecting = false;
    this.aiDetectionTimer = null;
    this.aiModel = null;
    this.aiDetectionInterval = 5000; // 5 seconds default
    this.currentDetectionConfig = null; // To be generated for repeating quests

    this.recordingStartTime = null;
    this.recordingTimerId = null;
  }

  /**
   * preloadModel – Preloads the COCO-SSD model so that detection can start immediately later.
   * Stores the loading promise to avoid double-loading.
   */
  async preloadModel() {
    if (!this.modelPromise) {
      console.log("[CameraSectionManager] Preloading AI model...");
      this.modelPromise = cocoSsd.load({ modelUrl: COCO_SSD_MODEL });
    }
    try {
      this.aiModel = await this.modelPromise;
      console.log("[CameraSectionManager] AI model preloaded successfully.");
    } catch (error) {
      ErrorManager.logError(error, "CameraSectionManager.preloadModel");
    }
  }

  /**
   * attachTo(containerId, options)
   * Attaches the video element to the specified container.
   * Creates the video element if it doesn't exist, applies style options,
   * and clears the container before appending.
   *
   * @param {string} containerId - The ID of the container.
   * @param {Object} [options={}] - CSS style properties for the video element.
   */
  attachTo(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      ErrorManager.logError(`Container with id "${containerId}" not found!`, "attachTo");
      return;
    }
    if (!this.videoElement) {
      this.videoElement = document.createElement('video');
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;
      // Ensure global id for referencing in AR.js
      this.videoElement.id = "global-camera-video";
    } else if (this.videoElement.parentNode) {
      this.videoElement.parentNode.removeChild(this.videoElement);
    }
    for (const prop in options) {
      this.videoElement.style[prop] = options[prop];
    }
    container.innerHTML = "";
    container.appendChild(this.videoElement);
  }

// Persistent detection frame element
this.detectionFrame = null;

// Reset detection frame when repeating quest completes
document.addEventListener('questCompleted', (e) => {
  if (e.detail === 'repeating_quest') {
    this.resetDetectionFrame();
  }
});

  /**
   * startCamera – Starts the camera by requesting access via getUserMedia.
   * If already running, logs a message and does nothing.
   * Upon success, sets the video element's source to the stream.
   * Once the video metadata is loaded, calls onVideoReady (if defined)
   * and dispatches the custom "cameraReady" event.
   */
  async startCamera() {
    if (this.stream) {
      console.log("Camera already started");
      return;
    }
    try {
      // Automatically attach video element if not created yet.
      if (!this.videoElement) {
        this.attachTo("global-camera", {
          width: "100%",
          height: "100%",
          filter: "grayscale(100%)"
        });
        console.log("Video element was not created; auto-attached to 'global-camera'.");
      }
      
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const constraints = { video: { facingMode: isMobile ? "environment" : "user" } };
      console.log(`Starting camera with facing mode: ${constraints.video.facingMode}`);
      
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (!this.videoElement) {
        ErrorManager.logError("Video element not created!", "startCamera");
        return;
      }
      this.videoElement.srcObject = this.stream;

      // Если метаданные уже загружены (быстрый F5), запускаем сразу
      if (this.videoElement.readyState >= 2) {
        console.log("Video metadata already ready; dispatching cameraReady immediately");
        if (typeof this.onVideoReady === "function") {
          this.onVideoReady();
        }
        document.dispatchEvent(new CustomEvent("cameraReady"));
        // Create persistent detection frame once video is ready
        this.createDetectionFrame();
      } else {
        // Иначе ждём обычный loadedmetadata
        this.videoElement.addEventListener("loadedmetadata", () => {
          console.log("loadedmetadata: Video stream is ready");
          if (typeof this.onVideoReady === "function") {
            this.onVideoReady();
          }
          document.dispatchEvent(new CustomEvent("cameraReady"));
          // Create persistent detection frame once video is ready
          this.createDetectionFrame();
        }, { once: true });
      }
    } catch (error) {
      ErrorManager.logError(error, "startCamera");
    }
  }

  /**
   * stopCamera – Stops the current camera stream.
   * Iterates over all tracks in the stream and stops them.
   * Resets the stream property to null and calls onCameraClosed (if defined).
   */
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
      if (typeof this.onCameraClosed === "function") {
        this.onCameraClosed();
      }
    }
  }

  // ---------------- Extended Methods ----------------

  /**
   * createDetectionFrame – Creates a full-screen white border that pulses.
   */
  createDetectionFrame() {
    // Inject pulsing keyframes once
    if (!document.getElementById('detection-frame-style')) {
      const style = document.createElement('style');
      style.id = 'detection-frame-style';
      style.textContent = `
  @keyframes detectionPulse {
    0%   { transform: scale(1);   opacity: 0.8; }
    50%  { transform: scale(1.02);opacity: 1;   }
    100% { transform: scale(1);   opacity: 0.8; }
  }`;
      document.head.appendChild(style);
    }

    this.detectionFrame = document.createElement('div');
    Object.assign(this.detectionFrame.style, {
      position:       'absolute',
      top:            '0',
      left:           '0',
      width:          '100%',
      height:         '100%',
      border:         '3px solid #fff',
      boxSizing:      'border-box',
      pointerEvents:  'none',
      animation:      'detectionPulse 2s infinite'
    });
    document.body.appendChild(this.detectionFrame);
    console.log('Detection frame initialized and pulsing.');
  }

  /**
   * updateDetectionFrame – Shrinks the frame to match detected object's bbox.
   * @param {Array<number>} bbox – [x, y, width, height]
   */
  updateDetectionFrame(bbox) {
    const [x, y, w, h] = bbox;
    this.detectionFrame.style.transition = 'all 0.3s ease-out';
    this.detectionFrame.style.left       = `${x}px`;
    this.detectionFrame.style.top        = `${y}px`;
    this.detectionFrame.style.width      = `${w}px`;
    this.detectionFrame.style.height     = `${h}px`;
    // Stop pulsing while focused on object
    this.detectionFrame.style.animation  = '';
    console.log(`Detection frame moved to bbox: ${bbox}`);
  }

  /**
   * resetDetectionFrame – Returns the frame back to full-screen and re-enables pulsing.
   */
  resetDetectionFrame() {
    this.detectionFrame.style.transition = 'all 0.5s ease-out';
    this.detectionFrame.style.left       = '0';
    this.detectionFrame.style.top        = '0';
    this.detectionFrame.style.width      = '100%';
    this.detectionFrame.style.height     = '100%';
    this.detectionFrame.style.animation  = 'detectionPulse 2s infinite';
    console.log('Detection frame reset to full-screen and pulsing.');
  }

  /**
   * startARMode
   * Activates AR mode by inserting an AR.js scene that uses the same video stream.
   */
  startARMode() {
    // Use the global video element id for AR.js reference
    if (!this.videoElement || !this.stream) {
      console.warn("Camera is not active. AR mode cannot be started.");
      return;
    }
    // Create AR scene markup with reference to the video element id
    const arMarkup = `
      <a-scene embedded arjs="sourceType: video; videoElement: #${this.videoElement.id}">
        <a-marker preset="hiro">
          <a-box position="0 0.5 0" material="color: red;"></a-box>
        </a-marker>
        <a-camera-static></a-camera-static>
      </a-scene>
    `;
    // Insert AR scene into DOM (for example, at the end of the body)
    document.body.insertAdjacentHTML('beforeend', arMarkup);
    console.log("AR mode activated.");
  }

  /**
   * stopARMode
   * Deactivates AR mode by removing the AR.js scene from the DOM.
   */
  stopARMode() {
    const arScene = document.querySelector('a-scene[arjs]');
    if (arScene) {
      arScene.remove();
      console.log("AR mode deactivated.");
    }
  }

  /**
   * applyFilter
   * Applies a CSS filter to the video element.
   * @param {string} filterType - 'nightVision', 'blackWhite' or '' for none.
   */
  applyFilter(filterType) {
    if (!this.videoElement) return;
    if (filterType === 'nightVision') {
      this.videoElement.style.filter = 'brightness(150%) contrast(120%) sepia(100%) hue-rotate(90deg)';
    } else if (filterType === 'blackWhite') {
      this.videoElement.style.filter = 'grayscale(100%)';
    } else {
      this.videoElement.style.filter = '';
    }
    console.log(`Filter applied: ${filterType}`);
  }

  /**
   * startRecordingTimer
   * Starts a timer (via UI overlay managed externally) for recording duration.
   */
  startRecordingTimer() {
    this.recordingStartTime = Date.now();
    // Here we assume that the UI overlay for timer is created by ViewManager.
    // In case it is not, you can create a temporary element.
    const timerElem = document.getElementById("recording-timer");
    if (timerElem) {
      timerElem.style.display = "block";
      this.recordingTimerId = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
        timerElem.innerText = `Recording: ${elapsed} sec`;
      }, 1000);
    }
  }

  /**
   * stopRecordingTimer
   * Stops the recording timer and hides the UI overlay.
   */
  stopRecordingTimer() {
    clearInterval(this.recordingTimerId);
    const timerElem = document.getElementById("recording-timer");
    if (timerElem) {
      timerElem.style.display = "none";
    }
  }

  /**
   * updateBatteryStatus
   * Retrieves battery status using the Battery API and displays it in a UI overlay.
   */
  async updateBatteryStatus() {
    try {
      const battery = await navigator.getBattery();
      const batteryElem = document.getElementById("battery-status");
      const update = () => {
        if (batteryElem) {
          batteryElem.innerText = `Battery: ${Math.floor(battery.level * 100)}%`;
        }
      };
      update();
      battery.addEventListener('levelchange', update);
      if (batteryElem) {
        batteryElem.style.display = "block";
      }
    } catch (error) {
      ErrorManager.logError(error, "updateBatteryStatus");
    }
  }

  /**
   * startAIDetection
   * Loads the COCO-SSD model if necessary and begins detection loop.
   * Stores only the `target` property from config for quest logic.
   * @param {{ target?: string }} config
   */
  async startAIDetection(config = {}) {
    this.currentDetectionConfig = { target: config.target || null };
    this.isDetecting = true;
    console.log(`[CameraSectionManager] startAIDetection(): target = "${this.currentDetectionConfig.target}"`);

    if (!this.aiModel) {
      console.log("[CameraSectionManager] Waiting for preloaded model…");
      await this.modelPromise; // если вы уже сделали preloadModel
      if (!this.aiModel) {
        console.error("[CameraSectionManager] Model failed to preload");
        return;
      }
    }

    this.runAIDetection();
  }

  /**
   * runAIDetection
   * Performs object detection on the current video frame and processes predictions.
   */
  async runAIDetection() {
    if (!this.isDetecting) {
      return;
    }

    if (!this.videoElement || this.videoElement.readyState < 2) {
      // video not ready yet; try again shortly
      this.aiDetectionTimer = setTimeout(() => this.runAIDetection(), this.aiDetectionInterval);
      return;
    }

    try {
      const predictions = await this.aiModel.detect(this.videoElement);
      console.log("[CameraSectionManager] predictions:", predictions);
      this.handleAIPredictions(predictions);
    } catch (error) {
      console.error("[CameraSectionManager] Error during detect():", error);
    }

    this.aiDetectionTimer = setTimeout(() => this.runAIDetection(), this.aiDetectionInterval);
  }

  /**
   * handleAIPredictions
   * Filters predictions by the current target and confidence,
   * draws a frame and dispatches `objectDetected` when found.
   * @param {Array<{class: string, score: number, bbox: number[]}>} predictions
   */
  handleAIPredictions(predictions) {
    // Determine current target without optional chaining
    const target = this.currentDetectionConfig && this.currentDetectionConfig.target;
    console.log(`[CameraSectionManager] handleAIPredictions(): looking for "${target}"`);
    if (!target) return;

    for (const pred of predictions) {
      // Only process high-confidence hits for the current target
      if (pred.score > 0.6 && pred.class === target) {
        console.log(`[CameraSectionManager] MATCH for "${target}" (score=${pred.score.toFixed(3)})`, pred.bbox);
        this.animateCornerFrame(pred.bbox);
        // Notify quest logic that the target was found
        document.dispatchEvent(new CustomEvent("objectDetected", { detail: target }));
      }
    }
  }

  /**
   * animateCornerFrame – Shrinks the persistent frame to bbox instead of creating a new one.
   */
  animateCornerFrame(bbox) {
    if (!this.detectionFrame) return;
    this.updateDetectionFrame(bbox);
  }

  /**
   * stopAIDetection
   * Stops the AI detection loop.
   */
  stopAIDetection() {
    this.isDetecting = false;
    if (this.aiDetectionTimer) {
      clearTimeout(this.aiDetectionTimer);
      this.aiDetectionTimer = null;
    }
    console.log("[CameraSectionManager] AI detection stopped.");
  }
}