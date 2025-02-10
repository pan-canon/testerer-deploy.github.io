export class GameEventManager {
  constructor(eventManager, appInstance, languageManager) {
    this.eventManager = eventManager;
    this.app = appInstance;
    this.languageManager = languageManager;
    this.events = [
      new WelcomeEvent(this.eventManager, this.app, this.languageManager)
      // Ваши другие события...
    ];
    this.currentEventIndex = 0;
  }

  // Метод для активации события "welcome" (инициирует первую запись)
  async startEvent(eventKey) {
    console.log(`Запуск события: ${eventKey}`);
    if (eventKey === "welcome") {
      // Добавляем запись о просьбе подойти к зеркалу
      await this.eventManager.addGhostDiaryEntry("Они просят меня подойти к зеркалу");

      // Активируем квест с зеркалом
      this.app.questManager.activateQuest("mirror_quest");
    }
  }

  // Метод для старта квеста для текущего призрака
  async startGhostQuest() {
    const ghost = this.app.ghostManager.getCurrentGhost();
    if (ghost) {
      const questKey = `ghost_${ghost.id}_quest`;
      await this.eventManager.addGhostDiaryEntry(questKey);
      console.log(`👻 Starting quest for ${ghost.name}...`);
    } else {
      console.error("⚠️ No active ghost found.");
    }
  }

  // Активируем событие по ключу
  async activateEvent(key) {
    const event = this.events.find(e => e.key === key);
    if (event) {
      await event.activate();
      this.currentEventIndex++;
      if (this.currentEventIndex < this.events.length) {
        // Автоматически активируем следующее событие
        await this.activateNextEvent();
      }
    } else {
      console.warn(`Событие с ключом "${key}" не найдено.`);
    }
  }

  // Метод для активации следующего события
  async activateNextEvent() {
    const nextEvent = this.events[this.currentEventIndex];
    if (nextEvent) {
      await nextEvent.activate();
    }
  }
}