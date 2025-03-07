// --- Event Modules ---
import { WelcomeEvent } from './events/welcomeEvent.js';
import { PostMirrorEvent } from './events/postMirrorEvent.js';
import { PostRepeatingEvent } from './events/postRepeatingEvent.js';
import { FinalEvent } from './events/finalEvent.js';

// --- State and Error Management ---
import { StateManager } from './stateManager.js';
import { ErrorManager } from './errorManager.js';

/**
 * GameEventManager class
 * Manages one-time game events (e.g., welcome, post-mirror, post-repeating, final).
 * It handles auto-launching the welcome event after registration by checking state flags
 * via StateManager, and activates events using the provided EventManager.
 *
 * NOTE: Последовательное связывание событий и квестов теперь реализовано через API GhostManager.
 *       Поэтому этот класс отвечает лишь за активацию конкретного события по ключу.
 */
export class GameEventManager {
  /**
   * @param {EventManager} eventManager - Manager for diary/event operations.
   * @param {App} appInstance - The main application instance.
   * @param {LanguageManager} languageManager - Localization manager.
   */
  constructor(eventManager, appInstance, languageManager) {
    this.eventManager = eventManager;
    this.app = appInstance;
    this.languageManager = languageManager;
    
    // Список одноразовых ивентов (welcome, postMirror, postRepeating, final).
    this.events = [
      new WelcomeEvent(this.eventManager, this.app, this.languageManager),
      new PostMirrorEvent(this.eventManager, this.app),
      new PostRepeatingEvent(this.eventManager, this.app),
      new FinalEvent(this.eventManager, this.app, this.languageManager)
    ];
  }

  /**
   * activateEvent
   * Активирует ивент по его ключу (key).
   * Не вызывает последующие ивенты автоматически (цепочка – через GhostManager).
   *
   * @param {string} key - Ключ ивента.
   */
  async activateEvent(key) {
    const event = this.events.find(e => e.key === key);
    if (event) {
      await event.activate();
      console.log(`Event '${key}' activated.`);
    } else {
      ErrorManager.logError(`Event "${key}" not found in the list.`, "activateEvent");
    }
  }

  /**
   * startQuest
   * Пример вспомогательного метода для запуска квеста конкретного призрака.
   * Проверяем, нет ли ивента с таким же ключом (ghost_1_quest, ghost_2_quest...).
   * Если ивента нет, запускаем квест напрямую через QuestManager.
   */
  async startQuest() {
    const ghost = this.app.ghostManager.getCurrentGhost();
    const questKey = `ghost_${ghost.id}_quest`;
    const event = this.events.find(e => e.key === questKey);
    if (event) {
      await this.activateEvent(questKey);
    } else {
      // Иначе сразу через QuestManager
      await this.app.questManager.activateQuest(questKey);
    }
  }

  /**
   * startMirrorQuest
   * Вспомогательный метод для явного запуска mirror_quest (если нужно).
   */
  async startMirrorQuest() {
    await this.activateEvent('mirror_quest');
    console.log("🪞 Mirror Quest started (event).");
  }
  
  /**
   * autoLaunchWelcomeEvent
   * Автоматически запускает welcome-событие (спустя 5с) после регистрации,
   * если "welcomeDone" ещё не установлен.
   *
   * РАНЬШЕ тут включалась кнопка «Пост», если welcomeDone === "true". 
   * Теперь убираем этот код, чтобы кнопка «Пост» не включалась «преждевременно».
   */
  async autoLaunchWelcomeEvent() {
    if (StateManager.get("welcomeDone") === "true") {
      console.log("Welcome event already completed; auto-launch skipped.");
      // Удалили логику автоматической активации кнопки «Пост».
      return;
    }
    console.log("Auto-launching welcome event in 5 seconds...");
    setTimeout(async () => {
      await this.activateEvent("welcome");
    }, 5000);
  }
}