/**
 * Determines whether a quest can be launched.
 * Checks if any quest is already active (via persistent flag) and, if a sequence manager is provided,
 * verifies that the provided questKey matches the expected quest.
 *
 * @param {string} questKey - The quest key to launch.
 * @param {function} isQuestActiveFn - Function returning true if a quest is active.
 * @param {object} [sequenceManager] - Optional SequenceManager instance.
 * @returns {boolean} True if the quest can be launched, false otherwise.
 */
export function canLaunchQuest(questKey, isQuestActiveFn, sequenceManager) {
  if (isQuestActiveFn()) {
    return false;
  }
  if (sequenceManager) {
    const currentEntry = sequenceManager.getCurrentEntry();
    if (currentEntry && currentEntry.questKey !== questKey) {
      return false;
    }
  }
  return true;
}