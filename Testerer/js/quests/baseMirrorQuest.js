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
  // Если событие ещё не добавлено в дневник, добавляем его (один раз)
  if (!this.eventManager.isEventLogged(this.key)) {
    console.log(`Активируем событие: ${this.key}`);
    await this.eventManager.addDiaryEntry(this.key);
  }
  // Устанавливаем флаг активности зеркального квеста
  localStorage.setItem("mirrorQuestActive", "true");
  // Обновляем состояние кнопки "Запостить"
  this.app.updatePostButtonState();
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
  // Ждем 5 секунд и проверяем статус квеста
  const success = await this.checkStatus();
  // Получаем текущего призрака и выбираем из его имени случайную букву
  const ghost = this.app.ghostManager.getCurrentGhost();
  const randomLetter = this.getRandomLetter(ghost.name);
  
  if (success) {
    // Если квест выполнен: добавляем пост от юзера с фото (если оно есть) и выбранной буквой
    const photoData = this.app.lastMirrorPhoto ? ` [photo attached]\n${this.app.lastMirrorPhoto}` : "";
    await this.eventManager.addDiaryEntry(`user_post_success: ${randomLetter}${photoData}`, false);
    alert("✅ Задание «подойти к зеркалу» выполнено!");
  } else {
    // Если квест не выполнен: добавляем пост от юзера с выбранной буквой и активируем событие welcome для повторения
    await this.eventManager.addDiaryEntry(`user_post_failed: ${randomLetter}`, false);
    alert("❌ Квест проигнорирован!");
    await this.app.gameEventManager.activateEvent("welcome");
  }
  
  // Удаляем флаг активности зеркального квеста, чтобы пост больше не добавлялся автоматически
  localStorage.removeItem("mirrorQuestActive");
  this.app.updatePostButtonState();
  
  // Важно: здесь мы больше не вызываем автоматический триггер следующего шага (triggerNextPhenomenon)
  // Это гарантирует, что пост (запись) будет добавлена лишь один раз для текущего события,
  // и дальнейшие действия зависят только от нажатия кнопки "Запостить" или таймаута.
}


getRandomLetter(name) {
  // Оставляем в строке только буквы (латинские и кириллические) и убираем пробелы/цифры
  const letters = name.replace(/[^A-Za-zА-Яа-яЁё]/g, '').split('');
  if (letters.length === 0) return '';
  const randomIndex = Math.floor(Math.random() * letters.length);
  return letters[randomIndex];
}
}