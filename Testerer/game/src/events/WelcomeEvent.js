// File: src/events/WelcomeEvent.js

import { BaseEvent } from './BaseEvent.js';
import { StateManager } from '../managers/StateManager.js';
import { ErrorManager } from '../managers/ErrorManager.js';

/**
 * WelcomeEvent
 * 
 * This event is triggered immediately after registration. It logs a welcome message
 * (invitation to approach the mirror) in the diary and triggers a mirror effect.
 * It uses StateManager to check and update the "welcomeDone" flag so that the event
 * is launched only once per registration cycle.
 *
 * NOTE: This event is part of the sequential chain managed by GhostManager.
 * It performs its core task and then dispatches a "gameEventCompleted" event.
 * All UI manipulations (such as enabling/disabling buttons) are now handled externally.
 */
export class WelcomeEvent extends BaseEvent {
  /**
   * @param {EventManager} eventManager - Manager handling diary operations.
   * @param {App} appInstance - Reference to the main application instance.
   * @param {LanguageManager} [languageManager] - Optional localization manager.
   */
  constructor(eventManager, appInstance, languageManager) {
    super(eventManager);
    this.app = appInstance;
    this.languageManager = languageManager;
    this.key = "welcome";
  }

  async activate() {
    // Если welcome уже завершен, выходим без активации.
    if (StateManager.get("welcomeDone") === "true") {
      console.log("Welcome event already completed; skipping activation.");
      return;
    }
    
    // Если событие уже залогировано, просто выходим.
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`Event '${this.key}' is already logged.`);
      return;
    }

    // Логируем событие как ghost-пост.
    console.log(`Activating event '${this.key}': Logging invitation to approach the mirror`);
    await this.eventManager.addDiaryEntry(this.key, true);

    // Триггерим визуальный эффект зеркала, если он доступен.
    if (this.app.visualEffectsManager && typeof this.app.visualEffectsManager.triggerMirrorEffect === "function") {
      this.app.visualEffectsManager.triggerMirrorEffect();
    }

    // Помечаем событие как завершенное.
    StateManager.set("welcomeDone", "true");

    // Отправляем событие, что welcome завершен, чтобы менеджеры могли отреагировать.
    document.dispatchEvent(new CustomEvent("gameEventCompleted", { detail: this.key }));
  }
}