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
  constructor(databaseManager, languageManager, ghostManager, visualEffectsManager) {
    this.databaseManager = databaseManager;
    this.languageManager = languageManager;
    this.ghostManager = ghostManager;
    // Получаем контейнер дневника из DOM
    this.diaryContainer = document.getElementById("diary");
    // Сохраняем переданный экземпляр визуальных эффектов
    this.visualEffectsManager = visualEffectsManager;
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

    // Получаем из localStorage массив ID записей, для которых уже запущена анимация
    const animatedIds = JSON.parse(localStorage.getItem("animatedDiaryIds") || "[]");

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
        const parts = entryObj.entry.split("[photo attached]");
        mainText = parts[0].trim();
        if (parts.length >= 2) {
          imageData = parts[1].trim();
          // Если префикс data URL отсутствует, добавляем его
          if (!/^data:/.test(imageData)) {
            imageData = "data:image/png;base64," + imageData;
          }
        }
      }
      // Локализуем основной текст с помощью менеджера языков
      const localizedText = this.languageManager.locales[currentLanguage][mainText] || mainText;

      // Убираем префиксы, которые не должны выводиться (например, "user_post_success:" или "user_post_failed:")
      const cleanedText = localizedText
        .replace(/^user_post_success:\s*/, '')
        .replace(/^user_post_failed:\s*/, '');

      // Форматируем время: удаляем дробную часть секунд и символ "Z"
      const formattedTimestamp = entryObj.timestamp.replace(/\.\d+Z$/, '');
      const finalText = `${cleanedText} (${formattedTimestamp})`;

      // Создаем контейнер для текста
      const textContainer = document.createElement("p");
      articleElem.appendChild(textContainer);

      // Если присутствует изображение, добавляем его перед текстом
      if (imageData) {
        const img = document.createElement("img");
        img.src = imageData;
        img.alt = this.languageManager.locales[currentLanguage]["photo_attached"] || "Photo attached";
        img.style.maxWidth = "100%";
        articleElem.insertBefore(img, textContainer);
      }

      // Формируем итоговый текст с временем
      const animatedText = cleanedText;
      const staticTimestamp = ` (${formattedTimestamp})`;

      // Используем глобальный экземпляр визуальных эффектов (переданный в конструкторе EventManager)
      const effectsManager = this.visualEffectsManager;
      // Если для этой записи ещё не запускалась анимация и запись новая
      if (!animatedIds.includes(entryObj.id)) {
          // Отмечаем, что для этой записи анимация запускается впервые
          animatedIds.push(entryObj.id);
          // Разбиваем итоговый текст на две части: основное сообщение и дату (если дата в скобках в конце)
          const dateMatch = finalText.match(/(\(\d{4}-\d{2}-\d{2}.*\))$/);
          let messageText = finalText;
          let dateText = "";
          if (dateMatch) {
              dateText = dateMatch[1];
              messageText = finalText.replace(dateText, "").trim();
          }
          // Создаем два span: один для анимированного текста, другой – для даты (без анимации)
          const animatedSpan = document.createElement('span');
          const staticSpan = document.createElement('span');
          staticSpan.textContent = dateText;
          staticSpan.style.opacity = "0"; // Изначально скрываем дату
          staticSpan.style.transition = "opacity 0.5s ease-in-out"; // Плавный переход
          // Очищаем контейнер и вставляем оба элемента
          textContainer.textContent = "";
          // Устанавливаем для даты начальное состояние скрытым с плавным переходом
          staticSpan.style.opacity = "0";
          staticSpan.style.transition = "opacity 0.5s ease-in-out";
          textContainer.appendChild(animatedSpan);
          textContainer.appendChild(staticSpan);
          if (entryObj.postClass === "ghost-post") {
              effectsManager.triggerGhostTextEffect(animatedSpan, messageText, () => {
                  // После завершения анимации основного текста делаем дату видимой
                  setTimeout(() => { staticSpan.style.opacity = "1"; }, 100);
              });
          } else {
              effectsManager.triggerUserTextEffect(animatedSpan, messageText, () => {
                  setTimeout(() => { staticSpan.style.opacity = "1"; }, 100);
              });
          }
      } else {
          // Если анимация уже была для этой записи, устанавливаем полный текст без анимации
          textContainer.textContent = finalText;
      }

      // Добавляем готовую запись в контейнер дневника
      this.diaryContainer.appendChild(articleElem);
    });
    // Сохраняем новый последний анимированный ID
    localStorage.setItem("animatedDiaryIds", JSON.stringify(animatedIds));
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