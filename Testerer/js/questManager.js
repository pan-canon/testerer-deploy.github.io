export class QuestManager {
  constructor(eventManager, appInstance) {
    this.eventManager = eventManager;
    this.app = appInstance; // нужно для app.compareCurrentFrame()
  }

  /**
   * Активируем mirror_quest, если ещё нет.
   */
  async activateMirrorQuest() {
    if (!this.eventManager.isEventLogged("mirror_quest")) {
      console.log("🔔 Активируем mirror_quest...");
      await this.eventManager.addDiaryEntry("mirror_quest");
    }
  }

  /**
   * Проверяем, если mirror_quest есть, но нет mirror_done:
   * Вызываем compareCurrentFrame() -> при успехе "mirror_done", запись в дневник
   */
  async checkMirrorQuestOnCamera() {
    const hasQuest = this.eventManager.isEventLogged("mirror_quest");
    const doneQuest = this.eventManager.isEventLogged("mirror_done");
    if (hasQuest && !doneQuest) {
      console.log("🪞 Mirror quest активно. Запускаем пиксельное сравнение...");

      setTimeout(async () => {
        const success = await this.app.compareCurrentFrame(); 
        if (success) {
          // Если успех, логируем mirror_done
          if (!this.eventManager.isEventLogged("mirror_done")) {
            await this.eventManager.addDiaryEntry("mirror_done");
          }
          alert("✅ Задание «подойти к зеркалу» выполнено!");
        } else {
          alert("❌ Нет совпадения. Попробуйте ещё раз!");
        }
      }, 3000);
    }
  }
}
