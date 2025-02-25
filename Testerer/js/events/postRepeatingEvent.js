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
    console.log(`[PostRepeatingEvent] Activating event '${this.key}': Logging invitation for repeating quest`);
    
    // Логируем событие как сообщение от призрака
    await this.eventManager.addDiaryEntry(this.key, true);
    
    // Устанавливаем флаг, аналогичный WelcomeEvent, чтобы активировать кнопку "Запостить"
    localStorage.setItem("mirrorQuestReady", "true");
    this.app.questManager.updatePostButtonState();
    this.app.visualEffectsManager.triggerMirrorEffect();
  }
}