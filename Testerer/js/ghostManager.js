export class GhostManager {
  constructor(eventManager, profileManager, app) {
    this.eventManager = eventManager;
    this.profileManager = profileManager;
    this.app = app;
    this.ghosts = []; // Призраки будут динамически генерироваться

    // Изначально настраиваем призраков с их именами и количеством букв в имени
    this.setupGhosts();
    this.currentGhostId = 1; // Начинаем с первого призрака
    this.currentPhenomenonIndex = 0; // Индекс текущего шага

    this.loadState();
    console.log(`Текущий активный призрак: ${this.getCurrentGhost().name}`);
  }

  /**
   * Динамически создаём призраков на основе их имен.
   * Количество явлений будет зависеть от длины имени призрака.
   */
  setupGhosts() {
    const ghostNames = [
      "призрак 1",
      "призрак 2",
      "призрак 3",
      "призрак 4",
      "призрак 5",
      "призрак 6",
      "призрак 7",
      "призрак 8",
      "призрак 9",
      "призрак 10",
      "призрак 11",
      "призрак 12",
      "призрак 13"
    ];

    // Генерация призраков на основе их имен
    this.ghosts = ghostNames.map((name, index) => {
      const phenomenaCount = name.length - 2; // Количество шагов в квесте - все буквы, кроме двух последних
      return {
        id: index + 1,
        name: name,
        phenomenaCount: phenomenaCount // Количество явлений зависит от длины имени
      };
    });
  }

  /**
   * Получить текущего активного призрака.
   */
  getCurrentGhost() {
    return this.ghosts.find(g => g.id === this.currentGhostId);
  }

  /**
   * Установить активного призрака по его ID.
   */
  setCurrentGhost(ghostId) {
    this.currentGhostId = ghostId;
    console.log(`Призрак ${this.getCurrentGhost().name} активирован.`);
    this.saveState();
  }

  /**
   * Завершаем текущего призрака.
   */
  finishCurrentGhost() {
    if (this.getCurrentGhost()) {
      this.getCurrentGhost().isFinished = true;
      console.log(`Призрак ${this.getCurrentGhost().name} завершен.`);
      this.saveState();
    }
  }

  /**
   * Проверка завершенности текущего призрака.
   */
  isCurrentGhostFinished() {
    return this.getCurrentGhost() && this.getCurrentGhost().isFinished;
  }

  /**
   * Триггер для следующего явления (шаг в квесте).
   */
  async triggerNextPhenomenon() {
    const ghost = this.getCurrentGhost();
    if (!ghost) return;

    if (this.currentPhenomenonIndex < ghost.phenomenaCount) {
      // Генерируем запись в блоге для текущего явления
      const phenomenonEntry = `${ghost.name}: Явление ${this.currentPhenomenonIndex + 1} - Подойти к зеркалу`;
      await this.eventManager.addDiaryEntry(phenomenonEntry);

      console.log(`Триггер явления для ${ghost.name}: ${phenomenonEntry}`);

      // Увеличиваем индекс явления
      this.currentPhenomenonIndex++;

      // Сохраняем прогресс по призраку
      this.profileManager.saveGhostProgress({
        ghostId: this.currentGhostId,
        phenomenonIndex: this.currentPhenomenonIndex
      });

      // Когда все явления пройдены, завершить призрака
      if (this.currentPhenomenonIndex === ghost.phenomenaCount) {
        const finalEntry = `${ghost.name}: Финальное явление – призрак завершен!`;
        await this.eventManager.addDiaryEntry(finalEntry);
        console.log(finalEntry);
      }
    }
  }

  /**
   * Сброс цепочки призраков (начинаем с первого).
   */
  resetGhostChain() {
    this.currentGhostId = 1;
    this.currentPhenomenonIndex = 0;
    this.profileManager.resetGhostProgress();
    console.log("Цепочка призраков сброшена.");
  }

  /**
   * Сохраняем текущее состояние призраков в localStorage.
   */
  saveState() {
    localStorage.setItem('ghostState', JSON.stringify(this.ghosts));
  }

  /**
   * Загружаем сохраненное состояние призраков из localStorage.
   */
  loadState() {
    const savedState = localStorage.getItem('ghostState');
    if (savedState) {
      this.ghosts = JSON.parse(savedState);
      console.log('Загружено состояние призраков:', this.ghosts);
    }
  }
}