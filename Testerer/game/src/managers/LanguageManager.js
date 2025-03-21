// LanguageManager.js
import locales from '../locales/locales.js';

export class LanguageManager {
  /**
   * Constructor for LanguageManager.
   * @param {string} selectorId - The ID of the <select> element used for language selection.
   *
   * The constructor now attempts to find the language selector element.
   * If not found, it logs a warning. Call the initialize() method later
   * when the element is available.
   */
  constructor(selectorId) {
    // Load translation dictionaries.
    this.locales = locales;
    // Set current language from localStorage, default to 'en'
    this.currentLanguage = localStorage.getItem('language') || 'en';
    
    // Try to get the language selector element.
    this.selector = document.getElementById(selectorId);
    if (!this.selector) {
      console.warn(`Language selector with id "${selectorId}" not found during initialization. Call initialize("${selectorId}") later when the element is available.`);
    } else {
      // If found, set initial value and apply language.
      this.selector.value = this.currentLanguage;
      this.applyLanguage();
      // Bind change event to update language.
      this.selector.addEventListener('change', () => {
        this.currentLanguage = this.selector.value;
        localStorage.setItem('language', this.currentLanguage);
        this.applyLanguage();
      });
    }
  }

  /**
   * initialize - Re-initializes the language selector when it becomes available.
   * @param {string} selectorId - The ID of the language selector element.
   */
  initialize(selectorId) {
    this.selector = document.getElementById(selectorId);
    if (this.selector) {
      this.selector.value = this.currentLanguage;
      this.applyLanguage();
      this.selector.addEventListener('change', () => {
        this.currentLanguage = this.selector.value;
        localStorage.setItem('language', this.currentLanguage);
        this.applyLanguage();
      });
      console.log(`LanguageManager initialized with selector id "${selectorId}".`);
    } else {
      console.warn(`Language selector with id "${selectorId}" still not found during initialization.`);
    }
  }

  /**
   * applyLanguage - Updates all elements with data-i18n attribute based on the current language.
   */
  applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (this.locales[this.currentLanguage] && this.locales[this.currentLanguage][key]) {
        el.textContent = this.locales[this.currentLanguage][key];
      }
    });
  }

  /**
   * getLanguage - Returns the current language.
   * @returns {string} The current language code.
   */
  getLanguage() {
    return this.currentLanguage;
  }
}