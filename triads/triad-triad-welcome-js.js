"use strict";
(self["webpackChunktesterer_deploy_github_io"] = self["webpackChunktesterer_deploy_github_io"] || []).push([["triads/triad-triad-welcome-js"],{

/***/ "./build/triads/triad-welcome.js":
/*!***************************************!*\
  !*** ./build/triads/triad-welcome.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BaseMirrorQuest: () => (/* reexport safe */ quests_BaseMirrorQuest_js__WEBPACK_IMPORTED_MODULE_1__.BaseMirrorQuest),
/* harmony export */   PostRepeatingEvent: () => (/* reexport safe */ events_PostRepeatingEvent_js__WEBPACK_IMPORTED_MODULE_2__.PostRepeatingEvent),
/* harmony export */   WelcomeEvent: () => (/* reexport safe */ events_WelcomeEvent_js__WEBPACK_IMPORTED_MODULE_0__.WelcomeEvent)
/* harmony export */ });
/* harmony import */ var events_WelcomeEvent_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! events/WelcomeEvent.js */ "./src/events/WelcomeEvent.js");
/* harmony import */ var quests_BaseMirrorQuest_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! quests/BaseMirrorQuest.js */ "./src/quests/BaseMirrorQuest.js");
/* harmony import */ var events_PostRepeatingEvent_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! events/PostRepeatingEvent.js */ "./src/events/PostRepeatingEvent.js");





/***/ }),

/***/ "./src/events/BaseEvent.js":
/*!*********************************!*\
  !*** ./src/events/BaseEvent.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BaseEvent: () => (/* binding */ BaseEvent)
/* harmony export */ });
/* harmony import */ var _managers_ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../managers/ErrorManager.js */ "./src/managers/ErrorManager.js");


/**
 * BaseEvent - Base class for events, providing common functionality
 * for activation and logging in the diary.
 * This class is used in an Observer Pattern where each event notifies
 * subscribed components (e.g., diary UI) about changes.
 */
class BaseEvent {
  /**
   * Constructor for the BaseEvent.
   * @param {EventManager} eventManager - Instance of the event manager responsible for diary operations.
   *
   * @property {string} key - Unique identifier for the event, which should be set by subclasses.
   */
  constructor(eventManager) {
    /** @type {EventManager} */
    this.eventManager = eventManager;
    // Event key; should be overridden in subclasses.
    this.key = "";
  }

  /**
   * activate - Activates the event.
   * If an event with the given key has not been logged yet, the event is logged via the eventManager.
   * This method handles logging and notification without triggering subsequent actions.
   *
   * NOTE: No direct UI manipulations should be placed here — any UI updates
   *       (e.g. enabling/disabling buttons) happen in specialized managers.
   *
   * @returns {Promise<void>} Asynchronous execution.
   */
  async activate() {
    try {
      // Check if the event with this key has not been logged yet.
      if (!this.eventManager.isEventLogged(this.key)) {
        console.log(`Activating event: ${this.key}`);
        // Log the event in the diary (as a user post, without ghost flag).
        await this.eventManager.addDiaryEntry(this.key);
      }
    } catch (error) {
      // Delegate error logging and user notification.
      _managers_ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__.ErrorManager.logError(error, "BaseEvent.activate");
      _managers_ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__.ErrorManager.showError("An error occurred during event activation.");
    }
  }

  /**
   * addDiaryEntry - Convenience method to add a diary entry.
   * Delegates the addition to the eventManager.
   *
   * @param {string} text - The text of the entry to be added to the diary.
   * @param {boolean} [isGhostPost=false] - Flag indicating if this is a ghost post.
   * @returns {Promise<void>} Asynchronous execution.
   */
  async addDiaryEntry(text, isGhostPost = false) {
    try {
      await this.eventManager.addDiaryEntry(text, isGhostPost);
    } catch (error) {
      _managers_ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__.ErrorManager.logError(error, "BaseEvent.addDiaryEntry");
      _managers_ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__.ErrorManager.showError("An error occurred while adding a diary entry.");
    }
  }
}

/***/ }),

/***/ "./src/events/PostRepeatingEvent.js":
/*!******************************************!*\
  !*** ./src/events/PostRepeatingEvent.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PostRepeatingEvent: () => (/* binding */ PostRepeatingEvent)
