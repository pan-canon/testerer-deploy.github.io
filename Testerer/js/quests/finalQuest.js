import { BaseQuest } from './baseQuest.js';

export class FinalQuest extends BaseQuest {
  /**
   * @param {EventManager} eventManager – менеджер событий
   * @param {App} appInstance – ссылка на основной объект App для доступа к камере и т.д.
   */
  constructor(eventManager, appInstance) {
    super(eventManager);
    this.app = appInstance;
    this.key = "final_quest";
    this.doneKey = "final_done";
  }

  /**
   * Метод активации финального квеста
   */
  async activate() {
    console.log("🔥 Финальный квест активирован: Призрак 1 атакует!");

    // В дневник добавляется запись о запуске финального квеста
    await this.eventManager.addGhostDiaryEntry("Призрак 1 атакует");

    // Создаем кнопку для завершения квеста
    const finalButton = document.createElement("button");
    finalButton.textContent = "Призрак 1 атакует!";
    finalButton.addEventListener("click", async () => {
      await this.finish();
    });

    // Добавляем кнопку на экран
    document.body.appendChild(finalButton);
  }

  /**
   * Метод завершения финального квеста
   */
  async finish() {
    if (this.eventManager.isEventLogged(this.doneKey)) {
      console.log(`Квест "${this.key}" уже завершен.`);
      return;
    }

    // Логика завершения финального квеста
    await this.eventManager.addDiaryEntry(this.doneKey);
    console.log("🎉 Финальный квест завершен!");

    // После завершения финального квеста, активируем Призрака 2
    this.app.ghostManager.setCurrentGhost(2);
    alert("🎉 Призрак 1 побежден! Активирован Призрак 2.");
  }
}