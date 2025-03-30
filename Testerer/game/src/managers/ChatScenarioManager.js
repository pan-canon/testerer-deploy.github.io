export class ChatScenarioManager {
  /**
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
  constructor(chatManager, scenarioConfig = null) {
    this.chatManager = chatManager;
    this.scenarioConfig = scenarioConfig; // Scenario configuration data (new format)
    this.currentDialogueIndex = 0;
    // Optional callback to be executed when the scenario ends.
    this.onScenarioEnd = null;
  }

  /**
   * Asynchronously initializes the scenario manager.
   * If no configuration is provided, it fetches the configuration from a default JSON file.
   */
  async init() {
    // If no configuration is provided, attempt to fetch it from the 'config' directory.
    if (!this.scenarioConfig) {
      try {
        const response = await fetch('src/config/chatDialogueConfig.json');
        if (!response.ok) {
          throw new Error("Failed to load dialogue configuration from 'config/chatDialogueConfig.json'");
        }
        this.scenarioConfig = await response.json();
      } catch (error) {
        console.error("Error loading dialogue configuration:", error);
        return;
      }
    }
    if (
      Array.isArray(this.scenarioConfig.dialogues) &&
      this.scenarioConfig.dialogues.length > 0
    ) {
      this.currentDialogueIndex = 0;
      this.loadCurrentDialogue();
    } else {
      console.warn("No valid dialogue configuration provided for ChatScenarioManager.");
    }
  }

  /**
   * Loads the current dialogue configuration and passes it to ChatManager to render.
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
    this.chatManager.loadDialogue(dialogue);
  }

  /**
   * Advances the dialogue based on the user's choice.
   *
   * If the selected option defines a nextDialogueIndex, the scenario advances accordingly.
   * Otherwise, the scenario is considered complete and the onScenarioEnd callback is invoked (if defined).
   *
   * @param {number} optionIndex - The index of the chosen option.
   */
  advanceDialogue(optionIndex) {
    const currentDialogue = this.scenarioConfig.dialogues[this.currentDialogueIndex];
    if (
      !currentDialogue ||
      !Array.isArray(currentDialogue.options) ||
      currentDialogue.options.length <= optionIndex
    ) {
      console.error("Invalid option index.");
      return;
    }
    const selectedOption = currentDialogue.options[optionIndex];
    if (selectedOption && typeof selectedOption.onSelect === "function") {
      selectedOption.onSelect();
    }
    if (selectedOption && typeof selectedOption.nextDialogueIndex === "number") {
      this.currentDialogueIndex = selectedOption.nextDialogueIndex;
      this.loadCurrentDialogue();
    } else {
      console.log("No next dialogue defined; scenario may have ended.");
      if (typeof this.onScenarioEnd === "function") {
        this.onScenarioEnd();
      }
    }
  }

  /**
   * Sets a new scenario configuration and resets the dialogue index.
   *
   * @param {Object} scenarioConfig - The new scenario configuration.
   */
  setScenario(scenarioConfig) {
    this.scenarioConfig = scenarioConfig;
    this.currentDialogueIndex = 0;
    this.loadCurrentDialogue();
  }

  /**
   * Registers a callback function to be called when the scenario ends.
   *
   * @param {Function} callback - The callback function.
   */
  setOnScenarioEnd(callback) {
    if (typeof callback === "function") {
      this.onScenarioEnd = callback;
    }
  }
}