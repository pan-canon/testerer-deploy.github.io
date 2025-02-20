export class GhostManager {
  /**
   * Конструктор GhostManager.
   * @param {EventManager} eventManager - Менеджер событий для работы с дневником.
   * @param {ProfileManager} profileManager - Менеджер профиля для сохранения прогресса.
   * @param {App} app - Основной объект приложения.
   *
   * Класс отвечает за управление призраками, генерируя список призраков,
   * переключая активного призрака, отслеживая прогресс явлений (шагов квеста)
   * и сохраняя/загружая состояние призраков в localStorage.
   */
  constructor(eventManager, profileManager, app) {
    this.eventManager = eventManager;
    this.profileManager = profileManager;
    this.app = app;

    // Массив призраков, который будет генерироваться динамически.
    this.ghosts = [];

    // Инициализируем список призраков на основе предопределённых имен.
    this.setupGhosts();

    // Устанавливаем начальный активный призрак (ID = 1).
    this.currentGhostId = 1;

    // Индекс текущего явления (шага квеста) для активного призрака.
    this.currentPhenomenonIndex = 0;

    // Загружаем сохраненное состояние призраков из localStorage, если оно имеется.
    this.loadState();

    console.log(`Текущий активный призрак: ${this.getCurrentGhost().name}`);
  }

  /**
   * setupGhosts – генерирует список призраков на основе заранее заданных имен.
   * Количество явлений (steps) для каждого призрака рассчитывается как длина имени минус 2.
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

    // Генерируем объект для каждого призрака с ID, именем и количеством явлений.
    this.ghosts = ghostNames.map((name, index) => {
      // Количество явлений определяется как длина имени минус 2.
      const phenomenaCount = name.length - 2;
      return {
        id: index + 1,
        name: name,
        phenomenaCount: phenomenaCount,
        // Дополнительное свойство для отметки завершения квеста призрака.
        isFinished: false
      };
    });
  }

  /**
   * getCurrentGhost – возвращает объект активного призрака на основе currentGhostId.
   * @returns {object} Объект призрака или undefined, если не найден.
   */
  getCurrentGhost() {
    return this.ghosts.find(g => g.id === this.currentGhostId);
  }

  /**
   * setCurrentGhost – устанавливает активного призрака по заданному ID.
   * Сохраняет состояние призраков в localStorage.
   * @param {number} ghostId - ID призрака, который нужно сделать активным.
   */
  setCurrentGhost(ghostId) {
    this.currentGhostId = ghostId;
    console.log(`Призрак ${this.getCurrentGhost().name} активирован.`);
    this.saveState();
  }

  /**
   * finishCurrentGhost – помечает текущего призрака как завершенного.
   * Вызывает сохранение состояния после обновления.
   */
  finishCurrentGhost() {
    const ghost = this.getCurrentGhost();
    if (ghost) {
      ghost.isFinished = true;
      console.log(`Призрак ${ghost.name} завершен.`);
      this.saveState();
    }
  }

  /**
   * isCurrentGhostFinished – проверяет, завершен ли текущий активный призрак.
   * @returns {boolean} true, если текущий призрак помечен как завершенный, иначе false.
   */
  isCurrentGhostFinished() {
    const ghost = this.getCurrentGhost();
    return ghost ? ghost.isFinished : false;
  }

  /**
   * triggerNextPhenomenon – инициирует следующее явление (шаг квеста) для текущего призрака.
   * Если индекс явления меньше, чем общее количество явлений для призрака,
   * добавляет запись в дневник и обновляет прогресс в профиле.
   * Если все явления пройдены, регистрирует финальное событие.
   */
  async triggerNextPhenomenon() {
    const ghost = this.getCurrentGhost();
    if (!ghost) return;

    if (this.currentPhenomenonIndex < ghost.phenomenaCount) {
      // Формируем текст записи для текущего явления.
      const phenomenonEntry = `${ghost.name}: Явление ${this.currentPhenomenonIndex + 1} - Подойти к зеркалу`;
      await this.eventManager.addDiaryEntry(phenomenonEntry);

      console.log(`Триггер явления для ${ghost.name}: ${phenomenonEntry}`);

      // Увеличиваем индекс явления.
      this.currentPhenomenonIndex++;

      // Сохраняем прогресс призрака через ProfileManager.
      this.profileManager.saveGhostProgress({
        ghostId: this.currentGhostId,
        phenomenonIndex: this.currentPhenomenonIndex
      });

      // Если достигнут конец явлений для призрака, добавляем финальную запись.
      if (this.currentPhenomenonIndex === ghost.phenomenaCount) {
        const finalEntry = `${ghost.name}: Финальное явление – призрак завершен!`;
        await this.eventManager.addDiaryEntry(finalEntry);
        console.log(finalEntry);
      }
    }
  }

  /**
   * resetGhostChain – сбрасывает цепочку призраков.
   * Устанавливает активный призрак на первый и сбрасывает индекс явлений.
   * Также сбрасывает сохраненный прогресс призраков через ProfileManager.
   */
  resetGhostChain() {
    this.currentGhostId = 1;
    this.currentPhenomenonIndex = 0;
    this.profileManager.resetGhostProgress();
    console.log("Цепочка призраков сброшена.");
  }

  /**
   * saveState – сохраняет текущее состояние призраков (массив this.ghosts) в localStorage.
   */
  saveState() {
    localStorage.setItem('ghostState', JSON.stringify(this.ghosts));
  }

  /**
   * loadState – загружает сохраненное состояние призраков из localStorage.
   * Если состояние найдено, обновляет массив this.ghosts.
   */
  loadState() {
    const savedState = localStorage.getItem('ghostState');
    if (savedState) {
      this.ghosts = JSON.parse(savedState);
      console.log('Загружено состояние призраков:', this.ghosts);
    }
  }
}