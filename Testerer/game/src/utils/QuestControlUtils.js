/**
 * Determines whether a quest can be launched.
 * It checks if a quest is already active (using persistent storage) and optionally verifies
 * that the quest key matches the expected value from the sequence configuration.
 *
 * @param {string} questKey - The quest key to launch.
 * @param {function} isQuestActiveFn - Функция, возвращающая true, если активен какой-либо квест.
 * @param {object} [sequenceManager] - (Необязательно) Экземпляр SequenceManager для проверки последовательности.
 * @returns {boolean} True if the quest can be launched; otherwise, false.
 */
export function canLaunchQuest(questKey, isQuestActiveFn, sequenceManager) {
  // Если уже запущен квест, то запуск нового запрещён.
  if (isQuestActiveFn()) {
    return false;
  }
  // Если передан sequenceManager, проверяем ожидаемый ключ.
  if (sequenceManager) {
    const currentEntry = sequenceManager.getCurrentEntry();
    if (currentEntry && currentEntry.questKey !== questKey) {
      return false;
    }
  }
  return true;
}