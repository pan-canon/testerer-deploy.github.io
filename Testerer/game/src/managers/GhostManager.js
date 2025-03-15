// File: src/managers/GhostManager.js

// --- Error and State Management ---
import { ErrorManager } from './ErrorManager.js';
import { StateManager } from './StateManager.js';
// Import the sequence configuration loader from utils
import { loadSequenceConfig } from '../utils/SequenceManager.js';

/**
 * GhostManager class
 * 
 * Manages the list of ghosts and their state. Responsibilities include:
 * - Maintaining the active ghost and tracking its phenomenon (quest step) progress.
 * - Saving the ghost state via DatabaseManager.
 * - Triggering events (e.g., final event) via GameEventManager.
 *
 * NEW CHANGES:
 * - The event-quest sequence is loaded from an external JSON configuration via SequenceManager.
 * - The active quest key is stored persistently using StateManager.
 * - A unified method 'canStartQuest' is provided to ensure that a quest cannot be started if:
 *    1) A non-finished record for the quest exists in the database.
 *    2) There is already an active quest registered.
 *    3) The quest key does not match the expected next quest in the sequence.
 * - Auto-launch of the first event (e.g., "welcome") is performed if registration is completed.
 */
export class GhostManager {
  /**
   * @param {number} currentSequenceIndex - Starting index for the event-quest sequence (from StateManager).
   * @param {ProfileManager} profileManager - Manager for saving profile/ghost progress.
   * @param {App} app - The main application instance.
   */
  constructor(currentSequenceIndex, profileManager, app) {
    // Set initial sequence index (will be updated after loading config)
    this.currentSequenceIndex = currentSequenceIndex;
    this.profileManager = profileManager;
    this.app = app;

    // In-memory flag for active quest key (persistent value in StateManager)
    this.activeQuestKey = StateManager.get("activeQuestKey") || null;
    this.questActive = !!this.activeQuestKey; // true if an active quest key is stored

    // eventManager will be assigned externally (see App.js)
    this.eventManager = null;

    // Initialize ghost list with only the default ghost.
    this.ghosts = [];
    this.setupGhosts();

    // Set the active ghost (default ID = 1)
    this.currentGhostId = 1;
    // Index of the current phenomenon (quest step) for the active ghost.
    this.currentPhenomenonIndex = 0;

    const currentGhost = this.getCurrentGhost();
    console.log(`Current active ghost: ${currentGhost ? currentGhost.name : 'not found'}`);

    // Load the event-quest sequence configuration from JSON via SequenceManager.
    loadSequenceConfig()
      .then(sequenceManager => {
        this.sequenceManager = sequenceManager;
        // Restore saved sequence index from StateManager (if any)
        const savedIndex = parseInt(StateManager.get(StateManager.KEYS.CURRENT_SEQUENCE_INDEX), 10) || 0;
        this.sequenceManager.currentIndex = savedIndex;
        console.log(`Sequence configuration loaded. Current index: ${this.sequenceManager.currentIndex}`);

        // Auto-launch the first event if registration is complete and welcome event is not done.
        if (StateManager.get("registrationCompleted") === "true" && StateManager.get("welcomeDone") !== "true") {
          const firstEntry = this.sequenceManager.getCurrentEntry();
          if (firstEntry) {
            console.log(`Auto-launching initial event: ${firstEntry.eventKey}`);
            this.eventManager.activateEvent(firstEntry.eventKey);
            // Save the active quest key
            this.activeQuestKey = firstEntry.questKey;
            StateManager.set("activeQuestKey", this.activeQuestKey);
          }
        }
      })
      .catch(error => {
        console.error("Error loading sequence configuration:", error);
      });

    // Subscribe to global events for completions.
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
    const defaultGhost = {
      id: 1,
      name: "призрак 1", // Default ghost name.
      phenomenaCount: 3, // Fixed number of phenomena (quest steps).
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
   * Sets the active ghost by its ID and saves its state.
   * @param {number} ghostId - The ID of the ghost to activate.
   */
  async setCurrentGhost(ghostId) {
    this.currentGhostId = ghostId;
    const ghost = this.getCurrentGhost();
    if (ghost) {
      console.log(`Ghost ${ghost.name} activated.`);
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
   * Checks if the current ghost is finished.
   * @returns {boolean} True if finished; otherwise, false.
   */
  isCurrentGhostFinished() {
    const ghost = this.getCurrentGhost();
    return ghost ? ghost.isFinished : false;
  }

  /**
   * triggerNextPhenomenon
   * Initiates the next phenomenon (quest step) for the current ghost.
   * If the phenomenon index is less than the total count, adds a diary entry and updates progress.
   * If all phenomena are completed, logs a final diary entry and triggers the final event.
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
      await this.profileManager.saveGhostProgress({
        ghostId: this.currentGhostId,
        phenomenonIndex: this.currentPhenomenonIndex
      });
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
   * Resets the ghost chain: sets active ghost to default, resets phenomenon index,
   * resets ghost progress, and updates the database.
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

  // --------------- New API: Sequential Event and Quest Management ---------------

  /**
   * isNextInSequence
   * Checks if the provided quest key matches the expected quest
   * from the loaded sequence configuration.
   * @param {string} questKey - The quest key to check.
   * @returns {boolean} True if it matches the expected quest; otherwise, false.
   */
  isNextInSequence(questKey) {
    return this.sequenceManager ? this.sequenceManager.isNextQuest(questKey) : false;
  }

  /**
   * isNextEvent
   * Checks if the provided event key matches the expected event
   * from the loaded sequence configuration.
   * @param {string} eventKey - The event key to check.
   * @returns {boolean} True if it matches the expected event; otherwise, false.
   */
  isNextEvent(eventKey) {
    return this.sequenceManager ? this.sequenceManager.isNextEvent(eventKey) : false;
  }

  /**
   * canStartQuest - Unified method to determine if a quest can be started.
   *
   * For the repeating quest, we allow starting only if there is no record with status "active".
   * A record with status "inactive" indicates a previous stage is complete and the quest can be reactivated.
   *
   * @param {string} questKey - The key of the quest to be started.
   * @returns {boolean} True if the quest can be launched, false otherwise.
   */
  canStartQuest(questKey) {
    const record = this.app.databaseManager.getQuestRecord(questKey);
    if (questKey === "repeating_quest") {
      if (record && record.status === "active") {
        console.warn(`Repeating quest "${questKey}" is already active.`);
        return false;
      }
      // For repeating quest, a record with status "inactive" (or no record) is allowed.
    } else {
      if (record && record.status !== "finished") {
        console.warn(`Quest "${questKey}" is already active with status "${record.status}".`);
        return false;
      }
    }
    const activeQuestKey = StateManager.get("activeQuestKey");
    if (activeQuestKey) {
      console.warn(`Another quest "${activeQuestKey}" is already active, cannot start quest "${questKey}".`);
      return false;
    }
    if (!this.isNextInSequence(questKey)) {
      console.error(`Quest "${questKey}" is not the next expected quest in the sequence.`);
      return false;
    }
    return true;
  }

  /**
   * startQuest
   * Starts a quest after verifying that it can be launched using the unified check.
   * For the repeating quest, we skip the redundant check inside this method because it is already handled.
   *
   * @param {string} questKey - The quest key to start.
   */
  async startQuest(questKey) {
    // For non-repeating quests, perform the unified check.
    if (questKey !== "repeating_quest" && !this.canStartQuest(questKey)) {
      console.error(`Cannot start quest with key: ${questKey}. Unified check failed.`);
      return;
    }
    console.log(`GhostManager: Starting quest with key: ${questKey}`);
    await this.app.questManager.activateQuest(questKey);
    this.activeQuestKey = questKey;
    StateManager.set("activeQuestKey", questKey);
    await this.app.questManager.syncQuestState();
  }

  /**
   * startEvent
   * Starts an event.
   *
   * @param {string} eventKey - The event key to start.
   * @param {boolean} [isFollowup=false] - If true, bypass the sequence check.
   */
  async startEvent(eventKey, isFollowup = false) {
    if (!isFollowup && !this.isNextEvent(eventKey)) {
      console.error(`Event "${eventKey}" is not next in sequence.`);
      return;
    }
    console.log(`GhostManager: Starting event with key: ${eventKey}`);
    await this.app.gameEventManager.activateEvent(eventKey);
  }

  /**
   * handlePostButtonClick
   * Called when the "Post" button is clicked.
   * Retrieves the next sequence entry and uses the unified check to determine if the quest can be started.
   * For the repeating quest, if the DB record is "inactive", it updates it to "active" before activation.
   */
  async handlePostButtonClick() {
    // Immediately disable the "Post" button to prevent repeated clicks.
    this.app.viewManager.setPostButtonEnabled(false);

    const nextEntry = this.sequenceManager ? this.sequenceManager.getCurrentEntry() : null;
    if (!nextEntry) {
      console.warn("No next sequence entry found.");
      return;
    }
    console.log(`GhostManager: Handling Post button click. Next expected quest: ${nextEntry.questKey}`);

    if (!this.canStartQuest(nextEntry.questKey)) {
      return;
    }
    // For repeating quest, if record is "inactive", update it to "active"
    if (nextEntry.questKey === "repeating_quest") {
      const record = this.app.databaseManager.getQuestRecord("repeating_quest");
      if (record && record.status === "inactive") {
        console.log("Re-activating repeating quest from inactive state.");
        record.status = "active";
        await this.app.databaseManager.saveQuestRecord(record);
      }
    }
    await this.startQuest(nextEntry.questKey);
  }

  /**
   * onEventCompleted
   * Called when a game event completes.
   * If the completed event matches the expected event in the sequence, increments the sequence index.
   *
   * @param {string} eventKey - The completed event key.
   */
  onEventCompleted(eventKey) {
    console.log(`GhostManager: Event completed with key: ${eventKey}`);
    if (this.sequenceManager && this.sequenceManager.getCurrentEntry().nextEventKey === eventKey) {
      this.sequenceManager.increment();
      StateManager.set(StateManager.KEYS.CURRENT_SEQUENCE_INDEX, String(this.sequenceManager.currentIndex));
      console.log(`GhostManager: Sequence index incremented to ${this.sequenceManager.currentIndex}`);
    }
  }

  /**
   * onQuestCompleted
   * Called when a quest completes.
   * For the repeating quest, if the DB record is active and the quest was activated,
   * triggers the dynamic event for the current stage; if the quest is finished, triggers the final event.
   *
   * @param {string} questKey - The completed quest key.
   */
  async onQuestCompleted(questKey) {
    console.log(`GhostManager: Quest completed with key: ${questKey}`);
    // Clear the active quest key.
    this.activeQuestKey = null;
    StateManager.remove("activeQuestKey");

    if (questKey === "repeating_quest") {
      const repeatingQuest = this.app.questManager.quests.find(q => q.key === "repeating_quest");
      const questStatus = repeatingQuest
        ? await repeatingQuest.getCurrentQuestStatus()
        : { finished: false, currentStage: 1, dbStatus: "not recorded" };

      console.log("Repeating quest status:", questStatus);

      // For repeating quest, trigger dynamic event if DB record is "active" and quest was activated via POST.
      if (questStatus.dbStatus === "active" && !questStatus.finished && repeatingQuest.activated) {
        const dynamicEventKey = `post_repeating_event_stage_${questStatus.currentStage}`;
        console.log(`Repeating quest stage completed. Triggering ghost event: ${dynamicEventKey} without sequence increment.`);
        await this.startEvent(dynamicEventKey, true);
        return;
      } else if (!questStatus.finished) {
        console.log("Repeating quest is not truly active (or not activated); skipping dynamic event for this stage.");
        return;
      } else {
        console.log("Repeating quest fully completed. Now starting ghost event: final_event");
        await this.startEvent("final_event", true);
        this.sequenceManager.increment();
        StateManager.set(StateManager.KEYS.CURRENT_SEQUENCE_INDEX, String(this.sequenceManager.currentIndex));
        return;
      }
    }

    const currentEntry = this.sequenceManager ? this.sequenceManager.getCurrentEntry() : null;
    if (currentEntry && currentEntry.questKey === questKey && currentEntry.nextEventKey) {
      console.log(`GhostManager: Quest completed. Now starting ghost event: ${currentEntry.nextEventKey}`);
      await this.startEvent(currentEntry.nextEventKey, true);
    }
  }
}