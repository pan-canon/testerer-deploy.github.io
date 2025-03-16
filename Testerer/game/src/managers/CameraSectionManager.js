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
   *
   * Extended functionality properties:
   * - AI detection settings, recording timer, and default overlay.
   */
  constructor() {
    this.videoElement = null;
    this.stream = null;
    this.onVideoReady = null;
    this.onCameraClosed = null;

    // Extended properties
    this.aiDetectionTimer = null;
    this.aiModel = null;
    this.aiDetectionInterval = 5000; // Default interval: 5 seconds
    this.currentDetectionConfig = null; // For repeating quest configuration

    this.recordingStartTime = null;
    this.recordingTimerId = null;

    // Canvas overlay for default animated corner frame (always visible)
    this.overlayCanvas = null;
    this.overlayCtx = null;
    this.overlayAnimationId = null;
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
      // Set default scale as in the camera (default resolution)
      this.videoElement.style.width = options.width || "640px";
      this.videoElement.style.height = options.height || "480px";
      // Ensure global id for AR.js reference
      this.videoElement.id = "global-camera-video";
    } else if (this.videoElement.parentNode) {
      this.videoElement.parentNode.removeChild(this.videoElement);
    }
    // Apply additional style options if provided.
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
      // Automatically attach video element if not already created.
      if (!this.videoElement) {
        this.attachTo("global-camera", {
          width: "640px",
          height: "480px",
          filter: "grayscale(100%)"
        });
        console.log("Video element was not created; auto-attached to 'global-camera'.");
      }
      
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      // Use default constraints; can be moved to a settings file later.
      const constraints = { video: { width: 640, height: 480, facingMode: isMobile ? "environment" : "user" } };
      console.log(`Starting camera with constraints:`, constraints);
      
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
    if (!this.videoElement || !this.stream) {
      console.warn("Camera is not active. AR mode cannot be started.");
      return;
    }
    const arMarkup = `
      <a-scene embedded arjs="sourceType: video; videoElement: #${this.videoElement.id}">
        <a-marker preset="hiro">
          <a-box position="0 0.5 0" material="color: red;"></a-box>
        </a-marker>
        <a-camera-static></a-camera-static>
      </a-scene>
    `;
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
   * Starts a timer for recording duration.
   * The timer is displayed via a UI overlay (assumed to have id "recording-timer").
   */
  startRecordingTimer() {
    this.recordingStartTime = Date.now();
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
   * Loads the COCO-SSD model (if not already loaded) and starts periodic detection.
   * Accepts an optional configuration object for dynamic detection modes.
   * @param {Object} [config] - Detection configuration, e.g. { target: 'eran' }.
   */
  async startAIDetection(config = null) {
    this.currentDetectionConfig = config || this.generateDetectionConfig();
    if (!this.aiModel) {
      try {
        this.aiModel = await cocoSsd.load();
        console.log("AI model loaded successfully.");
      } catch (error) {
        ErrorManager.logError(error, "startAIDetection");
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
   * Processes predictions from the AI detection.
   * For each prediction with score > 0.6, draws an animated corner frame.
   * @param {Array} predictions - Array of prediction objects.
   */
  handleAIPredictions(predictions) {
    predictions.forEach(pred => {
      if (pred.score > 0.6) {
        this.animateCornerFrame(pred.bbox);
      }
    });
  }

  /**
   * animateCornerFrame
   * Creates an animated corner frame around the detected object's bounding box.
   * This frame is mandatory and always displayed when detection occurs.
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
   * Generates a random detection configuration for a repeating quest.
   * For example, selects a random target from a preset list.
   * @returns {Object} Configuration object.
   */
  generateDetectionConfig() {
    const targets = ['eran', 'objectB', 'objectC'];
    const randomTarget = targets[Math.floor(Math.random() * targets.length)];
    console.log(`Detection config generated: target = ${randomTarget}`);
    return { detectionActive: true, target: randomTarget };
  }

  /**
   * startDefaultFrameOverlay
   * Starts a continuous overlay that displays animated corner markers on the video.
   * This default overlay ensures that a semi-frame is always visible.
   */
  startDefaultFrameOverlay() {
    // Create an overlay canvas if it doesn't exist
    if (!this.overlayCanvas) {
      this.overlayCanvas = document.createElement('canvas');
      this.overlayCanvas.id = "default-frame-overlay";
      // Position overlay over the global camera element
      Object.assign(this.overlayCanvas.style, {
        position: "absolute",
        top: "0",
        left: "0",
        pointerEvents: "none",
        zIndex: "2000"
      });
      // Append overlay to the same container as video or body
      document.body.appendChild(this.overlayCanvas);
      this.overlayCtx = this.overlayCanvas.getContext("2d");
    }
    // Adjust overlay size to match video element
    const rect = this.videoElement.getBoundingClientRect();
    this.overlayCanvas.width = rect.width;
    this.overlayCanvas.height = rect.height;
    this.overlayCanvas.style.top = rect.top + "px";
    this.overlayCanvas.style.left = rect.left + "px";

    const drawOverlay = () => {
      if (!this.overlayCtx) return;
      this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
      // Draw animated corner markers at each corner
      const lineLength = 20;
      const lineWidth = 3;
      this.overlayCtx.lineWidth = lineWidth;
      this.overlayCtx.strokeStyle = "red";
      // Top-left corner
      this.overlayCtx.beginPath();
      this.overlayCtx.moveTo(0, lineLength);
      this.overlayCtx.lineTo(0, 0);
      this.overlayCtx.lineTo(lineLength, 0);
      this.overlayCtx.stroke();
      // Top-right corner
      this.overlayCtx.beginPath();
      this.overlayCtx.moveTo(this.overlayCanvas.width - lineLength, 0);
      this.overlayCtx.lineTo(this.overlayCanvas.width, 0);
      this.overlayCtx.lineTo(this.overlayCanvas.width, lineLength);
      this.overlayCtx.stroke();
      // Bottom-left corner
      this.overlayCtx.beginPath();
      this.overlayCtx.moveTo(0, this.overlayCanvas.height - lineLength);
      this.overlayCtx.lineTo(0, this.overlayCanvas.height);
      this.overlayCtx.lineTo(lineLength, this.overlayCanvas.height);
      this.overlayCtx.stroke();
      // Bottom-right corner
      this.overlayCtx.beginPath();
      this.overlayCtx.moveTo(this.overlayCanvas.width - lineLength, this.overlayCanvas.height);
      this.overlayCtx.lineTo(this.overlayCanvas.width, this.overlayCanvas.height);
      this.overlayCtx.lineTo(this.overlayCanvas.width, this.overlayCanvas.height - lineLength);
      this.overlayCtx.stroke();

      // Continue animation using requestAnimationFrame
      this.overlayAnimationId = requestAnimationFrame(drawOverlay);
    };

    drawOverlay();
    console.log("Default frame overlay started.");
  }

  /**
   * stopDefaultFrameOverlay
   * Stops the continuous default frame overlay and removes the overlay canvas.
   */
  stopDefaultFrameOverlay() {
    if (this.overlayAnimationId) {
      cancelAnimationFrame(this.overlayAnimationId);
      this.overlayAnimationId = null;
    }
    if (this.overlayCanvas) {
      this.overlayCanvas.remove();
      this.overlayCanvas = null;
      this.overlayCtx = null;
    }
    console.log("Default frame overlay stopped.");
  }
}