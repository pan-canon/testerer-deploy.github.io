export class EventManager {
  /**
   * Конструктор EventManager.
   * @param {DatabaseManager} databaseManager - экземпляр менеджера базы данных.
   * @param {LanguageManager} languageManager - менеджер локализации.
   * @param {GhostManager} ghostManager - менеджер призраков (если используется).
   * @param {VisualEffectsManager} visualEffectsManager - менеджер визуальных эффектов (если используется).
   *
   * Этот класс отвечает за работу с дневником:
   * - Добавление записей (диалогов, уведомлений, квестовых сообщений).
   * - Обновление и отображение записей.
   * - Запуск коротких событий (через GameEventManager), если нужно.
   */
  constructor(databaseManager, languageManager, ghostManager, visualEffectsManager) {
    this.databaseManager       = databaseManager;
    this.languageManager       = languageManager;
    this.ghostManager          = ghostManager;
    this.visualEffectsManager  = visualEffectsManager;
    
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
   * @param {string} entry - Текст записи (обычно в формате JSON или обычная строка).
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
   * Получает все записи из базы, сортирует их (при желании)
   * и отображает в виде отдельных элементов <article>.
   */
  updateDiaryDisplay() {
    if (!this.diaryContainer) {
      console.error("Diary container not found!");
      return;
    }
    // Очищаем контейнер дневника
    this.diaryContainer.innerHTML = "";

    // Получаем из localStorage массив ID записей, для которых уже запускалась анимация
    const animatedIds = JSON.parse(localStorage.getItem("animatedDiaryIds") || "[]");

    // Получаем записи из базы данных
    const entries = this.databaseManager.getDiaryEntries();
    const seen    = new Set();
    const currentLanguage = this.languageManager.getLanguage();

    entries.forEach(entryObj => {
      // Предотвращаем дублирование записей (по id)
      if (seen.has(entryObj.id)) return;
      seen.add(entryObj.id);

      // Создаем обёртку для записи <article>
      const articleElem = document.createElement("article");
      articleElem.classList.add(entryObj.postClass);

      // Разбираем поле entryObj.entry на основной текст + [photo attached]
      let mainText  = entryObj.entry;
      let imageData = null;
      if (entryObj.entry.includes("[photo attached]")) {
        const parts = entryObj.entry.split("[photo attached]");
        mainText    = parts[0].trim();
        if (parts.length >= 2) {
          imageData  = parts[1].trim();
          if (!/^data:/.test(imageData)) {
            imageData = "data:image/png;base64," + imageData;
          }
        }
      }

      // Локализуем текст (при необходимости)
      const localizedText = this.languageManager.locales[currentLanguage][mainText] || mainText;

      // Убираем специальные префиксы (user_post_success: / user_post_failed:)
      const cleanedText = localizedText
        .replace(/^user_post_success:\s*/, '')
        .replace(/^user_post_failed:\s*/, '');

      // Удаляем дробную часть секунд и символ "Z" у timestamp, если есть
      const formattedTimestamp = entryObj.timestamp.replace(/\.\d+Z$/, '');

      // Формируем финальный текст вида "СООБЩЕНИЕ (2025-02-20T15:34:12)"
      const fullText = `${cleanedText} (${formattedTimestamp})`;

      // Блок для текста
      const textContainer = document.createElement("p");
      // Если присутствует изображение, добавляем <img> перед текстом
      if (imageData) {
        const img = document.createElement("img");
        img.src = imageData;
        img.alt = this.languageManager.locales[currentLanguage]["photo_attached"] || "Photo attached";
        img.style.maxWidth = "100%";
        articleElem.appendChild(img);
      }
      articleElem.appendChild(textContainer);

      // Если дата есть в конце, переносим её на новую строку
      let messageText = fullText;
      const dateMatch = fullText.match(/(\(\d{4}-\d{2}-\d{2}.*\))$/);
      if (dateMatch) {
        const dateText = dateMatch[1].trim();
        messageText = fullText.replace(dateText, "").trim() + "<br>" + dateText;
      }

      // Проверяем, анимировали ли уже эту запись
      const isAlreadyAnimated = animatedIds.includes(entryObj.id);
      const effectsManager    = this.visualEffectsManager;
      if (isAlreadyAnimated) {
        // Запись уже анимировалась, просто выводим результат
        textContainer.innerHTML = messageText;
      } else {
        // Запись новая: анимируем
        const animatedSpan = document.createElement("span");
        textContainer.innerHTML = "";
        textContainer.appendChild(animatedSpan);

        // Запускаем эффект (ghost или user)
        if (entryObj.postClass === "ghost-post") {
          effectsManager.triggerGhostTextEffect(animatedSpan, messageText);
        } else {
          effectsManager.triggerUserTextEffect(animatedSpan, messageText);
        }

        // Помечаем эту запись как анимированную
        animatedIds.push(entryObj.id);
      }

      // Добавляем <article> в контейнер
      this.diaryContainer.appendChild(articleElem);
    });

    // Сохраняем обновлённый список animatedIds
    localStorage.setItem("animatedDiaryIds", JSON.stringify(animatedIds));
    console.log("📖 Diary updated.");
  }

  /**
   * startGhostQuest – пример: запускает квест для текущего призрака.
   * Добавляет в дневник запись с ключом квеста и выводит информацию в консоль.
   */
  async startGhostQuest() {
    const ghost = this.ghostManager.getCurrentGhost();
    if (ghost) {
      const questKey = `ghost_${ghost.id}_quest`;
      await this.addDiaryEntry(questKey, true);
      console.log(`👻 Starting quest for ${ghost.name}...`);
      // Здесь вы можете вызвать QuestManager.activateQuest(questKey) или другое событие.
    } else {
      console.error("⚠️ No active ghost found.");
    }
  }

  /*
   * Пример, как можно организовать логику запуска небольших событий/квестов:
   * - Любая логика, связанная с зеркальным квестом, теперь хранится в BaseMirrorQuest и его событиях.
   * - Если нужны короткие события (попытки напугать, стук в дверь, телефонный звонок), можно добавлять
   *   методы или вызывать gameEventManager.activateEvent('ghost_knock') и т.д.
   *
   * Таким образом, EventManager остаётся "чистым" местом для работы с дневником
   * и небольшими вспомогательными методами. Вся логика зеркального квеста уехала
   * в BaseMirrorQuest, а специфичная логика "что это?!" - в отдельное событие,
   * если вы хотите сохранить такой сценарий.
   */
}