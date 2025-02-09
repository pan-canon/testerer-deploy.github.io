export class ProfileManager {
  isProfileSaved() {
    return !!localStorage.getItem('profile');
  }

  getProfile() {
    return JSON.parse(localStorage.getItem('profile'));
  }

  saveProfile(profile) {
    localStorage.setItem('profile', JSON.stringify(profile));
  }

  resetProfile() {
    localStorage.removeItem('profile');
    localStorage.removeItem('regData');
    localStorage.removeItem('diaryDB');
    localStorage.removeItem("registrationCompleted");
    localStorage.removeItem("callHandled");
    // Сброс прогресса по призракам
    localStorage.removeItem("ghostProgress");
    // Сброс типа локации
    localStorage.removeItem("locationType");
    // Сброс состояния квестов
    localStorage.removeItem("questProgress");
    window.location.reload();
  }

  exportProfileData(databaseManager, apartmentPlanManager) {
    const profileStr = localStorage.getItem('profile');
    if (!profileStr) {
      alert("No profile found to export.");
      return;
    }
    const diaryEntries = databaseManager.getDiaryEntries();
    const apartmentPlanData = apartmentPlanManager ? apartmentPlanManager.rooms : [];
    const questProgressData = databaseManager.getQuestProgress();

    const exportData = {
      profile: JSON.parse(profileStr),
      diary: diaryEntries,
      apartment: apartmentPlanData,
      quests: questProgressData
    };

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

  importProfileData(file, databaseManager, apartmentPlanManager) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (!importedData.profile || !importedData.profile.name || !importedData.profile.gender ||
            !importedData.profile.selfie || !importedData.profile.language) {
          alert("Invalid profile file. Required profile fields are missing.");
          return;
        }
        this.saveProfile(importedData.profile);

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

        if (importedData.apartment && Array.isArray(importedData.apartment)) {
          if (apartmentPlanManager) {
            apartmentPlanManager.rooms = importedData.apartment;
            apartmentPlanManager.renderRooms();
          }
        }

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

  saveGhostProgress(progress) {
    localStorage.setItem('ghostProgress', JSON.stringify(progress));
  }

  getGhostProgress() {
    const progress = localStorage.getItem('ghostProgress');
    return progress ? JSON.parse(progress) : null;
  }

  resetGhostProgress() {
    localStorage.removeItem('ghostProgress');
  }

  saveLocationType(locationType) {
    localStorage.setItem('locationType', locationType);
  }

  getLocationType() {
    return localStorage.getItem('locationType');
  }
}