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
  
  async addDiaryEntry(key) {
    // Храним в базе именно ключ, а не локализованный текст
    await this.databaseManager.addDiaryEntry(key);
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
      const entryKey = entry.entry;
      if (seen.has(entryKey)) return;
      seen.add(entryKey);
      
      // Если запись начинается с "data:image" – считаем её изображением
      if (entryKey.startsWith("data:image")) {
        const wrapper = document.createElement("div");
        
        const img = document.createElement("img");
        img.src = entryKey;
        // Для alt можно попытаться получить локализованный вариант, если он определён
        const altText =
          this.languageManager.locales[currentLanguage]["photo_attached"] ||
          "Photo attached";
        img.alt = altText;
        // Можно добавить стили, например: img.style.maxWidth = "100%";
        wrapper.appendChild(img);
        
        // Добавляем подпись (например, временную метку)
        const caption = document.createElement("span");
        caption.textContent = ` (${entry.timestamp})`;
        wrapper.appendChild(caption);
        
        this.diaryContainer.appendChild(wrapper);
      } else {
        // Для текстовых записей пытаемся найти локализацию по ключу
        const localizedText =
          this.languageManager.locales[currentLanguage][entryKey] || entryKey;
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
