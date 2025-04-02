import { StateManager } from './StateManager.js';

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
    this.scenarioConfig = scenarioConfig; // Scenario configuration data
    this.currentDialogueIndex = 0;
    // Optional callback when the scenario ends.
    this.onScenarioEnd = null;
  }

  /**
   * Asynchronously initializes the scenario manager.
   * If no configuration is provided, fetch it from 'src/config/chatDialogueConfig.json'.
   */
  async init() {
    if (!this.scenarioConfig) {
      try {
        const response = await fetch('src/config/chatDialogueConfig.json');
        if (!response.ok) {
          throw new Error("Failed to load dialogue configuration from 'src/config/chatDialogueConfig.json'");
        }
        this.scenarioConfig = await response.json();
      } catch (error) {
        console.error("Error loading dialogue configuration:", error);
        return;
      }
    }
    // Check if conversation is already completed.
    if (StateManager.get('chat_conversation_completed') === 'true') {
      console.log("Chat conversation already completed, skipping dialogue initialization.");
      return;
    }
    // Restore current dialogue index if available; default to 0.
    const savedIndex = StateManager.get('chat_currentDialogueIndex');
    this.currentDialogueIndex = savedIndex !== null ? parseInt(savedIndex, 10) : 0;
    this.loadCurrentDialogue();
  }

  /**
   * Loads the current dialogue configuration and passes the dialogue to ChatManager to render.
   * Message saving is handled within ChatManager.loadDialogue() to avoid duplicate entries.
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
    // Render the dialogue. Saving of messages is now handled in ChatManager.loadDialogue().
    this.chatManager.loadDialogue(dialogue);
  }

  /**
   * Advances the dialogue based on the user's choice.
   *
   * If the selected option defines a nextDialogueIndex, advance accordingly.
   * Otherwise, mark conversation as completed so it won’t restart after reload.
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
      // Persist the updated dialogue index.
      StateManager.set('chat_currentDialogueIndex', this.currentDialogueIndex);
      this.loadCurrentDialogue();
    } else {
      console.log("No next dialogue defined; scenario may have ended.");
      // Mark conversation as completed and remove the saved dialogue index.
      StateManager.set('chat_conversation_completed', 'true');
      StateManager.remove('chat_currentDialogueIndex');
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
    StateManager.set('chat_currentDialogueIndex', this.currentDialogueIndex);
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