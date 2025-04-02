import { TemplateEngine } from '../utils/TemplateEngine.js';
import { animateText } from '../utils/SpiritBoardUtils.js';
import { StateManager } from './StateManager.js';

// Dynamically determine the base path without fixed values.
function getBasePath() {
  const loc = window.location;
  const path = loc.pathname.substring(0, loc.pathname.lastIndexOf('/'));
  return loc.origin + path;
}

export class ChatManager {
  /**
   * @param {Object} options - Configuration options for the chat.
   *  - templateUrl: URL to fetch the chat template fragment (default: dynamic base path + '/src/templates/chat_template.html')
   *  - mode: 'full' (default) for full chat, or 'board-only' for displaying only the spirit board.
   *  - basePath: (optional) override for the base path.
   *  - databaseManager: (optional) instance of DatabaseManager to load chat messages.
   *  - languageManager: (optional) instance of LanguageManager for locale integration.
   */
  constructor(options = {}) {
    const basePath = options.basePath || getBasePath();
    this.templateUrl = options.templateUrl || `${basePath}/src/templates/chat_template.html`;
    this.mode = options.mode || 'full';
    this.container = null; // DOM element for the chat section
    this.databaseManager = options.databaseManager || null;
    // Optional language manager for localized strings.
    this.languageManager = options.languageManager || null;
    // We'll store the scenario manager here if needed.
    this.scenarioManager = null;
  }

  /**
   * Helper method to fetch a localized string by key.
   * If a languageManager is provided and contains the key, it returns the localized value.
   * Otherwise, returns the defaultValue.
   *
   * @param {string} key - The localization key.
   * @param {string} defaultValue - The fallback value if no localization is found.
   * @returns {string} Localized string.
   */
  getLocalizedString(key, defaultValue) {
    if (
      this.languageManager &&
      this.languageManager.locales &&
      typeof this.languageManager.getLanguage === 'function'
    ) {
      const lang = this.languageManager.getLanguage();
      if (this.languageManager.locales[lang] && this.languageManager.locales[lang][key]) {
        return this.languageManager.locales[lang][key];
      }
    }
    return defaultValue;
  }