/* harmony export */ });
/* harmony import */ var _BaseEvent_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./BaseEvent.js */ "./src/events/BaseEvent.js");
/* harmony import */ var _managers_StateManager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../managers/StateManager.js */ "./src/managers/StateManager.js");
/* harmony import */ var _managers_ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../managers/ErrorManager.js */ "./src/managers/ErrorManager.js");




/**
 * PostRepeatingEvent
 * 
 * This event finalizes the mirror quest cycle and prepares the system for the repeating quest cycle.
 * It logs a ghost post and, if the current ghost is not finished, enables the Post button and triggers the mirror effect.
 * It does not directly set quest-specific flags; these are managed via the universal state.
 *
 * NOTE: This event does not automatically trigger quest activation;
 * it simply performs its task and dispatches a "gameEventCompleted" event.
 */
class PostRepeatingEvent extends _BaseEvent_js__WEBPACK_IMPORTED_MODULE_0__.BaseEvent {
  /**
   * @param {EventManager} eventManager - Manager handling diary operations.
   * @param {App} appInstance - Reference to the main application instance.
   */
  constructor(eventManager, appInstance) {
    super(eventManager);
    this.app = appInstance;
    // Base key for post repeating event.
    this.key = "post_repeating_event";
  }

  /**
   * activate - Activates the post repeating event.
   * Accepts an optional dynamicKey to generate a unique event id (e.g., "post_repeating_event_stage_2").
   *
   * @param {string} [dynamicKey] - Optional unique event key.
   */
  async activate(dynamicKey) {
    const eventKey = dynamicKey || this.key;
    if (this.eventManager.isEventLogged(eventKey)) {
      console.log(`[PostRepeatingEvent] Event '${eventKey}' is already logged, skipping activation.`);
      return;
    }
    console.log(`[PostRepeatingEvent] Activating event '${eventKey}'.`);
    await this.addDiaryEntry(eventKey, true);

    // Check if the current ghost is finished.
    const ghost = this.app.ghostManager.getCurrentGhost();
    if (ghost && ghost.isFinished) {
      console.log("[PostRepeatingEvent] Ghost is finished; ready to dispatch event completion.");
      // No additional processing is needed if the ghost is finished.
    } else {
      // Instead of setting a mirrorQuestReady flag,
      // simply enable the Post button and trigger the mirror effect.
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
        this.app.viewManager.setPostButtonEnabled(true);
      }
      if (this.app.visualEffectsManager && typeof this.app.visualEffectsManager.triggerMirrorEffect === "function") {
        this.app.visualEffectsManager.triggerMirrorEffect();
      }
      console.log("[PostRepeatingEvent] Repeating quest cycle ended; waiting for user action.");
    }

    // Dispatch an event to signal completion of this event.
    document.dispatchEvent(new CustomEvent("gameEventCompleted", {
      detail: eventKey
    }));
  }
}

/***/ }),

/***/ "./src/events/WelcomeEvent.js":
/*!************************************!*\
  !*** ./src/events/WelcomeEvent.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   WelcomeEvent: () => (/* binding */ WelcomeEvent)
/* harmony export */ });
/* harmony import */ var _BaseEvent_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./BaseEvent.js */ "./src/events/BaseEvent.js");
/* harmony import */ var _managers_StateManager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../managers/StateManager.js */ "./src/managers/StateManager.js");
/* harmony import */ var _managers_ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../managers/ErrorManager.js */ "./src/managers/ErrorManager.js");




/**
 * WelcomeEvent
 * 
 * This event is triggered immediately after registration. It logs a welcome message
 * (invitation to approach the mirror) in the diary and enables the "Post" button.
 * It uses StateManager to check and update the "welcomeDone" flag so that the event
 * is launched only once per registration cycle.
 *
 * NOTE: This event is part of the sequential chain managed by GhostManager.
 * It only performs its task (publishing a ghost post and setting flags) and then
 * dispatches a "gameEventCompleted" event.
 */
class WelcomeEvent extends _BaseEvent_js__WEBPACK_IMPORTED_MODULE_0__.BaseEvent {
  /**
   * @param {EventManager} eventManager - Manager handling diary operations.
   * @param {App} appInstance - Reference to the main application instance.
   * @param {LanguageManager} [languageManager] - Optional localization manager.
   */
  constructor(eventManager, appInstance, languageManager) {
    super(eventManager);
    this.app = appInstance;
    this.languageManager = languageManager;
    this.key = "welcome";
  }
  async activate() {
    // If the welcome event has already been completed, skip activation.
    if (_managers_StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.get(_managers_StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.KEYS.WELCOME_DONE) === "true") {
      console.log("Welcome event already completed; skipping activation.");
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
        this.app.viewManager.setPostButtonEnabled(true);
      }
      return;
    }

