import { BaseQuest } from './baseQuest.js';

export class MirrorQuest extends BaseQuest {
  /**
   * @param {EventManager} eventManager
   * @param {App} appInstance – ссылка на основной объект App для вызова compareCurrentFrame()
   */
  constructor(eventManager, appInstance) {
    super(eventManager);
    this.app = appInstance;
    this.key = "mirror_quest";
    this.doneKey = "mirror_done";
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
    // Если квест уже завершён – ничего не делаем
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
      if (cameraBtn) cameraBtn.classList.remove("glowing");
      localStorage.removeItem("mirrorQuestActive");
      
      alert("✅ Задание «подойти к зеркалу» выполнено!");
    } else {
      alert("❌ Нет совпадения! Попробуйте ещё раз!");
    }
  }

  /**
   * Новый метод для активации квеста при запуске камеры.
   * Он внутри проверяет флаг mirrorQuestActive и, если он установлен, запускает проверку.
   */
  async activateOnCamera() {
    if (localStorage.getItem("mirrorQuestActive") === "true") {
      console.log("MirrorQuest: флаг mirrorQuestActive установлен – запускаем квест.");
      await this.finish();
    } else {
      console.log("MirrorQuest: флаг mirrorQuestActive не установлен, квест не запускается.");
    }
  }
}
