// GhostEvent1.js
import { BaseEvent } from '../events/baseEvent.js';

export class GhostEvent1 extends BaseEvent {
  constructor(eventManager, appInstance, languageManager) {
    super(eventManager, appInstance, languageManager);
    this.stages = [
      { key: "stage_1", text: "Этап 1 – Звонок" },
      { key: "stage_2", text: "Этап 2" },
      { key: "stage_3", text: "Этап 3" }
    ];
    this.finalText = "Финальное явление – блогер погиб!";
    this.activate();
  }

  // Логика для завершения текущего этапа и перехода к следующему
  async finishStage() {
    // Если это этап с звонком, вызываем его
    if (this.currentStage === 0) {
      await this.handleCall();
    } else {
      await super.advanceStage();  // Переходим к следующему этапу
    }
  }
}