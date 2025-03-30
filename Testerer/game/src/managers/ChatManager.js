import { TemplateEngine } from '../utils/TemplateEngine.js';
import { animateText } from '../utils/SpiritBoardUtils.js';

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
   */
  constructor(options = {}) {
    const basePath = options.basePath || getBasePath();
    this.templateUrl = options.templateUrl || `${basePath}/src/templates/chat_template.html`;
    this.mode = options.mode || 'full';
    this.container = null; // DOM element for the chat section
    this.databaseManager = options.databaseManager || null;
    // We'll store the scenario manager here if needed.
    this.scenarioManager = null;
  }

  /**
   * Initializes the ChatManager by fetching the chat template fragment,
   * rendering it using the TemplateEngine with initial data (including messages from DB if available),
   * and inserting it into the chat section in index.html.
   * @returns {Promise<void>}
   */
  async init() {
    try {
      // Fetch the chat template fragment from the external file.
      const response = await fetch(this.templateUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch template from ${this.templateUrl}`);
      }
      const templateText = await response.text();

      // Prepare initial messages string.
      let messagesStr = "";
      if (this.databaseManager) {
        const chatMessages = this.databaseManager.getChatMessages();
        if (chatMessages && chatMessages.length > 0) {
          messagesStr = chatMessages
            .map(msg => `<div class="chat-message ${msg.sender}" style="margin-bottom: 0.5rem; padding: 0.5rem; border-radius: 4px; max-width: 80%; word-wrap: break-word;">${msg.message}</div>`)
            .join("");
        } else {
          // Default initial message if no records in DB.
          messagesStr = `<div class="chat-message spirit" style="margin-bottom: 0.5rem; padding: 0.5rem; border-radius: 4px; max-width: 80%; word-wrap: break-word;">Hello Chat!</div>`;
        }
      } else {
        messagesStr = `<div class="chat-message spirit" style="margin-bottom: 0.5rem; padding: 0.5rem; border-radius: 4px; max-width: 80%; word-wrap: break-word;">Hello Chat!</div>`;
      }

      // Prepare initial data for rendering the template.
      const data = {
        messages: messagesStr,
        spiritBoardContent: 'Spirit Board', // Can be replaced with localized value.
        options: '' // Initially, no dialogue options.
      };

      // Render the template using TemplateEngine.
      const renderedHTML = TemplateEngine.render(templateText, data);

      // Get the chat section container from index.html.
      this.container = document.getElementById('chat-section');
      if (!this.container) {
        throw new Error('Chat section container (id="chat-section") not found in index.html');
      }
      // Insert the rendered HTML into the chat section.
      this.container.innerHTML = renderedHTML;
      // Initially hide the chat section.
      this.container.style.display = 'none';

      // If mode is 'board-only', hide the options section.
      if (this.mode === 'board-only') {
        const optionsEl = this.container.querySelector('#chat-options');
        if (optionsEl) {
          optionsEl.style.display = 'none';
        }
      }

      console.log('ChatManager initialized.');
      
      // Automatically initialize ChatScenarioManager if not already set.
      try {
        const module = await import('./ChatScenarioManager.js');
        this.scenarioManager = new module.ChatScenarioManager(this, null);
        await this.scenarioManager.init();
      } catch (e) {
        console.error("Failed to initialize ChatScenarioManager:", e);
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
   * Sends the initial localized message to the chat.
   *
   * @param {string} localizedText - The localized text to send as the first message.
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
   * Loads a dialogue configuration and updates the chat content.
   *
   * The expected format of dialogueConfig:
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
   * If the number of options is greater than 3, the options container will be made scrollable.
   *
   * @param {Object} dialogueConfig - The dialogue configuration object.
   */
  loadDialogue(dialogueConfig) {
    if (!this.container) {
      console.error('ChatManager is not initialized.');
      return;
    }

    // Build HTML for messages.
    let messagesHTML = '';
    dialogueConfig.messages.forEach(msg => {
      messagesHTML += `<div class="chat-message ${msg.sender}" style="margin-bottom: 0.5rem; padding: 0.5rem; border-radius: 4px; max-width: 80%; word-wrap: break-word;">${msg.text}</div>`;
      if (msg.animateOnBoard) {
        const boardEl = this.container.querySelector('#spirit-board');
        if (boardEl) {
          animateText(boardEl, msg.text);
        }
      }
    });

    // Build HTML for options.
    let optionsHTML = '';
    if (dialogueConfig.options && dialogueConfig.options.length > 0) {
      dialogueConfig.options.forEach(option => {
        optionsHTML += `<button class="button is-link dialogue-option" style="margin-bottom: 0.5rem;">${option.text}</button>`;
      });
    }

    // Update the messages container.
    const messagesEl = this.container.querySelector('#chat-messages');
    if (messagesEl) {
      messagesEl.innerHTML = messagesHTML;
    }

    // Update the options container and make it scrollable if needed.
    const optionsEl = this.container.querySelector('#chat-options');
    if (optionsEl) {
      if (dialogueConfig.options && dialogueConfig.options.length > 3) {
        optionsEl.style.maxHeight = '200px';
        optionsEl.style.overflowY = 'auto';
      } else {
        optionsEl.style.maxHeight = '';
        optionsEl.style.overflowY = '';
      }
      optionsEl.innerHTML = optionsHTML;
    }

    // Clear/update the spirit board content.
    const boardEl = this.container.querySelector('#spirit-board');
    if (boardEl) {
      boardEl.innerHTML = '';
    }

    // Attach event listeners to dialogue option buttons.
    const optionButtons = this.container.querySelectorAll('.dialogue-option');
    optionButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        // If the ChatScenarioManager is available, use it to advance the dialogue.
        if (this.scenarioManager && typeof this.scenarioManager.advanceDialogue === 'function') {
          this.scenarioManager.advanceDialogue(index);
        } else {
          // Fallback: log the selected option.
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
   * @param {string} mode - 'full' for full chat, or 'board-only' to show only the spirit board.
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
}