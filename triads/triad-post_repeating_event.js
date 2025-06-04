"use strict";
(self["webpackChunktesterer_deploy_github_io"] = self["webpackChunktesterer_deploy_github_io"] || []).push([["triads/triad-post_repeating_event"],{

/***/ "./build/triads/triad-post_repeating_event.js":
/*!****************************************************!*\
  !*** ./build/triads/triad-post_repeating_event.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BaseRepeatingQuest: () => (/* reexport safe */ quests_BaseRepeatingQuest_js__WEBPACK_IMPORTED_MODULE_1__.BaseRepeatingQuest),
/* harmony export */   FinalEvent: () => (/* reexport safe */ events_FinalEvent_js__WEBPACK_IMPORTED_MODULE_2__.FinalEvent),
/* harmony export */   PostRepeatingEvent: () => (/* reexport safe */ events_PostRepeatingEvent_js__WEBPACK_IMPORTED_MODULE_0__.PostRepeatingEvent)
/* harmony export */ });
/* harmony import */ var events_PostRepeatingEvent_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! events/PostRepeatingEvent.js */ "./src/events/PostRepeatingEvent.js");
/* harmony import */ var quests_BaseRepeatingQuest_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! quests/BaseRepeatingQuest.js */ "./src/quests/BaseRepeatingQuest.js");
/* harmony import */ var events_FinalEvent_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! events/FinalEvent.js */ "./src/events/FinalEvent.js");





/***/ }),

/***/ "./src/config/detectableItems.js":
/*!***************************************!*\
  !*** ./src/config/detectableItems.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   detectableItems: () => (/* binding */ detectableItems)
/* harmony export */ });
// config/detectableItems.js
// List of household items for repeating quest detection
const detectableItems = ['toilet', 'clock', 'lamp', 'chair', 'table', 'couch', 'bed', 'refrigerator', 'book', 'cup'];

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

/***/ "./src/events/FinalEvent.js":
/*!**********************************!*\
  !*** ./src/events/FinalEvent.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FinalEvent: () => (/* binding */ FinalEvent)
/* harmony export */ });
/* harmony import */ var _BaseEvent_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./BaseEvent.js */ "./src/events/BaseEvent.js");
/* harmony import */ var _managers_StateManager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../managers/StateManager.js */ "./src/managers/StateManager.js");
/* harmony import */ var _managers_ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../managers/ErrorManager.js */ "./src/managers/ErrorManager.js");
// File: src/events/FinalEvent.js





/**
 * FinalEvent
 *
 * This event finalizes the scenario. It logs the final event,
 * sets the game as finalized, triggers a ghost fade-out effect,
 * marks the current ghost as finished, disables active UI elements,
 * and notifies the user via the ViewManager.
 *
 * NOTE: FinalEvent is part of the sequential chain managed by GhostManager.
 * It performs its task and signals completion via the "gameEventCompleted" event.
 */