    // If the event is already logged, check the universal active quest key for enabling the Post button.
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`Event '${this.key}' is already logged.`);
      if (_managers_StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.get("activeQuestKey") === "mirror_quest") {
        if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
          this.app.viewManager.setPostButtonEnabled(true);
          console.log("Post button enabled based on activeQuestKey 'mirror_quest'.");
        }
      } else {
        if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
          this.app.viewManager.setPostButtonEnabled(false);
          console.log("Post button remains disabled as activeQuestKey is not set to 'mirror_quest'.");
        }
      }
      return;
    }

    // Log the event as a ghost post via the unified method.
    console.log(`Activating event '${this.key}': Logging invitation to approach the mirror`);
    await this.addDiaryEntry(this.key, true);

    // Instead of setting "mirrorQuestReady", update the universal active quest key.
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
      this.app.viewManager.setPostButtonEnabled(true);
    }

    // Trigger the mirror effect if available.
    if (this.app.visualEffectsManager && typeof this.app.visualEffectsManager.triggerMirrorEffect === "function") {
      this.app.visualEffectsManager.triggerMirrorEffect();
    }

    // Mark the welcome event as completed.
    _managers_StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.set(_managers_StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.KEYS.WELCOME_DONE, "true");

    // Dispatch an event to signal that the welcome event has completed.
    document.dispatchEvent(new CustomEvent("gameEventCompleted", {
      detail: this.key
    }));
  }
}

/***/ }),

/***/ "./src/quests/BaseMirrorQuest.js":
/*!***************************************!*\
  !*** ./src/quests/BaseMirrorQuest.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BaseMirrorQuest: () => (/* binding */ BaseMirrorQuest)
/* harmony export */ });
/* harmony import */ var _events_BaseEvent_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../events/BaseEvent.js */ "./src/events/BaseEvent.js");
/* harmony import */ var _utils_ImageUtils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/ImageUtils.js */ "./src/utils/ImageUtils.js");
/* harmony import */ var _managers_StateManager_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../managers/StateManager.js */ "./src/managers/StateManager.js");
/* harmony import */ var _managers_ErrorManager_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../managers/ErrorManager.js */ "./src/managers/ErrorManager.js");





/**
 * BaseMirrorQuest – Base class for the mirror quest.
 * Encapsulates the logic for comparing the current frame (canvas → grayscale → compare),
 * managing the check loop, and delegating UI updates to the ViewManager.
 */
