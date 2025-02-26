// File: baseRepeatingQuest.js
import { BaseEvent } from '../events/baseEvent.js';

export class BaseRepeatingQuest extends BaseEvent {
  constructor(eventManager, appInstance, config = {}) {
    super(eventManager);
    this.app = appInstance;
    this.key = config.key || "repeating_quest";
    this.doneKey = config.doneKey || (this.key + "_done");

    // UI element IDs
    this.statusElementId = config.statusElementId || "repeating-quest-status";
    this.shootButtonId = config.shootButtonId || "btn_shoot";

    // Quest state
    this.totalStages = config.totalStages || 3;
    this.currentStage = 1;
    this.finished = false;
  }

  /**
   * activate – Активирует повторяющийся квест.
   * Теперь всегда сбрасываем состояние, чтобы при повторном запуске кнопка "Заснять" была активна.
   */
  async activate() {
    this.resetCycle(); // Всегда сбрасываем состояние нового цикла
    console.log(`Activating repeating quest: ${this.key}`);
    await this.eventManager.addDiaryEntry(this.key, true);
    console.log(`[BaseRepeatingQuest] Repeating quest started with ${this.totalStages} stages`);

    if (!this.app.isCameraOpen) {
      console.log("[BaseRepeatingQuest] Camera is not open. Waiting for cameraReady event...");
      await new Promise(resolve => {
        const onCameraReady = () => {
          document.removeEventListener("cameraReady", onCameraReady);
          resolve();
        };
        document.addEventListener("cameraReady", onCameraReady);
      });
    }
    this.startCheckLoop();
  }

  /**
   * startCheckLoop – Обновляет UI повторяющегося квеста.
   * Делает кнопку «Заснять» видимой и активной, назначая ей одноразовый обработчик.
   */
  startCheckLoop() {
    const statusDiv = document.getElementById(this.statusElementId);
    if (statusDiv) {
      statusDiv.style.display = "block";
      statusDiv.textContent = `Repeating quest – Stage ${this.currentStage} of ${this.totalStages}`;
    }
    const shootBtn = document.getElementById(this.shootButtonId);
    if (shootBtn) {
      shootBtn.style.display = "inline-block";
      shootBtn.disabled = false;
      shootBtn.style.pointerEvents = "auto";
      // Удаляем предыдущий обработчик, если он был назначен
      shootBtn.onclick = null;
      // Назначаем одноразовый обработчик клика
      shootBtn.onclick = () => {
        // Сразу отключаем кнопку, чтобы предотвратить повторные нажатия
        shootBtn.disabled = true;
        shootBtn.style.pointerEvents = "none";
        this.finishStage();
      };
      console.log(`[BaseRepeatingQuest] Shoot button enabled for stage ${this.currentStage}.`);
    } else {
      console.error("[BaseRepeatingQuest] Shoot button not found in the DOM.");
    }
    console.log("[BaseRepeatingQuest] Repeating quest UI updated. Awaiting user action to capture snapshot.");
  }

  /**
   * finishStage – Завершает один этап квеста.
   * Снимает снимок (без дополнительных проверок), добавляет запись в дневник и завершает цикл.
   */
  async finishStage() {
    if (this.finished) return;
    const shootBtn = document.getElementById(this.shootButtonId);
    if (shootBtn) {
      shootBtn.disabled = true;
      shootBtn.style.pointerEvents = "none";
    }
    const photoData = this.captureSimplePhoto();
    console.log(`[BaseRepeatingQuest] Captured snapshot for stage ${this.currentStage}.`);
    await this.eventManager.addDiaryEntry(
      `repeating_stage_${this.currentStage} [photo attached]\n${photoData}`,
      false
    );
    console.log(`[BaseRepeatingQuest] Completed stage: ${this.currentStage}`);
    this.currentStage++;
    
    if (this.currentStage <= this.totalStages) {
      // Если повторяющийся квест состоит из нескольких этапов,
      // можно вызвать startCheckLoop() для следующего этапа.
      // Если же требуется завершить квест после одного цикла, вызываем finish():
      await this.finish();
    } else {
      await this.finish();
    }
  }

  /**
   * finish – Завершает повторяющийся квест.
   * Скрывает UI, логирует завершение и активирует событие post_repeating_event.
   */
async finish() {
  const statusDiv = document.getElementById(this.statusElementId);
  if (statusDiv) {
    statusDiv.style.display = "none";
  }
  const shootBtn = document.getElementById(this.shootButtonId);
  if (shootBtn) {
    shootBtn.disabled = true;
    shootBtn.style.pointerEvents = "none";
  }
  this.finished = true;
  console.log(`[BaseRepeatingQuest] All ${this.totalStages} stages completed!`);
  await this.eventManager.addDiaryEntry(`${this.key}_complete`, true);
  // Вместо немедленной активации повторяющегося события, 
  // устанавливаем флаг, сигнализирующий о завершении повторяющегося квеста.
  this.pendingFinal = true;
  console.log("[BaseRepeatingQuest] Repeating quest finished. Waiting for 'Запостить' to trigger final event.");
}

  /**
   * captureSimplePhoto – Захватывает снимок с активной камеры и возвращает data URL изображения.
   */
  captureSimplePhoto() {
    const video = this.app.cameraSectionManager?.videoElement;
    if (!video || !video.srcObject) {
      console.warn("[BaseRepeatingQuest] Camera is not active — returning an empty string");
      return "";
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  }

  /**
   * resetCycle – Сбрасывает состояние повторяющегося квеста для нового цикла.
   */
  resetCycle() {
    this.finished = false;
    this.currentStage = 1;
    console.log("[BaseRepeatingQuest] Quest state has been reset for a new cycle.");
  }
}