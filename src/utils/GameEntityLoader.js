/**
 * GameEntityLoader.js
 * 
 * Provides functions to load the game entities configuration (events, quests, and sequence)
 * from a unified JSON file and derive mappings for use in managers.
 */
import { BASE_PATH } from '../config/paths.js';
import { ErrorManager } from '../managers/ErrorManager.js';

// Load the game entities configuration by fetching the JSON file
export async function loadGameEntitiesConfig() {
  // Check if the application is online
  if (!navigator.onLine) {
    ErrorManager.showError(
      'No internet connection. Please check your network and try again.'
    );
    throw new Error('Offline');
  }

  try {
    // Fetch the config using BASE_PATH for correct subdirectory
    const response = await fetch(`${BASE_PATH}/config/gameEntities.json`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    // Log the error and show a user-friendly message
    ErrorManager.logError(err, 'GameEntityLoader');
    ErrorManager.showError(
      'Failed to load configuration. Please try again later.'
    );
    throw err;
  }
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