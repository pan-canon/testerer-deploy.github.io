// --- Error and State Management ---
import { ErrorManager } from './errorManager.js';
import { StateManager } from './stateManager.js';

/**
 * GhostManager class
 * Manages the list of ghosts and their state. It is responsible for:
 * - Maintaining the active ghost and tracking the progress of its phenomena (quest steps).
 * - Saving the ghost's state via DatabaseManager.
 * - Triggering events (e.g., final event) via GameEventManager.
 *
 * CURRENT CHANGE: The ghost list is simplified to contain only the default ghost.
 * NEW CHANGE: Added API for sequential management of events and quests.
 */
export class GhostManager {
  /**
   * @param {number} currentSequenceIndex - The starting index for the event-quest sequence (restored from StateManager).
   * @param {ProfileManager} profileManager - Manager for saving profile/ghost progress.
   * @param {App} app - The main application instance.
   */
  constructor(currentSequenceIndex, profileManager, app) {
    // New property: current sequence index for event-quest chain.
    this.currentSequenceIndex = currentSequenceIndex;
    this.profileManager = profileManager;
    this.app = app;

    // eventManager will be assigned externally (see App.js)
    this.eventManager = null;

    // Initialize ghost list with only the default ghost.
    this.ghosts = [];
    this.setupGhosts();

    // Set the initial active ghost (ID = 1).
    this.currentGhostId = 1;

    // Index of the current phenomenon (quest step) for the active ghost.
    this.currentPhenomenonIndex = 0;

    const currentGhost = this.getCurrentGhost();
    console.log(`Current active ghost: ${currentGhost ? currentGhost.name : 'not found'}`);

    // Initialize Event-Quest sequence configuration.
    // Each entry defines a chain: { eventKey, questKey, nextEventKey }
    // Example: event "welcome" launches quest "mirror_quest", after which "post_repeating_event" is triggered, etc.
    this.eventQuestSequenceList = [
      { eventKey: "welcome", questKey: "mirror_quest", nextEventKey: "post_repeating_event" },
      { eventKey: "post_repeating_event", questKey: "repeating_quest", nextEventKey: "final_event" },
      { eventKey: "final_event", questKey: "final_quest", nextEventKey: null }
    ];

    // Subscribe to global events for completions.
    // It is assumed that GameEventManager and QuestManager dispatch "gameEventCompleted" and "questCompleted" events with detail = key.
    document.addEventListener("gameEventCompleted", (e) => {
      this.onEventCompleted(e.detail);
    });
    document.addEventListener("questCompleted", (e) => {
      this.onQuestCompleted(e.detail);
    });
  }

  /**
   * setupGhosts
   * Generates the list of ghosts.
   * CURRENT CHANGE: Only the default ghost is created.
   */
  setupGhosts() {
    // Create a default ghost with ID 1.
    const defaultGhost = {
      id: 1,
      name: "призрак 1", // Default ghost name.
      phenomenaCount: 3, // Fixed default number of phenomena (quest steps).
      isFinished: false
    };
    this.ghosts = [defaultGhost];
  }

  /**
   * getCurrentGhost
   * Returns the active ghost object based on currentGhostId.
   * @returns {object|undefined} The ghost object, or undefined if not found.
   */
  getCurrentGhost() {
    return this.ghosts.find(g => g.id === this.currentGhostId);
  }

  /**
   * setCurrentGhost
   * Sets the active ghost by the given ID and saves its state via DatabaseManager.
   * @param {number} ghostId - The ID of the ghost to activate.
   */
  async setCurrentGhost(ghostId) {
    this.currentGhostId = ghostId;
    const ghost = this.getCurrentGhost();
    if (ghost) {
      console.log(`Ghost ${ghost.name} activated.`);
      // Save ghost state using the DatabaseManager.
      await this.app.databaseManager.saveGhostState(ghost);
    } else {
      ErrorManager.logError(`Ghost with ID=${ghostId} not found!`, "setCurrentGhost");
    }
  }

  /**
   * finishCurrentGhost
   * Marks the current ghost as finished and saves its state.
   */
  async finishCurrentGhost() {
    const ghost = this.getCurrentGhost();
    if (ghost) {
      ghost.isFinished = true;
      console.log(`Ghost ${ghost.name} finished.`);
      await this.app.databaseManager.saveGhostState(ghost);
    } else {
      ErrorManager.logError("Cannot finish ghost: ghost not found.", "finishCurrentGhost");
    }
  }

  /**
   * isCurrentGhostFinished
   * Checks whether the current active ghost is marked as finished.
   * @returns {boolean} True if finished, otherwise false.
   */
  isCurrentGhostFinished() {
    const ghost = this.getCurrentGhost();
    return ghost ? ghost.isFinished : false;
  }

