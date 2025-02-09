// QuestManager.js
import { GhostEvent1 } from './ghosts/ghostEvent1.js';

export class QuestManager {
  constructor(eventManager, appInstance) {
    this.eventManager = eventManager;
    this.app = appInstance;
    this.quests = [new GhostEvent1(this.eventManager, this.app, this.app.languageManager)];
  }

  // Активируем квест
  async activateQuest() {
    const currentQuest = this.quests[this.app.ghostManager.currentGhostId - 1];
    await currentQuest.activate();
  }

  // Проверяем и завершаем квест
  async checkQuest() {
    const currentQuest = this.quests[this.app.ghostManager.currentGhostId - 1];
    await currentQuest.finishStage();
  }
}
