export class GhostManager {
  /**
   * @param {EventManager} eventManager – менеджер для работы с дневником
   * @param {ProfileManager} profileManager – менеджер профиля (расширенный для работы с призраками)
   */
  constructor(eventManager, profileManager) {
    this.eventManager = eventManager;
    this.profileManager = profileManager;
    // Генерируем 13 призраков с названиями и набором допустимых явлений.
    // Для простоты все призраки имеют 6 явлений.
    this.ghosts = [
      { id: 1, name: "призрак 1", allowedPhenomena: ["call", "randomCall"], phenomenaCount: 6 },
      { id: 2, name: "призрак 2", allowedPhenomena: ["call"], phenomenaCount: 6 },
      { id: 3, name: "призрак 3", allowedPhenomena: ["call"], phenomenaCount: 6 },
      { id: 4, name: "призрак 4", allowedPhenomena: ["call"], phenomenaCount: 6 },
      { id: 5, name: "призрак 5", allowedPhenomena: ["call"], phenomenaCount: 6 },
      { id: 6, name: "призрак 6", allowedPhenomena: ["call"], phenomenaCount: 6 },
      { id: 7, name: "призрак 7", allowedPhenomena: ["call"], phenomenaCount: 6 },
      { id: 8, name: "призрак 8", allowedPhenomena: ["call"], phenomenaCount: 6 },
      { id: 9, name: "призрак 9", allowedPhenomena: ["call"], phenomenaCount: 6 },
      { id: 10, name: "призрак 10", allowedPhenomena: ["call"], phenomenaCount: 6 },
      { id: 11, name: "призрак 11", allowedPhenomena: ["call"], phenomenaCount: 6 },
      { id: 12, name: "призрак 12", allowedPhenomena: ["call"], phenomenaCount: 6 },
      { id: 13, name: "призрак 13", allowedPhenomena: ["call"], phenomenaCount: 6 }
    ];
    // По умолчанию начинаем с призрака 1, с 0 выполненными явлениями.
    this.currentGhostId = 1;
    this.currentPhenomenonIndex = 0;
  }

  getCurrentGhost() {
    return this.ghosts.find(g => g.id === this.currentGhostId);
  }

  /**
   * Вызывает следующее явление для текущего призрака.
   * Для призрака 1 первое явление фиксировано (например, звонок зеркала),
   * остальные выбираются случайно из набора разрешённых для данного призрака.
   * После 6-го явления генерируется финальное событие.
   */
  async triggerNextPhenomenon() {
    const ghost = this.getCurrentGhost();
    if (!ghost) return;
    if (this.currentPhenomenonIndex < ghost.phenomenaCount) {
      // Определяем тип явления.
      let phenomenonType;
      if (this.currentGhostId === 1 && this.currentPhenomenonIndex === 0) {
         // Для первого явления призрака 1 фиксирован звонок (зеркальный квест).
         phenomenonType = "call";
      } else {
         // Выбираем случайно из разрешённых.
         const allowed = ghost.allowedPhenomena;
         phenomenonType = allowed[Math.floor(Math.random() * allowed.length)];
      }
      // Логируем явление в дневнике.
      const phenomenonEntry = `${ghost.name}: явление ${this.currentPhenomenonIndex + 1} (${phenomenonType})`;
      await this.eventManager.addDiaryEntry(phenomenonEntry);
      console.log(`Триггер явления для ${ghost.name}: ${phenomenonEntry}`);
      
      this.currentPhenomenonIndex++;
      // Сохраняем прогресс в профиле.
      this.profileManager.saveGhostProgress({
         ghostId: this.currentGhostId,
         phenomenonIndex: this.currentPhenomenonIndex
      });
      // Если явлений выполнено все, генерируем финальное событие.
      if (this.currentPhenomenonIndex === ghost.phenomenaCount) {
         const finalEntry = `${ghost.name}: финальное явление – персонаж убит!`;
         await this.eventManager.addDiaryEntry(finalEntry);
         console.log(finalEntry);
         // Здесь можно добавить вызов логики спасения персонажа в будущем.
      }
    }
  }

  /**
   * Сбрасывает цепочку явлений (например, при перезапуске квеста или нового призрака).
   */
  resetGhostChain() {
    this.currentGhostId = 1;
    this.currentPhenomenonIndex = 0;
    this.profileManager.resetGhostProgress();
  }
}