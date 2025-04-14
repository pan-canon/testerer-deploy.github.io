// File: src/managers/GhostManager.js

import { ErrorManager } from './ErrorManager.js';
import { StateManager } from './StateManager.js';
import { loadGameEntitiesConfig } from '../utils/GameEntityLoader.js';
import { SequenceManager } from '../utils/SequenceManager.js';

/**
 * GhostManager class
 * 
 * Manages ghost state and coordinates sequence progression.
 * Responsibilities include:
 * - Maintaining ghost list and active ghost state.
 * - Handling ghost phenomena progression.
 * - Coordinating sequence progression upon event and quest completions.
 */
export class GhostManager {
  /**
   * @param {number} currentSequenceIndex - Starting index for the event–quest sequence (from StateManager).
   * @param {ProfileManager} profileManager - Manager for saving ghost progress.
   * @param {App} app - The main application instance.
   */
  constructor(currentSequenceIndex, profileManager, app) {
    // Set initial sequence index.
    this.currentSequenceIndex = currentSequenceIndex;
    this.profileManager = profileManager;
    this.app = app;

    // Retrieve the active quest key from StateManager.
    this.activeQuestKey = StateManager.get("activeQuestKey") || null;

    // Initialize ghost list.
    this.ghosts = [];
    this.setupGhosts();

    // Set the active ghost (default ID = 1).
    this.currentGhostId = 1;
    // Current phenomenon (quest step) index for the active ghost.
    this.currentPhenomenonIndex = 0;

    const currentGhost = this.getCurrentGhost();
    console.log(`Current active ghost: ${currentGhost ? currentGhost.name : 'not found'}`);

    // Load the unified configuration and initialize the sequence manager.
    loadGameEntitiesConfig()
      .then(config => {
        this.sequenceManager = new SequenceManager(config.sequence);
        const savedIndex = parseInt(StateManager.get(StateManager.KEYS.CURRENT_SEQUENCE_INDEX), 10) || 0;
        this.sequenceManager.currentIndex = savedIndex;
        console.log(`Sequence configuration loaded. Current index: ${this.sequenceManager.currentIndex}`);

        // Auto-launch the initial event if registration is complete and the welcome event has not been executed.
        if (StateManager.get("registrationCompleted") === "true" && StateManager.get("welcomeDone") !== "true") {
          const firstEntry = this.sequenceManager.getCurrentEntry();
          if (firstEntry) {
            console.log(`Auto-launching initial event: ${firstEntry.eventKey}`);
            this.app.gameEventManager.activateEvent(firstEntry.eventKey);
            // Save the active quest key using the unified mechanism.
            this.activeQuestKey = firstEntry.questKey;
            StateManager.set("activeQuestKey", this.activeQuestKey);
          }
        }
      })
      .catch(error => {
        console.error("Error loading unified configuration:", error);
      });

    // Subscribe to global events for event and quest completions.
    document.addEventListener("gameEventCompleted", (e) => {
      this.onEventCompleted(e.detail);
    });
    document.addEventListener("questCompleted", (e) => {
      this.onQuestCompleted(e.detail);
    });
  }

  /**
   * Generates the list of ghosts.
   * Current implementation creates only the default ghost.
   */
  setupGhosts() {
    const defaultGhost = {
      id: 1,
      name: "ghost 1",
      phenomenaCount: 3,
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
      await this.app.gameEventManager.eventManager.addDiaryEntry(phenomenonEntry);
      console.log(`Triggered phenomenon for ${ghost.name}: ${phenomenonEntry}`);
      this.currentPhenomenonIndex++;
      await this.profileManager.saveGhostProgress({
        ghostId: this.currentGhostId,
        phenomenonIndex: this.currentPhenomenonIndex
      });
      if (this.currentPhenomenonIndex === ghost.phenomenaCount) {
        const finalEntry = `${ghost.name}: Final phenomenon – ghost finished!`;
        await this.app.gameEventManager.eventManager.addDiaryEntry(finalEntry);
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
   * Handles post-quest operations including triggering subsequent events and delegating UI updates.
   * @param {string} questKey - The completed quest key.
   */
  async onQuestCompleted(questKey) {
    console.log(`GhostManager: Quest completed with key: ${questKey}`);
    // Clear the active quest key.
    this.activeQuestKey = null;
    StateManager.remove("activeQuestKey");

    // Handle repeating quest logic.
    if (questKey === "repeating_quest") {
      const repeatingQuest = this.app.questManager.quests.find(q => q.key === "repeating_quest");
      const questStatus = repeatingQuest ? await repeatingQuest.getCurrentQuestStatus() : { finished: false, currentStage: 1 };
      console.log("Repeating quest status:", questStatus);
      if (!questStatus.finished) {
        const dynamicEventKey = `post_repeating_event_stage_${questStatus.currentStage}`;
        console.log(`Repeating quest stage completed. Triggering ghost event: ${dynamicEventKey}`);
        await this.app.gameEventManager.activateEvent(dynamicEventKey, true);
        return;
      } else {
        console.log("Repeating quest fully completed. Now starting ghost event: final_event");
        await this.app.gameEventManager.activateEvent("final_event", true);
        this.sequenceManager.increment();
        StateManager.set(StateManager.KEYS.CURRENT_SEQUENCE_INDEX, String(this.sequenceManager.currentIndex));
        return;
      }
    }

    const currentEntry = this.sequenceManager ? this.sequenceManager.getCurrentEntry() : null;
    if (currentEntry && currentEntry.questKey === questKey && currentEntry.nextEventKey) {
      console.log(`GhostManager: Quest completed. Now starting ghost event: ${currentEntry.nextEventKey}`);
      await this.app.gameEventManager.activateEvent(currentEntry.nextEventKey, true);
    }

    // Delegate UI state synchronization to QuestManager.
    if (this.app.questManager && typeof this.app.questManager.syncQuestState === 'function') {
      await this.app.questManager.syncQuestState();
    }
    // Deactivate the camera button since the quest is finished.
    if (this.app.viewManager && typeof this.app.viewManager.setCameraButtonActive === 'function') {
      this.app.viewManager.setCameraButtonActive(false);
    }
  }
}