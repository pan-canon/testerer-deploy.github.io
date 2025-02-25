export class ProfileManager {
  /**
   * Checks if a profile is saved in localStorage.
   * @returns {boolean} True if a profile is found, otherwise false.
   */
  isProfileSaved() {
    return !!localStorage.getItem('profile');
  }

  /**
   * Retrieves the profile from localStorage and returns it as an object.
   * @returns {Object|null} The profile object or null if not found.
   */
  getProfile() {
    return JSON.parse(localStorage.getItem('profile'));
  }

  /**
   * Saves the given profile object to localStorage.
   * @param {Object} profile - The profile object.
   */
  saveProfile(profile) {
    localStorage.setItem('profile', JSON.stringify(profile));
  }

  /**
   * Resets the profile and all related data.
   * Removes registration data, diary database, ghost progress,
   * location type, quest progress, and animated entries.
   * After reset, the page is reloaded.
   */
  resetProfile() {
    // Preserve the language value so it is not lost during reset
    const language = localStorage.getItem("language");

    // Remove all profile data and related keys:
    localStorage.removeItem("registrationCompleted");
    localStorage.removeItem("profile");
    localStorage.removeItem("regData");
    localStorage.removeItem("diaryDB");
    localStorage.removeItem("ghostState");
    localStorage.removeItem("ghostProgress");
    localStorage.removeItem("locationType");
    localStorage.removeItem("questProgress");
    localStorage.removeItem("mirrorQuestReady");
    localStorage.removeItem("mirrorQuestActive");
    localStorage.removeItem("animatedDiaryIds");
    // New key from repeating quest:
    localStorage.removeItem("isRepeatingCycle");

    // Restore the saved language (if any)
    if (language !== null) {
      localStorage.setItem("language", language);
    }

    // Reload the page
    window.location.reload();
  }

  /**
   * Exports the profile along with the diary, apartment plan, and quest progress.
   * The data is formatted as JSON and saved to a file named profile.json.
   * @param {Object} databaseManager - The database manager.
   * @param {Object} apartmentPlanManager - The apartment plan manager.
   */
  exportProfileData(databaseManager, apartmentPlanManager) {
    // Retrieve the profile from localStorage.
    const profileStr = localStorage.getItem('profile');
    if (!profileStr) {
      alert("No profile found to export.");
      return;
    }
    // Retrieve diary entries.
    const diaryEntries = databaseManager.getDiaryEntries();
    // Retrieve apartment plan data if available.
    const apartmentPlanData = apartmentPlanManager ? apartmentPlanManager.rooms : [];
    
    // Retrieve quest progress data. Since getQuestProgress requires a key,
    // execute an SQL query to get all records from the quest_progress table.
    let questProgressData = [];
    const result = databaseManager.db.exec("SELECT * FROM quest_progress ORDER BY id DESC");
    if (result.length > 0) {
      questProgressData = result[0].values.map(row => ({
        id: row[0],
        quest_key: row[1],
        status: row[2]
      }));
    }

    // Form the export object including profile, diary, apartment plan, and quest progress.
    const exportData = {
      profile: JSON.parse(profileStr),
      diary: diaryEntries,
      apartment: apartmentPlanData,
      quests: questProgressData
    };

    // Create a Blob from the JSON string (formatted with indentation for readability).
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'profile.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Imports profile data from the selected file.
   * After import, the profile, diary, apartment plan, and quest progress are updated,
   * and then the page is reloaded.
   * @param {File} file - The file containing the profile data.
   * @param {Object} databaseManager - The database manager.
   * @param {Object} apartmentPlanManager - The apartment plan manager.
   */
  importProfileData(file, databaseManager, apartmentPlanManager) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        // Check for the presence of essential profile fields.
        if (!importedData.profile || !importedData.profile.name || !importedData.profile.gender ||
            !importedData.profile.selfie || !importedData.profile.language) {
          alert("Invalid profile file. Required profile fields are missing.");
          return;
        }
        // Save the profile.
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
   * Saves ghost progress (e.g., the current quest step).
   * @param {Object} progress - An object containing progress data (e.g., { ghostId: number, phenomenonIndex: number }).
   */
  saveGhostProgress(progress) {
    localStorage.setItem('ghostProgress', JSON.stringify(progress));
  }

  /**
   * Retrieves the saved ghost progress.
   * @returns {Object|null} The progress object or null if no data exists.
   */
  getGhostProgress() {
    const progress = localStorage.getItem('ghostProgress');
    return progress ? JSON.parse(progress) : null;
  }

  /**
   * Resets ghost progress by removing the corresponding key from localStorage.
   */
  resetGhostProgress() {
    localStorage.removeItem('ghostProgress');
  }

  /**
   * Saves the location type selected by the user.
   * @param {string} locationType - The name of the location type.
   */
  saveLocationType(locationType) {
    localStorage.setItem('locationType', locationType);
  }

  /**
   * Retrieves the saved location type.
   * @returns {string|null} The location type or null if not set.
   */
  getLocationType() {
    return localStorage.getItem('locationType');
  }
}