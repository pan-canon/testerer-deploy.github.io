export class EventManager {
  constructor(databaseManager, languageManager) {
    this.databaseManager = databaseManager;
    this.languageManager = languageManager;
    // Убедитесь, что в index.html присутствует контейнер с id "diary"
    this.diaryContainer = document.getElementById("diary");
  }

isEventLogged(eventKey) {
  const entries = this.databaseManager.getDiaryEntries();
  return entries.some(entry => entry.entry === eventKey);
}
  
async addDiaryEntry(key) {
    const localizedText = this.languageManager.locales[this.languageManager.getLanguage()][key] || key;
    console.log(`📝 Попытка добавить запись: ${localizedText}`);

    await this.databaseManager.addDiaryEntry(localizedText);
    
    // Проверяем, обновились ли данные
    const entries = this.databaseManager.getDiaryEntries();
    console.log("📖 Записи в дневнике после добавления:", entries);

    this.updateDiaryDisplay();
}

  
updateDiaryDisplay() {
  if (!this.diaryContainer) {
    console.error("Diary container not found!");
    return;
  }
  this.diaryContainer.innerHTML = "";
  const entries = this.databaseManager.getDiaryEntries();
  const seen = new Set();
  entries.forEach(entry => {
    // Формируем ключ на основе текста записи и времени (или только текста)
    const key = entry.entry; // можно использовать и entry.timestamp, если нужно
    if (!seen.has(key)) {
      seen.add(key);
      const p = document.createElement("p");
      p.textContent = `${entry.entry} (${entry.timestamp})`;
      this.diaryContainer.appendChild(p);
    }
  });
  console.log("📖 Diary updated.");
}
  
  startMirrorQuest() {
    this.addDiaryEntry("mirror_quest");
    console.log("🎭 Starting mirror quest...");
  }
}