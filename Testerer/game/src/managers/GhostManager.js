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
 * - Coordinating the common sequential logic for events and quests.
 *
 * Changes:
 * - Методы, относящиеся к управлению квестами (canStartQuest, startQuest, onQuestCompleted) перенесены в QuestManager.
 * - Методы, связанные с событиями (isNextEvent, startEvent, onEventCompleted) – в GameEventManager.
 * - GhostManager сохраняет только общую логику (например, работу с последовательностью, состоянием призрака,
 *   обновление кнопки Post и делегирование запуска нужного действия специализированным модулям).
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
            // Delegate event activation to GameEventManager.
            this.app.gameEventManager.activateEvent(firstEntry.eventKey);
            // Save the active quest key using the universal mechanism.
            this.activeQuestKey = firstEntry.questKey;
            StateManager.set("activeQuestKey", this.activeQuestKey);
          }
        }
        // Update the Post button state after loading configuration.
        this.updatePostButtonState();
      })
      .catch(error => {
        console.error("Error loading unified configuration:", error);
      });

    // Удалены подписки на события завершения квестов и событий – они теперь обрабатываются в QuestManager и GameEventManager.
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
      // Delegate diary entry addition to GameEventManager.
      await this.app.gameEventManager.addDiaryEntry(phenomenonEntry);
      console.log(`Triggered phenomenon for ${ghost.name}: ${phenomenonEntry}`);
      this.currentPhenomenonIndex++;
      await this.profileManager.saveGhostProgress({
        ghostId: this.currentGhostId,
        phenomenonIndex: this.currentPhenomenonIndex
      });
      if (this.currentPhenomenonIndex === ghost.phenomenaCount) {
        const finalEntry = `${ghost.name}: Final phenomenon – ghost finished!`;
        await this.app.gameEventManager.addDiaryEntry(finalEntry);
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
   * Returns whether the given quest key is the next expected in the sequence.
   * This is common logic and remains in GhostManager.
   * @param {string} questKey - The quest key to check.
   * @returns {boolean} True if it matches; otherwise, false.
   */
  isNextInSequence(questKey) {
    return this.sequenceManager ? this.sequenceManager.isNextQuest(questKey) : false;
  }

  /**
   * Updates the Post button state based on whether an active quest is present.
   * If an active quest exists, the button is disabled; otherwise, it is enabled.
   */
  updatePostButtonState() {
    const activeQuestKey = StateManager.get("activeQuestKey");
    const isEnabled = !activeQuestKey;
    this.app.viewManager.setPostButtonEnabled(isEnabled);
    console.log(`[GhostManager] Post button state updated: enabled=${isEnabled}`);
  }

  /**
   * Handles the Post button click.
   * Delegates the action to the appropriate manager based on the next sequence entry:
   * - Если присутствует questKey – делегирует запуск QuestManager.
   * - Если есть eventKey – делегирует запуск GameEventManager.
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
    console.log("GhostManager: Handling Post button click. Next sequence entry:", nextEntry);
    
    if (nextEntry.questKey) {
      console.log(`Delegating quest start for key: ${nextEntry.questKey}`);
      await this.app.questManager.activateQuest(nextEntry.questKey);
      // Save the active quest key universally.
      this.activeQuestKey = nextEntry.questKey;
      StateManager.set("activeQuestKey", nextEntry.questKey);
      await this.app.questManager.syncQuestState();
      // Activate camera button when quest starts.
      this.app.viewManager.setCameraButtonActive(true);
    } else if (nextEntry.eventKey) {
      console.log(`Delegating event start for key: ${nextEntry.eventKey}`);
      await this.app.gameEventManager.activateEvent(nextEntry.eventKey);
    }
    // Update the Post button state after delegation.
    this.updatePostButtonState();
  }
}