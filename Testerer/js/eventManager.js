export class EventManager {
  /**
   * Конструктор EventManager.
   * @param {DatabaseManager} databaseManager - экземпляр менеджера базы данных.
   * @param {LanguageManager} languageManager - менеджер локализации.
   * @param {GhostManager} ghostManager - менеджер призраков.
   * @param {VisualEffectsManager} visualEffectsManager - менеджер визуальных эффектов.
   */
  constructor(databaseManager, languageManager, ghostManager, visualEffectsManager) {
    this.databaseManager = databaseManager;
    this.languageManager = languageManager;
    this.ghostManager = ghostManager;
    this.diaryContainer = document.getElementById("diary");
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
   * addDiaryEntry – добавляет запись в дневник.
   * @param {string} entry - Текст записи.
   * @param {boolean} [isPostFromGhost=false] - если true, запись оформляется как призрачный пост.
   */
  async addDiaryEntry(entry, isPostFromGhost = false) {
    const postClass = isPostFromGhost ? "ghost-post" : "user-post";
    const entryData = { entry, postClass };
    const serializedEntry = JSON.stringify(entryData);
    await this.databaseManager.addDiaryEntry(serializedEntry);
    this.updateDiaryDisplay();
  }

  /**
   * updateDiaryDisplay – обновляет содержимое контейнера дневника.
   */
  updateDiaryDisplay() {
    if (!this.diaryContainer) {
      console.error("Diary container not found!");
      return;
    }

    this.diaryContainer.innerHTML = "";
    const animatedIds = JSON.parse(localStorage.getItem("animatedDiaryIds") || "[]");
    const entries = this.databaseManager.getDiaryEntries();
    const seen = new Set();
    const currentLanguage = this.languageManager.getLanguage();

    entries.forEach(entryObj => {
      if (seen.has(entryObj.id)) return;
      seen.add(entryObj.id);

      const articleElem = document.createElement("article");
      articleElem.classList.add(entryObj.postClass);

      let mainText = entryObj.entry;
      let imageData = null;
      if (entryObj.entry.includes("[photo attached]")) {
        const parts = entryObj.entry.split("[photo attached]");
        mainText = parts[0].trim();
        if (parts.length >= 2) {
          imageData = parts[1].trim();
          if (!/^data:/.test(imageData)) {
            imageData = "data:image/png;base64," + imageData;
          }
        }
      }

      const localizedText =
        this.languageManager.locales[currentLanguage][mainText] || mainText;
      const cleanedText = localizedText
        .replace(/^user_post_success:\s*/, '')
        .replace(/^user_post_failed:\s*/, '');
      const formattedTimestamp = entryObj.timestamp.replace(/\.\d+Z$/, '');
      const fullText = `${cleanedText} (${formattedTimestamp})`;

      const textContainer = document.createElement("p");
      if (imageData) {
        const img = document.createElement("img");
        img.src = imageData;
        img.alt = this.languageManager.locales[currentLanguage]["photo_attached"] || "Photo attached";
        img.style.maxWidth = "100%";
        articleElem.appendChild(img);
      }
      articleElem.appendChild(textContainer);

      let messageText = fullText;
      const dateMatch = fullText.match(/(\(\d{4}-\d{2}-\d{2}.*\))$/);
      if (dateMatch) {
        const dateText = dateMatch[1].trim();
        messageText = fullText.replace(dateText, "").trim() + "<br>" + dateText;
      }

      const isAlreadyAnimated = animatedIds.includes(entryObj.id);
      const effectsManager = this.visualEffectsManager;

      if (isAlreadyAnimated) {
        textContainer.innerHTML = messageText;
      } else {
        const animatedSpan = document.createElement("span");
        textContainer.innerHTML = "";
        textContainer.appendChild(animatedSpan);

        if (entryObj.postClass === "ghost-post") {
          effectsManager.triggerGhostTextEffect(animatedSpan, messageText);
        } else {
          effectsManager.triggerUserTextEffect(animatedSpan, messageText);
        }
        animatedIds.push(entryObj.id);
      }
      this.diaryContainer.appendChild(articleElem);
    });

    localStorage.setItem("animatedDiaryIds", JSON.stringify(animatedIds));
    console.log("📖 Diary updated.");
  }

  /**
   * startMirrorQuest – начинает квест с зеркалом после регистрации.
   */
  async startMirrorQuest() {
    await this.addDiaryEntry("Подойди к зеркалу", true);
    console.log("🎭 Starting mirror quest...");
    this.createWhatIsThisButton();
  }

  /**
   * createWhatIsThisButton – создаёт кнопку "Что это?" с таймером.
   */
  createWhatIsThisButton() {
    const buttonContainer = document.createElement("div");
    const button = document.createElement("button");
    button.textContent = "Что это?!";
    button.id = "what_is_this_button";
    
    button.addEventListener("click", async () => {
      await this.startMirrorQuestProcess();
      button.style.display = 'none';
    });
    
    setTimeout(() => {
      button.style.display = 'none';
    }, 5000);

    buttonContainer.appendChild(button);
    this.diaryContainer.appendChild(buttonContainer);
  }

  /**
   * startMirrorQuestProcess – запускает процесс зеркального квеста.
   */
  async startMirrorQuestProcess() {
    const success = await this.checkStatus();
    if (success) {
      const photoOrText = "Буква Z";
      await this.addDiaryEntry(photoOrText);
    } else {
      alert("❌ Квест не пройден!");
    }
  }

  /**
   * checkStatus – проверяет, находится ли игрок перед зеркалом.
   * @returns {boolean}
   */
  async checkStatus() {
    const success = await this.app.compareCurrentFrame();
    return success;
  }

  /**
   * startGhostQuest – запускает квест для текущего призрака.
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