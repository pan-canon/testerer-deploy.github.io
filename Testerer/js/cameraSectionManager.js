export class cameraSectionManager {
  /**
   * Constructor for the cameraSectionManager class.
   * Initializes:
   * - videoElement: Will be created dynamically on the first call to attachTo().
   * - stream: Stores the MediaStream object obtained from getUserMedia().
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
   * If the video element has not been created, it is created with basic settings.
   * All provided style options are applied to the video element.
   * The container is cleared (container.innerHTML = "") before appending.
   *
   * @param {string} containerId - The ID of the container to attach the video element.
   * @param {object} [options={}] - Object containing CSS style properties for the video element (e.g., width, height, filter).
   */
  attachTo(containerId, options = {}) {
    // Get the container element by its ID.
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with id "${containerId}" not found!`);
      return;
    }

    // If the video element is not yet created, create and configure it.
    if (!this.videoElement) {
      this.videoElement = document.createElement('video');
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;
    } else if (this.videoElement.parentNode) {
      // If the video element is already attached to a container, remove it to avoid duplication.
      this.videoElement.parentNode.removeChild(this.videoElement);
    }

    // Apply the provided style options to the video element.
    for (const prop in options) {
      this.videoElement.style[prop] = options[prop];
    }

    // Clear the container's content and append the video element.
    container.innerHTML = "";
    container.appendChild(this.videoElement);
  }

  /**
   * startCamera – Starts the camera by requesting access via getUserMedia.
   * If the stream is already running, the function does nothing.
   * Upon successful retrieval, sets the video element's source to the stream.
   * Once the video metadata is loaded, calls onVideoReady (if defined).
   */
  async startCamera() {
    // If the stream is already running, log a message and exit.
    if (this.stream) {
      console.log("Camera already started");
      return;
    }
    try {
      // Determine if a mobile device is being used to set the correct camera mode.
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const constraints = { video: { facingMode: isMobile ? "environment" : "user" } };
      console.log(`🎥 Starting camera with facing mode: ${constraints.video.facingMode}`);
      
      // Request access to the camera.
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (!this.videoElement) {
        console.error("Video element not created!");
        return;
      }
      // Set the obtained stream as the source for the video element.
      this.videoElement.srcObject = this.stream;
      
      // Add a listener for the "loadedmetadata" event to notify when the video stream is ready.
      this.videoElement.addEventListener("loadedmetadata", () => {
        console.log("loadedmetadata: Video stream is ready");
        if (typeof this.onVideoReady === "function") {
          this.onVideoReady();
        }
        // Dispatch custom event to notify that camera is ready
        const event = new CustomEvent("cameraReady");
        document.dispatchEvent(event);  // Notify any listeners of the camera readiness
      }, { once: true });
    } catch (error) {
      console.error("❌ Error accessing the camera:", error);
    }
  }

  /**
   * stopCamera – Stops the current camera stream.
   * Iterates over all tracks in the stream and stops them.
   * Resets the stream property to null.
   * Calls onCameraClosed (if defined).
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