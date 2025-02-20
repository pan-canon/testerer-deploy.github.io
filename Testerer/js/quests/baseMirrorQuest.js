import { BaseEvent } from '../events/baseEvent.js';
import { ImageUtils } from '../utils/imageUtils.js';

/**
 * BaseMirrorQuest – базовый класс для зеркального квеста.
 * Инкапсулирует логику сравнения текущего кадра (canvas → grayscale → compare),
 * управление циклом проверки состояния (startCheckLoop/stopCheckLoop),
 * и обновление UI, связанного с зеркальным квестом (кнопка "Заснять", статус).
 */
export class BaseMirrorQuest extends BaseEvent {
  /**
   * @param {EventManager} eventManager - Менеджер дневника.
   * @param {App} appInstance - Основной объект приложения.
   * @param {Object} [config] - Дополнительная конфигурация (например, ID UI-элементов).
   */
  constructor(eventManager, appInstance, config = {}) {
    super(eventManager);
    this.app       = appInstance;
    this.key       = config.key || "mirror_quest";  // Позволяет переопределить ключ
    this.doneKey   = config.doneKey || "mirror_done";

    // UI
    this.statusElementId = config.statusElementId || "mirror-quest-status";
    this.shootButtonId   = config.shootButtonId   || "btn_shoot";

    // Вспомогательные флаги/переменные
    this.checkInterval = null; // Для startCheckLoop
    this.finished      = false;

    // Канвас для сравнения
    this.tempCanvas = document.createElement("canvas");
    this.tempCtx    = this.tempCanvas.getContext("2d");

    this.registerEvents();
  }

  /**
   * registerEvents – регистрирует обработчики для UI элементов.
   * При желании можно навесить события на кнопки прямо тут или в QuestManager.
   */
  registerEvents() {
    // Пусто: зависит от того, хотим ли мы делать что-то сразу при конструкте
  }

