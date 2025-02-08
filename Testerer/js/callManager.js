export class CallManager {
  /**
   * @param {EventManager} eventManager – менеджер дневника
   * @param {App} appInstance – ссылка на основное приложение
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
   * @param {object} options – дополнительные параметры, например, onAnswer callback
   */
  startCall(callType, options = {}) {
    console.log(`Запуск звонка типа "${callType}"`);
    const ringtone = new Audio('audio/phone_ringtone.mp3');
    ringtone.play();

    const answerCallBtn = document.createElement("button");
    const ignoreCallBtn = document.createElement("button");

    // Локализуем надписи для кнопок
    answerCallBtn.textContent = this.languageManager.locales[this.languageManager.getLanguage()]["answer"];
    ignoreCallBtn.textContent = this.languageManager.locales[this.languageManager.getLanguage()]["ignore"];

    answerCallBtn.addEventListener("click", async () => {
      ringtone.pause();
      answerCallBtn.remove();
      ignoreCallBtn.remove();

      // Фиксируем, что звонок обработан и устанавливаем флаги для квеста
      localStorage.setItem("callHandled", "true");
      localStorage.setItem("mirrorQuestActive", "true");

      // Если задан колбэк, вызываем его – он определяет, какую запись добавить в дневник.
      if (options.onAnswer) {
        await options.onAnswer();
      } else {
        const answeredText = this.languageManager.locales[this.languageManager.getLanguage()]["answered_call"];
        await this.eventManager.addDiaryEntry(answeredText);
      }

      // Делаем кнопку камеры видимой и добавляем ей класс свечения
      const cameraBtn = document.getElementById("toggle-camera");
      cameraBtn.style.display = "inline-block";
      cameraBtn.classList.add("glowing");
    });

ignoreCallBtn.addEventListener("click", async () => {
  localStorage.setItem("callHandled", "true");
  const ignoredText = this.languageManager.locales[this.languageManager.getLanguage()]["ignored_call"];
  await this.endCall(ringtone, answerCallBtn, ignoreCallBtn, ignoredText);
  
  // Запускаем цепочку явлений для призраков, даже если пользователь не ответил
  if (this.app.ghostManager) {
    await this.app.ghostManager.triggerNextPhenomenon();
  }
});

    this.app.mainScreen.appendChild(answerCallBtn);
    this.app.mainScreen.appendChild(ignoreCallBtn);
  }

  /**
   * Завершает звонок и добавляет запись в дневник (если требуется)
   * @param {Audio} ringtone – объект звукового сигнала
   * @param {HTMLElement} answerCallBtn – кнопка ответа на звонок
   * @param {HTMLElement} ignoreCallBtn – кнопка игнорирования звонка
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
