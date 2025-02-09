// BaseEvent.js
export class BaseEvent {
  constructor(eventManager, appInstance, languageManager) {
    this.eventManager = eventManager;
    this.app = appInstance;
    this.languageManager = languageManager;
    this.stages = [];   // Этапы события
    this.finalText = ""; // Финальный текст
    this.currentStage = 0; // Индекс текущего этапа
    this.callManager = this.app.callManager; // Используем CallManager для звонков
  }

  // Метод активации первого этапа
  async activate() {
    if (this.currentStage === 0) {
      await this.eventManager.addDiaryEntry(this.getLocalizedText(this.stages[0].key, this.stages[0].text));
    }
  }

  // Переход к следующему этапу
  async advanceStage() {
    this.currentStage++;
    if (this.currentStage < this.stages.length) {
      await this.eventManager.addDiaryEntry(this.getLocalizedText(this.stages[this.currentStage].key, this.stages[this.currentStage].text));
    } else {
      await this.eventManager.addDiaryEntry(this.getLocalizedText("final", this.finalText));
      this.app.ghostManager.startNewGhostEvent(); // Запуск следующего события
    }
  }

  // Утилитарный метод для получения локализованного текста
  getLocalizedText(key, defaultText) {
    const lang = this.languageManager.getLanguage();
    return this.languageManager.locales[lang][key] || defaultText;
  }

  // Обработка звонка
  async handleCall() {
    // Запускаем звонок (если он активен)
    await this.callManager.startCall("welcome", {
      onAnswer: async () => {
        await this.advanceStage();  // Переходим к следующему этапу после ответа
      },
      onIgnore: async () => {
        await this.advanceStage();  // Переход к следующему этапу, если звонок был проигнорирован
      }
    });
  }
}