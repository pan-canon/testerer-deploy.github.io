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
  localStorage.removeItem('diaryDB'); // Очищаем базу дневника!
  window.location.reload();
}

  
  saveRegistrationData(data) {
    localStorage.setItem('regData', JSON.stringify(data));
  }
  
  getRegistrationData() {
    return JSON.parse(localStorage.getItem('regData'));
  }
  
  importProfile(fileContent) {
    try {
      const profile = JSON.parse(fileContent);
      if (!profile.name || !profile.gender || !profile.language || !profile.selfie) {
        throw new Error("Invalid profile data");
      }
      this.saveProfile(profile);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
// ДОБАВЛЯЕМ В ФУНКЦИЮ `importProfile()`
if (importedData.apartment) {
    importedData.apartment.forEach(room => {
        this.databaseManager.addApartmentRoom(room);
    });
}

  }
  
  exportProfile() {
    
// ДОБАВЛЯЕМ В ФУНКЦИЮ `exportProfile()`
const apartmentPlan = this.databaseManager.getApartmentPlan();
const exportData = {
    profile: JSON.parse(profileStr),
    diary: diaryEntries,
    apartment: apartmentPlan
};
return localStorage.getItem('profile');
  }
}