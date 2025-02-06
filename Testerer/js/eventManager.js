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
    // Для специальных ключей не выполняем локализацию,
    // т.е. если запись является специальной (например, "mirror_quest" или "mirror_done"),
    // то в базу записывается именно этот ключ.
    let localizedText;
    if (key === "mirror_quest" || key === "mirror_done") {
      localizedText = key;
    } else {
      localizedText =
        this.languageManager.locales[this.languageManager.getLanguage()][key] || key;
    }
    await this.databaseManager.addDiaryEntry(localizedText);
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

    entries.forEach(entry => {
      // Используем текст записи как ключ (можно добавить timestamp, если нужно)
      const key = entry.entry;
      if (!seen.has(key)) {
        seen.add(key);

        // Если запись начинается с "data:image" – это изображение
        if (entry.entry.startsWith("data:image")) {
          // Создаём контейнер для изображения с подписью (например, временной меткой)
          const wrapper = document.createElement("div");

          const img = document.createElement("img");
          img.src = entry.entry;
          img.alt = "Изображение из дневника";
          // При желании можно добавить стили, например:
          // img.style.maxWidth = "100%";
          wrapper.appendChild(img);

          const caption = document.createElement("span");
          caption.textContent = ` (${entry.timestamp})`;
          wrapper.appendChild(caption);

          this.diaryContainer.appendChild(wrapper);
        } else {
          // Обычная текстовая запись – создаём абзац
          const p = document.createElement("p");
          p.textContent = `${entry.entry} (${entry.timestamp})`;
          this.diaryContainer.appendChild(p);
        }
      }
    });
    console.log("📖 Diary updated.");
  }
  
  startMirrorQuest() {
    // Запускаем задание (здесь можно привязать вызов к кнопке)
    this.addDiaryEntry("mirror_quest");
    console.log("🎭 Starting mirror quest...");
  }
}
