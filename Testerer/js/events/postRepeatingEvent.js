import { BaseEvent } from './baseEvent.js';

export class PostRepeatingEvent extends BaseEvent {
  constructor(eventManager, appInstance) {
    super(eventManager);
    this.app = appInstance;
    this.key = "post_repeating_event";
  }

  async activate() {
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`[PostRepeatingEvent] Event '${this.key}' is already logged, skipping activation.`);
      return;
    }
    console.log(`[PostRepeatingEvent] Activating event '${this.key}': advancing ghost phenomenon`);
    
    // Логируем событие как сообщение от призрака
    await this.eventManager.addDiaryEntry(this.key, true);
    
    // Продвигаем явление призрака (если оно ещё доступно)
    await this.app.ghostManager.triggerNextPhenomenon();
    
    // Если призрак ещё не завершён, активируем возможность нового цикла:
    const ghost = this.app.ghostManager.getCurrentGhost();
    if (ghost && !ghost.isFinished) {
      localStorage.setItem("mirrorQuestReady", "true");
      this.app.questManager.updatePostButtonState();
      // Запускаем визуальный эффект для сигнализации о готовности
      this.app.visualEffectsManager.triggerMirrorEffect();
      console.log(`[PostRepeatingEvent] New cycle initiated: mirrorQuestReady flag set to true`);
    } else {
      console.log(`[PostRepeatingEvent] Ghost '${ghost ? ghost.name : "undefined"}' is finished. No new cycle initiated.`);
    }
  }
}