  /**
   * activate – запускает зеркальный квест:
   *  1) Логируем в дневник (если не логирован).
   *  2) Устанавливаем флаг mirrorQuestActive.
   *  3) (Опционально) Можем разблокировать кнопку "Заснять" или камеру.
   */
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`Активируем событие: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key);
    }
    console.log("[BaseMirrorQuest] Зеркальный квест запущен.");
    localStorage.setItem("mirrorQuestActive", "true");
  }

  /**
   * startCheckLoop – запускает интервал, каждые 2 сек проверяем, "перед зеркалом" ли игрок.
   * Обновляем UI (statusDiv, shootBtn).
   */
  startCheckLoop() {
    if (this.checkInterval) return; // уже запущен
    const statusDiv = document.getElementById(this.statusElementId);
    if (statusDiv) {
      statusDiv.style.display = "block";
      statusDiv.textContent    = "Нет совпадения...";
    }
    const shootBtn = document.getElementById(this.shootButtonId);
    if (shootBtn) {
      shootBtn.style.display = "inline-block";
      shootBtn.disabled       = true;
      shootBtn.addEventListener("click", () => this.finish(), { once: true });
    }

    this.checkInterval = setInterval(async () => {
      const success = await this.checkStatus();
      if (statusDiv) {
        statusDiv.textContent = success
          ? "Вы перед зеркалом!"
          : "Нет совпадения...";
      }
      if (shootBtn) {
        shootBtn.disabled = !success;
      }
    }, 2000);
  }

  /**
   * stopCheckLoop – останавливает цикл проверки и скрывает UI.
   */
  stopCheckLoop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
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
   * checkStatus – проверяем, "перед зеркалом" ли игрок
   * (пиксельное/гистограммное сравнение).
   */
  async checkStatus() {
    console.log("[BaseMirrorQuest] checkStatus() -> compareFrameInternally()");
    return await this.compareFrameInternally();
  }

  /**
   * compareFrameInternally – сравниваем текущий кадр камеры с сохранённым селфи.
   * @returns {boolean} true, если сходство выше порога, иначе false.
   */
  async compareFrameInternally() {
    // Если нет селфи – false
    if (!this.app.selfieData) {
      console.warn("[BaseMirrorQuest] ❌ Нет сохранённого селфи (app.selfieData)");
      return false;
    }
    // Проверяем камеру
    const videoEl = this.app.cameraSectionManager?.videoElement;
    if (!videoEl || !videoEl.srcObject) {
      console.warn("[BaseMirrorQuest] ❌ Камера не активна!");
      return false;
    }

    // Настраиваем канвас
    this.tempCanvas.width  = videoEl.videoWidth  || 640;
    this.tempCanvas.height = videoEl.videoHeight || 480;
    this.tempCtx.drawImage(videoEl, 0, 0, this.tempCanvas.width, this.tempCanvas.height);

    // Преобразуем в оттенки серого
    const currentFrameData = ImageUtils.convertToGrayscale(this.tempCanvas);

    // Сравнение
    const matchPixel = ImageUtils.pixelWiseComparison(this.app.selfieData, currentFrameData);
    const matchHist  = ImageUtils.histogramComparison(this.app.selfieData, currentFrameData);
    console.log(`[BaseMirrorQuest] pixel=${matchPixel.toFixed(2)}, hist=${matchHist.toFixed(2)}`);

    const success = (matchPixel > 0.6 && matchHist > 0.7);
    if (success) {
      // Сохраняем для отчёта (дневник)
      this.app.lastMirrorPhoto = currentFrameData;
    }
    return success;
  }

  /**
   * finish – завершаем зеркальный квест:
   *  1) Останавливаем проверку.
   *  2) checkStatus + логируем результат.
   *  3) Снимаем "mirrorQuestActive", обновляем пост/камеру.
   *  4) При желании запускаем следующий квест (repeating_quest или final_quest).
   */
  async finish() {
    if (this.finished) return;
    this.finished = true;

    this.stopCheckLoop();
    const success = await this.checkStatus();

    // Логируем результат
    const ghost = this.app.ghostManager.getCurrentGhost();
    const randomLetter = ghost ? this.getRandomLetter(ghost.name) : "";
    if (success) {
      const photoData = this.app.lastMirrorPhoto
        ? ` [photo attached]\n${this.app.lastMirrorPhoto}`
        : "";
      await this.eventManager.addDiaryEntry(`user_post_success: ${randomLetter}${photoData}`, false);
      const statusDiv = document.getElementById(this.statusElementId);
      if (statusDiv) {
        statusDiv.textContent = "✅ Задание «подойти к зеркалу» выполнено!";
        setTimeout(() => statusDiv.style.display = "none", 2000);
      }
    } else {
      await this.eventManager.addDiaryEntry(`user_post_failed: ${randomLetter}`, false);
      const statusDiv = document.getElementById(this.statusElementId);
      if (statusDiv) {
        statusDiv.textContent = "❌ Квест проигнорирован!";
        setTimeout(() => statusDiv.style.display = "none", 2000);
      }
    }

    // Убираем флаг активности зеркального квеста
    localStorage.removeItem("mirrorQuestActive");
    this.app.questManager.updatePostButtonState();

    // Снимаем glow с кнопки камеры
    const cameraBtn = document.getElementById("toggle-camera");
    if (cameraBtn) {
      cameraBtn.classList.remove("glowing");
    }

    // --- При желании можно автоматом запустить следующий квест:
    this.app.questManager.activateQuest("repeating_quest"); 
    // Или финальный: this.app.questManager.activateQuest("final_quest");
  }

  /**
   * getRandomLetter – возвращает случайную букву из имени призрака.
   */
  getRandomLetter(name) {
    if (!name) return "";
    const letters = name.replace(/[^A-Za-zА-Яа-яЁё]/g, '').split('');
    if (!letters.length) return '';
    return letters[Math.floor(Math.random() * letters.length)];
  }
}