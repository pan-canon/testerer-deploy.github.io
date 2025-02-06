// questManager.js

export class QuestManager {
  /**
   * @param {EventManager} eventManager - ваш eventManager для работы с дневником
   * @param {App} appInstance - ссылка на App, чтобы вызывать compareCurrentFrame()
   */
  constructor(eventManager, appInstance) {
    this.eventManager = eventManager;
    this.app = appInstance; 
  }

  /**
   * Активируем задание "mirror_quest" в дневнике, если его ещё нет
   */
  async activateMirrorQuest() {
    if (!this.eventManager.isEventLogged("mirror_quest")) {
      console.log("🔔 Активируем задание mirror_quest...");
      await this.eventManager.addDiaryEntry("mirror_quest");
    }
  }

  /**
   * При открытии камеры - проверяем, нужно ли делать зеркальную проверку.
   * Если задание ещё не выполнено, пробуем compareCurrentFrame() и ставим mirror_done при успехе.
   */
  async checkMirrorQuestOnCamera() {
    const hasQuest = this.eventManager.isEventLogged("mirror_quest");
    const doneQuest = this.eventManager.isEventLogged("mirror_done");

    if (hasQuest && !doneQuest) {
      console.log("🪞 Mirror quest активно. Запускаем пиксельное сравнение...");
      // Немного ждём, чтобы камера «раскрутилась» - 2-3 секунды
      setTimeout(async () => {
        const success = await this.app.compareCurrentFrame(); 
        if (success) {
          // Задание выполнено
          await this.eventManager.addDiaryEntry("mirror_done");
          alert("✅ Задание «подойти к зеркалу» выполнено!");
        } else {
          alert("❌ Нет совпадения! Попробуйте ещё раз.");
        }
      }, 3000);
    }
  }
}
