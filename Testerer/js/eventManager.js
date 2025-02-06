export class EventManager {
  constructor(databaseManager, languageManager) {
    this.databaseManager = databaseManager;
    this.languageManager = languageManager;
    this.diaryContainer = document.getElementById("diary");
  }

  isEventLogged(key) {
    const entries = this.databaseManager.getDiaryEntries();
    return entries.some(e => e.entry === key);
  }

  async addDiaryEntry(key) {
    // Можно локализовать, но иногда мы пишем просто как есть
    this.databaseManager.addDiaryEntry(key);
    this.updateDiaryDisplay();
  }

  updateDiaryDisplay() {
    if (!this.diaryContainer) {
      console.error("Diary container not found!");
      return;
    }
    this.diaryContainer.innerHTML = "";
    const entries = this.databaseManager.getDiaryEntries();
    if (entries.length === 0) {
      const p = document.createElement("p");
      p.textContent = this.languageManager.locales[this.languageManager.getLanguage()]["empty_diary"];
      this.diaryContainer.appendChild(p);
      return;
    }
    entries.forEach(entry => {
      const p = document.createElement("p");
      p.textContent = `${entry.entry} (${entry.timestamp})`;
      this.diaryContainer.appendChild(p);
    });
    console.log("📖 Diary updated.");
  }
}
