export class GhostManager {
  /**
   * Constructor for GhostManager.
   * @param {EventManager} eventManager - The event manager for diary operations.
   * @param {ProfileManager} profileManager - The profile manager for saving progress.
   * @param {App} app - The main application instance.
   *
   * This class manages ghosts by generating a list of ghosts,
   * switching the active ghost, tracking the progress of phenomena (quest steps),
   * and saving/loading ghost state from localStorage.
   */
  constructor(eventManager, profileManager, app) {
    this.eventManager = eventManager;
    this.profileManager = profileManager;
    this.app = app;

    // Array of ghosts that will be generated dynamically.
    this.ghosts = [];

    // Initialize the list of ghosts based on predefined names.
    this.setupGhosts();

    // Set the initial active ghost (ID = 1).
    this.currentGhostId = 1;

    // Index of the current phenomenon (quest step) for the active ghost.
    this.currentPhenomenonIndex = 0;

    // Load saved ghost state from localStorage, if available.
    this.loadState();

    const currentGhost = this.getCurrentGhost();
    console.log(`Current active ghost: ${currentGhost ? currentGhost.name : 'not found'}`);
  }

  /**
   * setupGhosts – Generates the list of ghosts based on predefined names.
   * The number of phenomena (steps) for each ghost is calculated as the length of the name minus 2.
   */
  setupGhosts() {
    const ghostNames = [
      "призрак 1",
      "призрак 2",
      "призрак 3",
      "призрак 4",
      "призрак 5",
      "призрак 6",
      "призрак 7",
      "призрак 8",
      "призрак 9",
      "призрак 10",
      "призрак 11",
      "призрак 12",
      "призрак 13"
    ];

    // Generate an object for each ghost with ID, name, and phenomena count.
    this.ghosts = ghostNames.map((name, index) => {
      // The phenomena count is determined as the length of the name minus 2 (example).
      const phenomenaCount = name.length - 2;
      return {
        id: index + 1,
        name: name,
        phenomenaCount: phenomenaCount,
        // Additional property to mark if the ghost's quest is finished.
        isFinished: false
      };
    });
  }

  /**
   * getCurrentGhost – Returns the active ghost object based on currentGhostId.
   * @returns {object|undefined} The ghost object or undefined if not found.
   */
  getCurrentGhost() {
    return this.ghosts.find(g => g.id === this.currentGhostId);
  }

  /**
   * setCurrentGhost – Sets the active ghost by the given ID.
   * Saves the ghost state to localStorage.
   * @param {number} ghostId - The ID of the ghost to activate.
   */
  setCurrentGhost(ghostId) {
    this.currentGhostId = ghostId;
    const ghost = this.getCurrentGhost();
    if (ghost) {
      console.log(`Ghost ${ghost.name} activated.`);
    } else {
      console.warn(`Ghost with ID=${ghostId} not found!`);
    }
    this.saveState();
  }

  /**
   * finishCurrentGhost – Marks the current ghost as finished.
   * Saves the state after updating.
   */
  finishCurrentGhost() {
    const ghost = this.getCurrentGhost();
    if (ghost) {
      ghost.isFinished = true;
      console.log(`Ghost ${ghost.name} finished.`);
      this.saveState();
    }
  }

  /**
   * isCurrentGhostFinished – Checks if the current active ghost is marked as finished.
   * @returns {boolean} True if the current ghost is marked as finished, otherwise false.
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

    // Check if the ghost is already finished.
    if (ghost.isFinished) {
      console.warn(`Ghost "${ghost.name}" is already finished; phenomena unavailable.`);
      return;
    }

    // Compare currentPhenomenonIndex with phenomenaCount.
    if (this.currentPhenomenonIndex < ghost.phenomenaCount) {
      // Form the entry text for the current phenomenon.
      const phenomenonNumber = this.currentPhenomenonIndex + 1;
      const phenomenonEntry = `${ghost.name}: Phenomenon ${phenomenonNumber} - Approach the mirror`;
      await this.eventManager.addDiaryEntry(phenomenonEntry);

      console.log(`Triggered phenomenon for ${ghost.name}: ${phenomenonEntry}`);

      // Increment the phenomenon index.
      this.currentPhenomenonIndex++;

      // Save ghost progress via ProfileManager, if needed.
      this.profileManager.saveGhostProgress({
        ghostId: this.currentGhostId,
        phenomenonIndex: this.currentPhenomenonIndex
      });

      // If the end of phenomena is reached, publish the "final post" and trigger the final event.
      if (this.currentPhenomenonIndex === ghost.phenomenaCount) {
        const finalEntry = `${ghost.name}: Final phenomenon – ghost finished!`;
        await this.eventManager.addDiaryEntry(finalEntry);
        console.log(finalEntry);

        // Trigger the event corresponding to final logic.
        // For example, "ghost_final_event" – a short event that, when activated,
        // triggers QuestManager to activate final_quest (or performs another action).
        console.log(`Triggering final event for ghost "${ghost.name}"...`);
        this.app.gameEventManager.activateEvent("ghost_final_event");
      }
    } else {
      console.warn(`All phenomena for ghost ${ghost.name} have been completed (index=${this.currentPhenomenonIndex}).`);
    }
  }

  /**
   * resetGhostChain – Resets the ghost chain.
   * Sets the active ghost to the first one and resets the phenomenon index.
   * Also resets the saved ghost progress via ProfileManager.
   */
  resetGhostChain() {
    this.currentGhostId = 1;
    this.currentPhenomenonIndex = 0;
    this.profileManager.resetGhostProgress();
    console.log("Ghost chain has been reset.");
  }

  /**
   * saveState – Saves the current state of ghosts (the this.ghosts array) to localStorage.
   */
  saveState() {
    localStorage.setItem('ghostState', JSON.stringify(this.ghosts));
  }

  /**
   * loadState – Loads the saved ghost state from localStorage.
   * If a state is found, updates the this.ghosts array.
   */
  loadState() {
    const savedState = localStorage.getItem('ghostState');
    if (savedState) {
      this.ghosts = JSON.parse(savedState);
      console.log("Ghost state loaded:", this.ghosts);
    }
  }
}