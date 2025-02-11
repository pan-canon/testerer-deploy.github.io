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
  // Ждём 5 секунд и проверяем статус квеста
  const success = await this.checkStatus();
  // Получаем текущего призрака и выбираем из его имени случайную букву
  const ghost = this.app.ghostManager.getCurrentGhost();
  const randomLetter = this.getRandomLetter(ghost.name);
  
  if (success) {
    // Если квест выполнен: добавляем пост от юзера с фото и выбранной буквой
    const photoData = this.app.lastMirrorPhoto ? ` [photo attached]\n${this.app.lastMirrorPhoto}` : "";
    await this.eventManager.addDiaryEntry(`user_post_success: ${randomLetter}${photoData}`, false);
    alert("✅ Задание «подойти к зеркалу» выполнено!");
  } else {
    // Если квест не выполнен (проигнорирован): добавляем пост от юзера с выбранной буквой
    await this.eventManager.addDiaryEntry(`user_post_failed: ${randomLetter}`, false);
    alert("❌ Квест проигнорирован!");
    // Запускаем новое событие (аналогичное welcome), чтобы повторить приглашение
    await this.app.gameEventManager.activateEvent("welcome");
  }
  
  // Зафиксировать отработанный шаг (одна буква) – независимо от результата квеста
  if (this.app.ghostManager) {
    await this.app.ghostManager.triggerNextPhenomenon();
  }
  // Сбрасываем флаг активности зеркального квеста
  localStorage.removeItem("mirrorQuestActive");
}

getRandomLetter(name) {
  // Оставляем в строке только буквы (латинские и кириллические) и убираем пробелы/цифры
  const letters = name.replace(/[^A-Za-zА-Яа-яЁё]/g, '').split('');
  if (letters.length === 0) return '';
  const randomIndex = Math.floor(Math.random() * letters.length);
  return letters[randomIndex];
}
}