import { BaseEvent } from './baseEvent.js';

/**
 * PostMirrorEvent – короткое событие, 
 * которое вызывается ПОСЛЕ успеха зеркального квеста.
 * Его задача – запустить RepeatingQuest.
 */
export class PostMirrorEvent extends BaseEvent {
  constructor(eventManager, appInstance) {
    super(eventManager);
    this.app = appInstance;
    // Уникальный ключ данного события
    this.key = "post_mirror_event";
  }

  async activate() {
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`[PostMirrorEvent] Событие '${this.key}' уже зарегистрировано, пропускаем.`);
      return;
    }
    console.log(`[PostMirrorEvent] Активируем событие '${this.key}'.`);

    // Логируем
    await this.eventManager.addDiaryEntry(this.key, true);

    // Запускаем RepeatingQuest
    console.log("[PostMirrorEvent] Запускаем 'repeating_quest'...");
    await this.app.questManager.activateQuest("repeating_quest");
  }
}