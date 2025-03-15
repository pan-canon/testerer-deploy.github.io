/**
 * @typedef {Object} SequenceEntry
 * @property {string} eventKey - Ключ события.
 * @property {string} questKey - Ключ квеста, который запускается после события.
 * @property {string|null} nextEventKey - Ключ следующего события (или null, если последовательность завершена).
 */

/**
 * SequenceManager provides methods to manage the event-quest sequence.
 */
export class SequenceManager {
  /**
   * @param {SequenceEntry[]} sequenceList - Список элементов последовательности.
   */
  constructor(sequenceList) {
    this.sequenceList = sequenceList;
    this.currentIndex = 0;
  }

  /**
   * Возвращает текущую запись последовательности.
   * @returns {SequenceEntry|null}
   */
  getCurrentEntry() {
    return (this.sequenceList && this.sequenceList[this.currentIndex]) || null;
  }

  /**
   * Проверяет, совпадает ли переданный ключ квеста с ожидаемым.
   * @param {string} questKey
   * @returns {boolean}
   */
  isNextQuest(questKey) {
    const entry = this.getCurrentEntry();
    return entry ? entry.questKey === questKey : false;
  }

  /**
   * Проверяет, совпадает ли переданный ключ события с ожидаемым.
   * @param {string} eventKey
   * @returns {boolean}
   */
  isNextEvent(eventKey) {
    const entry = this.getCurrentEntry();
    return entry ? entry.eventKey === eventKey : false;
  }

  /**
   * Инкрементирует индекс последовательности.
   */
  increment() {
    if (this.currentIndex < this.sequenceList.length - 1) {
      this.currentIndex++;
    }
  }

  /**
   * Сбрасывает индекс последовательности.
   */
  reset() {
    this.currentIndex = 0;
  }
}

/**
 * Loads the sequence configuration from a JSON file.
 * @returns {Promise<SequenceManager>}
 */
export async function loadSequenceConfig() {
  const response = await fetch('./src/config/eventSequence.json');
  if (!response.ok) {
    throw new Error('Failed to load event sequence configuration');
  }
  const sequenceList = await response.json();
  return new SequenceManager(sequenceList);
}