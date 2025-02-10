import { BaseQuest } from './baseQuest.js';

export class MirrorQuest extends BaseQuest {
  /**
   * @param {EventManager} eventManager – менеджер событий
   * @param {App} appInstance – ссылка на основной объект App для доступа к камере и т.д.
   */
  constructor(eventManager, appInstance) {
    super(eventManager);
    this.app = appInstance;
    this.key = "mirror_quest";
    this.doneKey = "mirror_done";
    
    // Регистрируем обработчики событий непосредственно в квесте
    this.registerEvents();
  }

  registerEvents() {
    const cameraBtn = document.getElementById("toggle-camera");
    if (cameraBtn) {
      cameraBtn.addEventListener("click", async () => {
        if (localStorage.getItem("mirrorQuestActive") === "true") {
          console.log("🪞 Запущена проверка зеркального квеста через событие кнопки");
          await this.finish();
        }
      });
    }
  }

  async checkStatus() {
    console.log("🪞 Mirror quest активно. Запускаем проверку...");
    return new Promise(resolve => {
      setTimeout(async () => {
        console.log("⏱ Запуск compareCurrentFrame() через 3 сек...");
        const success = await this.app.compareCurrentFrame();
        console.log("⏱ Результат compareCurrentFrame():", success);
        resolve(success);
      }, 3000);
    });
  }

  async finish() {
    if (this.eventManager.isEventLogged(this.doneKey)) {
      console.log(`Quest "${this.key}" уже выполнен, повторная проверка не требуется.`);
      return;
    }

    const success = await this.checkStatus();
    if (success) {
      if (!this.eventManager.isEventLogged(this.doneKey)) {
        await this.eventManager.addDiaryEntry(this.doneKey);
        await this.eventManager.addDiaryEntry("what_was_it", this.app.lastMirrorPhoto);
      }
      const cameraBtn = document.getElementById("toggle-camera");
      if (cameraBtn) {
        cameraBtn.classList.remove("glowing");
      }
      localStorage.removeItem("mirrorQuestActive");
      alert("✅ Задание «подойти к зеркалу» выполнено!");

      // После успешного завершения зеркального квеста запускаем цепочку призрака 1
      if (this.app.ghostManager) {
        this.app.ghostManager.triggerNextPhenomenon();
      }
    } else {
      alert("❌ Нет совпадения! Попробуйте ещё раз!");
    }
  }
}