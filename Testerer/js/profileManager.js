export class ProfileManager {
  isProfileSaved() {
    return !!localStorage.getItem('profile');
  }
  
getProfile() {
    const profile = localStorage.getItem('profile');

    if (!profile) {
        console.warn("⚠️ Профиль не найден в localStorage.");
        return null;
    }

    try {
        return JSON.parse(profile);
    } catch (error) {
        console.error("❌ Ошибка при загрузке профиля:", error);
        return null;
    }
}

  
saveProfile(profile) {
    localStorage.setItem('profile', JSON.stringify(profile));
    console.log("✅ Профиль сохранён!", profile);

    // Проверяем, действительно ли данные записаны
    const storedProfile = localStorage.getItem("profile");
    console.log("📂 Сохранённый профиль:", storedProfile ? JSON.parse(storedProfile) : "❌ Отсутствует");
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
  }
  
  exportProfile() {
    return localStorage.getItem('profile');
  }
}