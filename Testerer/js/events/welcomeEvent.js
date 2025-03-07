import { BaseEvent } from './baseEvent.js';
import { StateManager } from '../stateManager.js';
import { ErrorManager } from '../errorManager.js';

/**
 * WelcomeEvent
 * 
 * This event is triggered immediately after registration. It logs a welcome message
 * (invitation to approach the mirror) in the diary and sets the "welcomeDone" flag,
 * so that the event is launched only once per registration cycle.
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
    // Unique key for the welcome event.
    this.key = "welcome";
  }

  async activate() {
    // 1) Если welcomeDone уже стоит, пропускаем активацию.
    if (StateManager.get("welcomeDone") === "true") {
      console.log("[WelcomeEvent] welcomeDone=true; skipping activation.");
      // Раньше тут включалась кнопка «Пост», теперь убираем.
      return;
    }
    
    // 2) Если событие уже есть в дневнике, значит его однажды запускали, 
    //    но welcomeDone почему-то не установился (либо была сброшена логика).
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`[WelcomeEvent] Event '${this.key}' already logged, but welcomeDone is false.`);
      // Раньше тут была логика включения/выключения «Пост» в зависимости от mirrorQuestReady.
      // Теперь убираем её, чтобы всё делал QuestManager.syncQuestState().
      return;
    }

    // 3) Иначе логируем событие впервые.
    console.log(`[WelcomeEvent] Activating event '${this.key}': Logging invitation to approach the mirror`);
    await this.eventManager.addDiaryEntry(this.key, true);

    // 4) Ставим mirrorQuestReady (если нужно, чтобы handlePostButtonClick знал, что можно начать зеркало).
    StateManager.set("mirrorQuestReady", "true");

    // 5) Запускаем эффект зеркала (опционально).
    if (this.app.visualEffectsManager && typeof this.app.visualEffectsManager.triggerMirrorEffect === 'function') {
      this.app.visualEffectsManager.triggerMirrorEffect();
    }

    // 6) Ставим welcomeDone=true, чтобы событие не повторялось.
    StateManager.set("welcomeDone", "true");
    console.log("[WelcomeEvent] Welcome event completed. Setting welcomeDone=true.");

    // 7) Опционально пересинхронизировать UI через QuestManager
    if (this.app.questManager && typeof this.app.questManager.syncQuestState === "function") {
      await this.app.questManager.syncQuestState();
    }
  }
}