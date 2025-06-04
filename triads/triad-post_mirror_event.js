"use strict";
(self["webpackChunktesterer_deploy_github_io"] = self["webpackChunktesterer_deploy_github_io"] || []).push([["triads/triad-post_mirror_event"],{

/***/ "./build/triads/triad-post_mirror_event.js":
/*!*************************************************!*\
  !*** ./build/triads/triad-post_mirror_event.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PostMirrorEvent: () => (/* reexport safe */ events_PostMirrorEvent_js__WEBPACK_IMPORTED_MODULE_0__.PostMirrorEvent),
/* harmony export */   PostRepeatingEvent: () => (/* reexport safe */ events_PostRepeatingEvent_js__WEBPACK_IMPORTED_MODULE_1__.PostRepeatingEvent)
/* harmony export */ });
/* harmony import */ var events_PostMirrorEvent_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! events/PostMirrorEvent.js */ "./src/events/PostMirrorEvent.js");
/* harmony import */ var events_PostRepeatingEvent_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! events/PostRepeatingEvent.js */ "./src/events/PostRepeatingEvent.js");




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

/***/ "./src/events/PostMirrorEvent.js":
/*!***************************************!*\
  !*** ./src/events/PostMirrorEvent.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PostMirrorEvent: () => (/* binding */ PostMirrorEvent)
/* harmony export */ });
/* harmony import */ var _BaseEvent_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./BaseEvent.js */ "./src/events/BaseEvent.js");
/* harmony import */ var _managers_StateManager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../managers/StateManager.js */ "./src/managers/StateManager.js");
/* harmony import */ var _managers_ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../managers/ErrorManager.js */ "./src/managers/ErrorManager.js");




/**
 * PostMirrorEvent
 * 
 * This event publishes a ghost post and signals that the mirror quest cycle has ended.
 * It updates the UI via ViewManager without directly setting quest-specific flags.
 *
 * NOTE: This event is part of the sequential chain managed by GhostManager.
 * It only performs its task and then dispatches a "gameEventCompleted" event.
 */
class PostMirrorEvent extends _BaseEvent_js__WEBPACK_IMPORTED_MODULE_0__.BaseEvent {
  /**
   * @param {EventManager} eventManager - Manager handling diary operations.
   * @param {App} appInstance - Reference to the main application instance.
   */
  constructor(eventManager, appInstance) {
    super(eventManager);
    this.app = appInstance;
    this.key = "post_mirror_event";
  }
  async activate() {
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`[PostMirrorEvent] Event '${this.key}' is already logged, skipping activation.`);
      return;
    }
    console.log(`[PostMirrorEvent] Activating event '${this.key}'.`);
    await this.addDiaryEntry(this.key, true);

    // Instead of directly setting mirrorQuestReady or isRepeatingCycle,
    // signal that the mirror quest cycle has completed by enabling the Post button 
    // and triggering the mirror effect. The universal active quest state is managed elsewhere.
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
      this.app.viewManager.setPostButtonEnabled(true);
    }
    if (this.app.visualEffectsManager && typeof this.app.visualEffectsManager.triggerMirrorEffect === "function") {
      this.app.visualEffectsManager.triggerMirrorEffect();
    }
    console.log("[PostMirrorEvent] Mirror quest cycle ended; waiting for user action to trigger the next quest.");

    // Dispatch an event to signal that this event has completed.
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

/***/ })

}]);
//# sourceMappingURL=triad-post_mirror_event.js.map