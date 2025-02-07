// CallManager.js
export class CallManager {
  /**
   * @param {EventManager} eventManager – менеджер дневника
   * @param {App} appInstance – ссылка на основной объект приложения
   * @param {LanguageManager} languageManager – для локализации
   */
  constructor(eventManager, appInstance, languageManager) {
    this.eventManager = eventManager;
    this.app = appInstance;
    this.languageManager = languageManager;
  }

  /**
   * Запускает звонок указанного типа.
   * @param {string} callType – тип звонка (например, "welcome")
   */
  startCall(callType) {
    // В зависимости от callType можно настроить звонок. Здесь для примера обрабатываем "welcome".
    console.log(`Запуск звонка типа "${callType}"`);
    const ringtone = new Audio('audio/phone_ringtone.mp3');
    ringtone.play();

    const answerCallBtn = document.createElement("button");
    const ignoreCallBtn = document.createElement("button");

    // Получаем локализованные надписи для кнопок
    answerCallBtn.textContent = this.languageManager.locales[this.languageManager.getLanguage()]["answer"];
    ignoreCallBtn.textContent = this.languageManager.locales[this.languageManager.getLanguage()]["ignore"];

    // Обработка нажатия кнопки "Ответить"
    answerCallBtn.addEventListener("click", async () => {
      ringtone.pause();
      answerCallBtn.remove();
      ignoreCallBtn.remove();

      // Фиксируем, что звонок обработан, устанавливаем флаги для квеста
      localStorage.setItem("callHandled", "true");
      localStorage.setItem("mirrorQuestActive", "true");

      // Получаем локализованный текст для записи в дневник
      const answeredText = this.languageManager.locales[this.languageManager.getLanguage()]["answered_call"];
      await this.eventManager.addDiaryEntry(answeredText);

      // Делаем кнопку камеры видимой и добавляем ей эффект свечения
      const cameraBtn = document.getElementById("toggle-camera");
      cameraBtn.style.display = "inline-block";
      cameraBtn.classList.add("glowing");
    });

    // Обработка нажатия кнопки "Игнорировать"
    ignoreCallBtn.addEventListener("click", async () => {
      localStorage.setItem("callHandled", "true");
      const ignoredText = this.languageManager.locales[this.languageManager.getLanguage()]["ignored_call"];
      await this.endCall(ringtone, answerCallBtn, ignoreCallBtn, ignoredText);
    });

    // Добавляем кнопки на главный экран
    this.app.mainScreen.appendChild(answerCallBtn);
    this.app.mainScreen.appendChild(ignoreCallBtn);
  }

  /**
   * Завершает звонок и добавляет запись в дневник, если необходимо.
   * @param {Audio} ringtone – объект рингтона
   * @param {HTMLElement} answerCallBtn – кнопка ответа
   * @param {HTMLElement} ignoreCallBtn – кнопка игнорирования
   * @param {string} eventText – локализованный текст для записи в дневник
   */
  async endCall(ringtone, answerCallBtn, ignoreCallBtn, eventText) {
    ringtone.pause();
    answerCallBtn.remove();
    ignoreCallBtn.remove();

    if (!this.eventManager.isEventLogged(eventText)) {
      await this.eventManager.addDiaryEntry(eventText);
    }
    const cameraBtn = document.getElementById("toggle-camera");
    cameraBtn.style.display = "inline-block";
  }
}