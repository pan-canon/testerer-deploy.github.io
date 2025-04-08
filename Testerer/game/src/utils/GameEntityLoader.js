/**
 * GameEntityLoader.js
 * 
 * Provides a function to load the game entities configuration (events, quests, and sequence)
 * from a unified JSON file.
 */
export async function loadGameEntitiesConfig() {
  const response = await fetch('./src/config/gameEntities.json');
  if (!response.ok) {
    throw new Error('Failed to load game entities configuration');
  }
  const config = await response.json();
  return config;
}