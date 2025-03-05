import { ErrorManager } from './errorManager.js';

export class cameraSectionManager {
  /**
   * Constructor for cameraSectionManager.
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
      // NEW: Automatically attach video element if not created yet.
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
      console.log(`🎥 Starting camera with facing mode: ${constraints.video.facingMode}`);
      
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
}