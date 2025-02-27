export class ProfileManager {
  /**
   * Constructor for ProfileManager.
   * @param {SQLiteDataManager} dataManager - An instance of the new DataManager responsible for profile persistence.
   */
  constructor(dataManager) {
    // Save reference to the data manager for profile and related data persistence.
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
   * @param {Object} profile - The profile object.
   * @returns {Promise<void>}
   */
  async saveProfile(profile) {
    await this.dataManager.saveProfile(profile);
  }

  /**
   * resetProfile – Resets the profile and all related data.
   * Calls the DataManager to remove profile data along with ghost progress, quest progress, etc.
   * After reset, the page is reloaded.
   */
  resetProfile() {
    // Reset profile and related data via DataManager.
    // (Assuming dataManager.resetProfile() is synchronous or handles its own async logic)
    this.dataManager.resetProfile();
    // Reload the page to reflect changes.
    window.location.reload();
  }

  /**
   * exportProfileData – Exports the profile along with diary entries, apartment plan,
   * and quest progress to a JSON file.
   * @param {Object} databaseManager - The database manager for retrieving diary and quest data.
   * @param {Object} apartmentPlanManager - The apartment plan manager.
   */
  exportProfileData(databaseManager, apartmentPlanManager) {
    // Retrieve the profile asynchronously. For export, we assume the profile is already loaded.
    this.getProfile().then(profile => {
      if (!profile) {
        alert("No profile found to export.");
        return;
      }
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
  
      // Form the export object.
      const exportData = {
        profile: profile,
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
   * After import, updates the profile, diary, apartment plan, and quest progress, then reloads the page.
   * @param {File} file - The file containing the profile data.
   * @param {Object} databaseManager - The database manager.
   * @param {Object} apartmentPlanManager - The apartment plan manager.
   */
  importProfileData(file, databaseManager, apartmentPlanManager) {
    const reader = new FileReader();
    reader.onload = (e) => {
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
          importedData.diary.forEach(entry => {
            if (entry.entry && entry.timestamp) {
              databaseManager.db.run(
                "INSERT INTO diary (entry, timestamp) VALUES (?, ?)",
                [entry.entry, entry.timestamp]
              );
            }
          });
          databaseManager.saveDatabase();
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
  
        alert("Profile imported successfully. Reloading page.");
        window.location.reload();
      } catch (err) {
        console.error(err);
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