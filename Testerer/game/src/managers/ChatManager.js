/**
 * ChatManager.js
 *
 * This module manages the independent chat section.
 * It fetches the chat template fragment from an external file,
 * renders it using the TemplateEngine with provided data, and injects it into the chat section.
 * It provides methods to show/hide the chat and to update the dialogue content dynamically.
 *
 * The module assumes that the main database integration is handled elsewhere.
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
   */
  constructor(options = {}) {
    const basePath = options.basePath || getBasePath();
    this.templateUrl = options.templateUrl || `${basePath}/src/templates/chat_template.html`;
    this.mode = options.mode || 'full';
    this.container = null; // DOM element for the chat section
  }

  /**
   * Initializes the ChatManager by fetching the chat template fragment,
   * rendering it using the TemplateEngine, and inserting it into the chat section in index.html.
   * @returns {Promise<void>}
   */
  async init() {
    try {
      // Fetch the chat template fragment from the external file
      const response = await fetch(this.templateUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch template from ${this.templateUrl}`);
      }
      const templateText = await response.text();

      // Prepare initial data for rendering the template
      const data = {
        messages: '',             // Initially, no messages
        spiritBoardContent: 'Spirit Board', // Default spirit board text
        options: ''               // Initially, no dialogue options
      };

      // Render the template using TemplateEngine
      const renderedHTML = TemplateEngine.render(templateText, data);

      // Get the chat section container from index.html
      this.container = document.getElementById('chat-section');
      if (!this.container) {
        throw new Error('Chat section container (id="chat-section") not found in index.html');
      }
      // Insert the rendered HTML into the chat section
      this.container.innerHTML = renderedHTML;
      // Initially hide the chat section
      this.container.style.display = 'none';

      // If mode is 'board-only', hide the options section
      if (this.mode === 'board-only') {
        const optionsEl = this.container.querySelector('#chat-options');
        if (optionsEl) {
          optionsEl.style.display = 'none';
        }
      }

      console.log('ChatManager initialized.');
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
   * Loads a dialogue configuration and updates the chat content.
   * @param {Object} dialogueConfig - Configuration for the dialogue flow.
   * Expected format:
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
   */
  loadDialogue(dialogueConfig) {
    if (!this.container) {
      console.error('ChatManager is not initialized.');
      return;
    }

    // Build HTML for messages
    let messagesHTML = '';
    dialogueConfig.messages.forEach(msg => {
      messagesHTML += `<div class="chat-message ${msg.sender}" style="margin-bottom: 0.5rem; padding: 0.5rem; border-radius: 4px; max-width: 80%; word-wrap: break-word;">${msg.text}</div>`;
      // Animate text on the spirit board if required
      if (msg.animateOnBoard) {
        const boardEl = this.container.querySelector('#spirit-board');
        if (boardEl) {
          animateText(boardEl, msg.text);
        }
      }
    });

    // Build HTML for options
    let optionsHTML = '';
    if (dialogueConfig.options && dialogueConfig.options.length > 0) {
      dialogueConfig.options.forEach(option => {
        // Create a button for each option; event listeners will be attached after rendering
        optionsHTML += `<button class="button is-link dialogue-option">${option.text}</button>`;
      });
    }

    // Update the relevant parts of the chat container with new data
    const messagesEl = this.container.querySelector('#chat-messages');
    if (messagesEl) {
      messagesEl.innerHTML = messagesHTML;
    }
    const optionsEl = this.container.querySelector('#chat-options');
    if (optionsEl) {
      optionsEl.innerHTML = optionsHTML;
    }
    // Optionally reset or update the spirit board content
    const boardEl = this.container.querySelector('#spirit-board');
    if (boardEl) {
      boardEl.innerHTML = ''; // Clear previous content
    }

    // Attach event listeners to the dialogue option buttons
    const optionButtons = this.container.querySelectorAll('.dialogue-option');
    optionButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const option = dialogueConfig.options[index];
        if (typeof option.onSelect === 'function') {
          option.onSelect();
        } else {
          console.log(`Option selected: ${option.text}`);
        }
      });
    });

    console.log('Dialogue loaded in ChatManager.');
  }

  /**
   * Sets the display mode for the chat.
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