/**
 * ChatScenarioManager.js
 *
 * This module manages chat scenarios for the independent chat module.
 * It is responsible for loading dialogue configurations, tracking the current dialogue state,
 * and advancing the dialogue flow based on user choices.
 * It interacts with ChatManager to update the chat interface accordingly.
 */

export class ChatScenarioManager {
  /**
   * @param {ChatManager} chatManager - An instance of ChatManager that handles the chat UI.
   * @param {Object} scenarioConfig - (Optional) A JSON object representing the chat scenario.
   */
  constructor(chatManager, scenarioConfig = null) {
    this.chatManager = chatManager;
    this.scenarioConfig = scenarioConfig; // Scenario configuration data
    this.currentDialogueIndex = 0;
  }

  /**
   * Initializes the scenario manager.
   * If a scenario configuration is provided, it loads the first dialogue.
   */
  init() {
    if (this.scenarioConfig && Array.isArray(this.scenarioConfig.dialogues) && this.scenarioConfig.dialogues.length > 0) {
      this.currentDialogueIndex = 0;
      this.loadCurrentDialogue();
    } else {
      console.warn("No valid scenario configuration provided for ChatScenarioManager.");
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
    // Load the current dialogue into ChatManager
    this.chatManager.loadDialogue(dialogue);
  }

  /**
   * Advances the dialogue based on the user's choice.
   * @param {number} optionIndex - The index of the chosen option.
   */
  advanceDialogue(optionIndex) {
    const currentDialogue = this.scenarioConfig.dialogues[this.currentDialogueIndex];
    if (!currentDialogue || !Array.isArray(currentDialogue.options) || currentDialogue.options.length <= optionIndex) {
      console.error("Invalid option index.");
      return;
    }
    // Execute the onSelect function for the chosen option, if provided
    const selectedOption = currentDialogue.options[optionIndex];
    if (selectedOption && typeof selectedOption.onSelect === 'function') {
      selectedOption.onSelect();
    }
    // Advance to the next dialogue if nextDialogueIndex is defined
    if (selectedOption && typeof selectedOption.nextDialogueIndex === 'number') {
      this.currentDialogueIndex = selectedOption.nextDialogueIndex;
      this.loadCurrentDialogue();
    } else {
      console.log("No next dialogue defined; scenario may have ended or remains static.");
    }
  }

  /**
   * Sets a new scenario configuration and resets the dialogue index.
   * @param {Object} scenarioConfig - The new scenario configuration.
   */
  setScenario(scenarioConfig) {
    this.scenarioConfig = scenarioConfig;
    this.currentDialogueIndex = 0;
    this.loadCurrentDialogue();
  }
}