import { GhostTextManager } from './ghostTextManager.js';
import ghostTextsConfig from './ghostTextsConfig.js';
import ghostQuestsConfig from './ghostQuestsConfig.js';
import { VisualEffectsManager } from './visualEffectsManager.js';

export class GhostEvent1 {
  /**
   * @param {EventManager} eventManager – менеджер событий
   * @param {App} appInstance – ссылка на основной объект приложения
   */
  constructor(eventManager, appInstance) {
    this.eventManager = eventManager;
    this.app = appInstance;
    this.key = "ghost_1";  // Уникальный идентификатор события
    this.doneKey = "ghost_1_done";
    
    // Инициализируем менеджер текстов с шаблонами для этапов
    this.ghostTextManager = new GhostTextManager(ghostTextsConfig);
    // Загружаем конфигурацию квестов для ghost1
    this.config = ghostQuestsConfig.ghost1;
  }
  
  async activate() {
    if (!this.eventManager.isEventLogged(this.key)) {
      console.log(`🔮 Призрак 1 активирован`);
      // Записываем стандартное сообщение активации (оно может подтягиваться через локализацию)
      await this.eventManager.addDiaryEntry(this.key, true);
      
      // Запускаем визуальный эффект появления призрака
      const effectsManager = new VisualEffectsManager();
      effectsManager.triggerGhostAppearanceEffect("ghost_1");
    }
  }
  
  async checkStatus() {
    // Здесь можно добавить проверку, например, через камеру или другое взаимодействие.
    return true;
  }
  
async finish() {
  const success = await this.checkStatus();
  if (success) {
    const ghost = this.app.ghostManager.getCurrentGhost();
    // Текущий этап (начинаем считать этапы с 1)
    const stage = this.app.ghostManager.currentPhenomenonIndex;
    
    if (stage < this.config.defaultQuestCount) {
      // Пока стандартные зеркальные квесты ещё не исчерпаны:
      // Получаем букву для текущего этапа (например, берем букву по порядку из имени)
      const letter = ghost ? ghost.name.charAt(stage) : "";
      // Генерируем текст для этапа; здесь stage + 1, если хотите нумерацию от 1
      const dynamicText = this.ghostTextManager.getText("ghost1", stage + 1, { letter });
      await this.eventManager.addDiaryEntry(dynamicText, true);
      // Увеличиваем индекс этапа в GhostManager
      this.app.ghostManager.currentPhenomenonIndex++;
      
      alert("Этап зеркального квеста завершён!");
      // Обновляем состояние (например, кнопку "Запостить")
      this.app.updatePostButtonState();
    } else {
      // Если все стандартные этапы отработаны, запускаем финальный квест.
      // Показываем кнопку финального подтверждения
      this.showFinalQuestButton();
      // Выходим из метода, чтобы дальнейшие действия выполнялись по нажатию кнопки.
      return;
    }
    
    // Если запись о завершении события ещё не добавлена, добавляем её.
    if (!this.eventManager.isEventLogged(this.doneKey)) {
      await this.eventManager.addDiaryEntry(this.doneKey, true);
    }
    
  } else {
    alert("❌ Призрак 1 не завершен, попробуйте еще раз.");
  }
}

showFinalQuestButton() {
  // Находим контейнер дневника, чтобы добавить туда кнопку финального квеста.
  const diaryContainer = this.eventManager.diaryContainer;
  const finalButton = document.createElement("button");
  
  // Текст кнопки получаем через локализацию; ключ берется из конфигурации финального квеста.
  const lang = this.app.languageManager.getLanguage();
  const locales = this.app.languageManager.locales;
  finalButton.textContent = locales[lang][this.config.finalQuest.textKey] || "Final Quest";
  
  // Стилизация кнопки (можно добавить свои стили)
  finalButton.style.margin = "10px";
  finalButton.style.padding = "8px 12px";
  
  // Обработчик клика по кнопке финального квеста.
  finalButton.addEventListener("click", async () => {
    // Добавляем запись финального квеста в дневник.
    await this.eventManager.addDiaryEntry(this.config.finalQuest.textKey, true);
    alert("🎉 Финальный квест завершён! Призрак 1 завершен!");
    // Отмечаем текущего призрака как завершённого.
    this.app.ghostManager.finishCurrentGhost();
    // Можно, например, сбросить индекс этапа или перейти к следующему призраку.
    this.app.ghostManager.triggerNextPhenomenon();
    // Удаляем кнопку из интерфейса.
    finalButton.remove();
  });
  
  // Добавляем кнопку в контейнер дневника.
  diaryContainer.appendChild(finalButton);
}

}