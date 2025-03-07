import { BaseEvent } from './baseEvent.js';
import { StateManager } from '../stateManager.js';
import { ErrorManager } from '../errorManager.js';

/**
 * WelcomeEvent
 * 
 * This event is triggered immediately after registration. It logs a welcome message
 * (invitation to approach the mirror) in the diary and enables the "Post" button.
 * It uses StateManager to check and update the "welcomeDone" flag so that the event
 * is launched only once per registration cycle.
 *
 * NOTE: This event is now part of the sequential chain managed by GhostManager.
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
    // Уникальный ключ для welcome-события.
    this.key = "welcome";
  }

  async activate() {
    // Если welcomeDone уже стоит, пропускаем активацию.
    if (StateManager.get("welcomeDone") === "true") {
      console.log("Welcome event already completed; skipping activation.");
      // По-прежнему включаем «Пост» (если это нужно по логике).
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
        this.app.viewManager.setPostButtonEnabled(true);
      }
      return;
    }
    
    // Если событие уже есть в дневнике, проверяем mirrorQuestReady, чтобы решить, включать ли «Пост».
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`Event '${this.key}' is already logged.`);
      if (StateManager.get("mirrorQuestReady") === "true") {
        if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
          this.app.viewManager.setPostButtonEnabled(true);
          console.log("Post button enabled based on mirrorQuestReady flag.");
        }
      } else {
        if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
          this.app.viewManager.setPostButtonEnabled(false);
          console.log("Post button remains disabled as mirrorQuestReady flag is false.");
        }
      }
      return;
    }

    // Если событие не записано в дневнике, логируем его (ghost post).
    console.log(`Activating event '${this.key}': Logging invitation to approach the mirror`);
    await this.eventManager.addDiaryEntry(this.key, true);

    // Ставим флаг mirrorQuestReady и включаем «Пост».
    StateManager.set("mirrorQuestReady", "true");
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
      this.app.viewManager.setPostButtonEnabled(true);
    }
    
    // Если нужно – запускаем эффект зеркала.
    if (this.app.visualEffectsManager && typeof this.app.visualEffectsManager.triggerMirrorEffect === 'function') {
      this.app.visualEffectsManager.triggerMirrorEffect();
    }

    // Наконец, ставим welcomeDone=true, чтобы событие не запускалось повторно.
    StateManager.set("welcomeDone", "true");

    // (Опционально) пересинхронизировать квест-состояние:
    // if (this.app.questManager && typeof this.app.questManager.syncQuestState === "function") {
    //   await this.app.questManager.syncQuestState();
    // }
  }
}