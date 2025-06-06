/**
 * GameEntityLoader.js
 * 
 * Provides functions to load the game entities configuration (events, quests, and sequence)
 * from a unified JSON file and derive mappings for use in managers.
 */

/**
 * Loads the game entities configuration by fetching the JSON file.
 * Returns an object containing `events`, `quests`, and `sequence`.
 */
export async function loadGameEntitiesConfig() {
  const response = await fetch('./config/gameEntities.json');
  if (!response.ok) {
    throw new Error('Failed to load game entities configuration');
  }
  const config = await response.json();
  return config;
}

/**
 * Constructs a mapping from questKey to its parent eventKey based on the sequence.
 * 
 * Example return value:
 * {
 *   "mirror_quest": "welcome",
 *   "repeating_quest": "post_repeating_event",
 *   "final_quest": "final_event"
 * }
 * 
 * Usage:
 *   const questKeyToEventKey = await getQuestKeyToEventKeyMap();
 */
export async function getQuestKeyToEventKeyMap() {
  const config = await loadGameEntitiesConfig();
  const map = {};
  config.sequence.forEach(triad => {
    // triad: { eventKey, questKey, nextEventKey }
    map[triad.questKey] = triad.eventKey;
  });
  return map;
}