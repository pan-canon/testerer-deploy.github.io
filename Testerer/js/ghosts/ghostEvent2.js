export class GhostEvent2 {
  /**
   * @param {EventManager} eventManager – менеджер событий
   * @param {App} appInstance – ссылка на основной объект приложения
   */
  constructor(eventManager, appInstance) {
    this.eventManager = eventManager;
    this.app = appInstance;
    this.key = "ghost_2";  // Уникальный идентификатор события
    this.doneKey = "ghost_2_done";
  }

  /**
   * При активации события будет происходить проявление второго призрака через VisualEffectsManager
   * и добавление записи в дневник.
   */
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`🔮 Призрак 2 активирован`);
      await this.eventManager.addDiaryEntry(this.key);
      
      // Визуальный эффект для второго призрака
      const effectsManager = new VisualEffectsManager();
      effectsManager.triggerGhostEffect("ghost_2");
    }
  }

  /**
   * Проверка завершенности события.
   */
  async checkStatus() {
    // Логика для проверки завершенности второго призрака
    return true;  // Пример для простоты
  }

  /**
   * Завершение события.
   */
  async finish() {
    const success = await this.checkStatus();
    if (success) {
      if (!this.eventManager.isEventLogged(this.doneKey)) {
        await this.eventManager.addDiaryEntry(this.doneKey);
      }
      alert("🎉 Призрак 2 завершен!");
      
      // Переход к следующему событию или квесту
      if (this.app.ghostManager) {
        this.app.ghostManager.triggerNextPhenomenon();
      }
    } else {
      alert("❌ Призрак 2 не завершен, попробуйте еще раз.");
    }
  }
}