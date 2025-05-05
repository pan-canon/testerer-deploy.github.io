// CameraSectionManager.js
import { ErrorManager } from './ErrorManager.js';

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
    this.aiDetectionTimer = null;
    this.aiModel = null;
    this.aiDetectionInterval = 5000; // 5 seconds default
    this.currentDetectionConfig = null; // To be generated for repeating quests

    this.recordingStartTime = null;
    this.recordingTimerId = null;
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
      
      this.videoElement.addEventListener("loadedmetadata", () => {
        console.log("loadedmetadata: Video stream is ready");
        if (typeof this.onVideoReady === "function") {
          this.onVideoReady();
        }
        // Dispatch the custom "cameraReady" event.
        const event = new CustomEvent("cameraReady");
        document.dispatchEvent(event);
      }, { once: true });
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
    // Save only the target for repeating quest logic.
    this.currentDetectionConfig = { target: config.target || null };

    if (!this.aiModel) {
      try {
        this.aiModel = await cocoSsd.load();
        console.log("AI model loaded successfully.");
      } catch (error) {
        ErrorManager.logError(error, "CameraSectionManager.startAIDetection");
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
    if (!this.videoElement || this.videoElement.readyState < 2) return;
    try {
      const predictions = await this.aiModel.detect(this.videoElement);
      this.handleAIPredictions(predictions);
    } catch (error) {
      ErrorManager.logError(error, "runAIDetection");
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
    predictions.forEach(pred => {
      if (pred.score > 0.6) {
        this.animateCornerFrame(pred.bbox);

        // ==== new: if this is the quest’s current target, enable Shoot ====
        const target = this.currentDetectionConfig?.target;
        if (target && pred.class === target) {
          console.log(`[AI Detection] Found target: ${pred.class}`);
          // enable the Shoot button now that we’ve detected it
          this.app.viewManager.setShootButtonActive(true);
          // optionally stop further detection
          clearTimeout(this.aiDetectionTimer);
        }
        // ================================================================
      }
    });
  }

  /**
   * animateCornerFrame
   * Creates an animated corner frame around the detected object's bounding box.
   * @param {Array} bbox - [x, y, width, height]
   */
  animateCornerFrame(bbox) {
    const [x, y, width, height] = bbox;
    const frame = document.createElement('div');
    frame.style.position = 'absolute';
    frame.style.border = '3px solid red';
    frame.style.boxSizing = 'border-box';
    frame.style.left = `${x}px`;
    frame.style.top = `${y}px`;
    frame.style.width = `${width}px`;
    frame.style.height = `${height}px`;
    frame.style.pointerEvents = 'none';
    frame.style.transition = 'opacity 0.5s ease-out';
    document.body.appendChild(frame);
    setTimeout(() => {
      frame.style.opacity = '0';
      setTimeout(() => frame.remove(), 500);
    }, 500);
  }

  /**
   * stopAIDetection
   * Stops the AI detection loop.
   */
  stopAIDetection() {
    clearTimeout(this.aiDetectionTimer);
  }

  /**
   * generateDetectionConfig
   * Generates a random detection configuration for the repeating quest.
   * For example, chooses a random target from a set.
   * @returns {Object} Configuration object.
   */
  generateDetectionConfig() {
    const targets = ['eran', 'objectB', 'objectC'];
    const randomTarget = targets[Math.floor(Math.random() * targets.length)];
    console.log(`Detection config generated: target = ${randomTarget}`);
    return { detectionActive: true, target: randomTarget };
  }
}