export class EventManager {
  /**
   * Constructor for EventManager.
   * @param {DatabaseManager} databaseManager - Instance of the database manager.
   * @param {LanguageManager} languageManager - Localization manager.
   * @param {GhostManager} ghostManager - Ghost manager (if used).
   * @param {VisualEffectsManager} visualEffectsManager - Visual effects manager (if used).
   *
   * This class is responsible for diary operations:
   * - Adding entries (dialogues, notifications, quest messages).
   * - Updating and displaying entries.
   * - Launching short events (via GameEventManager) if needed.
   */
  constructor(databaseManager, languageManager, ghostManager, visualEffectsManager) {
    this.databaseManager = databaseManager;
    this.languageManager = languageManager;
    this.ghostManager = ghostManager;
    this.visualEffectsManager = visualEffectsManager;
    
    // Get the diary container from the DOM
    this.diaryContainer = document.getElementById("diary");
  }

  /**
   * isEventLogged – Checks whether an entry with the given key has already been added.
   * @param {string} eventKey - The event key.
   * @returns {boolean} True if the entry is found, otherwise false.
   */
  isEventLogged(eventKey) {
    const entries = this.databaseManager.getDiaryEntries();
    return entries.some(entry => entry.entry === eventKey);
  }

  /**
   * addDiaryEntry – Adds an entry to the diary with an indication of its source (ghost or user).
   * @param {string} entry - The text of the entry (usually in JSON format or plain text).
   * @param {boolean} [isPostFromGhost=false] - If true, the entry will be styled as a ghost post.
   */
  async addDiaryEntry(entry, isPostFromGhost = false) {
    // Determine the CSS class for styling the entry
    const postClass = isPostFromGhost ? "ghost-post" : "user-post";
    // Create the entry object
    const entryData = { entry, postClass };
    // Serialize the entry object into a JSON string
    const serializedEntry = JSON.stringify(entryData);

    // Add the entry to the database (using the databaseManager's addDiaryEntry method)
    await this.databaseManager.addDiaryEntry(serializedEntry);

    // Update the diary display
    this.updateDiaryDisplay();
  }

  /**
   * updateDiaryDisplay – Updates the content of the diary container.
   * Retrieves all entries from the database, sorts them if necessary,
   * and displays them as individual <article> elements.
   */
  updateDiaryDisplay() {
    if (!this.diaryContainer) {
      console.error("Diary container not found!");
      return;
    }
    // Clear the diary container
    this.diaryContainer.innerHTML = "";

    // Retrieve an array of IDs for entries that have already been animated from localStorage
    const animatedIds = JSON.parse(localStorage.getItem("animatedDiaryIds") || "[]");

    // Retrieve entries from the database
    const entries = this.databaseManager.getDiaryEntries();
    const seen = new Set();
    const currentLanguage = this.languageManager.getLanguage();

    entries.forEach(entryObj => {
      // Prevent duplicate entries by id
      if (seen.has(entryObj.id)) return;
      seen.add(entryObj.id);

      // Create an <article> wrapper for the entry
      const articleElem = document.createElement("article");
      articleElem.classList.add(entryObj.postClass);

      // Split entryObj.entry into main text and image data (if "[photo attached]" is present)
      let mainText = entryObj.entry;
      let imageData = null;
      if (entryObj.entry.includes("[photo attached]")) {
        const parts = entryObj.entry.split("[photo attached]");
        mainText = parts[0].trim();
        if (parts.length >= 2) {
          imageData = parts[1].trim();
          if (!/^data:/.test(imageData)) {
            imageData = "data:image/png;base64," + imageData;
          }
        }
      }

      // Localize the text if necessary
      const localizedText = this.languageManager.locales[currentLanguage][mainText] || mainText;

      // Remove special prefixes (user_post_success: / user_post_failed:)
      const cleanedText = localizedText
        .replace(/^user_post_success:\s*/, '')
        .replace(/^user_post_failed:\s*/, '');

      // Remove fractional seconds and the "Z" from the timestamp, if present
      const formattedTimestamp = entryObj.timestamp.replace(/\.\d+Z$/, '');

      // Format the final text as "MESSAGE (timestamp)"
      const fullText = `${cleanedText} (${formattedTimestamp})`;

      // Create a text container <p>
      const textContainer = document.createElement("p");
      // If an image is attached, add an <img> element before the text
      if (imageData) {
        const img = document.createElement("img");
        img.src = imageData;
        img.alt = this.languageManager.locales[currentLanguage]["photo_attached"] || "Photo attached";
        img.style.maxWidth = "100%";
        articleElem.appendChild(img);
      }
      articleElem.appendChild(textContainer);

      // If a date is at the end, move it to a new line
      let messageText = fullText;
      const dateMatch = fullText.match(/(\(\d{4}-\d{2}-\d{2}.*\))$/);
      if (dateMatch) {
        const dateText = dateMatch[1].trim();
        messageText = fullText.replace(dateText, "").trim() + "<br>" + dateText;
      }

      // Check if this entry has already been animated
      const isAlreadyAnimated = animatedIds.includes(entryObj.id);
      const effectsManager = this.visualEffectsManager;
      if (isAlreadyAnimated) {
        // If already animated, simply display the result
        textContainer.innerHTML = messageText;
      } else {
        // For new entries, animate the text
        const animatedSpan = document.createElement("span");
        textContainer.innerHTML = "";
        textContainer.appendChild(animatedSpan);

        // Trigger the appropriate effect (ghost or user)
        if (entryObj.postClass === "ghost-post") {
          effectsManager.triggerGhostTextEffect(animatedSpan, messageText);
        } else {
          effectsManager.triggerUserTextEffect(animatedSpan, messageText);
        }

        // Mark this entry as animated
        animatedIds.push(entryObj.id);
      }

      // Append the <article> to the diary container
      this.diaryContainer.appendChild(articleElem);
    });

    // Save the updated list of animated IDs to localStorage
    localStorage.setItem("animatedDiaryIds", JSON.stringify(animatedIds));
    console.log("📖 Diary updated.");
  }

  /**
   * startGhostQuest – Example method: Starts a quest for the current ghost.
   * Adds a diary entry with the quest key and logs the information to the console.
   */
  async startGhostQuest() {
    const ghost = this.ghostManager.getCurrentGhost();
    if (ghost) {
      const questKey = `ghost_${ghost.id}_quest`;
      await this.addDiaryEntry(questKey, true);
      console.log(`👻 Starting quest for ${ghost.name}...`);
      // Here, you can call QuestManager.activateQuest(questKey) or trigger another event.
    } else {
      console.error("⚠️ No active ghost found.");
    }
  }

  /*
   * Example of how to organize logic for triggering small events/quests:
   * - All mirror quest-related logic is now encapsulated in BaseMirrorQuest and its events.
   * - For short events (attempts to scare, door knocks, phone calls), you could add
   *   methods or call gameEventManager.activateEvent('ghost_knock') etc.
   *
   * This approach keeps the EventManager as a "clean" place for diary operations
   * and helper methods. All mirror quest logic has been moved to BaseMirrorQuest,
   * and any specific "what is this?!" logic to a separate event, if desired.
   */
}