export class EventManager {
  /**
   * Конструктор EventManager.
   * @param {DatabaseManager} databaseManager - экземпляр менеджера базы данных.
   * @param {LanguageManager} languageManager - менеджер локализации.
   * @param {GhostManager} ghostManager - менеджер призраков (если используется).
   *
   * Этот класс отвечает за работу с дневником:
   * - Добавление записей (диалогов, уведомлений, квестовых сообщений).
   * - Обновление и отображение записей.
   * - Запуск квестовых процессов, связанных с зеркалом, и квестов от призраков.
   */
  constructor(databaseManager, languageManager, ghostManager) {
    this.databaseManager = databaseManager;
    this.languageManager = languageManager;
    this.ghostManager = ghostManager;
    // Получаем контейнер дневника из DOM
    this.diaryContainer = document.getElementById("diary");
  }

  /**
   * isEventLogged – проверяет, была ли уже добавлена запись с данным ключом.
   * @param {string} eventKey - ключ события.
   * @returns {boolean} true, если запись найдена, иначе false.
   */
  isEventLogged(eventKey) {
    const entries = this.databaseManager.getDiaryEntries();
    return entries.some(entry => entry.entry === eventKey);
  }

  /**
   * addDiaryEntry – добавляет запись в дневник с указанием, от кого она (призрак или пользователь).
   * @param {string} entry - Текст записи (обычно в формате JSON).
   * @param {boolean} [isPostFromGhost=false] - если true, запись будет оформлена как запись призрака.
   */
  async addDiaryEntry(entry, isPostFromGhost = false) {
    // Определяем CSS-класс для оформления записи
    const postClass = isPostFromGhost ? "ghost-post" : "user-post";
    // Формируем объект записи
    const entryData = { entry, postClass };
    // Сериализуем объект записи в JSON-строку
    const serializedEntry = JSON.stringify(entryData);
    // Добавляем запись в базу данных (метод addDiaryEntry базы)
    await this.databaseManager.addDiaryEntry(serializedEntry);
    // Обновляем отображение дневника
    this.updateDiaryDisplay();
  }

  /**
   * updateDiaryDisplay – обновляет содержимое контейнера дневника.
   * Получает все записи из базы, сортирует их и отображает в виде отдельных элементов <article>.
   */
  updateDiaryDisplay() {
    if (!this.diaryContainer) {
      console.error("Diary container not found!");
      return;
    }
    
    // Очищаем контейнер дневника
    this.diaryContainer.innerHTML = "";
    
    // Получаем записи из базы данных
    const entries = this.databaseManager.getDiaryEntries();
    const seen = new Set();
    const currentLanguage = this.languageManager.getLanguage();

    entries.forEach(entryObj => {
      // Предотвращаем дублирование записей (по id)
      if (seen.has(entryObj.id)) return;
      seen.add(entryObj.id);

      // Создаем обертку для записи в виде элемента <article>
      const articleElem = document.createElement("article");
      // Добавляем класс оформления (например, "ghost-post" или "user-post")
      articleElem.classList.add(entryObj.postClass);

      // Разбиваем запись на основной текст и, если есть, изображение
      let mainText = entryObj.entry;
      let imageData = null;
      if (entryObj.entry.includes("[photo attached]")) {
        const parts = entryObj.entry.split("\n[photo attached]\n");
        mainText = parts[0];
        if (parts.length >= 2) {
          imageData = parts[1];
        }
      }
      // Локализуем основной текст с помощью менеджера языков
      const localizedText =
        this.languageManager.locales[currentLanguage][mainText] || mainText;

      // Создаем элемент абзаца для текста записи
      const p = document.createElement("p");
      p.textContent = `${localizedText} (${entryObj.timestamp})`;
      articleElem.appendChild(p);

      // Если присутствует прикрепленное изображение, добавляем его в элемент <img>
      if (imageData) {
        const img = document.createElement("img");
        // Если префикс data:image отсутствует, добавляем его (предполагаем, что изображение в формате PNG)
        if (!imageData.startsWith("data:image")) {
          img.src = "data:image/png;base64," + imageData;
        } else {
          img.src = imageData;
        }
        img.alt = this.languageManager.locales[currentLanguage]["photo_attached"] || "Photo attached";
        img.style.maxWidth = "100%";
        articleElem.appendChild(img);
      }

      // Добавляем готовую запись в контейнер дневника
      this.diaryContainer.appendChild(articleElem);
    });
    console.log("📖 Diary updated.");
  }

  /**
   * startMirrorQuest – начинает квест с зеркалом после регистрации.
   * Добавляет запись с просьбой подойти к зеркалу и создает кнопку "Что это?".
   */
  async startMirrorQuest() {
    // Добавляем запись от призрака с инструкцией
    await this.addDiaryEntry("Подойди к зеркалу", true);
    console.log("🎭 Starting mirror quest...");
    // Создаем кнопку "Что это?" для начала квеста
    this.createWhatIsThisButton();
  }

  /**
   * createWhatIsThisButton – создает кнопку "Что это?" с таймером для автоматического скрытия.
   * По нажатию на кнопку запускается процесс зеркального квеста.
   */
  createWhatIsThisButton() {
    const buttonContainer = document.createElement("div");
    const button = document.createElement("button");
    button.textContent = "Что это?!";
    button.id = "what_is_this_button";
    
    // По нажатию запускаем процесс зеркального квеста и скрываем кнопку.
    button.addEventListener("click", async () => {
      await this.startMirrorQuestProcess();
      button.style.display = 'none';
    });
    
    // Автоматически скрываем кнопку через 5 секунд.
    setTimeout(() => {
      button.style.display = 'none';
    }, 5000);

    buttonContainer.appendChild(button);
    this.diaryContainer.appendChild(buttonContainer);
  }

  /**
   * startMirrorQuestProcess – запускает процесс зеркального квеста.
   * После проверки статуса (через compareCurrentFrame) добавляет запись с результатом.
   */
  async startMirrorQuestProcess() {
    const success = await this.checkStatus(); // Проверяем, находится ли игрок перед зеркалом.
    if (success) {
      // Пример: добавляем запись с буквой "Z" в качестве результата квеста.
      const photoOrText = "Буква Z";
      await this.addDiaryEntry(photoOrText);
    } else {
      alert("❌ Квест не пройден!");
    }
  }

  /**
   * checkStatus – проверяет, находится ли игрок перед зеркалом.
   * Вызывает метод compareCurrentFrame() у приложения.
   * @returns {boolean} Результат сравнения: true, если совпадение достаточно, иначе false.
   */
  async checkStatus() {
    const success = await this.app.compareCurrentFrame();
    return success;
  }

  /**
   * startGhostQuest – запускает квест для текущего призрака.
   * Добавляет в дневник запись с ключом квеста и выводит информацию в консоль.
   */
  async startGhostQuest() {
    const ghost = this.ghostManager.getCurrentGhost();
    if (ghost) {
      const questKey = `ghost_${ghost.id}_quest`;
      await this.addDiaryEntry(questKey, true);
      console.log(`👻 Starting quest for ${ghost.name}...`);
    } else {
      console.error("⚠️ No active ghost found.");
    }
  }
}