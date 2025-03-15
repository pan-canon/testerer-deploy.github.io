// --- Error and State Management ---
import { ErrorManager } from './ErrorManager.js';
import { StateManager } from './StateManager.js';

/**
 * GhostManager class
 * Manages the list of ghosts and their state. It is responsible for:
 * - Maintaining the active ghost and tracking the progress of its phenomena (quest steps).
 * - Saving the ghost's state via DatabaseManager.
 * - Triggering events (e.g., final event) via GameEventManager.
 *
 * CURRENT CHANGE: The ghost list is simplified to contain only the default ghost.
 * NEW CHANGE: Added API for sequential management of events and quests.
 *            Sequence now ensures that a ghost event is triggered before its corresponding quest starts.
 */
export class GhostManager {
  /**
   * @param {number} currentSequenceIndex - The starting index for the event-quest sequence (restored from StateManager).
   * @param {ProfileManager} profileManager - Manager for saving profile/ghost progress.
   * @param {App} app - The main application instance.
   */
  constructor(currentSequenceIndex, profileManager, app) {
    // Current sequence index for event-quest chain.
    this.currentSequenceIndex = currentSequenceIndex;
    this.profileManager = profileManager;
    this.app = app;

    // Tracks whether a quest is currently active.
    this.questActive = false;

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
    // Example: event "welcome" launches quest "mirror_quest",
    // after which "post_repeating_event" is triggered, etc.
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
    // Reset ghost progress stored in the profile.
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
   * Note: For follow-up ghost events (triggered from quest completions), this check is bypassed.
   *
   * @param {string} eventKey - The key of the event to check.
   * @returns {boolean} True if the eventKey matches the expected event, false otherwise.
   */
  isNextEvent(eventKey) {
    const nextEntry = this.eventQuestSequenceList[this.currentSequenceIndex];
    return nextEntry && nextEntry.eventKey === eventKey;
  }

  /**
   * startQuest - Starts a quest after checking if it is the next expected quest.
   * Calls QuestManager.activateQuest.
   * 
   * IMPORTANT: The sequence index is NOT incremented here.
   * The increment will occur after the corresponding ghost event is successfully completed.
   *
   * @param {string} questKey - The key of the quest to start.
   */
  async startQuest(questKey) {
    // Check both in-memory flag and persistent flag.
    if (this.questActive || StateManager.get("questActive") === "true") {
      console.error("Quest already launched. Cannot start a new quest.");
      return;
    }
    if (!this.isNextInSequence(questKey)) {
      console.error(`Quest "${questKey}" is not next in sequence.`);
      return;
    }
    console.log(`GhostManager: Starting quest with key: ${questKey}`);
    await this.app.questManager.activateQuest(questKey);
    // Mark quest as active in-memory and persist it.
    this.questActive = true;
    StateManager.set("questActive", "true");
  }

  /**
   * startEvent - Starts an event.
   * If the event is being triggered as a follow-up ghost event, bypass the normal check.
   *
   * @param {string} eventKey - The key of the event to start.
   * @param {boolean} [isFollowup=false] - Indicates if this is a ghost event triggered after a quest.
   */
  async startEvent(eventKey, isFollowup = false) {
    if (!isFollowup && !this.isNextEvent(eventKey)) {
      console.error(`Event "${eventKey}" is not next in sequence.`);
      return;
    }
    console.log(`GhostManager: Starting event with key: ${eventKey}`);
    await this.app.gameEventManager.activateEvent(eventKey);
    // No change to questActive flag here.
  }

  /**
   * handlePostButtonClick - Handler for the "Post" button click.
   * If no quest is currently active, it uses the sequence to launch the next quest.
   */
  async handlePostButtonClick() {
    if (this.questActive) {
      console.error("Quest already launched. Please wait until the current quest completes.");
      return;
    }
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
   * 
   * IMPORTANT: After a ghost event completes, we increment the sequence index.
   *
   * @param {string} eventKey - The key of the completed event.
   */
  onEventCompleted(eventKey) {
    console.log(`GhostManager: Event completed with key: ${eventKey}`);
    const currentEntry = this.eventQuestSequenceList[this.currentSequenceIndex];
    if (currentEntry && currentEntry.nextEventKey === eventKey) {
      // Ghost event completed successfully; now increment the sequence index.
      this.currentSequenceIndex++;
      StateManager.set(StateManager.KEYS.CURRENT_SEQUENCE_INDEX, String(this.currentSequenceIndex));
      console.log(`GhostManager: Sequence index incremented to ${this.currentSequenceIndex}`);
    }
    // Do not automatically trigger quest activation here.
  }

  /**
   * onQuestCompleted - Handler called when a quest completes.
   * 
   * For a repeating quest (questKey "repeating_quest"):
   * - If the repeating quest is not finished (more stages remain), trigger a unique ghost event:
   *   "post_repeating_event_stage_X", where X is the current stage.
   * - If the repeating quest is finished, trigger the ghost event "final_event" and then increment the sequence index.
   *
   * For non-repeating quests, trigger the ghost event from the current sequence entry.
   *
   * @param {string} questKey - The key of the completed quest.
   */
  async onQuestCompleted(questKey) {
    console.log(`GhostManager: Quest completed with key: ${questKey}`);
    // Reset the quest active flag both in-memory and persistent storage.
    this.questActive = false;
    StateManager.remove("questActive");
    
    // Existing logic for repeating quests and triggering next ghost event:
    if (questKey === "repeating_quest") {
      const repeatingQuest = this.app.questManager.quests.find(q => q.key === "repeating_quest");
      const questStatus = repeatingQuest ? await repeatingQuest.getCurrentQuestStatus() : { finished: false, currentStage: 1 };
      console.log("Repeating quest status:", questStatus);
      if (!questStatus.finished) {
        const dynamicEventKey = `post_repeating_event_stage_${questStatus.currentStage}`;
        console.log(`Repeating quest stage completed. Triggering ghost event: ${dynamicEventKey} without sequence increment.`);
        await this.startEvent(dynamicEventKey, true);
        return;
      } else {
        console.log("Repeating quest fully completed. Now starting ghost event: final_event");
        await this.startEvent("final_event", true);
        this.currentSequenceIndex++;
        StateManager.set(StateManager.KEYS.CURRENT_SEQUENCE_INDEX, String(this.currentSequenceIndex));
        return;
      }
    }
    
    const currentEntry = this.eventQuestSequenceList[this.currentSequenceIndex];
    if (currentEntry && currentEntry.questKey === questKey && currentEntry.nextEventKey) {
      console.log(`GhostManager: Quest completed. Now starting ghost event: ${currentEntry.nextEventKey}`);
      await this.startEvent(currentEntry.nextEventKey, true);
    }
  }
}