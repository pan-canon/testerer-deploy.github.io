import { BaseEvent } from '../events/baseEvent.js';

/**
 * BaseRepeatingQuest – базовый класс для повторяющихся этапов квеста.
 * Пример: нужно несколько раз «сделать фото», «отправить пост» и т.д.
 * до того, как квест будет считаться завершённым.
 */
export class BaseRepeatingQuest extends BaseEvent {
  /**
   * @param {EventManager} eventManager
   * @param {App} appInstance
   * @param {Object} config - Например: { key: 'repeating_quest', totalStages: 3, ... }
   */
  constructor(eventManager, appInstance, config = {}) {
    super(eventManager);

    this.app      = appInstance;
    // Если передан key в config, используем его, иначе "repeating_quest".
    this.key      = config.key || "repeating_quest";
    // doneKey – для логирования окончания (если понадобится).
    this.doneKey  = this.key + "_done";

    // Количество этапов (например, количество букв, которые нужно собрать)
    this.totalStages   = config.totalStages || 3;
    this.currentStage  = 1;
    this.finished      = false;
  }

  /**
   * activate – активирует повторяющийся квест.
   * Если событие (квест) ещё не в дневнике, логируем
   * и при желании ставим флаг (например, repeatingQuestActive) в localStorage.
   */
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`Активируем повторяющийся квест: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key, true);
    }
    // localStorage.setItem("repeatingQuestActive", "true");
  }

  /**
   * checkStatus – проверка, готов ли квест перейти на следующий этап.
   * Здесь может быть любая логика (например, снимок, пост, поиск буквы и т.д.).
   * Пока заглушка => true (всегда успешно).
   */
  async checkStatus() {
    console.log(`[BaseRepeatingQuest] Проверяем этап ${this.currentStage}/${this.totalStages}`);
    return true;
  }

  /**
   * finish – завершает ОДИН этап квеста.
   * Если currentStage < totalStages, переходим к следующему. Иначе квест закончен (finished = true).
   */
  async finish() {
    if (this.finished) return;

    const success = await this.checkStatus();
    if (!success) {
      alert("❌ Этап не пройден, повторите попытку!");
      return;
    }

    // Допустим, на каждом этапе публикуем запись в дневник
    await this.eventManager.addDiaryEntry(`repeating_stage_${this.currentStage}`, false);
    console.log(`[BaseRepeatingQuest] Завершён этап: ${this.currentStage}`);

    this.currentStage++;
    if (this.currentStage > this.totalStages) {
      // Все этапы пройдены, считаем квест завершённым
      this.finished = true;
      console.log(`[BaseRepeatingQuest] Все ${this.totalStages} этапов пройдены!`);
      // Добавляем запись о завершении (если нужно)
      await this.eventManager.addDiaryEntry(`${this.key}_complete`, true);

      // После успешного завершения запускаем финальный квест/событие (при желании)
      // Например:
      // this.app.questManager.activateQuest("final_quest");
      // или 
      // this.app.gameEventManager.activateEvent("final_event");

    } else {
      alert(`Этап ${this.currentStage - 1} завершён. Переход к этапу ${this.currentStage}.`);
    }
  }
}