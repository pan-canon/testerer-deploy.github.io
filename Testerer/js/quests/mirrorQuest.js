import { BaseQuest } from './baseQuest.js';

export class MirrorQuest extends BaseQuest {
  /**
   * @param {EventManager} eventManager
   * @param {App} appInstance – ссылка на основной объект App для вызова compareCurrentFrame()
   */
  constructor(eventManager, appInstance) {
    super(eventManager);
    this.app = appInstance;
    this.key = "mirror_quest";
    this.doneKey = "mirror_done";
  }

  // Эффект затемнения
  triggerMirrorEffect() {
    console.log("🔥 triggerMirrorEffect: запуск эффекта затемнения");
    document.body.style.transition = "background 1s";
    document.body.style.background = "black";
    setTimeout(() => {
      document.body.style.background = "";
      console.log("🌟 triggerMirrorEffect: эффект затемнения завершён");
    }, 1000);
    const staticNoise = new Audio('audio/phone_ringtone.mp3');
    staticNoise.play();
    console.log("🔊 triggerMirrorEffect: звук статического шума воспроизводится");
    setTimeout(() => {
      staticNoise.pause();
      console.log("🔇 triggerMirrorEffect: звук статического шума остановлен");
    }, 3000);
  }

  // Отображение задания "Подойти к зеркалу"
  showMirrorTask() {
    console.log("🪞 showMirrorTask: отображение задания 'Подойти к зеркалу'");
    const mirrorTask = document.createElement("p");
    mirrorTask.textContent = this.app.languageManager.locales[this.app.languageManager.getLanguage()]["go_to_mirror"];
    mirrorTask.id = "mirror-task";
    document.getElementById("diary").appendChild(mirrorTask);
  }

  async checkStatus() {
    console.log("🪞 checkStatus: запуск проверки зеркального квеста");
    return new Promise(resolve => {
      setTimeout(async () => {
        console.log("⏱ checkStatus: запускаем compareCurrentFrame() через 3 сек");
        const success = await this.app.compareCurrentFrame();
        console.log("⏱ checkStatus: результат compareCurrentFrame():", success);
        resolve(success);
      }, 3000);
    });
  }

  async finish() {
    console.log("🪞 finish: запуск метода finish для зеркального квеста");
    if (this.eventManager.isEventLogged(this.doneKey)) {
      console.log(`🪞 finish: Квест "${this.key}" уже выполнен`);
      return;
    }
    const success = await this.checkStatus();
    if (success) {
      if (!this.eventManager.isEventLogged(this.doneKey)) {
        console.log("📝 finish: Добавляем запись о завершении квеста с ключом", this.doneKey);
        await this.eventManager.addDiaryEntry(this.doneKey, this.app.lastMirrorPhoto);
        await this.eventManager.addDiaryEntry("what_was_it", this.app.lastMirrorPhoto);
      }
      this.showMirrorTask();
      alert("✅ Задание «подойти к зеркалу» выполнено!");
    } else {
      alert("❌ Нет совпадения! Попробуйте ещё раз!");
    }
  }
}
