// File: src/quests/FinalQuest.js

import { BaseEvent } from '../events/BaseEvent.js';
import { StateManager } from '../managers/StateManager.js';

/**
 * FinalQuest – The final quest signifies the complete end of the scenario.
 * It logs the completion, updates the game state via StateManager, triggers
 * the ghost finishing process, and notifies the user via ViewManager.
 *
 * NOTE: This quest performs its task (logging, state updates, finish procedures)
 * and then dispatches a "questCompleted" event for external managers to handle further UI updates.
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
   */
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`[FinalQuest] Activating final quest: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key, true);
    }
    console.log("[FinalQuest] Final quest initiated.");
  }

  /**
   * checkStatus – Performs necessary checks for final quest completion.
   * Currently always returns true.
   *
   * @returns {Promise<boolean>}
   */
  async checkStatus() {
    return true;
  }

  /**
   * finish – Completes the final quest:
   *  1) Checks final conditions via checkStatus.
   *  2) Logs the completion in the diary.
   *  3) Sets the "gameFinalized" flag via StateManager.
   *  4) Removes the universal active quest key.
   *  5) Triggers the ghost finishing process via GhostManager.
   *  6) Notifies the user via ViewManager.
   *  7) Synchronizes the UI state via QuestManager.
   *  8) Dispatches a "questCompleted" event to signal completion.
   */
  async finish() {
    if (this.finished) return;

    const success = await this.checkStatus();
    if (!success) {
      if (this.app.viewManager && typeof this.app.viewManager.showNotification === "function") {
        this.app.viewManager.showNotification("❌ Final quest conditions not met!");
      }
      return;
    }

    this.finished = true;
    console.log(`[FinalQuest] Finishing quest: ${this.key}`);

    await this.eventManager.addDiaryEntry(`${this.key}_completed`, true);

    // Set the game as finalized and clear the universal active quest key.
    StateManager.set("gameFinalized", "true");
    StateManager.remove("activeQuestKey");

    // Trigger the ghost finishing process.
    if (this.app.ghostManager) {
      await this.app.ghostManager.finishCurrentGhost();
    }

    // Notify the user about final completion.
    if (this.app.viewManager && typeof this.app.viewManager.showNotification === "function") {
      this.app.viewManager.showNotification("🎉 Final quest completed! Scenario ended!");
    } else {
      console.log("🎉 Final quest completed! Scenario ended!");
    }

    // Synchronize the UI state via QuestManager.
    if (this.app.questManager && typeof this.app.questManager.syncQuestState === "function") {
      await this.app.questManager.syncQuestState();
    }

    // Dispatch an event to signal that the final quest has been completed.
    document.dispatchEvent(new CustomEvent("questCompleted", { detail: this.key }));
  }
}