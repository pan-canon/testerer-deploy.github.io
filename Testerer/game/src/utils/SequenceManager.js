/**
 * SequenceManager.js
 * 
 * Provides methods to manage the event–quest sequence.
 *
 * @typedef {Object} SequenceEntry
 * @property {string} eventKey - The event key.
 * @property {string} questKey - The quest key that will be started after the event.
 * @property {string|null} nextEventKey - The key of the next event (or null if the sequence is complete).
 */

export class SequenceManager {
  /**
   * @param {SequenceEntry[]} sequenceList - The list of sequence entries.
   */
  constructor(sequenceList) {
    this.sequenceList = sequenceList;
    this.currentIndex = 0;
  }

  /**
   * Returns the current sequence entry.
   * @returns {SequenceEntry|null}
   */
  getCurrentEntry() {
    return (this.sequenceList && this.sequenceList[this.currentIndex]) || null;
  }

  /**
   * Checks if the provided quest key matches the expected quest in the current sequence entry.
   * @param {string} questKey 
   * @returns {boolean}
   */
  isNextQuest(questKey) {
    const entry = this.getCurrentEntry();
    return entry ? entry.questKey === questKey : false;
  }

  /**
   * Checks if the provided event key matches the expected event in the current sequence entry.
   * @param {string} eventKey 
   * @returns {boolean}
   */
  isNextEvent(eventKey) {
    const entry = this.getCurrentEntry();
    return entry ? entry.eventKey === eventKey : false;
  }

  /**
   * Increments the sequence index if not at the end.
   */
  increment() {
    if (this.currentIndex < this.sequenceList.length - 1) {
      this.currentIndex++;
    }
  }

  /**
   * Resets the sequence index to the beginning.
   */
  reset() {
    this.currentIndex = 0;
  }
}
