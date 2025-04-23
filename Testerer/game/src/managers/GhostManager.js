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
 * - Reactive updates on activeQuestKey changes via pub/sub; manual updatePostButtonState calls removed.
 * - On starting a quest the camera button is set to active,
 *   and upon quest completion the active state (class) is removed.
 */
export class GhostManager {
  /**
   * @param {number} currentSequenceIndex - Starting index for the event–quest sequence (from StateManager).
   * @param {ProfileManager} profileManager - Manager for saving ghost progress.
   * @param {App} app - The main application instance.
   */
  constructor(currentSequenceIndex, profileManager, app) {
    // Sequence index and dependencies
    this.currentSequenceIndex = currentSequenceIndex;
    this.profileManager = profileManager;
    this.app = app;

    // Persisted active quest key
    this.activeQuestKey = StateManager.get(StateManager.KEYS.ACTIVE_QUEST_KEY) || null;

    // Placeholder for GameEventManager injection
    this.eventManager = null;

    // Ghost list initialization
    this.ghosts = [];
    this.setupGhosts();
    this.currentGhostId = 1;
    this.currentPhenomenonIndex = 0;

    const currentGhost = this.getCurrentGhost();
    console.log(`Current active ghost: ${currentGhost ? currentGhost.name : 'not found'}`);

    // Load unified config
    loadGameEntitiesConfig()
      .then(config => {
        this.sequenceManager = new SequenceManager(config.sequence);
        const savedIndex = parseInt(StateManager.get(StateManager.KEYS.CURRENT_SEQUENCE_INDEX), 10) || 0;
        this.sequenceManager.currentIndex = savedIndex;
        console.log(`Sequence configuration loaded. Current index: ${this.sequenceManager.currentIndex}`);

        // Auto-launch welcome event
        if (StateManager.get('registrationCompleted') === 'true' && StateManager.get('welcomeDone') !== 'true') {
          const firstEntry = this.sequenceManager.getCurrentEntry();
          if (firstEntry) {
            console.log(`Auto-launching initial event: ${firstEntry.eventKey}`);
            this.eventManager.activateEvent(firstEntry.eventKey);
            StateManager.set(StateManager.KEYS.ACTIVE_QUEST_KEY, firstEntry.questKey);
          }
        }
      })
      .catch(error => {
        console.error('Error loading unified configuration:', error);
      });

    // Listen to global completions
    document.addEventListener('gameEventCompleted', e => this.onEventCompleted(e.detail));
    document.addEventListener('questCompleted', e => this.onQuestCompleted(e.detail));

    // React to changes in activeQuestKey
    StateManager.subscribe(StateManager.KEYS.ACTIVE_QUEST_KEY, () => this.updatePostButtonState());
    // Initial Post button sync
    this.updatePostButtonState();
  }

  /** Generates the list of ghosts (only default for now). */
  setupGhosts() {
    this.ghosts = [{ id: 1, name: 'ghost 1', phenomenaCount: 3, isFinished: false }];
  }

  /** Returns the currently active ghost object. */
  getCurrentGhost() {
    return this.ghosts.find(g => g.id === this.currentGhostId);
  }

  /** Sets and persists the current ghost by ID. */
  async setCurrentGhost(ghostId) {
    this.currentGhostId = ghostId;
    const ghost = this.getCurrentGhost();
    if (ghost) {
      console.log(`Ghost ${ghost.name} activated.`);
      await this.app.databaseManager.saveGhostState(ghost);
    } else {
      ErrorManager.logError(`Ghost with ID=${ghostId} not found!`, 'setCurrentGhost');
    }
  }

  /** Marks the current ghost as finished and persists. */
  async finishCurrentGhost() {
    const ghost = this.getCurrentGhost();
    if (ghost) {
      ghost.isFinished = true;
      console.log(`Ghost ${ghost.name} finished.`);
      await this.app.databaseManager.saveGhostState(ghost);
    } else {
      ErrorManager.logError('Cannot finish ghost: not found.', 'finishCurrentGhost');
    }
  }

  /** Returns true if the current ghost is finished. */
  isCurrentGhostFinished() {
    const ghost = this.getCurrentGhost();
    return ghost ? ghost.isFinished : false;
  }

  /**
   * Triggers the next phenomenon in the chain.
   * Adds a diary entry and updates progression.
   */
  async triggerNextPhenomenon() {
    const ghost = this.getCurrentGhost();
    if (!ghost) return ErrorManager.logError('No ghost found.', 'triggerNextPhenomenon');
    if (ghost.isFinished) return ErrorManager.logError(`Ghost "${ghost.name}" already finished.`, 'triggerNextPhenomenon');

    if (this.currentPhenomenonIndex < ghost.phenomenaCount) {
      const num = this.currentPhenomenonIndex + 1;
      const entry = `${ghost.name}: Phenomenon ${num} - Approach the mirror`;
      await this.eventManager.addDiaryEntry(entry);
      console.log(`Triggered phenomenon: ${entry}`);
      this.currentPhenomenonIndex++;
      await this.profileManager.saveGhostProgress({ ghostId: this.currentGhostId, phenomenonIndex: this.currentPhenomenonIndex });

      if (this.currentPhenomenonIndex === ghost.phenomenaCount) {
        const finalEntry = `${ghost.name}: Final phenomenon – ghost finished!`;
        await this.eventManager.addDiaryEntry(finalEntry);
        console.log(finalEntry);
        await this.app.gameEventManager.activateEvent('ghost_final_event');
      }
    } else {
      ErrorManager.logError(`All phenomena completed for ${ghost.name}.`, 'triggerNextPhenomenon');
    }
  }

