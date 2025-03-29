/**
 * ChatManager.js
 *
 * This module manages the independent chat functionality.
 * It fetches the chat template fragment from an external file,
 * renders it using the TemplateEngine with provided data, and
 * processes dialogue configurations.
 * All direct UI (DOM) manipulation has been moved to ViewManager.
 *
 * The module assumes that main database integration is handled elsewhere.
 */

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
    this.databaseManager = options.databaseManager || null;
    this.renderedHTML = ""; // Will store the initial rendered HTML for the chat UI.
  }

  /**
   * Fetches the chat template fragment and renders it with initial data.
   * Returns the rendered HTML string without inserting it into the DOM.
   *
   * @returns {Promise<string>} The rendered chat template HTML.
   */
  async fetchTemplate() {
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
            .map(
              msg =>
                `<div class="chat-message ${msg.sender}" style="margin-bottom: 0.5rem; padding: 0.5rem; border-radius: 4px; max-width: 80%; word-wrap: break-word;">${msg.message}</div>`
            )
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
        spiritBoardContent: 'Spirit Board', // Can be replaced with a localized value.
        options: '' // Initially, no dialogue options.
      };

      // Render the template using TemplateEngine.
      this.renderedHTML = TemplateEngine.render(templateText, data);
      console.log("ChatManager template fetched and rendered.");
      return this.renderedHTML;
    } catch (error) {
      console.error("Error fetching chat template:", error);
      throw error;
    }
  }

  /**
   * Returns the previously rendered initial chat HTML.
   *
   * @returns {string} The rendered HTML string.
   */
  getInitialChatHTML() {
    return this.renderedHTML;
  }

  /**
   * Processes a dialogue configuration and returns the generated HTML.
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
   * @param {Object} dialogueConfig - The dialogue configuration object.
   * @returns {Object} An object containing messagesHTML and optionsHTML.
   */
  processDialogue(dialogueConfig) {
    let messagesHTML = '';
    dialogueConfig.messages.forEach(msg => {
      messagesHTML += `<div class="chat-message ${msg.sender}" style="margin-bottom: 0.5rem; padding: 0.5rem; border-radius: 4px; max-width: 80%; word-wrap: break-word;">${msg.text}</div>`;
      // Note: Any animation (e.g. using animateText) will be handled by UI logic in ViewManager.
    });

    let optionsHTML = '';
    if (dialogueConfig.options && dialogueConfig.options.length > 0) {
      dialogueConfig.options.forEach(option => {
        optionsHTML += `<button class="button is-link dialogue-option" style="margin-bottom: 0.5rem;">${option.text}</button>`;
      });
    }

    console.log("ChatManager processed dialogue configuration.");
    return { messagesHTML, optionsHTML };
  }
}