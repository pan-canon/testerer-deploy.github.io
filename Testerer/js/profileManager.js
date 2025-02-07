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
    window.location.reload();
  }
  
  // Экспорт профиля вместе с дневником и планом квартиры
  exportProfileData(databaseManager, apartmentPlanManager) {
    const profileStr = localStorage.getItem('profile');
    if (!profileStr) {
      alert("No profile found to export.");
      return;
    }
    // Получаем данные дневника
    const diaryEntries = databaseManager.getDiaryEntries();
    // Если имеется план квартиры, получаем данные плана
    const apartmentPlanData = apartmentPlanManager ? apartmentPlanManager.rooms : [];
    
    // Объединяем данные в один объект
    const exportData = {
      profile: JSON.parse(profileStr),
      diary: diaryEntries,
      apartment: apartmentPlanData
    };

    // Экспорт в JSON-файл
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
  
  // Импорт профиля вместе с дневником и планом квартиры
  importProfileData(file, databaseManager, apartmentPlanManager) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        // Проверяем наличие основных данных профиля
        if (!importedData.profile || !importedData.profile.name || !importedData.profile.gender ||
            !importedData.profile.selfie || !importedData.profile.language) {
          alert("Invalid profile file. Required profile fields are missing.");
          return;
        }
        // Сохраняем профиль
        this.saveProfile(importedData.profile);
        
        // Импортируем записи дневника, если они есть
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
        
        // Импортируем данные плана квартиры, если они есть
        if (importedData.apartment && Array.isArray(importedData.apartment)) {
          if (apartmentPlanManager) {
            apartmentPlanManager.rooms = importedData.apartment;
            apartmentPlanManager.renderRooms();
          }
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
}