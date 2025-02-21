import { BaseEvent } from '../events/baseEvent.js';

/**
 * BaseRepeatingQuest – базовый класс для повторяющегося квеста,
 * где N раз нужно сделать снимок (или отправить пост), без проверки схожести.
 */
export class BaseRepeatingQuest extends BaseEvent {
  /**
   * @param {EventManager} eventManager - Менеджер дневника
   * @param {App} appInstance - Основной объект приложения
   * @param {Object} config - Например: { key: 'repeating_quest', totalStages: 3, ... }
   */
  constructor(eventManager, appInstance, config = {}) {
    super(eventManager);

    this.app       = appInstance;
    this.key       = config.key || "repeating_quest";
    this.doneKey   = config.doneKey || (this.key + "_done");

    // UI
    // Вы можете указать другие ID, если хотите отдельные кнопки/статусы для повторяющегося квеста
    this.statusElementId = config.statusElementId || "repeating-quest-status";
    this.shootButtonId   = config.shootButtonId   || "btn_shoot"; 

    // Количество раз (этапов), которые надо выполнить
    this.totalStages      = config.totalStages || 3;
    this.currentStage     = 1;
    this.finished         = false;

    // Если квест нужно «активировать» (пост в дневник), 
    // то при activate() можем поставить флаг repeatingQuestActive (необязательно)
    this.registerEvents();
  }

  /**
   * registerEvents – при желании навесить обработчики для UI здесь.
   */
  registerEvents() {
    // Пусто — можно обрабатывать UI в QuestManager
  }

  /**
   * activate – логируем начало (если не логировалось).
   */
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`Активируем повторяющийся квест: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key, true);
    }
    console.log(`[BaseRepeatingQuest] Запущен квест с ${this.totalStages} этапами`);
    // localStorage.setItem("repeatingQuestActive", "true"); // опционально
  }

  /**
   * startCheckLoop – для единообразия с зеркальным квестом можем сделать «псевдо»-проверку,
   * но здесь нет сравнения изображения. Просто включаем UI (statusDiv и shootBtn).
   */
  startCheckLoop() {
    // Можно имитировать логику, схожую с зеркальным квестом
    const statusDiv = document.getElementById(this.statusElementId);
    if (statusDiv) {
      statusDiv.style.display = "block";
      statusDiv.textContent = `Повторяющийся квест — этап ${this.currentStage} из ${this.totalStages}`;
    }

    const shootBtn = document.getElementById(this.shootButtonId);
    if (shootBtn) {
      shootBtn.style.display = "inline-block";
      shootBtn.disabled = false; // в отличие от зеркального
      // Вешаем обработчик клика для снимка
      // Каждое нажатие «Заснять» будет завершать текущий этап
      shootBtn.addEventListener("click", () => this.finishStage(), { once: true });
    }
  }

  /**
   * stopCheckLoop – скрываем UI, убираем обработчики.
   */
  stopCheckLoop() {
    const statusDiv = document.getElementById(this.statusElementId);
    if (statusDiv) {
      statusDiv.style.display = "none";
    }
    const shootBtn = document.getElementById(this.shootButtonId);
    if (shootBtn) {
      shootBtn.style.display = "none";
      // Удалим обработчик «once» не нужно, т.к. он самоуничтожается
    }
  }

  /**
   * finishStage – завершает один этап:
   * 1) Делаем снимок (cam) или создаём «пост», без проверки сравнения
   * 2) Публикуем запись в дневник
   * 3) Если текущий этап < totalStages, переходим к следующему
   * 4) Если текущий этап == totalStages, квест завершён
   */
  async finishStage() {
    if (this.finished) return;

    // 1) «Снимок» — в данном случае не нужно ничего сравнивать;
    //    Просто берём текущий кадр (app.cameraSectionManager.videoElement) и делаем фото
    const photoData = this.captureSimplePhoto();

    // 2) Публикуем в дневник
    await this.eventManager.addDiaryEntry(
      `repeating_stage_${this.currentStage} [photo attached]\n${photoData}`,
      false
    );
    console.log(`[BaseRepeatingQuest] Завершён этап: ${this.currentStage}`);

    // Переходим к следующему этапу
    this.currentStage++;

    // Если не достигли конца — обновляем UI и ждём следующий снимок
    if (this.currentStage <= this.totalStages) {
      const statusDiv = document.getElementById(this.statusElementId);
      if (statusDiv) {
        statusDiv.textContent = `Повторяющийся квест — этап ${this.currentStage} из ${this.totalStages}`;
      }
      // Повторно вешаем обработчик на shootBtn
      const shootBtn = document.getElementById(this.shootButtonId);
      if (shootBtn) {
        shootBtn.addEventListener("click", () => this.finishStage(), { once: true });
      }
    } else {
      // Иначе завершаем квест полностью
      await this.finish();
    }
  }

  /**
   * finish – полное завершение повторяющегося квеста.
   */
  async finish() {
    this.stopCheckLoop();
    this.finished = true;
    console.log(`[BaseRepeatingQuest] Все ${this.totalStages} этапов пройдены!`);

    // Логируем результат
    await this.eventManager.addDiaryEntry(`${this.key}_complete`, true);

    // При желании запускаем финальный квест
    this.app.gameEventManager.activateEvent("post_repeating_event");
  }

  /**
   * captureSimplePhoto – упрощённый снимок без проверки схожести.
   * @returns {string} dataURL полученного снимка
   */
  captureSimplePhoto() {
    const video = this.app.cameraSectionManager?.videoElement;
    if (!video || !video.srcObject) {
      console.warn("[BaseRepeatingQuest] ❌ Камера не активна — возвращаем пустую строку");
      return "";
    }
    // Создаём временный canvas
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Возвращаем base64
    return canvas.toDataURL("image/png");
  }
}