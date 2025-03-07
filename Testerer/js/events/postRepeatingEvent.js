import { BaseEvent } from './baseEvent.js';
import { StateManager } from '../stateManager.js';
import { ErrorManager } from '../errorManager.js';

/**
 * PostRepeatingEvent
 * 
 * This event finalizes the mirror quest cycle and prepares the system for the repeating quest cycle.
 * It logs a ghost post, then checks if the current ghost is finished.
 * - If the ghost is finished, it triggers the final quest.
 * - Otherwise, it resets the "mirrorQuestReady" flag, re-enables the "Post" button via ViewManager,
 *   and triggers the mirror visual effect.
 *
 * NOTE: This event is now part of the sequential chain managed by GhostManager.
 */
export class PostRepeatingEvent extends BaseEvent {
  /**
   * @param {EventManager} eventManager - Manager for diary operations.
   * @param {App} appInstance - Reference to the main application instance.
   */
  constructor(eventManager, appInstance) {
    super(eventManager);
    this.app = appInstance;
    this.key = "post_repeating_event";
  }

  async activate() {
    // Если событие уже есть в дневнике, пропускаем активацию.
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`[PostRepeatingEvent] Event '${this.key}' is already logged, skipping activation.`);
      return;
    }
    console.log(`[PostRepeatingEvent] Activating event '${this.key}'.`);

    // Запись в дневник как "ghost post".
    await this.eventManager.addDiaryEntry(this.key, true);

    // Проверяем, завершён ли призрак
    const ghost = this.app.ghostManager.getCurrentGhost();
    if (ghost && ghost.isFinished) {
      // Если призрак завершён — запускаем финальный квест
      console.log("[PostRepeatingEvent] Ghost is finished, triggering final quest.");
      await this.app.questManager.activateQuest("final_quest");
    } else {
      // Иначе готовим систему к следующему циклу повторяющегося квеста.
      
      // Ставим флаг mirrorQuestReady
      StateManager.set("mirrorQuestReady", "true");
      // (Флаг "isRepeatingCycle" остаётся true для повторного цикла)
      
      // Включаем кнопку «Пост» через ViewManager
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
        this.app.viewManager.setPostButtonEnabled(true);
      }
      
      // Вызываем визуальный «mirror effect» (если есть)
      if (this.app.visualEffectsManager && typeof this.app.visualEffectsManager.triggerMirrorEffect === "function") {
        this.app.visualEffectsManager.triggerMirrorEffect();
      }

      console.log("[PostRepeatingEvent] Repeating quest cycle ended; waiting for user action.");
    }

    // (Опционально) Если нужно сразу пересинхронизировать состояние:
    // if (this.app.questManager && typeof this.app.questManager.syncQuestState === "function") {
    //   await this.app.questManager.syncQuestState();
    // }
  }
}