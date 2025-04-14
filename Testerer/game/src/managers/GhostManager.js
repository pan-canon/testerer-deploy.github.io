// File: src/managers/GhostManager.js

import { ErrorManager } from './ErrorManager.js';
import { StateManager } from './StateManager.js';
import { loadGameEntitiesConfig } from '../utils/GameEntityLoader.js';
import { SequenceManager } from '../utils/SequenceManager.js';

/**
 * GhostManager class
 * 
 * Manages the list of ghosts and their state. Responsibilities include:
 * - Maintaining the active ghost and tracking its phenomenon (quest step) progress.
 * - Saving ghost state via DatabaseManager.
 * - Triggering events (e.g., final event) via GameEventManager.
 *
 * NEW CHANGES:
 * - The event–quest sequence is now loaded from a unified JSON configuration.
 * - The active quest key is stored persistently using StateManager.
 * - A unified method 'canStartQuest' is provided to check if a quest can start:
 *    1. A non-finished quest record does not exist.
 *    2. There is no active quest registered in the StateManager.
 *    3. The quest key matches the expected next quest in the sequence.
 * - Auto-launch of the first event (e.g., "welcome") is performed if registration is complete.
 * - Dynamic update of the Post button state added via updatePostButtonState():
 *    the button is enabled only if no quest is active.
 * - **New:** On starting a quest the camera button is set to active,
 *   and upon quest completion the active state (class) is removed.
 */
