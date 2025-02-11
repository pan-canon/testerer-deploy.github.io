export class BaseMirrorQuest {
  /**
   * Базовый класс для квеста с зеркалом и управления событиями.
   * @param {EventManager} eventManager – менеджер событий для работы с дневником
   * @param {App} appInstance – ссылка на приложение для доступа к камере и остальным функциям
   */
  constructor(eventManager, appInstance) {
    this.eventManager = eventManager;
    this.app = appInstance;
    this.key = "mirror_quest"; // уникальный ключ для этого события
    this.doneKey = "mirror_done"; // ключ завершенного события
    this.registerEvents(); // Регистрируем обработчики для действий с камерами
  }

  /**
   * Регистрируем события на действия с элементами интерфейса.
   */
  registerEvents() {
  }

  /**
   * Активируем событие, если оно еще не было выполнено.
   */
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`Активируем событие: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key); // Логируем в дневник
      localStorage.setItem("mirrorQuestActive", "true"); // Отмечаем, что квест активен
    }
  }

  /**
   * Проверка статуса текущего зеркального квеста.
   */
async checkStatus() {
  console.log("🪞 Зеркальный квест активно. Запускаем проверку...");
  return new Promise(resolve => {
    setTimeout(async () => {
      console.log("⏱ Запуск сравнения текущего кадра...");
      const success = await this.app.compareCurrentFrame();
      console.log("⏱ Результат сравнения:", success);
      resolve(success);
    }, 5000);
  });
}


  /**
   * Завершение квеста (проверка и запись результатов в дневник).
   */
  async finish() {
    if (this.eventManager.isEventLogged(this.doneKey)) {
      console.log(`Квест "${this.key}" уже выполнен, повторная проверка не требуется.`);
      return;
    }

    const success = await this.checkStatus(); // Проверка на совпадение с зеркалом
    if (success) {
      if (!this.eventManager.isEventLogged(this.doneKey)) {
        await this.eventManager.addDiaryEntry(this.doneKey); // Логируем завершение квеста
        await this.eventManager.addDiaryEntry("what_was_it", this.app.lastMirrorPhoto); // Добавляем фото последнего кадра
      }
      const cameraBtn = document.getElementById("toggle-camera");
      if (cameraBtn) {
        cameraBtn.classList.remove("glowing"); // Убираем подсветку с кнопки камеры
      }
      localStorage.removeItem("mirrorQuestActive"); // Завершаем квест
      alert("✅ Задание «подойти к зеркалу» выполнено!");

      // После успешного завершения зеркального квеста запускаем следующее явление призрака
      if (this.app.ghostManager) {
        this.app.ghostManager.triggerNextPhenomenon();
      }
    } else {
      alert("❌ Нет совпадения! Попробуйте ещё раз!");
    }
  }
}