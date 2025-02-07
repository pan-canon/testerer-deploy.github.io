import { BaseQuest } from './baseQuest.js';

export class MirrorQuest extends BaseQuest {
  /**
   * @param {EventManager} eventManager
   * @param {App} appInstance – ссылка на основной объект App для доступа к другим функциям, если нужно
   */
  constructor(eventManager, appInstance) {
    super(eventManager);
    this.app = appInstance;
    this.key = "mirror_quest";
    this.doneKey = "mirror_done";
  }

  // Эффект затемнения + помехи
  triggerMirrorEffect() {
    document.body.style.transition = "background 1s";
    document.body.style.background = "black";
    setTimeout(() => {
      document.body.style.background = "";
    }, 1000);

    const staticNoise = new Audio('audio/phone_ringtone.mp3');
    staticNoise.play();
    setTimeout(() => staticNoise.pause(), 3000);
  }

  // Показ задания "Подойти к зеркалу"
  showMirrorTask() {
    const mirrorTask = document.createElement("p");
    // Обратите внимание: доступ к локалям через app.languageManager
    mirrorTask.textContent = this.app.languageManager.locales[this.app.languageManager.getLanguage()]["go_to_mirror"];
    mirrorTask.id = "mirror-task";
    document.getElementById("diary").appendChild(mirrorTask);
  }

  async checkStatus() {
    console.log("🪞 Mirror quest активно. Запускаем проверку...");
    return new Promise(resolve => {
      setTimeout(async () => {
        console.log("⏱ Запуск compareCurrentFrame() через 3 сек...");
        const success = await this.app.compareCurrentFrame();
        console.log("⏱ Результат compareCurrentFrame():", success);
        resolve(success);
      }, 3000);
    });
  }

  async finish() {
    // Если квест уже завершён – ничего не делаем
    if (this.eventManager.isEventLogged(this.doneKey)) {
      console.log(`Quest "${this.key}" уже выполнен, повторная проверка не требуется.`);
      return;
    }

    // Можно вызвать эффект до проверки
    this.triggerMirrorEffect();

    const success = await this.checkStatus();
    if (success) {
      // Добавляем запись о завершении, прикрепляя фото (если нужно)
if (!this.eventManager.isEventLogged(this.doneKey)) {
  await this.eventManager.addDiaryEntry(this.doneKey, this.app.lastMirrorPhoto);
}

      // Показ задания, например, после завершения квеста
      this.showMirrorTask();
      alert("✅ Задание «подойти к зеркалу» выполнено!");
    } else {
      alert("❌ Нет совпадения! Попробуйте ещё раз!");
    }
  }
}