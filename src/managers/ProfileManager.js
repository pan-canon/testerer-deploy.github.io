import { StateManager } from './StateManager.js';
import { ErrorManager } from './ErrorManager.js';

export class ProfileManager {
  /**
   * Constructor for ProfileManager.
   * @param {SQLiteDataManager} dataManager - An instance of the DataManager responsible for profile persistence.
   */
  constructor(dataManager) {
    // Save a reference to the DataManager for profile and related data persistence.
    this.dataManager = dataManager;
  }

  /**
   * isProfileSaved – Asynchronously checks if a profile is saved via the DataManager.
   * @returns {Promise<boolean>} Resolves to true if a profile exists, otherwise false.
   */
  async isProfileSaved() {
    const profile = await this.dataManager.getProfile();
    return !!profile;
  }

  /**
   * getProfile – Asynchronously retrieves the profile from the DataManager.
   * @returns {Promise<Object|null>} Resolves to the profile object or null if not found.
   */
  async getProfile() {
    return await this.dataManager.getProfile();
  }

  /**
   * saveProfile – Asynchronously saves the given profile object via the DataManager.
   *
   * IMPORTANT: Registration data (name, gender, language, selfie, etc.) should be 
   * integrated into the profile object. Do not store additional transient keys.
   *
   * @param {Object} profile - The profile object (should include registration fields).
   * @returns {Promise<void>}
   */
  async saveProfile(profile) {
    await this.dataManager.saveProfile(profile);
  }

