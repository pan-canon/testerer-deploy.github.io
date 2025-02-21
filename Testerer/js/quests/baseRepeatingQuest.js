import { BaseEvent } from '../events/baseEvent.js';

/**
 * BaseRepeatingQuest – несколько этапов "сделать снимок", но без проверки сходства.
 */
export class BaseRepeatingQuest extends BaseEvent {
  constructor(eventManager, appInstance, config = {}) {
    super(eventManager);
    this.app            = appInstance;
    this.key            = config.key || "repeating_quest";
    this.doneKey        = config.doneKey || (this.key + "_done");

    this.statusElementId = config.statusElementId || "repeating-quest-status";
    this.shootButtonId   = config.shootButtonId   || "btn_shoot";

    this.totalStages  = config.totalStages || 3;
    this.currentStage = 1;
    this.finished     = false;
  }

  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`Активируем повторяющийся квест: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key, true); // ghost-post или user-post – на ваше усмотрение
    }
    console.log(`[BaseRepeatingQuest] Запущен квест с ${this.totalStages} этапами`);
    this.startCheckLoop();
  }

  startCheckLoop() {
    // Просто показываем статус и даём нажать «Заснять»
    const statusDiv = document.getElementById(this.statusElementId);
    if (statusDiv) {
      statusDiv.style.display = "block";
      statusDiv.textContent = `Повторяющийся квест — этап ${this.currentStage} / ${this.totalStages}`;
    }
    const shootBtn = document.getElementById(this.shootButtonId);
    if (shootBtn) {
      shootBtn.style.display = "inline-block";
      shootBtn.disabled = false;
      // при клике завершаем ОДИН этап
      shootBtn.addEventListener("click", this.finishStageOnce.bind(this), { once: true });
    }
  }

  stopCheckLoop() {
    const statusDiv = document.getElementById(this.statusElementId);
    if (statusDiv) {
      statusDiv.style.display = "none";
    }
    const shootBtn = document.getElementById(this.shootButtonId);
    if (shootBtn) {
      shootBtn.style.display = "none";
    }
  }

  // Нужен маленький «хелпер», чтобы каждый раз заново вешать {once:true}
  finishStageOnce() {
    this.finishStage().catch(console.error);
  }

  /**
   * finishStage – завершает 1 этап:
   *  1) Делаем упрощённый снимок, пишем в дневник
   *  2) currentStage++
   *  3) Если достигли totalStages => finish(), иначе обновляем UI, снова вешаем {once:true}
   */
  async finishStage() {
    if (this.finished) return;

    // 1) Упрощённый снимок (не сравниваем ничего)
    const photoData = this.captureSimplePhoto();
    await this.eventManager.addDiaryEntry(
      `repeating_stage_${this.currentStage} [photo attached]\n${photoData}`,
      false
    );
    console.log(`[BaseRepeatingQuest] Завершён этап: ${this.currentStage}`);

    this.currentStage++;
    if (this.currentStage > this.totalStages) {
      // Все этапы пройдены
      await this.finish();
    } else {
      // Ещё не всё, обновляем статус, снова вешаем click
      const statusDiv = document.getElementById(this.statusElementId);
      if (statusDiv) {
        statusDiv.textContent = `Повторяющийся квест — этап ${this.currentStage} / ${this.totalStages}`;
      }
      const shootBtn = document.getElementById(this.shootButtonId);
      if (shootBtn) {
        shootBtn.addEventListener("click", this.finishStageOnce.bind(this), { once: true });
      }
    }
  }

  /**
   * finish – общий финиш квеста: логируем, вызываем финальный квест, скрываем UI
   */
  async finish() {
    this.finished = true;
    this.stopCheckLoop();

    console.log(`[BaseRepeatingQuest] Все ${this.totalStages} этапов пройдены!`);
    await this.eventManager.addDiaryEntry(`${this.key}_complete`, false);

    // Запускаем финальный квест:
    console.log(`[BaseRepeatingQuest] Запускаем final_quest...`);
    this.app.questManager.activateQuest("final_quest");
  }

  /**
   * captureSimplePhoto – просто берём текущий кадр.
   */
  captureSimplePhoto() {
    const video = this.app.cameraSectionManager?.videoElement;
    if (!video || !video.srcObject) {
      console.warn("[BaseRepeatingQuest] Камера не активна. Возвращаем пустую строку.");
      return "";
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth  || 640;
    canvas.height= video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  }
}