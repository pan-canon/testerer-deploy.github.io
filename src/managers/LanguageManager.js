// Import base locales, then merge them
import baseLocales from '../locales/locales.js';

// Merge base locales for each language
const mergedLocales = {
  en: { ...baseLocales.en },
  ru: { ...baseLocales.ru },
  uk: { ...baseLocales.uk }
};

/**
 * LanguageManager is responsible for managing localization in the application.
 * It loads the translation dictionaries (locales), listens for changes on the language selector,
 * and updates all page elements that have the data-i18n attribute.
 * This class also saves the selected language in localStorage to preserve the choice between sessions.
 */
export class LanguageManager {
  /**
   * Constructor for LanguageManager.
   * @param {string} selectorId - The ID of the <select> element used for language selection.
   *
   * During initialization:
   * - The merged translation dictionary is loaded.
   * - The current language is set from localStorage (or defaults to 'en').
   * - The selector's value is updated, and applyLanguage() is called to update the UI.
   * - A change event listener is added to the selector to handle language switching.
   */
  constructor(selectorId) {
    // Use merged locales (base)
    this.locales = mergedLocales;

    // Get the language selector element by its ID.
    this.selector = document.getElementById(selectorId);
    if (!this.selector) {
      console.error(`Language selector with id "${selectorId}" not found.`);
    }

    // Set the current language from localStorage, defaulting to 'en'.
    this.currentLanguage = localStorage.getItem('language') || 'en';

    // Update the selector to reflect the current language.
    if (this.selector) {
      this.selector.value = this.currentLanguage;
    }

    // Apply the selected language to all elements with the data-i18n attribute.
    this.applyLanguage();

    // Add an event listener to update the language when the selector's value changes.
    if (this.selector) {
      this.selector.addEventListener('change', () => {
        this.currentLanguage = this.selector.value;
        localStorage.setItem('language', this.currentLanguage);
        this.applyLanguage();
      });
    }
  }

  /**
   * applyLanguage – Updates the text content of all elements with the data-i18n attribute
   * based on the selected language.
   *
   * This method iterates over all elements with data-i18n, retrieves the translation key,
   * and replaces the element's text content with the corresponding translation from the dictionary.
   */
  applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      // If a translation exists for the key in the current language, update the text.
      if (this.locales[this.currentLanguage] && this.locales[this.currentLanguage][key]) {
        el.textContent = this.locales[this.currentLanguage][key];
      }
    });
  }

  /**
   * updateContainerLanguage – Updates the text content of all elements with the data-i18n attribute
   * within a specific container. This is useful for dynamically inserted content.
   *
   * @param {HTMLElement} container - The container element in which to update localized text.
   */
  updateContainerLanguage(container) {
    if (!container) return;
    container.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (this.locales[this.currentLanguage] && this.locales[this.currentLanguage][key]) {
        el.textContent = this.locales[this.currentLanguage][key];
      }
    });
  }

  /**
   * Optional method: startObservingContainer
   * Sets up a MutationObserver on a given container to automatically update any newly
   * added elements with the data-i18n attribute.
   *
   * @param {HTMLElement} container - The container element to observe.
   * @returns {MutationObserver} The observer instance (can be disconnected when no longer needed).
   */
  startObservingContainer(container) {
    if (!container) return;
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // If the new node itself has data-i18n attribute, update it.
            if (node.hasAttribute && node.hasAttribute('data-i18n')) {
              const key = node.getAttribute('data-i18n');
              if (this.locales[this.currentLanguage] && this.locales[this.currentLanguage][key]) {
                node.textContent = this.locales[this.currentLanguage][key];
              }
            }
            // Also update any descendant elements.
            if (node.querySelectorAll) {
              node.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (this.locales[this.currentLanguage] && this.locales[this.currentLanguage][key]) {
                  el.textContent = this.locales[this.currentLanguage][key];
                }
              });
            }
          }
        });
      });
    });
    observer.observe(container, { childList: true, subtree: true });
    console.log("[LanguageManager] Started observing container for localization updates.");
    return observer;
  }

  /**
   * getLanguage – Returns the currently selected language.
   * @returns {string} The current language (e.g., 'en', 'ru', 'uk').
   */
  getLanguage() {
    return this.currentLanguage;
  }

  /**
   * translate – Returns the localized text for the given key.
   *
   * @param {string} key - The localization key.
   * @param {string} [defaultValue=key] - The default value if no translation is found.
   * @returns {string} The localized text.
   */
  translate(key, defaultValue = key) {
    if (this.locales[this.currentLanguage] && this.locales[this.currentLanguage][key]) {
      return this.locales[this.currentLanguage][key];
    }
    return defaultValue;
  }
}