  /**
   * resetProfile – Resets the profile and all related data.
   * Calls the DataManager to remove profile data along with ghost and quest progress,
   * and clears all transient state keys from localStorage (except for the language key).
   * Also resets the SQL database stored in IndexedDB.
   * After reset, the service worker cache is cleared and the page is reloaded.
   */
  resetProfile() {
    Promise.all([
      this.dataManager.resetProfile(),
      this.dataManager.resetDatabase()
    ]).then(async () => {
      // Clear all keys from localStorage except the language-related key.
      const preserveKeys = ["language"];
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (!preserveKeys.includes(key)) {
          localStorage.removeItem(key);
        }
      }

       // After data reset, check for Service Worker update
      if ('serviceWorker' in navigator) {
        console.log('🔍 Checking for Service Worker update after profile reset…');
        const registration = await navigator.serviceWorker.getRegistration();

        if (!registration) {
          console.log('❌ No Service Worker registration found.');
          window.location.reload();
          return;
        }

        // Force the SW to check for a new version
        await registration.update();

        if (registration.waiting) {
          console.log('🔄 Update found. Installing new Service Worker…');
          console.log('🛠️ Reset in progress and SW update installation started.');
          console.log('⏳ Page will reload automatically after SW activation.');
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
          console.log('ℹ️ No updates found. Reloading to complete profile reset.');
          window.location.reload();
        }
      } else {
        // If no SW support, just reload to finish UI reset
        window.location.reload();
      }
    }).catch((err) => {
      ErrorManager.logError(err, "resetProfile");
    });
  }

  /**
   * exportProfileData – Exports the profile along with diary entries, apartment plan,
   * and quest progress to a JSON file.
   * @param {Object} databaseManager - The database manager for retrieving diary, quest, and chat data.
   * @param {Object} apartmentPlanManager - The apartment plan manager.
   */
  exportProfileData(databaseManager, apartmentPlanManager) {
    this.getProfile().then(profile => {
      if (!profile) {
        alert("No profile found to export.");
        return;
      }
      // Filter profile to include only essential registration fields.
      const filteredProfile = {
        name: profile.name,
        gender: profile.gender,
        language: profile.language,
        selfie: profile.selfie
      };

      // Retrieve diary entries.
      const diaryEntries = databaseManager.getDiaryEntries();
      // Retrieve apartment plan data if available.
      const apartmentPlanData = apartmentPlanManager ? apartmentPlanManager.rooms : [];
      
      // Retrieve quest progress data from the database.
      let questProgressData = [];
      const result = databaseManager.db.exec("SELECT * FROM quest_progress ORDER BY id DESC");
      if (result.length > 0) {
        questProgressData = result[0].values.map(row => ({
          id: row[0],
          quest_key: row[1],
          status: row[2]
        }));
      }
  
      // Form the export object including chat messages.
      const exportData = {
        profile: filteredProfile,
        diary: diaryEntries,
        apartment: apartmentPlanData,
        quests: questProgressData
      };
  
      // Create a Blob from the JSON string.
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'profile.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  /**
   * importProfileData – Imports profile data from the selected JSON file.
   * After import, updates the profile, diary, apartment plan, and quest progress,
   * then reloads the page.
   * @param {File} file - The file containing the profile data.
   * @param {Object} databaseManager - The database manager.
   * @param {Object} apartmentPlanManager - The apartment plan manager.
   */
  importProfileData(file, databaseManager, apartmentPlanManager) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        // Validate essential profile fields.
        if (!importedData.profile || !importedData.profile.name || !importedData.profile.gender ||
            !importedData.profile.selfie || !importedData.profile.language) {
          alert("Invalid profile file. Required profile fields are missing.");
          return;
        }
        // Save the profile via DataManager.
        this.saveProfile(importedData.profile);

        // Import diary entries.
        if (importedData.diary && Array.isArray(importedData.diary)) {
          for (const entry of importedData.diary) {
            if (entry.entry && entry.timestamp) {
              await databaseManager.insertOrUpdate(
                'diary',
                { entry: entry.entry, timestamp: entry.timestamp }
              );
              console.log('✅ Diary entry imported:', entry);
            }
          }
        }

        // Import apartment plan data, if available.
        if (importedData.apartment && Array.isArray(importedData.apartment)) {
          if (apartmentPlanManager) {
            apartmentPlanManager.rooms = importedData.apartment;
            apartmentPlanManager.renderRooms();
          }
        }
  
        // Import quest progress.
        if (importedData.quests && Array.isArray(importedData.quests)) {
          importedData.quests.forEach(progress => {
            if (progress.quest_key && progress.status) {
              databaseManager.addQuestProgress(progress.quest_key, progress.status);
            }
          });
        }

        // Clear transient state keys using StateManager.
        StateManager.remove("cameraButtonActive");
        StateManager.remove("shootButtonActive");
        StateManager.remove("quest_state_repeating_quest");
  
        alert("Profile imported successfully. Reloading page.");
        window.location.reload();
      } catch (err) {
        ErrorManager.logError(err, "importProfileData");
        alert("Error parsing the profile file.");
      }
    };
    reader.readAsText(file);
  }

  /**
   * saveGhostProgress – Saves ghost progress data via the DataManager.
   * @param {Object} progress - Progress data (e.g., { ghostId: number, phenomenonIndex: number }).
   */
  saveGhostProgress(progress) {
    this.dataManager.saveGhostProgress(progress);
  }

  /**
   * getGhostProgress – Retrieves the saved ghost progress via the DataManager.
   * @returns {Object|null} The progress object or null if not set.
   */
  getGhostProgress() {
    return this.dataManager.getGhostProgress();
  }

  /**
   * resetGhostProgress – Resets ghost progress via the DataManager.
   */
  resetGhostProgress() {
    this.dataManager.resetGhostProgress();
  }

  /**
   * saveLocationType – Saves the user's selected location type via the DataManager.
   * @param {string} locationType - The location type.
   */
  saveLocationType(locationType) {
    this.dataManager.saveLocationType(locationType);
  }

  /**
   * getLocationType – Retrieves the saved location type via the DataManager.
   * @returns {string|null} The location type or null if not set.
   */
  getLocationType() {
    return this.dataManager.getLocationType();
  }
}