// --- StateManager.js ---
// Сохраняет и загружает состояние игры (квестов и UI) в localStorage.
export const StateManager = {
  saveGameState(data) {
    let currentState = JSON.parse(localStorage.getItem('gameState')) || { completedEvents: {}, ui: {} };
    if (data.completedEvents) {
      Object.assign(currentState.completedEvents, data.completedEvents);
    }
    if (data.currentEvent) {
      currentState.currentEvent = data.currentEvent;
    }
    if (data.ui) {
      Object.assign(currentState.ui, data.ui);
    }
    localStorage.setItem('gameState', JSON.stringify(currentState));
  },

  loadGameState() {
    return JSON.parse(localStorage.getItem('gameState'));
  }
};