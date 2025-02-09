// /js/eventManager.js
export class EventManager {
  constructor(databaseManager, languageManager) {
    this.databaseManager = databaseManager;
    this.languageManager = languageManager;
    // Контейнер для дневника должен быть в index.html с id="diary"
    this.diaryContainer = document.getElementById("diary");
  }

  isEventLogged(eventKey) {
    const entries = this.databaseManager.getDiaryEntries();
    return entries.some(entry => entry.entry === eventKey);
  }

  async addDiaryEntry(key, imageData = null) {
    // Если передано изображение, сохраняем запись в виде:
    // "<текст ключа>\n[photo attached]\n<dataURL изображения>"
    let entry = key;
    if (imageData) {
      entry = `${key}\n[photo attached]\n${imageData}`;
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
    this.addDiaryEntry("mirror_quest");
    console.log("🎭 Starting mirror quest...");
  }
}