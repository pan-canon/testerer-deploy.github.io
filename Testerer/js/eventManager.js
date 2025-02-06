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
  // Для специальных ключей не выполняем локализацию
  let localizedText;
  if (key === "mirror_quest" || key === "mirror_done") {
    localizedText = key;
  } else {
    localizedText = this.languageManager.locales[this.languageManager.getLanguage()][key] || key;
  }
  await this.databaseManager.addDiaryEntry(localizedText);
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