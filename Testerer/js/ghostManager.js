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
 * NEW: Introduces eventSequence configuration to manage the flow of game events/quests.
 */
export class GhostManager {
  /**
   * @param {EventManager} eventManager - Manager for diary operations.
   * @param {ProfileManager} profileManager - Manager for saving profile/ghost progress.
   * @param {App} app - The main application instance.
   */
  constructor(eventManager, profileManager, app) {
    this.eventManager = eventManager;
    this.profileManager = profileManager;
    this.app = app;

    // Initialize ghost list with only the default ghost.
    this.ghosts = [];
    this.setupGhosts();

    // Set the initial active ghost (ID = 1).
    this.currentGhostId = 1;

    // Index of the current phenomenon (quest step) for the active ghost.
    this.currentPhenomenonIndex = 0;

    // NEW: Initialize event sequence configuration.
    // This configuration defines the overall flow of events/quests:
    // - welcome: Start of the welcome event.
    // - mirror: State of the mirror quest (not_started, in_progress, finished).
    // - repeating: State of the repeating event/quest.
    // - final: Final event flag.
    this.eventSequence = [
      { name: 'welcome', status: 'not_started' },
      { name: 'mirror', status: 'not_started' },
      { name: 'repeating', status: 'not_started' },
      { name: 'final', status: 'not_started' }
    ];
    // Optionally, persist initial sequence.
    StateManager.set("eventSequence", JSON.stringify(this.eventSequence));

    const currentGhost = this.getCurrentGhost();
    console.log(`Current active ghost: ${currentGhost ? currentGhost.name : 'not found'}`);
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
  
  // ===========================================================
  // NEW: Event Sequence Management API
  // This API allows transparent configuration of the sequence of events and quests.
  // ===========================================================

  /**
   * setEventSequence
   * Sets the event sequence configuration.
   * @param {Array} sequence - Array of event steps, each being an object with properties:
   *   - name: string (e.g., 'welcome', 'mirror', 'repeating', 'final')
   *   - status: string ('not_started', 'in_progress', 'finished')
   */
  setEventSequence(sequence) {
    this.eventSequence = sequence;
    console.log("Event sequence updated:", this.eventSequence);
    StateManager.set("eventSequence", JSON.stringify(this.eventSequence));
  }

  /**
   * getEventSequence
   * Returns the current event sequence configuration.
   * @returns {Array} The event sequence.
   */
  getEventSequence() {
    const stored = StateManager.get("eventSequence");
    if (stored) {
      try {
        this.eventSequence = JSON.parse(stored);
      } catch (e) {
        console.error("Error parsing stored event sequence:", e);
      }
    }
    return this.eventSequence;
  }

  /**
   * updateEventStepStatus
   * Updates the status of a given event step.
   * @param {string} eventName - Name of the event step (e.g., 'welcome', 'mirror', etc.).
   * @param {string} status - New status ('not_started', 'in_progress', 'finished').
   */
  updateEventStepStatus(eventName, status) {
    if (!this.eventSequence) return;
    const step = this.eventSequence.find(e => e.name === eventName);
    if (step) {
      step.status = status;
      console.log(`Event step '${eventName}' updated to status: ${status}`);
      StateManager.set(`event_${eventName}_status`, status);
    } else {
      console.warn(`Event step '${eventName}' not found in sequence.`);
    }
  }

  /**
   * getCurrentEventStep
   * Determines and returns the current active event step based on the event sequence.
   * @returns {Object|null} The current event step object, or null if all steps are finished.
   */
  getCurrentEventStep() {
    if (!this.eventSequence) return null;
    const currentStep = this.eventSequence.find(step => step.status !== 'finished');
    return currentStep || null;
  }
}