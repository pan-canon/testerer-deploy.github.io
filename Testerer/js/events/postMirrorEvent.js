import { BaseEvent } from './baseEvent.js';
import { StateManager } from '../stateManager.js';
import { ErrorManager } from '../errorManager.js';

/**
 * PostMirrorEvent
 * 
 * This event publishes a ghost post and sets flags to start the mirror quest.
 * It updates the UI via ViewManager and uses StateManager to set the necessary flags.
 *
 * NOTE: This event is now part of the sequential chain managed by GhostManager.
 */
export class PostMirrorEvent extends BaseEvent {
  /**
   * @param {EventManager} eventManager - Manager handling diary operations.
   * @param {App} appInstance - Reference to the main application instance.
   */
  constructor(eventManager, appInstance) {
    super(eventManager);
    this.app = appInstance;
    this.key = "post_mirror_event";
  }

  async activate() {
    // Если событие уже записано в дневник, не активируем повторно.
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`[PostMirrorEvent] Event '${this.key}' is already logged, skipping activation.`);
      return;
    }

    console.log(`[PostMirrorEvent] Activating event '${this.key}'.`);
    
    // Запись в дневник как "ghost post".
    await this.eventManager.addDiaryEntry(this.key, true);

    // Ставим флаг mirrorQuestReady, чтобы можно было снова запустить mirror-quest или
    // иные действия, связанные с зеркалом.
    StateManager.set("mirrorQuestReady", "true");

    // УБРАНО: StateManager.set("isRepeatingCycle", "true");
    // Теперь повторяющийся квест не запустится «вне очереди».

    // Включаем «Пост» через ViewManager.
    if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === "function") {
      this.app.viewManager.setPostButtonEnabled(true);
    }

    // Если есть метод триггера зеркального эффекта — вызываем.
    if (this.app.visualEffectsManager && typeof this.app.visualEffectsManager.triggerMirrorEffect === 'function') {
      this.app.visualEffectsManager.triggerMirrorEffect();
    }

    // (Опционально) пересинхронизировать квест-состояние, если нужно
    // if (this.app.questManager && typeof this.app.questManager.syncQuestState === "function") {
    //   await this.app.questManager.syncQuestState();
    // }

    console.log("[PostMirrorEvent] Mirror quest cycle ended; waiting for user action.");
  }
}