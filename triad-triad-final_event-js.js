"use strict";
(self["webpackChunktesterer_deploy_github_io"] = self["webpackChunktesterer_deploy_github_io"] || []).push([["triad-triad-final_event-js"],{

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
   * @param {LanguageManager} [languageManager] - Optional localization manager.
   */
  constructor(eventManager, appInstance, languageManager) {
    super(eventManager);
    this.app = appInstance;
    this.languageManager = languageManager;
    this.key = "final_event";
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

/***/ "./src/quests/FinalQuest.js":
/*!**********************************!*\
  !*** ./src/quests/FinalQuest.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FinalQuest: () => (/* binding */ FinalQuest)
/* harmony export */ });
/* harmony import */ var _events_BaseEvent_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../events/BaseEvent.js */ "./src/events/BaseEvent.js");
/* harmony import */ var _managers_StateManager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../managers/StateManager.js */ "./src/managers/StateManager.js");



/**
 * FinalQuest – The final quest signifies the complete end of the scenario
 * (e.g., no more letters/phenomena). It logs the completion, updates the game
 * state via StateManager, triggers the ghost finishing process, and notifies the user
 * via ViewManager.
 */
class FinalQuest extends _events_BaseEvent_js__WEBPACK_IMPORTED_MODULE_0__.BaseEvent {
  /**
   * @param {EventManager} eventManager - The event manager.
   * @param {App} appInstance - The main application instance.
   * @param {Object} [config] - Optional configuration (e.g., { key: "final_quest" }).
   */
  constructor(eventManager, appInstance, config = {}) {
    super(eventManager);
    this.app = appInstance;
    this.key = config.key || "final_quest";
    this.finished = false;
  }

  /**
   * activate – Logs the start of the final quest (if not already logged).
   */
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`[FinalQuest] Activating final quest: ${this.key}`);
      // Use unified method for adding diary entry.
      await this.addDiaryEntry(this.key, true);
    }
    console.log("[FinalQuest] Final quest initiated.");
  }

  /**
   * checkStatus – Performs any necessary checks (e.g., additional snapshot if needed).
   * Currently always returns true.
   */
  async checkStatus() {
    return true;
  }

  /**
   * finish – Completes the final quest:
   *  1) Checks final conditions via checkStatus.
   *  2) Logs the completion in the diary.
   *  3) Sets the "gameFinalized" flag via StateManager.
   *  4) Removes the universal active quest key.
   *  5) Calls finishCurrentGhost from GhostManager.
   *  6) Notifies the user via ViewManager.
   *  7) Synchronizes UI state.
   *  8) Dispatches a "questCompleted" event to signal completion.
   */
  async finish() {
    if (this.finished) return;
    const success = await this.checkStatus();
    if (!success) {
      if (this.app.viewManager && typeof this.app.viewManager.showNotification === "function") {
        this.app.viewManager.showNotification("❌ Final quest conditions not met!");
      }
      return;
    }
    this.finished = true;
    console.log(`[FinalQuest] Finishing quest: ${this.key}`);

    // Use unified method for adding a diary entry.
    await this.addDiaryEntry(`${this.key}_completed`, true);

    // Set the game as finalized.
    _managers_StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.set(_managers_StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.KEYS.GAME_FINALIZED, "true");
    // Remove the universal active quest key to clear any lingering quest state.
    _managers_StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.setActiveQuestKey(null);
    if (this.app.ghostManager) {
      await this.app.ghostManager.finishCurrentGhost();
    }
    if (this.app.viewManager && typeof this.app.viewManager.showNotification === "function") {
      this.app.viewManager.showNotification("🎉 Final quest completed! Scenario ended!");
    } else {
      console.log("🎉 Final quest completed! Scenario ended!");
    }
    if (this.app.questManager && typeof this.app.questManager.syncQuestState === "function") {
      await this.app.questManager.syncQuestState();
    }
    document.dispatchEvent(new CustomEvent("questCompleted", {
      detail: this.key
    }));
  }
}

/***/ }),

/***/ "./src/triads/triad-final_event.js":
/*!*****************************************!*\
  !*** ./src/triads/triad-final_event.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FinalEvent: () => (/* reexport safe */ _events_FinalEvent_js__WEBPACK_IMPORTED_MODULE_0__.FinalEvent),
/* harmony export */   FinalQuest: () => (/* reexport safe */ _quests_FinalQuest_js__WEBPACK_IMPORTED_MODULE_1__.FinalQuest)
/* harmony export */ });
/* harmony import */ var _events_FinalEvent_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../events/FinalEvent.js */ "./src/events/FinalEvent.js");
/* harmony import */ var _quests_FinalQuest_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../quests/FinalQuest.js */ "./src/quests/FinalQuest.js");




/***/ })

}]);
//# sourceMappingURL=triad-triad-final_event-js.js.map