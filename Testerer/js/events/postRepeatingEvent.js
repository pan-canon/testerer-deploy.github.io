import { BaseEvent } from './baseEvent.js';

/**
 * PostRepeatingEvent – короткое событие,
 * которое вызывается ПОСЛЕ успеха RepeatingQuest.
 * Его задача – запустить FinalQuest.
 */
export class PostRepeatingEvent extends BaseEvent {
  constructor(eventManager, appInstance) {
    super(eventManager);
    this.app = appInstance;
    this.key = "post_repeating_event";
  }

  async activate() {
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`[PostRepeatingEvent] Событие '${this.key}' уже зарегистрировано, пропускаем.`);
      return;
    }
    console.log(`[PostRepeatingEvent] Активация события '${this.key}'.`);

    // Логируем
    await this.eventManager.addDiaryEntry(this.key, true);

    // Запускаем финальный квест
    console.log("[PostRepeatingEvent] Запускаем 'final_quest'...");
    await this.app.questManager.activateQuest("final_quest");
  }
}