  /**
   * Initializes the ChatManager by fetching the chat template fragment,
   * rendering it using the TemplateEngine with initial data (loading messages from DB if available),
   * and inserting it into the chat section in index.html.
   * Also initializes the conversation if not marked as completed.
   * @returns {Promise<void>}
   */
  async init() {
    try {
      // Fetch the chat template fragment.
      const response = await fetch(this.templateUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch template from ${this.templateUrl}`);
      }
      const templateText = await response.text();

      // Load saved messages from DB.
      let messagesStr = "";
      if (this.databaseManager) {
        const chatMessages = this.databaseManager.getChatMessages();
        if (chatMessages && chatMessages.length > 0) {
          messagesStr = chatMessages
            .map(msg => `<div class="chat-message ${msg.sender}" style="margin-bottom: 0.5rem; padding: 0.5rem; border-radius: 4px; max-width: 80%; word-wrap: break-word;">${msg.message}</div>`)
            .join("");
        }
      }

      // Get localized string for the spirit board content.
      const localizedSpiritBoardContent = this.getLocalizedString('spirit_board', 'Spirit Board');

      // Render the template.
      const data = {
        messages: messagesStr,
        spiritBoardContent: localizedSpiritBoardContent,
        options: '' // Initially no dialogue options.
      };
      const renderedHTML = TemplateEngine.render(templateText, data);

      // Insert rendered HTML into chat container.
      this.container = document.getElementById('chat-section');
      if (!this.container) {
        throw new Error('Chat section container (id="chat-section") not found in index.html');
      }
      this.container.innerHTML = renderedHTML;
      this.container.style.display = 'none';

      // If mode is 'board-only', hide the options container.
      if (this.mode === 'board-only') {
        const optionsEl = this.container.querySelector('#chat-options');
        if (optionsEl) {
          optionsEl.style.display = 'none';
        }
      }

      console.log('ChatManager initialized.');

      // --- FIX: Prevent auto-start unless conversation was explicitly started ---
      const conversationStarted = StateManager.get('chat_started') === 'true';
      const conversationCompleted = StateManager.get('chat_conversation_completed') === 'true';
      if (conversationStarted && !conversationCompleted) {
        try {
          const module = await import('./ChatScenarioManager.js');
          this.scenarioManager = new module.ChatScenarioManager(this, null);
          await this.scenarioManager.init();
        } catch (e) {
          console.error("Failed to resume ChatScenarioManager:", e);
        }
      } else {
        console.log("No active conversation found. Chat remains idle.");
      }
      
    } catch (error) {
      console.error('Error initializing ChatManager:', error);
    }
  }

  /**
   * Shows the chat section.
   */
  show() {
    if (this.container) {
      this.container.style.display = 'block';
      console.log('ChatManager is now visible.');
    }
  }

  /**
   * Hides the chat section.
   */
  hide() {
    if (this.container) {
      this.container.style.display = 'none';
      console.log('ChatManager is now hidden.');
    }
  }

  /**
   * Sends an initial localized message to the chat.
   *
   * @param {string} localizedText - The text to send.
   */
  sendInitialMessage(localizedText) {
    if (!this.container) {
      console.error('ChatManager is not initialized.');
      return;
    }
    const messagesEl = this.container.querySelector('#chat-messages');
    if (messagesEl) {
      const messageHTML = `<div class="chat-message spirit" style="margin-bottom: 0.5rem; padding: 0.5rem; border-radius: 4px; max-width: 80%; word-wrap: break-word;">${localizedText}</div>`;
      messagesEl.innerHTML += messageHTML;
      console.log('Initial message sent:', localizedText);
    }
  }

  /**
   * Saves a chat message using the DatabaseManager.
   * @param {Object} msg - An object with properties: sender and text.
   */
  async saveMessage(msg) {
    if (this.databaseManager && typeof this.databaseManager.addChatMessage === 'function') {
      await this.databaseManager.addChatMessage(msg.sender, msg.text);
      console.log(`Message saved: [${msg.sender}] ${msg.text}`);
    }
  }

  /**
   * Loads a dialogue configuration and updates the chat content.
   *
   * The expected dialogueConfig format:
   * {
   *   messages: [
   *     { sender: 'spirit'|'user', text: '...', animateOnBoard: true|false },
   *     ...
   *   ],
   *   options: [
   *     { text: 'Option 1', onSelect: function },
   *     ...
   *   ]
   * }
   *
   * @param {Object} dialogueConfig - The dialogue configuration object.
   */
  async loadDialogue(dialogueConfig) {
    if (!this.container) {
      console.error('ChatManager is not initialized.');
      return;
    }

    let messagesHTML = '';
    for (const msg of dialogueConfig.messages) {
      // Get localized message text if available.
      const localizedMsg = this.getLocalizedString(msg.text, msg.text);
      messagesHTML += `<div class="chat-message ${msg.sender}" style="margin-bottom: 0.5rem; padding: 0.5rem; border-radius: 4px; max-width: 80%; word-wrap: break-word;">${localizedMsg}</div>`;
      if (msg.animateOnBoard) {
        const boardEl = this.container.querySelector('#spirit-board');
        if (boardEl) {
          animateText(boardEl, localizedMsg);
        }
      }
      await this.saveMessage({ sender: msg.sender, text: localizedMsg });
    }

    let optionsHTML = '';
    if (dialogueConfig.options && dialogueConfig.options.length > 0) {
      for (const option of dialogueConfig.options) {
        // Get localized option text if available.
        const localizedOptionText = this.getLocalizedString(option.text, option.text);
        optionsHTML += `<button class="button is-link dialogue-option" style="margin-bottom: 0.5rem;">${localizedOptionText}</button>`;
      }
    }

    const messagesEl = this.container.querySelector('#chat-messages');
    if (messagesEl) {
      // Append new messages (history is preserved).
      messagesEl.innerHTML += messagesHTML;
    }

    const optionsEl = this.container.querySelector('#chat-options');
    if (optionsEl) {
      if (dialogueConfig.options && dialogueConfig.options.length > 3) {
        optionsEl.style.maxHeight = '200px';
        optionsEl.style.overflowY = 'auto';
      } else {
        optionsEl.style.maxHeight = '';
        optionsEl.style.overflowY = '';
      }
      // Replace options to show current choices.
      optionsEl.innerHTML = optionsHTML;
    }

    const boardEl = this.container.querySelector('#spirit-board');
    if (boardEl) {
      boardEl.innerHTML = '';
    }

    const optionButtons = this.container.querySelectorAll('.dialogue-option');
    optionButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        if (this.scenarioManager && typeof this.scenarioManager.advanceDialogue === 'function') {
          this.scenarioManager.advanceDialogue(index);
        } else {
          const option = dialogueConfig.options[index];
          console.log(`Option selected: ${option.text}`);
        }
      });
    });

    console.log('Dialogue loaded in ChatManager.');
  }

  /**
   * Sets the display mode for the chat.
   *
   * @param {string} mode - 'full' for full chat, or 'board-only' for only the spirit board.
   */
  setMode(mode) {
    this.mode = mode;
    if (this.container) {
      const optionsEl = this.container.querySelector('#chat-options');
      if (mode === 'board-only' && optionsEl) {
        optionsEl.style.display = 'none';
      } else if (optionsEl) {
        optionsEl.style.display = 'block';
      }
    }
    console.log(`ChatManager mode set to: ${mode}`);
  }

  /**
   * Resets the current conversation by clearing saved state and reinitializing the dialogue.
   * This allows for independent conversation sessions without restarting the entire chat.
   */
  async restartConversation() {
    // Mark conversation as started.
    StateManager.set('chat_started', 'true');
    // Clear conversation state in StateManager.
    StateManager.remove('chat_conversation_completed');
    StateManager.remove('chat_currentDialogueIndex');

    // Clear chat messages container to prevent duplicate messages.
    if (this.container) {
      const messagesEl = this.container.querySelector('#chat-messages');
      if (messagesEl) {
        messagesEl.innerHTML = '';
      }
    }

    // Reinitialize the scenario manager to start the dialogue from the beginning.
    try {
      const module = await import('./ChatScenarioManager.js');
      this.scenarioManager = new module.ChatScenarioManager(this, null);
      await this.scenarioManager.init();
      console.log('Conversation restarted.');
    } catch (e) {
      console.error("Failed to restart conversation:", e);
    }
  }

  /**
   * Schedules a conversation restart after a specified delay.
   *
   * @param {number} delay - Delay in milliseconds before restarting the conversation (default: 5000 ms).
   */
  scheduleConversationRestart(delay = 5000) {
    setTimeout(() => {
      this.restartConversation();
    }, delay);
    console.log(`Conversation restart scheduled in ${delay} ms.`);
  }
}