class FinalEvent extends _BaseEvent_js__WEBPACK_IMPORTED_MODULE_0__.BaseEvent {
  /**
   * @param {EventManager} eventManager - The diary/event manager.
   * @param {App} appInstance - The main application instance.
   * @param {Object} config - Configuration object from gameEntities.json, contains `key`.
   * @param {LanguageManager} [languageManager] - Optional localization manager.
   */
  constructor(eventManager, appInstance, config, languageManager) {
    super(eventManager);
    this.app = appInstance;
    this.languageManager = languageManager;
    this.key = config.key;
  }
  async activate() {
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`Event '${this.key}' is already logged, skipping activation.`);
      return;
    }
    console.log(`Activating final event: '${this.key}'`);
    await this.addDiaryEntry(this.key, true);

    // Set the game as finalized.
    _managers_StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.set(_managers_StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.KEYS.GAME_FINALIZED, "true");

    // Trigger the ghost fade-out effect.
    if (this.app.visualEffectsManager && typeof this.app.visualEffectsManager.triggerGhostAppearanceEffect === "function") {
      this.app.visualEffectsManager.triggerGhostAppearanceEffect("ghost_fade_out");
    }

    // Mark the current ghost as finished.
    await this.app.ghostManager.finishCurrentGhost();

    // Disable active UI elements (e.g. Post button).
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
      this.app.viewManager.setPostButtonEnabled(false);
    }

    // Re-sync UI state.
    if (this.app.questManager && typeof this.app.questManager.syncQuestState === "function") {
      await this.app.questManager.syncQuestState();
    }

    // Remove the universal active quest key to clear any remaining quest state.
    _managers_StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.setActiveQuestKey(null);

    // Notify the user that the scenario is finished.
    if (this.app.viewManager && typeof this.app.viewManager.showNotification === "function") {
      this.app.viewManager.showNotification("🎉 Congratulations, the scenario is finished!");
    } else {
      console.log("🎉 Congratulations, the scenario is finished!");
    }

    // Dispatch an event to signal completion of the final event.
    document.dispatchEvent(new CustomEvent("gameEventCompleted", {
      detail: this.key
    }));
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
// File: src/events/PostRepeatingEvent.js





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
   * @param {Object} config - Configuration object from gameEntities.json, contains `key`.
   * @param {LanguageManager} [languageManager] - (unused here, but kept for signature consistency)
   */
  constructor(eventManager, appInstance, config, languageManager) {
    super(eventManager);
    this.app = appInstance;
    // Use key from config instead of hardcoded literal
    this.key = config.key;
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

/***/ "./src/quests/BaseRepeatingQuest.js":
/*!******************************************!*\
  !*** ./src/quests/BaseRepeatingQuest.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BaseRepeatingQuest: () => (/* binding */ BaseRepeatingQuest)
/* harmony export */ });
/* harmony import */ var _events_BaseEvent_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../events/BaseEvent.js */ "./src/events/BaseEvent.js");
/* harmony import */ var _utils_ImageUtils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/ImageUtils.js */ "./src/utils/ImageUtils.js");
/* harmony import */ var _managers_StateManager_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../managers/StateManager.js */ "./src/managers/StateManager.js");
/* harmony import */ var _managers_ErrorManager_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../managers/ErrorManager.js */ "./src/managers/ErrorManager.js");
/* harmony import */ var _config_detectableItems_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../config/detectableItems.js */ "./src/config/detectableItems.js");






/**
 * BaseRepeatingQuest – Base class for the repeating quest.
 * Manages quest progress by updating state across multiple stages,
 * saving progress via StateManager, and delegating UI updates to ViewManager.
 *
 * NOTE: This quest is part of the sequential chain managed by GhostManager.
 */
class BaseRepeatingQuest extends _events_BaseEvent_js__WEBPACK_IMPORTED_MODULE_0__.BaseEvent {
  constructor(eventManager, appInstance, config = {}) {
    super(eventManager);
    this.app = appInstance;
    this.key = config.key || "repeating_quest";
    this.doneKey = config.doneKey || this.key + "_done";

    // UI configuration (delegated to ViewManager)
    this.statusElementId = config.statusElementId || "repeating-quest-status";
    this.shootButtonId = config.shootButtonId || "btn_shoot";

    // Quest state
    this.totalStages = config.totalStages || 3;
    this.currentStage = 1;
    this.activated = false;
    this.finished = false;

    // (Optional flag – not used further, can be removed if unnecessary)
    this.finalRepeatingQuestCompleted = false;

    // Restore saved quest state from StateManager.
    this.loadState();

    // ==== new: initialize remaining items and pick the currentTarget ====
    // Restore the list of remaining items from StateManager or use the default array
    const savedItems = _managers_StateManager_js__WEBPACK_IMPORTED_MODULE_2__.StateManager.get('remainingItems');
    this.remainingItems = savedItems ? JSON.parse(savedItems) : [..._config_detectableItems_js__WEBPACK_IMPORTED_MODULE_4__.detectableItems];
    // Save the remaining items list (if not already saved)
    _managers_StateManager_js__WEBPACK_IMPORTED_MODULE_2__.StateManager.set('remainingItems', JSON.stringify(this.remainingItems));

    // Pick the first item from the list as the current target
    this.currentTarget = this.remainingItems.length > 0 ? this.remainingItems[0] : null;

    // subscribe to AI‐detection events and enable Shoot button when target is found
    document.addEventListener("objectDetected", this.onObjectDetected.bind(this));
  }

