import { BaseEvent } from '../events/baseEvent.js';

/**
 * FinalQuest – финальный квест, который означает полное завершение логики (например, закончились буквы/явления).
 */
export class FinalQuest extends BaseEvent {
  /**
   * @param {EventManager} eventManager
   * @param {App} appInstance
   * @param {Object} [config] - { key: "final_quest" } и т.п.
   */
  constructor(eventManager, appInstance, config = {}) {
    super(eventManager);
    this.app      = appInstance;
    this.key      = config.key || "final_quest";
    this.finished = false;
  }

  /**
   * activate – логируем начало финального квеста (если не логировалось).
   */
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`[FinalQuest] Активируем финальный квест: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key, true);
    }
    console.log("[FinalQuest] Финальный квест запущен.");
    // localStorage.setItem("finalQuestActive", "true");
  }

  /**
   * checkStatus – можно сделать любую проверку (например, нужно ещё раз сделать снимок).
   * Пока что всегда true.
   */
  async checkStatus() {
    return true;
  }

  /**
   * finish – завершает финальный квест:
   *  1) Проверяем условия (checkStatus)
   *  2) Логируем
   *  3) Ставим флаги/вызываем GhostManager.finishCurrentGhost()
   */
  async finish() {
    if (this.finished) return;
    const success = await this.checkStatus();
    if (!success) {
      alert("❌ Условия финального квеста не выполнены!");
      return;
    }

    this.finished = true;
    console.log(`[FinalQuest] Завершаем квест: ${this.key}`);
    
    // Логируем
    await this.eventManager.addDiaryEntry(`${this.key}_completed`, true);

    // Считаем сценарий завершённым
    if (this.app.ghostManager) {
      this.app.ghostManager.finishCurrentGhost();
    }

    alert("🎉 Финальный квест завершён! Сценарий окончен!");

    // При желании можно отключить UI, спрятать кнопки, запустить событие postFinal
    // this.app.gameEventManager.activateEvent("post_final_celebration");
  }
}