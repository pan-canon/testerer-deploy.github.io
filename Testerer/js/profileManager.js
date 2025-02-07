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
  // Удаляем ключи, связанные с профилем и регистрацией
  localStorage.removeItem('profile');
  localStorage.removeItem('regData');
  localStorage.removeItem('diaryDB'); // Очищаем базу дневника!
  // Если у вас используются дополнительные ключи (например, для флагов регистрации или звонка), удалите их тоже:
  localStorage.removeItem("registrationCompleted");
  localStorage.removeItem("callHandled");
  
  // Альтернативно можно вызвать localStorage.clear(), если хотите полностью очистить хранилище:
  // localStorage.clear();
  
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
  }
  
  exportProfile() {
    return localStorage.getItem('profile');
  }
}