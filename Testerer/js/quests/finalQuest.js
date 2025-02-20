import { BaseEvent } from '../events/baseEvent.js';

/**
 * FinalQuest – пример финального квеста, который завершает призрака / игру.
 * Наследуется от BaseEvent, чтобы при activate() логировать себя в дневник.
 */
export class FinalQuest extends BaseEvent {
  /**
   * @param {EventManager} eventManager  – менеджер дневника (EventManager).
   * @param {App} appInstance           – основной объект приложения.
   * @param {Object} [config]           – конфигурация для финального квеста, например key="final_quest".
   */
  constructor(eventManager, appInstance, config = {}) {
    super(eventManager);
    this.app      = appInstance;
    this.key      = config.key || "final_quest";
    this.finished = false;
  }

  /**
   * activate – активирует финальный квест:
   *  1) Если не логирован – логируем.
   *  2) Можно установить локальные/глобальные флаги, разблокировать что-то и т.д.
   */
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`Активируем финальный квест: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key, true);
    } else {
      console.log(`[FinalQuest] Событие "${this.key}" уже зарегистрировано, пропускаем.`);
    }
    // При желании можно ставить локальные флаги:
    // localStorage.setItem("finalQuestActive", "true");
  }

  /**
   * checkStatus – если хотите добавить проверку условий (камера, снимок, и т.д.).
   * Пока заглушка => true.
   */
  async checkStatus() {
    return true;
  }

  /**
   * finish – завершает финальный квест, логирует его в дневник
   * и сигнализирует, что призрак / сценарий завершены (пример).
   */
  async finish() {
    if (this.finished) return;
    const success = await this.checkStatus();
    if (!success) {
      alert("❌ Условие финального квеста не выполнено!");
      return;
    }

    this.finished = true;
    console.log(`[FinalQuest] Завершаем финальный квест: ${this.key}`);
    
    // Логируем результат
    await this.eventManager.addDiaryEntry(`${this.key}_completed`, true);

    // Считаем призрака / сценарий завершённым
    // Пример: mark ghost as finished
    if (this.app.ghostManager) {
      this.app.ghostManager.finishCurrentGhost();
    }

    alert("🎉 Финальный квест завершён! Поздравляем!");
    // При желании можно вызвать следующее событие или что-то ещё:
    // this.app.gameEventManager.activateEvent("post_final_celebration");
  }
}