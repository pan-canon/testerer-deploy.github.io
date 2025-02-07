// mirrorQuest.js
import { BaseQuest } from './baseQuest.js';

export class MirrorQuest extends BaseQuest {
  /**
   * @param {EventManager} eventManager
   * @param {App} appInstance – для вызова compareCurrentFrame()
   */
  constructor(eventManager, appInstance) {
    super(eventManager);
    this.app = appInstance;
    this.key = "mirror_quest";
    this.doneKey = "mirror_done";
  }

  /**
   * Переопределяем метод проверки статуса квеста.
   * Запускаем сравнение селфи с текущим кадром с задержкой.
   */
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

  /**
   * Переопределяем finish, чтобы запись о завершении добавлялась только один раз.
   */
  async finish() {
    const success = await this.checkStatus();
    if (success) {
      if (!this.eventManager.isEventLogged(this.doneKey)) {
        await this.eventManager.addDiaryEntry(this.doneKey);
      }
      alert("✅ Задание «подойти к зеркалу» выполнено!");
    } else {
      alert("❌ Нет совпадения! Попробуйте ещё раз!");
    }
  }
}
