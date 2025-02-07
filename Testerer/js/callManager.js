export class CallManager {
  /**
   * @param {EventManager} eventManager – менеджер событий (для работы с дневником)
   * @param {App} appInstance – ссылка на основной объект App
   * @param {LanguageManager} languageManager – менеджер языка для локализации
   */
  constructor(eventManager, appInstance, languageManager) {
    this.eventManager = eventManager;
    this.app = appInstance;
    this.languageManager = languageManager;
  }

  /**
   * Запускает процесс звонка
   */
  startPhoneCall() {
    const ringtone = new Audio('audio/phone_ringtone.mp3');
    ringtone.play();

    const answerCallBtn = document.createElement("button");
    const ignoreCallBtn = document.createElement("button");

    // Получаем локализованные тексты для кнопок
    answerCallBtn.textContent = this.languageManager.locales[this.languageManager.getLanguage()]["answer"];
    ignoreCallBtn.textContent = this.languageManager.locales[this.languageManager.getLanguage()]["ignore"];

    // Обработка нажатия кнопки "Ответить"
    answerCallBtn.addEventListener("click", async () => {
      ringtone.pause();
      answerCallBtn.remove();
      ignoreCallBtn.remove();

      // Фиксируем, что звонок обработан, активируем флаг для квеста
      localStorage.setItem("callHandled", "true");
      localStorage.setItem("mirrorQuestActive", "true");

      // Добавляем запись в дневник, что звонок принят
      await this.eventManager.addDiaryEntry("answered_call");

      // Делаем кнопку камеры видимой и добавляем ей класс свечения
      const cameraBtn = document.getElementById("toggle-camera");
      cameraBtn.style.display = "inline-block";
      cameraBtn.classList.add("glowing");
    });

    // Обработка нажатия кнопки "Игнорировать"
    ignoreCallBtn.addEventListener("click", async () => {
      localStorage.setItem("callHandled", "true");
      await this.endCall(ringtone, answerCallBtn, ignoreCallBtn, "ignored_call");
    });

    // Добавляем кнопки на главный экран приложения
    this.app.mainScreen.appendChild(answerCallBtn);
    this.app.mainScreen.appendChild(ignoreCallBtn);
  }

  /**
   * Завершает звонок и добавляет запись в дневник (если требуется)
   * @param {Audio} ringtone – объект звукового сигнала
   * @param {HTMLElement} answerCallBtn – кнопка ответа на звонок
   * @param {HTMLElement} ignoreCallBtn – кнопка игнорирования звонка
   * @param {string} eventKey – ключ для записи в дневник
   */
  async endCall(ringtone, answerCallBtn, ignoreCallBtn, eventKey) {
    ringtone.pause();
    answerCallBtn.remove();
    ignoreCallBtn.remove();

    if (!this.eventManager.isEventLogged(eventKey)) {
      await this.eventManager.addDiaryEntry(eventKey);
    }
    const cameraBtn = document.getElementById("toggle-camera");
    cameraBtn.style.display = "inline-block";
  }
}