  /**
   * generateDetectionConfig
   * Returns an object with current target for AI detection.
   * @returns {{ target: string }}
   */
  generateDetectionConfig() {
    // Use the quest’s currentTarget (set in constructor)
    console.log(`[BaseRepeatingQuest] Providing detection target: ${this.currentTarget}`);
    return {
      target: this.currentTarget
    };
  }

  /**
   * loadState – Restores the quest state from StateManager.
   */
  loadState() {
    const saved = _managers_StateManager_js__WEBPACK_IMPORTED_MODULE_2__.StateManager.get(`quest_state_${this.key}`);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        this.currentStage = state.currentStage;
        this.finished = state.finished;
        if (state.totalStages) {
          this.totalStages = state.totalStages;
        }
        console.log(`[BaseRepeatingQuest] Restored quest state: stage=${this.currentStage}, finished=${this.finished}`);
      } catch (e) {
        console.error("[BaseRepeatingQuest] Error parsing saved quest state:", e);
      }
    }
  }

  /**
   * saveState – Saves the current quest state to StateManager.
   */
  saveState() {
    const state = {
      currentStage: this.currentStage,
      finished: this.finished,
      totalStages: this.totalStages
    };
    _managers_StateManager_js__WEBPACK_IMPORTED_MODULE_2__.StateManager.set(`quest_state_${this.key}`, JSON.stringify(state));
    console.log(`[BaseRepeatingQuest] Saved quest state: stage=${this.currentStage}, finished=${this.finished}`);
  }

  /**
   * activate – Activates the repeating quest.
   * Waits for the camera to be open (using a "cameraReady" event) if needed,
   * then starts the UI check loop and sets the "Open Camera" button active via ViewManager.
   * Also saves the quest record in the database with status "active".
   */
  async activate() {
    console.log(`Activating repeating quest: ${this.key}`);

    // 1) запишем в дневник и в БД
    await this.addDiaryEntry(this.key, true);
    await this.app.databaseManager.saveQuestRecord({
      quest_key: this.key,
      status: "active",
      current_stage: this.currentStage,
      total_stages: this.totalStages
    });

    // 2) визуально подсветить камеру-кнопку
    if (this.app.viewManager?.setCameraButtonActive) {
      this.app.viewManager.setCameraButtonActive(true);
    }

    // 3) флажок что квест стартанул
    this.activated = true;

    // 4) Ждём, пока пользователь сам откроет камеру…
    if (this.app.isCameraOpen) {
      this.startCheckLoop();
    } else {
      document.addEventListener("cameraReady", () => {
        console.log("[BaseRepeatingQuest] cameraReady received — starting quest loop");
        this.startCheckLoop();
      }, {
        once: true
      });
    }
  }

  /**
   * startCheckLoop – Delegates UI initialization for the quest stage to ViewManager,
   * then awaits user action (via the shoot button).
   */
  startCheckLoop() {
    // теперь запускаем детекцию ТОЛЬКО если камера открыта, квест активирован и он не завершён
    if (this.app.isCameraOpen && this.activated && !this.finished) {
      console.log(`[BaseRepeatingQuest] Starting AI detection for target '${this.currentTarget}'.`);
      this.app.cameraSectionManager?.startAIDetection?.({
        target: this.currentTarget
      });
    }

    // далее — инициализируем UI (статус + disabled Shoot)
    if (this.app.viewManager?.startRepeatingQuestUI) {
      this.app.viewManager.startRepeatingQuestUI({
        statusElementId: this.statusElementId,
        shootButtonId: this.shootButtonId,
        stage: this.currentStage,
        totalStages: this.totalStages,
        target: this.currentTarget,
        onShoot: () => this.finishStage(),
        quest: this
      });
    } else {
      console.error("[BaseRepeatingQuest] ViewManager.startRepeatingQuestUI is not available.");
    }
    console.log("[BaseRepeatingQuest] Repeating quest UI updated. Awaiting user action to capture snapshot.");
  }

  /**
   * restoreUI – Restores the UI for the repeating quest if a cycle is active.
   * This method now checks the DB record and, if the quest is active there,
   * sets the local 'activated' flag to true before restoring the UI.
   */
  restoreUI() {
    console.log("[BaseRepeatingQuest] Attempting to restore repeating quest UI...");

    // Retrieve the DB record for this quest.
    const record = this.app.databaseManager.getQuestRecord(this.key);

    // If there is no record or the status is not "active", skip restoration.
    if (!record || record.status !== "active") {
      console.log("[BaseRepeatingQuest] DB record is not active; UI restoration skipped.");
      return;
    }

    // If the quest is finished locally, skip restoration.
    if (this.finished) {
      console.log("[BaseRepeatingQuest] Quest is finished; UI restoration skipped.");
      return;
    }

    // If the quest was not activated locally (e.g. after a page reload), set it to active based on DB record.
    if (!this.activated) {
      console.log("[BaseRepeatingQuest] Quest not activated locally; setting activated=true based on DB record.");
      this.activated = true;
    }

    // Function to restore UI state.
    const restoreButtonState = () => {
      // Переинициализируем UI: статусы, статус-бар и запустим детекцию,
      // но кнопку “Shoot” оставляем выключенной до фактической objectDetected().
      this.startCheckLoop();
      console.log("[BaseRepeatingQuest] UI restored; shoot button will be enabled upon detection.");
    };

    // If the camera is not open yet, wait for the "cameraReady" event.
    if (!this.app.isCameraOpen) {
      document.addEventListener("cameraReady", restoreButtonState, {
        once: true
      });
    } else {
      restoreButtonState();
    }

    // Если камера была открыта и videoElement уже готов,
    // сразу запускаем восстановление (на случай, если loadedmetadata уже случился).
    const video = this.app.cameraSectionManager.videoElement;
    if (_managers_StateManager_js__WEBPACK_IMPORTED_MODULE_2__.StateManager.isCameraOpen() && video && video.srcObject && video.readyState >= 2) {
      console.log("[BaseRepeatingQuest] videoElement.readyState >= 2 — сразу восстанавливаем детекцию");
      restoreButtonState();
    }
  }

  /**
   * finishStage – Completes one stage of the repeating quest.
   * Disables the "Shoot" button, captures a snapshot, logs the stage completion,
   * updates quest state, and enables the "Post" button for the next stage (if any).
   * 
   * IMPORTANT: After finishing a stage (if quest is not finished),
   * a "questCompleted" event is dispatched to notify GhostManager.
   */
  async finishStage() {
    if (this.finished) return;

    // stop AI detection as soon as user pressed Shoot
    if (this.app.cameraSectionManager && typeof this.app.cameraSectionManager.stopAIDetection === 'function') {
      this.app.cameraSectionManager.stopAIDetection();
      console.log("[BaseRepeatingQuest] AI detection stopped after shoot.");
    }
    if (this.app.viewManager && typeof this.app.viewManager.setShootButtonActive === 'function') {
      this.app.viewManager.setShootButtonActive(false);
      console.log("[BaseRepeatingQuest] Shoot button disabled after click.");
    }
    const photoData = this.captureSimplePhoto();
    console.log(`[BaseRepeatingQuest] Captured snapshot for stage ${this.currentStage}.`);

    // Use unified method to log diary entry.
    await this.addDiaryEntry(`repeating_stage_${this.currentStage} [photo attached]\n${photoData}`, false);
    console.log(`[BaseRepeatingQuest] Completed stage: ${this.currentStage}`);
    this.currentStage++;
    this.saveState();

    // Remove the processed item from remainingItems and persist for next cycles
    if (this.currentTarget) {
      this.remainingItems.shift();
      _managers_StateManager_js__WEBPACK_IMPORTED_MODULE_2__.StateManager.set('remainingItems', JSON.stringify(this.remainingItems));
      this.currentTarget = this.remainingItems[0] || null;
      console.log(`[BaseRepeatingQuest] Next detection target: ${this.currentTarget}`);
    }
    if (this.currentStage <= this.totalStages) {
      // For intermediate stages, force the quest record to be "finished"
      // so that a new instance of the quest can be started.
      await this.app.databaseManager.saveQuestRecord({
        quest_key: this.key,
        status: "finished",
        current_stage: this.currentStage,
        total_stages: this.totalStages
      });
      // Removed direct call to set "mirrorQuestReady"; universal active quest state is managed externally.
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
        this.app.viewManager.setPostButtonEnabled(true);
        console.log("[BaseRepeatingQuest] Post button enabled for next stage.");
      }
      // Dispatch event to notify that a stage of the repeating quest is completed.
      document.dispatchEvent(new CustomEvent("questCompleted", {
        detail: this.key
      }));
      console.log("[BaseRepeatingQuest] questCompleted event dispatched for repeating quest stage.");
    } else {
      // If the current stage exceeds the total stages, finish the quest completely.
      await this.finishCompletely();
    }
  }

  /**
   * finishCompletely – Finalizes the repeating quest.
   * Sets the quest as finished in the database, removes the quest state from StateManager,
   * and dispatches the questCompleted event to signal full completion.
   */
  async finishCompletely() {
    // Mark the quest as finished.
    this.finished = true;
    // Save the final state in the database with status "finished".
    await this.app.databaseManager.saveQuestRecord({
      quest_key: this.key,
      status: "finished",
      current_stage: this.currentStage,
      total_stages: this.totalStages
    });
    // Remove the quest state from StateManager so that it doesn't get restored on page refresh.
    _managers_StateManager_js__WEBPACK_IMPORTED_MODULE_2__.StateManager.remove(`quest_state_${this.key}`);
    // Dispatch the questCompleted event to signal full completion.
    document.dispatchEvent(new CustomEvent("questCompleted", {
      detail: this.key
    }));
    console.log(`[BaseRepeatingQuest] Quest completely finished. questCompleted event dispatched.`);
  }

  /**
   * captureSimplePhoto – Captures a snapshot from the active camera and returns a data URL.
   * @returns {string} Data URL of the captured image.
   */
  captureSimplePhoto() {
    const video = this.app.cameraSectionManager?.videoElement;
    if (!video || !video.srcObject) {
      console.warn("[BaseRepeatingQuest] Camera is not active — returning an empty string");
      return "";
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  }

  /**
   * resetCycle – Resets the state of the repeating quest for a new cycle.
   */
  resetCycle() {
    this.finished = false;
    this.currentStage = 1;
    console.log("[BaseRepeatingQuest] Quest state has been reset for a new cycle.");
    this.saveState();
  }

  /**
   * getCurrentQuestStatus – Retrieves the current status of the repeating quest.
   * Now, instead of using a local boolean, the active flag is determined by comparing
   * the universal active quest key with this quest's key.
   * @returns {Promise<Object>} An object containing quest status information.
   */
  async getCurrentQuestStatus() {
    const record = this.app.databaseManager.getQuestRecord(this.key);
    const active = _managers_StateManager_js__WEBPACK_IMPORTED_MODULE_2__.StateManager.getActiveQuestKey() === this.key;
    return {
      key: this.key,
      active: active,
      finished: this.finished,
      currentStage: this.currentStage,
      totalStages: this.totalStages,
      dbStatus: record ? record.status : "not recorded"
    };
  }

  /**
   * getRandomLetter – Utility function that returns a random letter from the ghost's name.
   * @param {string} name - The ghost's name.
   * @returns {string} A random letter from the name.
   */
  getRandomLetter(name) {
    if (!name) return "";
    const letters = name.replace(/[^A-Za-zА-Яа-яЁё]/g, '').split('');
    if (!letters.length) return '';
    return letters[Math.floor(Math.random() * letters.length)];
  }

  /**
   * onObjectDetected – called when the AI model detects the current target.
   * Enables the Shoot button in the UI.
   */
  onObjectDetected(event) {
    const detectedClass = event.detail;
    if (detectedClass === this.currentTarget && this.app.isCameraOpen) {
      console.log(`[BaseRepeatingQuest] Detected '${detectedClass}', enabling Shoot button.`);
      if (this.app.viewManager && typeof this.app.viewManager.setShootButtonActive === 'function') {
        this.app.viewManager.setShootButtonActive(true);
      }
    }
  }
}

/***/ })

}]);
//# sourceMappingURL=triad-post_repeating_event.js.map