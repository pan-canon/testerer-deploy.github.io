// LanguageManager отвечает за управление языковой локализацией в приложении.
// Он подгружает словари переводов (locales), следит за изменениями в селекторе языка
// и обновляет все элементы страницы, у которых задан атрибут data-i18n.
// Этот класс сохраняет выбранный язык в localStorage, чтобы сохранить выбор между сессиями.

export class LanguageManager {
  /**
   * Конструктор LanguageManager.
   * @param {string} selectorId - ID элемента <select>, через который пользователь выбирает язык.
   *
   * При инициализации:
   * - Загружается объект переводов (locales).
   * - Устанавливается текущий язык из localStorage (или по умолчанию 'en').
   * - Значение селектора обновляется, и вызывается метод applyLanguage() для обновления интерфейса.
   * - Добавляется обработчик события change на селектор для смены языка.
   */
  constructor(selectorId) {
    // Подключаем словари локализации (переводов).
    // Предполагается, что переменная locales определена глобально или импортирована.
    this.locales = locales;

    // Получаем элемент селектора языка по его ID.
    this.selector = document.getElementById(selectorId);

    // Устанавливаем текущий язык: либо из localStorage, либо по умолчанию 'en'.
    this.currentLanguage = localStorage.getItem('language') || 'en';

    // Обновляем значение селектора, чтобы отразить выбранный язык.
    this.selector.value = this.currentLanguage;

    // Применяем выбранный язык ко всем элементам с атрибутом data-i18n.
    this.applyLanguage();

    // Добавляем обработчик события change для селектора языка.
    // При изменении языка обновляем текущее значение, сохраняем его в localStorage и заново применяем переводы.
    this.selector.addEventListener('change', () => {
      this.currentLanguage = this.selector.value;
      localStorage.setItem('language', this.currentLanguage);
      this.applyLanguage();
    });
  }

  /**
   * applyLanguage – обновляет текстовое содержимое всех элементов,
   * у которых задан атрибут data-i18n, на основе выбранного языка.
   *
   * Метод проходит по всем элементам страницы с атрибутом data-i18n,
   * получает ключ перевода из этого атрибута и заменяет текстовое содержимое элемента на
   * соответствующий перевод из словаря.
   */
  applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      // Если в текущем языке существует перевод для данного ключа, обновляем текст.
      if (this.locales[this.currentLanguage] && this.locales[this.currentLanguage][key]) {
        el.textContent = this.locales[this.currentLanguage][key];
      }
    });
  }

  /**
   * getLanguage – возвращает текущий выбранный язык.
   * @returns {string} Текущий язык (например, 'en', 'ru', 'uk').
   */
  getLanguage() {
    return this.currentLanguage;
  }
}