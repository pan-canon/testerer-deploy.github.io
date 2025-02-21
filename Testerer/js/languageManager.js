/**
 * LanguageManager is responsible for managing localization in the application.
 * It loads the translation dictionaries (locales), listens for changes on the language selector,
 * and updates all page elements that have the data-i18n attribute.
 * This class also saves the selected language in localStorage to preserve the choice between sessions.
 */
import locales from './locales.js';

export class LanguageManager {
  /**
   * Constructor for LanguageManager.
   * @param {string} selectorId - The ID of the <select> element used for language selection.
   *
   * During initialization:
   * - The translation dictionary (locales) is loaded.
   * - The current language is set from localStorage (or defaults to 'en').
   * - The selector's value is updated, and applyLanguage() is called to update the UI.
   * - A change event listener is added to the selector to handle language switching.
   */
  constructor(selectorId) {
    // Load the localization dictionaries (translations).
    // It is assumed that the variable 'locales' is defined globally or imported.
    this.locales = locales;

    // Get the language selector element by its ID.
    this.selector = document.getElementById(selectorId);

    // Set the current language from localStorage, defaulting to 'en'.
    this.currentLanguage = localStorage.getItem('language') || 'en';

    // Update the selector to reflect the current language.
    this.selector.value = this.currentLanguage;

    // Apply the selected language to all elements with the data-i18n attribute.
    this.applyLanguage();

    // Add an event listener to update the language when the selector's value changes.
    this.selector.addEventListener('change', () => {
      this.currentLanguage = this.selector.value;
      localStorage.setItem('language', this.currentLanguage);
      this.applyLanguage();
    });
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
   * getLanguage – Returns the currently selected language.
   * @returns {string} The current language (e.g., 'en', 'ru', 'uk').
   */
  getLanguage() {
    return this.currentLanguage;
  }
}