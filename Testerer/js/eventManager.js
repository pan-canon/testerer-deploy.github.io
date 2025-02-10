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

  await this.databaseManager.addDiaryEntry(entry);
  this.updateDiaryDisplay();
}


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

startMirrorQuest() {
  // Добавляем запись с ключом "mirror_quest" – при отображении будет локализовано
  this.addGhostDiaryEntry("mirror_quest");
  console.log("🎭 Starting mirror quest...");
}

async addGhostDiaryEntry(key, imageData = null) {
  await this.addDiaryEntry(key, imageData, true);
}

  // Новый метод для начала квеста для текущего призрака
  async startGhostQuest() {
    const ghost = this.ghostManager.getCurrentGhost();
    if (ghost) {
      const questKey = `ghost_${ghost.id}_quest`;
      await this.addDiaryEntry(questKey);
      console.log(`👻 Starting quest for ${ghost.name}...`);
    } else {
      console.error("⚠️ No active ghost found.");
    }
  }
}