  /** Resets ghost chain and clears progress. */
  async resetGhostChain() {
    this.currentGhostId = 1;
    this.currentPhenomenonIndex = 0;
    await this.profileManager.resetGhostProgress();
    const ghost = this.getCurrentGhost();
    if (ghost) {
      ghost.isFinished = false;
      await this.app.databaseManager.saveGhostState(ghost);
    }
    console.log('Ghost chain reset.');
  }

  // ---------- Sequential Event & Quest Management ----------

  isNextInSequence(questKey) {
    return this.sequenceManager?.isNextQuest(questKey) || false;
  }

  isNextEvent(eventKey) {
    return this.sequenceManager?.isNextEvent(eventKey) || false;
  }

  /**
   * Returns true if the quest can start:
   * - No unfinished record exists.
   * - No other active quest.
   * - Matches next in sequence.
   */
  canStartQuest(questKey) {
    const record = this.app.databaseManager.getQuestRecord(questKey);
    if (record && record.status !== 'finished') return false;
    const activeKey = StateManager.get(StateManager.KEYS.ACTIVE_QUEST_KEY);
    if (activeKey && activeKey !== questKey) return false;
    if (!this.isNextInSequence(questKey)) return false;
    return true;
  }

  /**
   * Starts a quest reactively: updates StateManager and camera button.
   */
  async startQuest(questKey) {
    if (!this.canStartQuest(questKey)) return;
    console.log(`Starting quest: ${questKey}`);
    await this.app.questManager.activateQuest(questKey);
    StateManager.set(StateManager.KEYS.ACTIVE_QUEST_KEY, questKey);
    this.app.viewManager.setCameraButtonActive(true);
  }

  /**
   * Starts an event; if not followup, checks sequence.
   */
  async startEvent(eventKey, isFollowup = false) {
    if (!isFollowup && !this.isNextEvent(eventKey)) return;
    console.log(`Starting event: ${eventKey}`);
    await this.app.gameEventManager.activateEvent(eventKey);
  }

  /** Updates the Post button based on next quest readiness. */
  updatePostButtonState() {
    const next = this.sequenceManager?.getCurrentEntry();
    const enabled = next ? this.canStartQuest(next.questKey) : false;
    this.app.viewManager.setPostButtonEnabled(enabled);
    console.log(`[GhostManager] Post button enabled=${enabled}`);
  }

  /** Handles Post button click without manual toggles. */
  async handlePostButtonClick() {
    this.app.viewManager.setPostButtonEnabled(false);
    const next = this.sequenceManager?.getCurrentEntry();
    if (!next) return;
    if (!this.canStartQuest(next.questKey)) return;
    await this.startQuest(next.questKey);
  }

  /** Increments sequence if completed event matches next. */
  onEventCompleted(eventKey) {
    if (this.sequenceManager?.getCurrentEntry().nextEventKey === eventKey) {
      this.sequenceManager.increment();
      StateManager.set(StateManager.KEYS.CURRENT_SEQUENCE_INDEX, String(this.sequenceManager.currentIndex));
      console.log(`Sequence index: ${this.sequenceManager.currentIndex}`);
    }
  }

  /**
   * Clears active quest on completion and triggers subsequent events.
   */
  async onQuestCompleted(questKey) {
    console.log(`Quest completed: ${questKey}`);
    StateManager.remove(StateManager.KEYS.ACTIVE_QUEST_KEY);
    this.app.viewManager.setCameraButtonActive(false);

    if (questKey === 'repeating_quest') {
      const rq = this.app.questManager.quests.find(q => q.key === 'repeating_quest');
      const status = rq ? await rq.getCurrentQuestStatus() : { currentStage: 1, totalStages: 1 };
      if (status.currentStage <= status.totalStages) {
        await this.startEvent(`post_repeating_event_stage_${status.currentStage}`, true);
        return;
      } else {
        const entry = this.sequenceManager.getCurrentEntry();
        if (entry?.nextEventKey) await this.startEvent(entry.nextEventKey, true);
        this.sequenceManager.increment();
        StateManager.set(StateManager.KEYS.CURRENT_SEQUENCE_INDEX, String(this.sequenceManager.currentIndex));
        return;
      }
    }

    const entry = this.sequenceManager.getCurrentEntry();
    if (entry?.questKey === questKey && entry.nextEventKey) {
      await this.startEvent(entry.nextEventKey, true);
    }
  }
}