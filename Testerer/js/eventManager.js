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
  
async addDiaryEntry(key, data = null) {
  const currentLanguage = this.languageManager.getLanguage();
  // Если data передана, сохраняем её, иначе локализуем ключ (если есть соответствие)
  const entryText = data || (this.languageManager.locales[currentLanguage][key] || key);
  await this.databaseManager.addDiaryEntry(entryText);
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
    const entryData = entry.entry;
    if (seen.has(entryData)) return;
    seen.add(entryData);
    
    // Если запись начинается с "data:image" – отображаем как изображение
    if (typeof entryData === "string" && entryData.startsWith("data:image")) {
      const wrapper = document.createElement("div");
      
      const img = document.createElement("img");
      img.src = entryData;
      const altText =
        this.languageManager.locales[currentLanguage]["photo_attached"] ||
        "Photo attached";
      img.alt = altText;
      img.style.maxWidth = "100%";
      wrapper.appendChild(img);
      
      // Добавляем подпись с временной меткой
      const caption = document.createElement("span");
      caption.textContent = ` (${new Date(entry.timestamp).toLocaleString()})`;
      wrapper.appendChild(caption);
      
      this.diaryContainer.appendChild(wrapper);
    } else {
      // Для текстовых записей пытаемся локализовать ключ
      const localizedText =
        this.languageManager.locales[currentLanguage][entryData] || entryData;
      const p = document.createElement("p");
      p.textContent = `${localizedText} (${new Date(entry.timestamp).toLocaleString()})`;
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