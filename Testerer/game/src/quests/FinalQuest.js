// File: src/events/FinalQuest.js

import { BaseEvent } from '../events/BaseEvent.js';
import { StateManager } from '../managers/StateManager.js';

/**
 * FinalQuest – The final quest signifies the complete end of the scenario
 * (e.g., no more letters/phenomena). It logs the completion, updates the game
 * state via StateManager, triggers the ghost finishing process, and notifies the user
 * via ViewManager.
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

    // React to the game being finalized: disable Post button and show a notification
    StateManager.subscribe("gameFinalized", newValue => {
      if (newValue === "true") {
        if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
          this.app.viewManager.setPostButtonEnabled(false);
        }
        if (this.app.viewManager && typeof this.app.viewManager.showNotification === "function") {
          this.app.viewManager.showNotification("🎉 Scenario is finalized!");
        }
      }
    });
  }

  /**
   * activate – Logs the start of the final quest (if not already logged).
   */
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`[FinalQuest] Activating final quest: ${this.key}`);
      // Use unified method for adding diary entry.
      await this.addDiaryEntry(this.key, true);
    }
    console.log("[FinalQuest] Final quest initiated.");
  }

  /**
   * checkStatus – Performs any necessary checks (e.g., additional snapshot if needed).
   * Currently always returns true.
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
   *  5) Calls finishCurrentGhost from GhostManager.
   *  6) Synchronizes UI state.
   *  7) Dispatches a "questCompleted" event to signal completion.
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

    // Use unified method for adding a diary entry.
    await this.addDiaryEntry(`${this.key}_completed`, true);

    // Set the game as finalized.
    StateManager.set("gameFinalized", "true");
    // Remove the universal active quest key.
    StateManager.remove("activeQuestKey");

    // Mark current ghost as finished.
    if (this.app.ghostManager) {
      await this.app.ghostManager.finishCurrentGhost();
    }

    // Re-sync UI state.
    if (this.app.questManager && typeof this.app.questManager.syncQuestState === "function") {
      await this.app.questManager.syncQuestState();
    }

    // Signal to GhostManager that the quest has completed.
    document.dispatchEvent(new CustomEvent("questCompleted", { detail: this.key }));
  }
}