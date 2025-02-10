export class EventManager {
  constructor(databaseManager, languageManager, ghostManager) {
    this.databaseManager = databaseManager;
    this.languageManager = languageManager;
    this.ghostManager = ghostManager;
    this.diaryContainer = document.getElementById("diary");
  }

  // Проверяем, была ли уже добавлена запись с данным ключом в дневник
  isEventLogged(eventKey) {
    const entries = this.databaseManager.getDiaryEntries();
    return entries.some(entry => entry.entry === eventKey);
  }

  // Добавляем запись в дневник, с пометкой о том, от кого эта запись (призрак или пользователь)
  async addDiaryEntry(entry, isPostFromGhost = false) {
    const postClass = isPostFromGhost ? "ghost-post" : "user-post";  // Класс для оформления поста в зависимости от источника
    const entryData = { entry, postClass };
    await this.databaseManager.addDiaryEntry(entryData);
    this.updateDiaryDisplay();
  }

  // Обновляем отображение дневника
  updateDiaryDisplay() {
    if (!this.diaryContainer) {
      console.error("Diary container not found!");
      return;
    }
    this.diaryContainer.innerHTML = "";  // Очищаем контейнер дневника
    const entries = this.databaseManager.getDiaryEntries();
    const seen = new Set();
    const currentLanguage = this.languageManager.getLanguage();

    entries.forEach(entry => {
      if (seen.has(entry.entry)) return;
      seen.add(entry.entry);

      const wrapper = document.createElement("div");
      const p = document.createElement("p");
      
      // Локализуем текст в зависимости от источника
      const localizedText =
        this.languageManager.locales[currentLanguage][entry.entry] || entry.entry;
      p.textContent = `${localizedText} (${entry.timestamp})`;
      
      // Добавляем класс поста (от призрака или пользователя)
      wrapper.classList.add(entry.postClass);  
      wrapper.appendChild(p);

      // Если запись содержит изображение, отображаем его
      if (entry.entry.includes("[photo attached]")) {
        const parts = entry.entry.split("\n[photo attached]\n");
        const imageData = parts[1];
        const img = document.createElement("img");
        img.src = imageData;
        img.alt = this.languageManager.locales[currentLanguage]["photo_attached"] || "Photo attached";
        img.style.maxWidth = "100%";
        wrapper.appendChild(img);
      }

      this.diaryContainer.appendChild(wrapper);
    });

    console.log("📖 Diary updated.");
  }

  // Новый метод для начала квеста с зеркалом после регистрации
  async startMirrorQuest() {
    // Запись от призрака с просьбой подойти к зеркалу
    await this.addDiaryEntry("Подойди к зеркалу", true);
    console.log("🎭 Starting mirror quest...");
    
    // Создаем кнопку "Что это?" в записи
    this.createWhatIsThisButton();
  }

  // Создаем кнопку "Что это?" с таймером на исчезновение
  createWhatIsThisButton() {
    const buttonContainer = document.createElement("div");
    const button = document.createElement("button");
    button.textContent = "Что это?!";
    button.id = "what_is_this_button";
    
    // Обработчик для начала квеста по нажатию
    button.addEventListener("click", async () => {
      await this.startMirrorQuestProcess();
      button.style.display = 'none';  // Скрыть кнопку после нажатия
    });
    
    // Таймер для автоматического исчезновения кнопки через 5 секунд
    setTimeout(() => {
      button.style.display = 'none';
    }, 5000);

    buttonContainer.appendChild(button);
    this.diaryContainer.appendChild(buttonContainer);
  }

  // Запуск процесса зеркального квеста
  async startMirrorQuestProcess() {
    // Логика для начала квеста и добавления фотографии или текста
    const success = await this.checkStatus();  // Проверка статуса (если игрок перед зеркалом)
    if (success) {
      const photoOrText = "Буква Z";  // Это для примера, нужно будет настроить на буквы
      await this.addDiaryEntry(photoOrText);
    } else {
      alert("❌ Квест не пройден!");
    }
  }

  // Метод проверки статуса зеркального квеста (если игрок перед зеркалом)
  async checkStatus() {
    const success = await this.app.compareCurrentFrame();  // Проверка кадра с зеркалом
    return success;
  }

  // Новый метод для начала квеста для текущего призрака
  async startGhostQuest() {
    const ghost = this.ghostManager.getCurrentGhost();
    if (ghost) {
      const questKey = `ghost_${ghost.id}_quest`;
      await this.addDiaryEntry(questKey, true);  // Запись от призрака
      console.log(`👻 Starting quest for ${ghost.name}...`);
    } else {
      console.error("⚠️ No active ghost found.");
    }
  }
}