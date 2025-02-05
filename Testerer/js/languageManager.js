export class LanguageManager {
  constructor(selectorId) {
    this.locales = locales;
    this.selector = document.getElementById(selectorId);
    this.currentLanguage = localStorage.getItem('language') || 'en';
    this.selector.value = this.currentLanguage;
    this.applyLanguage();
    this.selector.addEventListener('change', () => {
      this.currentLanguage = this.selector.value;
      localStorage.setItem('language', this.currentLanguage);
      this.applyLanguage();
    });
  }
  
  applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (this.locales[this.currentLanguage] && this.locales[this.currentLanguage][key]) {
        el.textContent = this.locales[this.currentLanguage][key];
      }
    });
  }
  
  getLanguage() {
    return this.currentLanguage;
  }
}