export class GhostManager {
  /**
   * @param {number} currentSequenceIndex - Starting index for the event–quest sequence (from StateManager).
   * @param {ProfileManager} profileManager - Manager for saving ghost progress.
   * @param {App} app - The main application instance.
   */
  constructor(currentSequenceIndex, profileManager, app) {
    // Set initial sequence index (will be updated after loading config).
    this.currentSequenceIndex = currentSequenceIndex;
    this.profileManager = profileManager;
    this.app = app;

    // In-memory flag for the active quest key (persisted in StateManager).
    this.activeQuestKey = StateManager.get("activeQuestKey") || null;
    this.questActive = !!this.activeQuestKey; // true if an active quest key is stored.

    // eventManager will be assigned externally (see App.js).
    this.eventManager = null;

    // Initialize ghost list with only the default ghost.
    this.ghosts = [];
    this.setupGhosts();

    // Set the active ghost (default ID = 1).
    this.currentGhostId = 1;
    // Current phenomenon (quest step) index for the active ghost.
    this.currentPhenomenonIndex = 0;

    const currentGhost = this.getCurrentGhost();
    console.log(`Current active ghost: ${currentGhost ? currentGhost.name : 'not found'}`);

    // Load the unified configuration and initialize the sequence manager from the "sequence" section.
    loadGameEntitiesConfig()
      .then(config => {
        this.sequenceManager = new SequenceManager(config.sequence);
        const savedIndex = parseInt(StateManager.get(StateManager.KEYS.CURRENT_SEQUENCE_INDEX), 10) || 0;
        this.sequenceManager.currentIndex = savedIndex;
        console.log(`Sequence configuration loaded. Current index: ${this.sequenceManager.currentIndex}`);

        // Auto-launch the first event if registration is complete and the welcome event has not been executed.
        if (StateManager.get("registrationCompleted") === "true" && StateManager.get("welcomeDone") !== "true") {
          const firstEntry = this.sequenceManager.getCurrentEntry();
          if (firstEntry) {
            console.log(`Auto-launching initial event: ${firstEntry.eventKey}`);
            this.eventManager.activateEvent(firstEntry.eventKey);
            // Save the active quest key using the universal mechanism.
            this.activeQuestKey = firstEntry.questKey;
            StateManager.set("activeQuestKey", this.activeQuestKey);
          }
        }
        // After loading configuration, update the Post button state.
        this.updatePostButtonState();
      })
      .catch(error => {
        console.error("Error loading unified configuration:", error);
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
   * Generates the list of ghosts.
   * CURRENT CHANGE: Only the default ghost is created.
   */
  setupGhosts() {
    const defaultGhost = {
      id: 1,
      name: "ghost 1", // Default ghost name.
      phenomenaCount: 3, // Fixed number of phenomena (quest steps).
      isFinished: false
    };
    this.ghosts = [defaultGhost];
  }

  /**
   * Returns the active ghost based on currentGhostId.
   * @returns {object|undefined} The ghost object, or undefined if not found.
   */
  getCurrentGhost() {
    return this.ghosts.find(g => g.id === this.currentGhostId);
  }

  /**
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
   * Checks if the current ghost is finished.
   * @returns {boolean} True if finished; otherwise, false.
   */
  isCurrentGhostFinished() {
    const ghost = this.getCurrentGhost();
    return ghost ? ghost.isFinished : false;
  }

  /**
   * Initiates the next phenomenon (quest step) for the current ghost.
   * Adds a diary entry and updates progress. If all steps are complete, triggers the final event.
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
   * Resets the ghost chain: sets active ghost to default, resets phenomenon index,
   * clears ghost progress, and updates the database.
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
   * Checks if the provided quest key matches the expected quest from the sequence configuration.
   * @param {string} questKey - The quest key to check.
   * @returns {boolean} True if it matches; otherwise, false.
   */
  isNextInSequence(questKey) {
    return this.sequenceManager ? this.sequenceManager.isNextQuest(questKey) : false;
  }

  /**
   * Checks if the provided event key matches the expected event from the sequence configuration.
   * @param {string} eventKey - The event key to check.
   * @returns {boolean} True if it matches; otherwise, false.
   */
  isNextEvent(eventKey) {
    return this.sequenceManager ? this.sequenceManager.isNextEvent(eventKey) : false;
  }

  /**
   * Determines if a quest can be started.
   * Checks that there is no active unfinished record in the database, no active quest in the StateManager,
   * and that the quest key is the next expected in the sequence.
   * @param {string} questKey - The quest key to start.
   * @returns {boolean} True if the quest can be launched; false otherwise.
   */
  canStartQuest(questKey) {
    // 1) Check for an existing unfinished quest record.
    const record = this.app.databaseManager.getQuestRecord(questKey);
    if (record && record.status !== "finished") {
      console.warn(`Quest "${questKey}" is already active with status "${record.status}".`);
      return false;
    }
    // 2) Check if an active quest is already recorded.
    const activeQuestKey = StateManager.get("activeQuestKey");
    // Block if an active quest exists and it does not match the quest we're trying to start.
    if (activeQuestKey && activeQuestKey !== questKey) {
      console.warn(`Another quest "${activeQuestKey}" is already active, cannot start quest "${questKey}".`);
      return false;
    }
    // 3) Check if this quest is the next expected in the sequence.
    if (!this.isNextInSequence(questKey)) {
      console.error(`Quest "${questKey}" is not the next expected quest in the sequence.`);
      return false;
    }
    return true;
  }

  /**
   * Starts a quest after verifying eligibility using the unified check.
   * @param {string} questKey - The quest key to start.
   */
  async startQuest(questKey) {
    if (!this.canStartQuest(questKey)) {
      console.error(`Cannot start quest with key: ${questKey}. Unified check failed.`);
      return;
    }
    console.log(`GhostManager: Starting quest with key: ${questKey}`);
    await this.app.questManager.activateQuest(questKey);
    // Update the active quest key universally.
    this.activeQuestKey = questKey;
    StateManager.set("activeQuestKey", questKey);
    await this.app.questManager.syncQuestState();
    // When a quest starts, mark the camera button as active.
    this.app.viewManager.setCameraButtonActive(true);
  }

  /**
   * Starts an event.
   * @param {string} eventKey - The event key to start.
   * @param {boolean} [isFollowup=false] - If true, bypasses the sequence check.
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
   * Updates the Post button state based on whether an active quest is present.
   * If an active quest exists, the button is disabled; otherwise, it is enabled.
   */
  updatePostButtonState() {
    const activeQuestKey = StateManager.get("activeQuestKey");
    // If active quest exists, disable the button; else, enable it.
    const isEnabled = !activeQuestKey;
    this.app.viewManager.setPostButtonEnabled(isEnabled);
    console.log(`[GhostManager] Post button state updated: enabled=${isEnabled}`);
  }

  /**
   * Handles the Post button click.
   * Immediately disables the button, retrieves the next sequence entry, and checks if the quest can be started.
   */
  async handlePostButtonClick() {
    // Disable the Post button immediately to prevent double-clicks.
    this.app.viewManager.setPostButtonEnabled(false);
    const nextEntry = this.sequenceManager ? this.sequenceManager.getCurrentEntry() : null;
    if (!nextEntry) {
      console.warn("No next sequence entry found.");
      this.updatePostButtonState();
      return;
    }
    console.log(`GhostManager: Handling Post button click. Next expected quest: ${nextEntry.questKey}`);
    if (!this.canStartQuest(nextEntry.questKey)) {
      this.updatePostButtonState();
      return;
    }
    await this.startQuest(nextEntry.questKey);
    // After starting the quest, update the Post button state.
    this.updatePostButtonState();
  }

  /**
   * Called when a game event completes.
   * Increments the sequence index if the completed event matches the expected next event.
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
   * Called when a quest completes.
   * For repeating quests, triggers a dynamic event for intermediate stages;
   * if the quest is fully completed, uses the final event key from the configuration.
   * For non-repeating quests, starts the next event as defined in the sequence.
   * @param {string} questKey - The completed quest key.
   */
  async onQuestCompleted(questKey) {
    console.log(`GhostManager: Quest completed with key: ${questKey}`);
    // Clear the active quest key.
    this.activeQuestKey = null;
    StateManager.remove("activeQuestKey");

    // Update the Post button state after quest completion.
    this.updatePostButtonState();
    // Deactivate the camera button since the quest is finished.
    this.app.viewManager.setCameraButtonActive(false);

    if (questKey === "repeating_quest") {
      const repeatingQuest = this.app.questManager.quests.find(q => q.key === "repeating_quest");
      const questStatus = repeatingQuest 
        ? await repeatingQuest.getCurrentQuestStatus() 
        : { currentStage: 1, totalStages: 1 };
      console.log("Repeating quest status:", questStatus);
      if (questStatus.currentStage < questStatus.totalStages) {
        // Intermediate stage: dynamically generate the event key.
        const dynamicEventKey = `post_repeating_event_stage_${questStatus.currentStage}`;
        console.log(`Repeating quest stage completed. Triggering generated event: ${dynamicEventKey}`);
        await this.startEvent(dynamicEventKey, true);
        return;
      } else {
        // Quest has reached its final stage: use the final event key from config.
        const currentEntry = this.sequenceManager ? this.sequenceManager.getCurrentEntry() : null;
        if (currentEntry && currentEntry.nextEventKey) {
          console.log(`Repeating quest fully completed. Now starting ghost event from config: ${currentEntry.nextEventKey}`);
          await this.startEvent(currentEntry.nextEventKey, true);
        } else {
          console.warn("No final event configured for repeating quest completion. Unable to start final event.");
        }
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