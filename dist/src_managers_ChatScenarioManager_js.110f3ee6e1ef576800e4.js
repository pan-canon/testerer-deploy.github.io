"use strict";
(self["webpackChunktesterer_deploy_github_io"] = self["webpackChunktesterer_deploy_github_io"] || []).push([["src_managers_ChatScenarioManager_js"],{

/***/ "./src/managers/ChatScenarioManager.js":
/*!*********************************************!*\
  !*** ./src/managers/ChatScenarioManager.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ChatScenarioManager: () => (/* binding */ ChatScenarioManager)
/* harmony export */ });
/* harmony import */ var _config_paths_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../config/paths.js */ "./src/config/paths.js");
/* harmony import */ var _StateManager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./StateManager.js */ "./src/managers/StateManager.js");


class ChatScenarioManager {
  /**
   * ChatScenarioManager is responsible for managing the dialogue flow of the chat.
   * It loads dialogue stages from a configuration file and advances the conversation
   * based on user selections. All dialogue texts (both messages and options) are expected
   * to be localization keys, which are converted to localized strings by ChatManager.
   *
   * With the new conversation independence functionality, the dialogue state can be reset
   * independently via ChatManager's restartConversation() method.
   *
   * @param {ChatManager} chatManager - An instance of ChatManager that handles the chat UI.
   * @param {Object} scenarioConfig - A JSON object representing the chat scenario.
   * Expected format:
   * {
   *   "dialogues": [
   *     {
   *       "messages": [
   *         { "sender": "spirit", "text": "chat_welcome_message", "animateOnBoard": true }
   *       ],
   *       "options": [
   *         { "text": "chat_option_1", "nextDialogueIndex": 1 },
   *         { "text": "chat_option_2", "nextDialogueIndex": 2 },
   *         { "text": "chat_option_3", "nextDialogueIndex": 3 }
   *       ]
   *     },
   *     ...
   *   ]
   * }
   */
  constructor(chatManager) {
    let scenarioConfig = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    this.chatManager = chatManager;
    this.scenarioConfig = scenarioConfig; // Scenario configuration data
    this.currentDialogueIndex = 0;
    // Optional callback when the scenario ends.
    this.onScenarioEnd = null;
  }

  /**
   * Asynchronously initializes the scenario manager.
   * If no configuration is provided, it fetches the dialogue configuration from
   * 'src/config/chatDialogueConfig.json'. This method also restores any saved dialogue
   * state unless the conversation has been marked as completed.
   * Previously, if chat messages were already present in the database, dialogue initialization
   * was skipped, which caused the dialogue options to disappear after a page reload.
   * This behavior has been corrected: the dialogue state (including options) is restored regardless
   * of existing messages, provided the conversation is not completed.
   */
  async init() {
    if (!this.scenarioConfig) {
      try {
        const response = await fetch(`${_config_paths_js__WEBPACK_IMPORTED_MODULE_0__.BASE_PATH}/src/config/chatDialogueConfig.json`);
        if (!response.ok) {
          throw new Error("Failed to load dialogue configuration from 'src/config/chatDialogueConfig.json'");
        }
        this.scenarioConfig = await response.json();
      } catch (error) {
        console.error("Error loading dialogue configuration:", error);
        return;
      }
    }
    // Check if the conversation is already completed for this section.
    if (_StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.get(this.chatManager.getStateKey('chat_conversation_completed')) === 'true') {
      console.log("Chat conversation already completed, skipping dialogue initialization.");
      return;
    }
    // Removed check for existing chat messages to ensure dialogue options are always restored.
    // Restore the current dialogue index if available; default to 0.
    const savedIndex = _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.get(this.chatManager.getStateKey('chat_currentDialogueIndex'));
    this.currentDialogueIndex = savedIndex !== null ? parseInt(savedIndex, 10) : 0;
    this.loadCurrentDialogue();
  }

  /**
   * Loads the current dialogue configuration and passes the dialogue to ChatManager to render.
   * The dialogue texts (messages and options) are expected to be localization keys,
   * and ChatManager will convert them into localized strings.
   */
  loadCurrentDialogue() {
    if (!this.scenarioConfig || !this.scenarioConfig.dialogues) {
      console.error("Scenario configuration is missing or invalid.");
      return;
    }
    const dialogue = this.scenarioConfig.dialogues[this.currentDialogueIndex];
    if (!dialogue) {
      console.warn("No dialogue found at the current index.");
      return;
    }
    // Render the dialogue. Message saving is handled in ChatManager.loadDialogue().
    this.chatManager.loadDialogue(dialogue);
  }

  /**
   * Advances the dialogue based on the user's selected option.
   *
   * If the selected option defines a nextDialogueIndex, the conversation advances accordingly.
   * Otherwise, the conversation is marked as completed and the saved dialogue index is removed.
   *
   * @param {number} optionIndex - The index of the chosen option.
   */
  advanceDialogue(optionIndex) {
    const currentDialogue = this.scenarioConfig.dialogues[this.currentDialogueIndex];
    if (!currentDialogue || !Array.isArray(currentDialogue.options) || currentDialogue.options.length <= optionIndex) {
      console.error("Invalid option index.");
      return;
    }
    const selectedOption = currentDialogue.options[optionIndex];
    if (selectedOption && typeof selectedOption.onSelect === "function") {
      selectedOption.onSelect();
    }
    if (selectedOption && typeof selectedOption.nextDialogueIndex === "number") {
      this.currentDialogueIndex = selectedOption.nextDialogueIndex;
      // Persist the updated dialogue index for this section.
      _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.set(this.chatManager.getStateKey('chat_currentDialogueIndex'), this.currentDialogueIndex);
      this.loadCurrentDialogue();
    } else {
      console.log("No next dialogue defined; scenario may have ended.");
      // Mark conversation as completed and remove the saved dialogue index for this section.
      _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.set(this.chatManager.getStateKey('chat_conversation_completed'), 'true');
      _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.remove(this.chatManager.getStateKey('chat_currentDialogueIndex'));
      // Remove the 'chat_started' flag so that conversation is not auto-resumed on reload.
      _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.remove(this.chatManager.getStateKey('chat_started'));
      if (typeof this.onScenarioEnd === "function") {
        this.onScenarioEnd();
      }
    }
  }

  /**
   * Sets a new scenario configuration and resets the dialogue index.
   * This facilitates conversation independence by allowing a fresh dialogue session.
   *
   * @param {Object} scenarioConfig - The new scenario configuration.
   */
  setScenario(scenarioConfig) {
    this.scenarioConfig = scenarioConfig;
    this.currentDialogueIndex = 0;
    _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.set(this.chatManager.getStateKey('chat_currentDialogueIndex'), this.currentDialogueIndex);
    this.loadCurrentDialogue();
  }

  /**
   * Registers a callback function to be executed when the dialogue scenario ends.
   *
   * @param {Function} callback - The callback function.
   */
  setOnScenarioEnd(callback) {
    if (typeof callback === "function") {
      this.onScenarioEnd = callback;
    }
  }
}

/***/ })

}]);
//# sourceMappingURL=src_managers_ChatScenarioManager_js.110f3ee6e1ef576800e4.js.map