class BaseMirrorQuest extends _events_BaseEvent_js__WEBPACK_IMPORTED_MODULE_0__.BaseEvent {
  constructor(eventManager, appInstance, config = {}) {
    super(eventManager);
    this.app = appInstance;
    this.key = config.key || "mirror_quest"; // Allows overriding the key.
    this.doneKey = config.doneKey || "mirror_done";

    // UI configuration (identifiers used by ViewManager)
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
   * If the universal active quest key matches this quest's key,
   * starts the check loop when the camera becomes ready.
   */
  registerEvents() {
    document.addEventListener('cameraReady', () => {
      // Instead of checking a specific flag, check the universal "activeQuestKey"
      if (_managers_StateManager_js__WEBPACK_IMPORTED_MODULE_2__.StateManager.getActiveQuestKey() === this.key) {
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
      // Use the unified diary entry method from BaseEvent.
      await this.addDiaryEntry(this.key);
    }
    console.log("[BaseMirrorQuest] Mirror quest activated.");
    // Save quest record as active.
    await this.app.databaseManager.saveQuestRecord({
      quest_key: this.key,
      status: "active",
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
    if (this.checkInterval) return; // Already running.

    if (this.app.viewManager && typeof this.app.viewManager.startMirrorQuestUI === 'function') {
      this.app.viewManager.startMirrorQuestUI({
        statusElementId: this.statusElementId,
        shootButtonId: this.shootButtonId,
        onShoot: () => this.finish() // When user clicks the shoot button, finish the quest.
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
   * checkStatus
   * Uses compareFrameInternally to decide if the user is "in front of the mirror."
   */
  async checkStatus() {
    console.log("[BaseMirrorQuest] checkStatus() -> compareFrameInternally()");
    return await this.compareFrameInternally();
  }

  /**
   * compareFrameInternally
   * Captures the current camera frame, converts it to grayscale, compares it to the saved selfieData,
   * and returns a boolean indicating success or failure.
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
    const currentFrameData = _utils_ImageUtils_js__WEBPACK_IMPORTED_MODULE_1__.ImageUtils.convertToGrayscale(this.tempCanvas);
    const matchPixel = _utils_ImageUtils_js__WEBPACK_IMPORTED_MODULE_1__.ImageUtils.pixelWiseComparison(this.app.selfieData, currentFrameData);
    const matchHist = _utils_ImageUtils_js__WEBPACK_IMPORTED_MODULE_1__.ImageUtils.histogramComparison(this.app.selfieData, currentFrameData);
    console.log(`[BaseMirrorQuest] pixel=${matchPixel.toFixed(2)}, hist=${matchHist.toFixed(2)}`);
    const success = matchPixel > 0.6 && matchHist > 0.7;
    if (success) {
      this.app.lastMirrorPhoto = currentFrameData;
    }
    return success;
  }

  /**
   * updateUIAfterFinish
   * Calls a custom "updateMirrorQuestUIAfterFinish" method in ViewManager (if available)
   * to update UI elements after quest completion.
   *
   * @param {boolean} success - Indicates whether the final check was successful.
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
   * Finalizes the mirror quest:
   * - Stops the check loop.
   * - Performs a final status check.
   * - Logs a diary entry indicating success or failure.
   * - Updates the UI (e.g., disables camera highlights, resets buttons).
   * - Clears the quest-specific state.
   * - Marks the quest as finished in the database.
   * - Does NOT automatically trigger the next quest or event.
   * - Dispatches a "questCompleted" event to signal completion to GhostManager.
   */
  async finish() {
    if (this.finished) return;
    this.finished = true;
    this.stopCheckLoop(); // Stop the quest UI check loop.

    const success = await this.checkStatus();
    const ghost = this.app.ghostManager.getCurrentGhost();
    const randomLetter = ghost ? this.getRandomLetter(ghost.name) : "";
    if (success) {
      const photoData = this.app.lastMirrorPhoto ? ` [photo attached]\n${this.app.lastMirrorPhoto}` : "";
      // Use the unified method for adding a diary entry.
      await this.addDiaryEntry(`user_post_success: ${randomLetter}${photoData}`, false);
    } else {
      await this.addDiaryEntry(`user_post_failed: ${randomLetter}`, false);
    }

    // Update the UI after finishing the quest.
    this.updateUIAfterFinish(success);

    // Reset the "Open Camera" button if necessary.
    if (this.app.viewManager && typeof this.app.viewManager.setCameraButtonActive === 'function') {
      this.app.viewManager.setCameraButtonActive(false);
    }

    // Mark the quest as finished in the database.
    await this.app.databaseManager.saveQuestRecord({
      quest_key: this.key,
      status: "finished",
      current_stage: 1,
      total_stages: 1
    });

    // Synchronize the quest state so that the "Post" button updates.
    await this.app.questManager.syncQuestState();

    // Dispatch a custom event to signal that the quest has been completed.
    document.dispatchEvent(new CustomEvent("questCompleted", {
      detail: this.key
    }));
  }

  /**
   * getCurrentQuestStatus
   * Retrieves the quest state from the database along with local flags.
   * Now, instead of checking "mirrorQuestActive", it checks if the universal active quest key
   * matches this quest's key.
   * @returns {Promise<Object>} An object containing quest status information.
   */
  async getCurrentQuestStatus() {
    const record = this.app.databaseManager.getQuestRecord(this.key);
    const activeFlag = _managers_StateManager_js__WEBPACK_IMPORTED_MODULE_2__.StateManager.getActiveQuestKey() === this.key;
    return {
      key: this.key,
      active: activeFlag,
      finished: this.finished,
      dbStatus: record ? record.status : "not recorded"
    };
  }

  /**
   * getRandomLetter
   * Utility function: returns a random letter from the ghost's name.
   * @param {string} name - The ghost's name.
   * @returns {string} A random letter from the name.
   */
  getRandomLetter(name) {
    if (!name) return "";
    const letters = name.replace(/[^A-Za-zА-Яа-яЁё]/g, '').split('');
    if (!letters.length) return '';
    return letters[Math.floor(Math.random() * letters.length)];
  }
}

/***/ })

}]);
//# sourceMappingURL=triad-triad-welcome-js.js.map