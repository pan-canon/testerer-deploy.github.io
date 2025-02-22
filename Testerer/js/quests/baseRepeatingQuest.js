import { BaseEvent } from '../events/baseEvent.js';

/**
 * BaseRepeatingQuest – Базовый класс для повторяющегося квеста,
 * где игрок должен пройти несколько этапов (например, сделать снимок или пост) без проверки схожести изображений.
 */
export class BaseRepeatingQuest extends BaseEvent {
  /**
   * @param {EventManager} eventManager - Менеджер событий для работы с дневником.
   * @param {App} appInstance - Основной объект приложения.
   * @param {Object} config - Дополнительная конфигурация (например: { key: 'repeating_quest', totalStages: 3, ... })
   */
  constructor(eventManager, appInstance, config = {}) {
    super(eventManager);

    this.app = appInstance;
    this.key = config.key || "repeating_quest";
    this.doneKey = config.doneKey || (this.key + "_done");

    // UI элементы
    this.statusElementId = config.statusElementId || "repeating-quest-status";
    this.shootButtonId = config.shootButtonId || "btn_shoot"; 

    // Общее количество этапов квеста
    this.totalStages = config.totalStages || 3;
    this.currentStage = 1;
    this.finished = false;

    // Регистрация событий для UI, если необходимо
    this.registerEvents();
  }

  /**
   * registerEvents – Дополнительно регистрирует обработчики событий для UI элементов.
   */
  registerEvents() {
    // Можно добавить дополнительные обработчики здесь, если необходимо
  }

  /**
   * activate – Логирует начало квеста (если не было ранее).
   *
   * @returns {Promise<void>}
   */
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`Активируем повторяющийся квест: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key, true);
    }
    console.log(`[BaseRepeatingQuest] Квест с ${this.totalStages} этапами начат.`);
    // Устанавливаем флаг активности квеста
    localStorage.setItem("repeatingQuestActive", "true");
  }

  /**
   * startCheckLoop – Имитируем проверку, обновляем UI (статус и кнопку "Заснять").
   */
  startCheckLoop() {
    const statusDiv = document.getElementById(this.statusElementId);
    if (statusDiv) {
      statusDiv.style.display = "block";
      statusDiv.textContent = `Повторяющийся квест — этап ${this.currentStage} из ${this.totalStages}`;
    }

    const shootBtn = document.getElementById(this.shootButtonId);
    if (shootBtn) {
      shootBtn.style.display = "inline-block";
      shootBtn.disabled = false;
      // Обработчик для завершения этапа
      shootBtn.addEventListener("click", () => this.finishStage(), { once: true });
    }
  }

  /**
   * stopCheckLoop – Останавливает цикл проверки и скрывает UI элементы.
   */
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

  /**
   * finishStage – Завершаем текущий этап квеста:
   * 1) Делаем снимок.
   * 2) Логируем результат в дневник.
   * 3) Переходим к следующему этапу или завершаем квест.
   */
  async finishStage() {
    if (this.finished) return;

    // 1) Делаем снимок
    const photoData = this.captureSimplePhoto();

    // 2) Логируем завершение этапа
    await this.eventManager.addDiaryEntry(
      `repeating_stage_${this.currentStage} [photo attached]\n${photoData}`,
      false
    );
    console.log(`[BaseRepeatingQuest] Завершён этап: ${this.currentStage}`);

    // 3) Увеличиваем счётчик этапов
    this.currentStage++;

    // Если этапы ещё остались — обновляем UI и ждём следующий снимок
    if (this.currentStage <= this.totalStages) {
      const statusDiv = document.getElementById(this.statusElementId);
      if (statusDiv) {
        statusDiv.textContent = `Повторяющийся квест — этап ${this.currentStage} из ${this.totalStages}`;
      }
      const shootBtn = document.getElementById(this.shootButtonId);
      if (shootBtn) {
        shootBtn.addEventListener("click", () => this.finishStage(), { once: true });
      }
    } else {
      // Завершаем квест
      await this.finish();
    }
  }

  /**
   * finish – Завершаем квест полностью.
   * Логируем его завершение, обновляем UI и вызываем событие "post_repeating_event".
   */
  async finish() {
    this.stopCheckLoop();
    this.finished = true;
    console.log(`[BaseRepeatingQuest] Все ${this.totalStages} этапа завершены!`);

    // Логируем завершение квеста в дневнике
    await this.eventManager.addDiaryEntry(`${this.key}_complete`, true);

    // Явно запускаем событие "post_repeating_event"
    this.app.gameEventManager.activateEvent("post_repeating_event");
  }

  /**
   * captureSimplePhoto – Делает простой снимок без проверки схожести.
   * @returns {string} dataURL снимка
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

    // Возвращаем dataURL снимка
    return canvas.toDataURL("image/png");
  }
}