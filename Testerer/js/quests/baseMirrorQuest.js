import { BaseEvent } from '../events/baseEvent.js';

/**
 * BaseMirrorQuest – базовый класс для зеркального квеста.
 * 
 * Логика "compareCurrentFrame" вызывается либо через this.app.compareCurrentFrame(),
 * либо реализуем прямо здесь, если хотим инкапсулировать.
 */
export class BaseMirrorQuest extends BaseEvent {
  constructor(eventManager, appInstance) {
    super(eventManager);
    this.app = appInstance;
    this.key = "mirror_quest";
    this.doneKey = "mirror_done";
    this.checkInterval = null;

    this.registerEvents();
  }

  registerEvents() {
    // Пустой; можно расширять
  }

  /**
   * activate – ставим mirrorQuestActive = true, логируем запись,
   * запускаем startCheckLoop.
   */
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`Активируем событие: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key);
    }
    console.log("[BaseMirrorQuest] Зеркальный квест запущен.");

    localStorage.setItem("mirrorQuestActive", "true");
    this.startCheckLoop();
  }

  /**
   * startCheckLoop – каждые 2с проверяем кадр, обновляем #mirror-quest-status,
   * разблокируем #btn_shoot при успехе.
   */
  startCheckLoop() {
    if (this.checkInterval) return;

    const statusDiv = document.getElementById("mirror-quest-status");
    if (statusDiv) {
      statusDiv.style.display = "block";
      statusDiv.textContent = "Нет совпадения...";
    }
    const shootBtn = document.getElementById("btn_shoot");
    if (shootBtn) {
      shootBtn.style.display = "inline-block";
      shootBtn.disabled = true;

      // По нажатию – finish
      shootBtn.addEventListener("click", () => this.finish(), { once: true });
    }

    this.checkInterval = setInterval(async () => {
      const success = await this.checkStatus();
      if (statusDiv) {
        statusDiv.textContent = success ? "Вы перед зеркалом!" : "Нет совпадения...";
      }
      if (shootBtn) {
        shootBtn.disabled = !success;
      }
    }, 2000);
  }

  /**
   * stopCheckLoop – убираем интервал, скрываем UI.
   */
  stopCheckLoop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    const statusDiv = document.getElementById("mirror-quest-status");
    if (statusDiv) {
      statusDiv.style.display = "none";
    }
    const shootBtn = document.getElementById("btn_shoot");
    if (shootBtn) {
      shootBtn.style.display = "none";
      // Доп. логика очистки обработчиков, если нужно
    }
  }

  /**
   * checkStatus – быстро вызываем app.compareCurrentFrame (если оставили в App),
   * возвращаем true/false. Или переносим логику compareCurrentFrame сюда.
   */
  async checkStatus() {
    console.log("[BaseMirrorQuest] checkStatus() -> compareCurrentFrame()");
    const success = await this.app.compareCurrentFrame(); 
    // или: const success = this.compareFrameInternally(); // если в этом классе
    return success;
  }

  /**
   * finish – когда пользователь «Заснял» или при успехе:
   *  1) Останавливаем checkLoop,
   *  2) Делем финальную проверку (this.checkStatus()),
   *  3) Логируем в дневник,
   *  4) Убираем mirrorQuestActive и снимаем glow с кнопки камеры,
   *  5) Вызываем this.app.questManager.updatePostButtonState() (если надо).
   */
  async finish() {
    this.stopCheckLoop();

    const success = await this.checkStatus();

    // Логика дневника
    const ghost = this.app.ghostManager.getCurrentGhost();
    const randomLetter = this.getRandomLetter(ghost.name);

    if (success) {
      const photoData = this.app.lastMirrorPhoto
        ? ` [photo attached]\n${this.app.lastMirrorPhoto}`
        : "";
      await this.eventManager.addDiaryEntry(
        `user_post_success: ${randomLetter}${photoData}`, 
        false
      );
      alert("✅ Задание «подойти к зеркалу» выполнено!");
    } else {
      await this.eventManager.addDiaryEntry(
        `user_post_failed: ${randomLetter}`, 
        false
      );
      alert("❌ Квест проигнорирован!");
    }

    localStorage.removeItem("mirrorQuestActive");
    // Обновляем кнопку "Запостить" (если хотим)
    this.app.questManager.updatePostButtonState();

    // Снимаем glow
    const cameraBtn = document.getElementById("toggle-camera");
    if (cameraBtn) {
      cameraBtn.classList.remove("glowing");
    }
  }

  getRandomLetter(name) {
    const letters = name.replace(/[^A-Za-zА-Яа-яЁё]/g, '').split('');
    if (!letters.length) return '';
    const idx = Math.floor(Math.random() * letters.length);
    return letters[idx];
  }
}