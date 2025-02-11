export class BaseMirrorQuest {
  constructor(eventManager, appInstance) {
    this.eventManager = eventManager;
    this.app = appInstance;
    this.key = "mirror_quest"; // уникальный ключ для этого события
    this.doneKey = "mirror_done"; // ключ завершенного события
    this.registerEvents(); // Регистрируем обработчики для действий с камерами
  }

  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`Активируем событие: ${this.key}`);
      await this.eventManager.addDiaryEntry(this.key);
      
      // Отмечаем, что зеркальный квест активен
      localStorage.setItem("mirrorQuestActive", "true");
      
      // Подсвечиваем кнопку камеры
      const cameraBtn = document.getElementById("toggle-camera");
      if (cameraBtn) {
        cameraBtn.classList.add("glowing");
      }
      
      // Создаем кнопку "Запостить", если её ещё нет
      if (!document.getElementById("post-button")) {
        const postButton = document.createElement("button");
        postButton.id = "post-button";
        postButton.textContent = "Запостить";
        postButton.addEventListener("click", async () => {
          await this.finish();
          postButton.remove();
        });
        document.getElementById("main-screen").appendChild(postButton);
      }
      
      // Запускаем таймер на автоматическое завершение квеста (например, через 60 секунд)
      this.questTimeout = setTimeout(() => {
        if (localStorage.getItem("mirrorQuestActive") === "true") {
          if (cameraBtn) cameraBtn.classList.remove("glowing");
          localStorage.removeItem("mirrorQuestActive");
          alert("Время для выполнения зеркального квеста истекло.");
          const postButton = document.getElementById("post-button");
          if (postButton) postButton.remove();
        }
      }, 60000);
    }
  }

  async checkStatus() {
    console.log("🪞 Зеркальный квест активно. Запускаем проверку...");
    return new Promise(resolve => {
      setTimeout(async () => {
        console.log("⏱ Запуск сравнения текущего кадра...");
        const success = await this.app.compareCurrentFrame();
        console.log("⏱ Результат сравнения:", success);
        resolve(success);
      }, 3000);
    });
  }

  async finish() {
    if (this.eventManager.isEventLogged(this.doneKey)) {
      console.log(`Квест "${this.key}" уже выполнен, повторная проверка не требуется.`);
      return;
    }

    const success = await this.checkStatus();
    if (success) {
      if (this.questTimeout) {
        clearTimeout(this.questTimeout);
      }
      if (!this.eventManager.isEventLogged(this.doneKey)) {
        await this.eventManager.addDiaryEntry(this.doneKey);
        await this.eventManager.addDiaryEntry("what_was_it", this.app.lastMirrorPhoto);
      }
      const cameraBtn = document.getElementById("toggle-camera");
      if (cameraBtn) {
        cameraBtn.classList.remove("glowing");
      }
      localStorage.removeItem("mirrorQuestActive");
      alert("✅ Задание «подойти к зеркалу» выполнено!");
      if (this.app.ghostManager) {
        this.app.ghostManager.triggerNextPhenomenon();
      }
    } else {
      alert("❌ Нет совпадения! Попробуйте ещё раз!");
    }
  }

  registerEvents() {
    const cameraBtn = document.getElementById("toggle-camera");
    if (cameraBtn) {
      cameraBtn.addEventListener("click", async () => {
        if (localStorage.getItem("mirrorQuestActive") === "true") {
          console.log("🪞 Запущена проверка зеркального квеста через событие кнопки");
          await this.finish();
        }
      });
    }
  }
}