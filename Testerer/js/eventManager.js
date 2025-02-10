export class EventManager {
  constructor(databaseManager, languageManager, ghostManager) {
    this.databaseManager = databaseManager;
    this.languageManager = languageManager;
    this.ghostManager = ghostManager;
    // Контейнер для дневника должен быть в index.html с id="diary"
    this.diaryContainer = document.getElementById("diary");
  }

  isEventLogged(eventKey) {
    const entries = this.databaseManager.getDiaryEntries();
    return entries.some(entry => entry.entry === eventKey);
  }

  // Метод добавления записи в дневник от имени призрака
  async addDiaryEntry(key, imageData = null, isFromGhost = false) {
    // Если передано изображение, сохраняем запись в виде:
    let entry = key;
    if (imageData) {
      entry = `${key}\n[photo attached]\n${imageData}`;
    }

    // Если запись должна быть от имени призрака
    if (isFromGhost) {
      const ghost = this.ghostManager.getCurrentGhost();
      entry = `${ghost.name}: ${entry}`; // Добавляем имя призрака
    }

    // Сохраняем запись в базу данных
    await this.databaseManager.addDiaryEntry(entry);
    this.updateDiaryDisplay();
  }

  // Обновление отображения дневника
  updateDiaryDisplay() {
    if (!this.diaryContainer) {
      console.error("Diary container not found!");
      return;
    }
    // Очищаем контейнер дневника
    this.diaryContainer.innerHTML = "";
    const entries = this.databaseManager.getDiaryEntries();
    const seen = new Set();
    const currentLanguage = this.languageManager.getLanguage();

    entries.forEach(entry => {
      // Если уже выводили такую запись, пропускаем
      if (seen.has(entry.entry)) return;
      seen.add(entry.entry);
      
      // Если запись содержит метку "[photo attached]", разбиваем её
      if (entry.entry.includes("[photo attached]")) {
        const parts = entry.entry.split("\n[photo attached]\n");
        const textPart = parts[0];
        const imageData = parts[1];

        // Создаём обёртку
        const wrapper = document.createElement("div");

        // Отображаем текст (локализованный, если есть)
        const p = document.createElement("p");
        const localizedText =
          this.languageManager.locales[currentLanguage][textPart] || textPart;
        p.textContent = `${localizedText} (${entry.timestamp})`;
        wrapper.appendChild(p);

        // Отображаем изображение
        const img = document.createElement("img");
        img.src = imageData;
        img.alt =
          this.languageManager.locales[currentLanguage]["photo_attached"] ||
          "Photo attached";
        img.style.maxWidth = "100%";
        wrapper.appendChild(img);

        this.diaryContainer.appendChild(wrapper);
      } else {
        // Для текстовых записей – локализуем, если нужно
        const localizedText =
          this.languageManager.locales[currentLanguage][entry.entry] || entry.entry;
        const p = document.createElement("p");
        p.textContent = `${localizedText} (${entry.timestamp})`;
        this.diaryContainer.appendChild(p);
      }
    });
    console.log("📖 Diary updated.");
  }

  // Метод для добавления записи от имени призрака
  async addGhostDiaryEntry(key, imageData = null) {
    await this.addDiaryEntry(key, imageData, true); // isFromGhost = true
  }

  // Новый метод для старта квеста
  async startGhostQuest() {
    const ghost = this.ghostManager.getCurrentGhost();
    if (ghost) {
      const questKey = `ghost_${ghost.id}_quest`;
      await this.addGhostDiaryEntry(questKey);
      console.log(`👻 Starting quest for ${ghost.name}...`);
    } else {
      console.error("⚠️ No active ghost found.");
    }
  }

  // Метод для активации события "welcome" (инициирует первую запись)
  async startEvent(eventKey) {
    console.log(`Запуск события: ${eventKey}`);
    if (eventKey === "welcome") {
      // Добавляем запись о просьбе подойти к зеркалу
      await this.addGhostDiaryEntry("Они просят меня подойти к зеркалу");

      // Активируем квест с зеркалом
      this.app.questManager.activateQuest("mirror_quest");
    }
  }
}