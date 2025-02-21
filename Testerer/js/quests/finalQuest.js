import { BaseEvent } from '../events/baseEvent.js';

export class FinalQuest extends BaseEvent {
  constructor(eventManager, appInstance, config = {}) {
    super(eventManager);
    this.app      = appInstance;
    this.key      = config.key || "final_quest";
    this.finished = false;
  }

  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`[FinalQuest] Активируем финальный квест: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key, true);
    } else {
      console.log(`[FinalQuest] Событие "${this.key}" уже зарегистрировано, пропускаем.`);
    }
  }

  async checkStatus() {
    return true;
  }

  async finish() {
    if (this.finished) return;
    const success = await this.checkStatus();
    if (!success) {
      alert("❌ Условия финального квеста не выполнены!");
      return;
    }

    this.finished = true;
    console.log(`[FinalQuest] Завершаем квест: ${this.key}`);
    await this.eventManager.addDiaryEntry(`${this.key}_completed`, true);

    if (this.app.ghostManager) {
      this.app.ghostManager.finishCurrentGhost();
    }
    alert("🎉 Финальный квест завершён! Сценарий/призрак окончен!");
  }
}