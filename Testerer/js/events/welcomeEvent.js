import { BaseEvent } from './baseEvent.js';

export class WelcomeEvent extends BaseEvent {
  constructor(eventManager, appInstance, languageManager) {
    super(eventManager);
    this.app = appInstance;
    this.languageManager = languageManager;
    this.key = "welcome";
  }

  async activate() {
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`Событие '${this.key}' уже зарегистрировано. Пропускаем.`);
      return;
    }
    console.log(`Активируем событие '${this.key}': регистрируем приглашение к зеркальному квесту`);
    await this.eventManager.addDiaryEntry(this.key, true);

    // Делаем "Запостить" активной
    localStorage.setItem("mirrorQuestReady", "true");
    this.app.questManager.updatePostButtonState();

    // Запускаем визуальный эффект
    this.app.visualEffectsManager.triggerMirrorEffect();
  }
}