export class GhostManager {
  /**
   * Constructor for GhostManager.
   * @param {EventManager} eventManager - The event manager for diary operations.
   * @param {ProfileManager} profileManager - The profile manager for saving progress.
   * @param {App} app - The main application instance.
   *
   * This class manages ghosts by maintaining a list of ghosts,
   * switching the active ghost, tracking the progress of phenomena (quest steps),
   * and, in the future, saving/loading ghost state.
   *
   * CURRENT CHANGE: The ghost list is reset to contain only the default ghost.
   */
  constructor(eventManager, profileManager, app) {
    this.eventManager = eventManager;
    this.profileManager = profileManager;
    this.app = app;

    // Initialize the ghost list with only the default ghost.
    this.ghosts = [];
    this.setupGhosts();

    // Set the initial active ghost (ID = 1).
    this.currentGhostId = 1;

    // Index of the current phenomenon (quest step) for the active ghost.
    this.currentPhenomenonIndex = 0;

    // Do not load saved ghost state to ensure a reset.
    // this.loadState(); // Disabled for default ghost configuration.

    const currentGhost = this.getCurrentGhost();
    console.log(`Current active ghost: ${currentGhost ? currentGhost.name : 'not found'}`);
  }

  /**
   * setupGhosts – Generates the list of ghosts.
   * CURRENT CHANGE: Instead of creating 13 ghosts, only the default ghost is created.
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
   * getCurrentGhost – Returns the active ghost object based on currentGhostId.
   * @returns {object|undefined} The ghost object or undefined if not found.
   */
  getCurrentGhost() {
    return this.ghosts.find(g => g.id === this.currentGhostId);
  }

  /**
   * setCurrentGhost – Sets the active ghost by the given ID and saves state in the database.
   * @param {number} ghostId - The ID of the ghost to activate.
   */
  async setCurrentGhost(ghostId) {
    this.currentGhostId = ghostId;
    const ghost = this.getCurrentGhost();
    if (ghost) {
      console.log(`Ghost ${ghost.name} activated.`);
      // Save ghost state using the new DatabaseManager method.
      await this.app.databaseManager.saveGhostState(ghost);
    } else {
      console.warn(`Ghost with ID=${ghostId} not found!`);
    }
  }

  /**
   * finishCurrentGhost – Marks the current ghost as finished and saves state.
   */
  async finishCurrentGhost() {
    const ghost = this.getCurrentGhost();
    if (ghost) {
      ghost.isFinished = true;
      console.log(`Ghost ${ghost.name} finished.`);
      await this.app.databaseManager.saveGhostState(ghost);
    }
  }

  /**
   * isCurrentGhostFinished – Checks if the current active ghost is marked as finished.
   * @returns {boolean} True if the current ghost is finished, otherwise false.
   */
  isCurrentGhostFinished() {
    const ghost = this.getCurrentGhost();
    return ghost ? ghost.isFinished : false;
  }

  /**
   * triggerNextPhenomenon – Initiates the next phenomenon (quest step) for the current ghost.
   * If the phenomenon index is less than the total phenomena for the ghost,
   * adds a diary entry and updates progress in the profile.
   * If all phenomena are completed, publishes a "final post" and triggers the final event.
   */
  async triggerNextPhenomenon() {
    const ghost = this.getCurrentGhost();
    if (!ghost) return;

    if (ghost.isFinished) {
      console.warn(`Ghost "${ghost.name}" is already finished; phenomena unavailable.`);
      return;
    }

    if (this.currentPhenomenonIndex < ghost.phenomenaCount) {
      const phenomenonNumber = this.currentPhenomenonIndex + 1;
      const phenomenonEntry = `${ghost.name}: Phenomenon ${phenomenonNumber} - Approach the mirror`;
      await this.eventManager.addDiaryEntry(phenomenonEntry);
      console.log(`Triggered phenomenon for ${ghost.name}: ${phenomenonEntry}`);

      this.currentPhenomenonIndex++;

      // Save ghost progress via ProfileManager.
      this.profileManager.saveGhostProgress({
        ghostId: this.currentGhostId,
        phenomenonIndex: this.currentPhenomenonIndex
      });

      if (this.currentPhenomenonIndex === ghost.phenomenaCount) {
        const finalEntry = `${ghost.name}: Final phenomenon – ghost finished!`;
        await this.eventManager.addDiaryEntry(finalEntry);
        console.log(finalEntry);

        console.log(`Triggering final event for ghost "${ghost.name}"...`);
        this.app.gameEventManager.activateEvent("ghost_final_event");
      }
    } else {
      console.warn(`All phenomena for ghost ${ghost.name} have been completed (index=${this.currentPhenomenonIndex}).`);
    }
  }

  /**
   * resetGhostChain – Resets the ghost chain.
   * Sets the active ghost to the default and resets the phenomenon index.
   * Also resets the saved ghost progress via ProfileManager and updates the database.
   */
  async resetGhostChain() {
    this.currentGhostId = 1;
    this.currentPhenomenonIndex = 0;
    this.profileManager.resetGhostProgress();
    console.log("Ghost chain has been reset.");
    const ghost = this.getCurrentGhost();
    if (ghost) {
      ghost.isFinished = false;
      await this.app.databaseManager.saveGhostState(ghost);
    }
  }
  
  // Methods saveState() and loadState() are now obsolete since state persistence is handled by DatabaseManager.
}