  /**
   * triggerNextPhenomenon
   * Initiates the next phenomenon (quest step) for the current ghost.
   * - If the phenomenon index is less than the total phenomena for the ghost, a diary entry is added
   *   and the progress is updated via ProfileManager.
   * - If all phenomena are completed, a final diary entry is logged and the final event is triggered.
   */
  async triggerNextPhenomenon() {
    const ghost = this.getCurrentGhost();
    if (!ghost) {
      ErrorManager.logError("No ghost found to trigger phenomenon.", "triggerNextPhenomenon");
      return;
    }

    if (ghost.isFinished) {
      ErrorManager.logError(`Ghost "${ghost.name}" is already finished; phenomena unavailable.`, "triggerNextPhenomenon");
      return;
    }

    if (this.currentPhenomenonIndex < ghost.phenomenaCount) {
      const phenomenonNumber = this.currentPhenomenonIndex + 1;
      const phenomenonEntry = `${ghost.name}: Phenomenon ${phenomenonNumber} - Approach the mirror`;
      await this.eventManager.addDiaryEntry(phenomenonEntry);
      console.log(`Triggered phenomenon for ${ghost.name}: ${phenomenonEntry}`);

      this.currentPhenomenonIndex++;

      // Save ghost progress via ProfileManager.
      await this.profileManager.saveGhostProgress({
        ghostId: this.currentGhostId,
        phenomenonIndex: this.currentPhenomenonIndex
      });

      // If all phenomena are completed, log the final entry and trigger the final event.
      if (this.currentPhenomenonIndex === ghost.phenomenaCount) {
        const finalEntry = `${ghost.name}: Final phenomenon – ghost finished!`;
        await this.eventManager.addDiaryEntry(finalEntry);
        console.log(finalEntry);

        console.log(`Triggering final event for ghost "${ghost.name}"...`);
        await this.app.gameEventManager.activateEvent("ghost_final_event");
      }
    } else {
      ErrorManager.logError(`All phenomena for ghost ${ghost.name} have been completed (index=${this.currentPhenomenonIndex}).`, "triggerNextPhenomenon");
    }
  }

  /**
   * resetGhostChain
   * Resets the ghost chain:
   * - Sets the active ghost back to the default.
   * - Resets the phenomenon index.
   * - Resets the saved ghost progress via ProfileManager.
   * - Updates the database with the reset state.
   */
  async resetGhostChain() {
    this.currentGhostId = 1;
    this.currentPhenomenonIndex = 0;
    await this.profileManager.resetGhostProgress();
    console.log("Ghost chain has been reset.");
    const ghost = this.getCurrentGhost();
    if (ghost) {
      ghost.isFinished = false;
      await this.app.databaseManager.saveGhostState(ghost);
    } else {
      ErrorManager.logError("Failed to reset ghost chain: default ghost not found.", "resetGhostChain");
    }
  }

  // ------------------ New API for Sequential Event and Quest Management ------------------

  /**
   * isNextInSequence - Checks if the given questKey matches the next expected quest in the sequence.
   * @param {string} questKey - The key of the quest to check.
   * @returns {boolean} True if the questKey matches the expected quest, false otherwise.
   */
  isNextInSequence(questKey) {
    const nextEntry = this.eventQuestSequenceList[this.currentSequenceIndex];
    return nextEntry && nextEntry.questKey === questKey;
  }

  /**
   * isNextEvent - Checks if the given eventKey matches the next expected event in the sequence.
   * @param {string} eventKey - The key of the event to check.
   * @returns {boolean} True if the eventKey matches the expected event, false otherwise.
   */
  isNextEvent(eventKey) {
    const nextEntry = this.eventQuestSequenceList[this.currentSequenceIndex];
    return nextEntry && nextEntry.eventKey === eventKey;
  }

  /**
   * startQuest - Starts a quest after checking if it is the next expected quest.
   * Calls QuestManager.activateQuest and updates the sequence index on success.
   * @param {string} questKey - The key of the quest to start.
   */
  async startQuest(questKey) {
    if (!this.isNextInSequence(questKey)) {
      console.error(`Quest "${questKey}" is not next in sequence.`);
      return;
    }
    console.log(`GhostManager: Starting quest with key: ${questKey}`);
    await this.app.questManager.activateQuest(questKey);
    // Update the sequence index and save to StateManager.
    this.currentSequenceIndex++;
    StateManager.set(StateManager.KEYS.CURRENT_SEQUENCE_INDEX, String(this.currentSequenceIndex));
  }

  /**
   * startEvent - Starts an event after checking if it is the next expected event.
   * Calls GameEventManager.activateEvent.
   * @param {string} eventKey - The key of the event to start.
   */
  async startEvent(eventKey) {
    if (!this.isNextEvent(eventKey)) {
      console.error(`Event "${eventKey}" is not next in sequence.`);
      return;
    }
    console.log(`GhostManager: Starting event with key: ${eventKey}`);
    await this.app.gameEventManager.activateEvent(eventKey);
    // Optionally, update the sequence index here if needed.
  }

  /**
   * handlePostButtonClick - Handler for the "Post" button click.
   * Determines the next sequence element and starts the corresponding quest.
   * After quest activation, the QuestManager.syncQuestState() method will disable the button.
   */
  async handlePostButtonClick() {
    const nextEntry = this.eventQuestSequenceList[this.currentSequenceIndex];
    if (!nextEntry) {
      console.warn("No next sequence entry found.");
      return;
    }
    console.log(`GhostManager: Handling Post button click. Next expected quest: ${nextEntry.questKey}`);
    await this.startQuest(nextEntry.questKey);
  }

  /**
   * onEventCompleted - Handler called when a game event completes.
   * If the completed event matches the expected event, starts the corresponding quest.
   * @param {string} eventKey - The key of the completed event.
   */
  onEventCompleted(eventKey) {
    console.log(`GhostManager: Event completed with key: ${eventKey}`);
    const nextEntry = this.eventQuestSequenceList[this.currentSequenceIndex];
    if (nextEntry && nextEntry.eventKey === eventKey && nextEntry.questKey) {
      this.startQuest(nextEntry.questKey);
    }
  }

  /**
   * onQuestCompleted - Handler called when a quest completes.
   * If the completed quest matches the expected quest and there is a next event,
   * starts the next event.
   * @param {string} questKey - The key of the completed quest.
   */
  onQuestCompleted(questKey) {
    console.log(`GhostManager: Quest completed with key: ${questKey}`);
    const nextEntry = this.eventQuestSequenceList[this.currentSequenceIndex];
    if (nextEntry && nextEntry.questKey === questKey && nextEntry.nextEventKey) {
      this.startEvent(nextEntry.nextEventKey);
    }
  }
}