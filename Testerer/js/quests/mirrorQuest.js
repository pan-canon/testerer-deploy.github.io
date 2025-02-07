// mirrorQuest.js
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

  /**
   * Переопределяем метод проверки статуса квеста.
   * Запускаем проверку (например, сравнение селфи с текущим кадром) с задержкой.
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
   * Переопределяем метод завершения квеста так, чтобы он выполнялся только один раз.
   */
  async finish() {
    // Если квест уже завершён – ничего не делаем
    if (this.eventManager.isEventLogged(this.doneKey)) {
      console.log(`Quest "${this.key}" уже выполнен, повторная проверка не требуется.`);
      return;
    }

    const success = await this.checkStatus();
    if (success) {
      // Если запись о завершении ещё не добавлена, добавляем её
      if (!this.eventManager.isEventLogged(this.doneKey)) {
        await this.eventManager.addDiaryEntry(this.doneKey);
      }
      alert("✅ Задание «подойти к зеркалу» выполнено!");
    } else {
      alert("❌ Нет совпадения! Попробуйте ещё раз!");
    }
  }
}