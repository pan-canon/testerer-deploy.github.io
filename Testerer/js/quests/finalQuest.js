import { BaseEvent } from '../events/baseEvent.js';

/**
 * FinalQuest – The final quest signifies the complete end of the scenario
 * (e.g., no more letters/phenomena).
 */
export class FinalQuest extends BaseEvent {
  /**
   * @param {EventManager} eventManager - The event manager.
   * @param {App} appInstance - The main application instance.
   * @param {Object} [config] - Optional configuration (e.g., { key: "final_quest" }).
   */
  constructor(eventManager, appInstance, config = {}) {
    super(eventManager);
    this.app = appInstance;
    this.key = config.key || "final_quest";
    this.finished = false;
  }

  /**
   * activate – Logs the start of the final quest (if not already logged).
   *
   * @returns {Promise<void>}
   */
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`[FinalQuest] Activating final quest: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key, true);
    }
    console.log("[FinalQuest] Final quest initiated.");
    // Optionally, a flag (e.g., finalQuestActive) can be set here.
  }

  /**
   * checkStatus – Performs any necessary checks (e.g., additional snapshot if needed).
   * Currently always returns true.
   *
   * @returns {Promise<boolean>}
   */
  async checkStatus() {
    return true;
  }

  /**
   * finish – Completes the final quest:
   *  1) Checks the conditions via checkStatus.
   *  2) Logs the completion.
   *  3) Calls finishCurrentGhost from GhostManager to mark the scenario as finished.
   *
   * @returns {Promise<void>}
   */
  async finish() {
    if (this.finished) return;
    const success = await this.checkStatus();
    if (!success) {
      alert("❌ Final quest conditions not met!");
      return;
    }

    this.finished = true;
    console.log(`[FinalQuest] Finishing quest: ${this.key}`);
    
    // Log the quest completion in the diary.
    await this.eventManager.addDiaryEntry(`${this.key}_completed`, true);

    // Mark the scenario as finished by calling finishCurrentGhost from GhostManager.
    if (this.app.ghostManager) {
      this.app.ghostManager.finishCurrentGhost();
    }

    alert("🎉 Final quest completed! Scenario ended!");
    // No further events are triggered automatically.
  }
}