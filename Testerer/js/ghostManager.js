export class GhostManager {
  constructor(eventManager, profileManager, app) {
    this.eventManager = eventManager;
    this.profileManager = profileManager;
    this.app = app;
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
    this.currentGhostId = 1;
    this.currentPhenomenonIndex = 0;
    this.loadState();
    console.log(`Текущий активный призрак: ${this.getCurrentGhost().name}`);
  }

  getCurrentGhost() {
    return this.ghosts.find(g => g.id === this.currentGhostId);
  }

  setCurrentGhost(ghostId) {
    this.currentGhostId = ghostId;
    console.log(`Призрак ${this.getCurrentGhost().name} активирован.`);
    this.saveState();
  }

  finishCurrentGhost() {
    if (this.getCurrentGhost()) {
      this.getCurrentGhost().isFinished = true;
      console.log(`Призрак ${this.getCurrentGhost().name} завершен.`);
      this.saveState();
    }
  }

  isCurrentGhostFinished() {
    return this.getCurrentGhost() && this.getCurrentGhost().isFinished;
  }

  async triggerNextPhenomenon() {
    const ghost = this.getCurrentGhost();
    if (!ghost) return;
    if (this.currentPhenomenonIndex < ghost.phenomenaCount) {
      let phenomenonType;

      const currentLocation = this.profileManager.getLocationType();

      if (this.currentGhostId === 1 && this.currentPhenomenonIndex === 0) {
        phenomenonType = "call";
      } else if (currentLocation) {
        const locationAllowedPhenomena = {
          "Кухня": ["call", "randomCall"],
          "Спальня": ["call", "randomCall"],
          "Гостиная": ["call", "randomCall"],
          "Ванная": ["call", "randomCall"],
          "Коридор": ["call", "randomCall"],
          "Другое": ["call", "randomCall"],
          "Подъезд": ["call", "randomCall"],
          "Кабинет": ["call", "randomCall"],
          "Библиотека": ["call", "randomCall"],
          "Детская": ["call", "randomCall"],
          "Кладовая": ["call", "randomCall"],
          "Гараж": ["call", "randomCall"]
        };
        const locationPhenomena = locationAllowedPhenomena[currentLocation] || [];
        const intersection = ghost.allowedPhenomena.filter(p => locationPhenomena.includes(p));
        if (intersection.length > 0) {
          phenomenonType = intersection[Math.floor(Math.random() * intersection.length)];
        } else {
          phenomenonType = ghost.allowedPhenomena[Math.floor(Math.random() * ghost.allowedPhenomena.length)];
        }
      } else {
        phenomenonType = ghost.allowedPhenomena[Math.floor(Math.random() * ghost.allowedPhenomena.length)];
      }

      const phenomenonEntry = `${ghost.name}: явление ${this.currentPhenomenonIndex + 1} (${phenomenonType})`;
      await this.eventManager.addDiaryEntry(phenomenonEntry);
      console.log(`Триггер явления для ${ghost.name}: ${phenomenonEntry}`);

      this.currentPhenomenonIndex++;
      this.profileManager.saveGhostProgress({
        ghostId: this.currentGhostId,
        phenomenonIndex: this.currentPhenomenonIndex
      });

      if (this.currentPhenomenonIndex === ghost.phenomenaCount) {
        const finalEntry = `${ghost.name}: финальное явление – персонаж убит!`;
        await this.eventManager.addDiaryEntry(finalEntry);
        console.log(finalEntry);
      }
    }
  }

  resetGhostChain() {
    this.currentGhostId = 1;
    this.currentPhenomenonIndex = 0;
    this.profileManager.resetGhostProgress();
    console.log("Цепочка призраков сброшена.");
  }

  saveState() {
    localStorage.setItem('ghostState', JSON.stringify(this.ghosts));
  }

  loadState() {
    const savedState = localStorage.getItem('ghostState');
    if (savedState) {
      this.ghosts = JSON.parse(savedState);
      console.log('Загружено состояние призраков:', this.ghosts);
    }
  }
}