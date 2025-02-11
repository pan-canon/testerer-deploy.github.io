export class ProfileManager {
  /**
   * Проверяет, сохранён ли профиль в localStorage.
   * @returns {boolean} true, если профиль найден, иначе false.
   */
  isProfileSaved() {
    return !!localStorage.getItem('profile');
  }

  /**
   * Получает профиль из localStorage и возвращает его в виде объекта.
   * @returns {Object|null} Объект профиля или null, если профиль не найден.
   */
  getProfile() {
    return JSON.parse(localStorage.getItem('profile'));
  }

  /**
   * Сохраняет переданный профиль в localStorage.
   * @param {Object} profile – объект профиля.
   */
  saveProfile(profile) {
    localStorage.setItem('profile', JSON.stringify(profile));
  }

  /**
   * Сбрасывает профиль и связанные с ним данные.
   * Удаляются данные регистрации, базы данных дневника, прогресс призраков, тип локации и состояние квестов.
   * После сброса страница перезагружается.
   */
  resetProfile() {
    localStorage.removeItem("registrationCompleted");
    localStorage.removeItem('profile');
    localStorage.removeItem('regData');
    localStorage.removeItem('diaryDB');
    localStorage.removeItem('ghostState');
    // Удаляем устаревшие данные, связанные с звонками – в новой логике они не используются
    // localStorage.removeItem("callHandled");
    // Сброс прогресса по призракам
    localStorage.removeItem("ghostProgress");
    // Сброс типа локации
    localStorage.removeItem("locationType");
    // Сброс состояния квестов
    localStorage.removeItem("questProgress");
    window.location.reload();
  }

  /**
   * Экспортирует данные профиля вместе с дневником, планом квартиры и прогрессом квестов.
   * Данные формируются в виде JSON и сохраняются в файл profile.json.
   * @param {Object} databaseManager – менеджер базы данных.
   * @param {Object} apartmentPlanManager – менеджер плана квартиры.
   */
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

  /**
   * Импортирует данные профиля из выбранного файла.
   * После импорта обновляет профиль, дневник, план квартиры и прогресс квестов, затем перезагружает страницу.
   * @param {File} file – файл с данными профиля.
   * @param {Object} databaseManager – менеджер базы данных.
   * @param {Object} apartmentPlanManager – менеджер плана квартиры.
   */
  importProfileData(file, databaseManager, apartmentPlanManager) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        // Проверяем наличие основных полей профиля
        if (!importedData.profile || !importedData.profile.name || !importedData.profile.gender ||
            !importedData.profile.selfie || !importedData.profile.language) {
          alert("Invalid profile file. Required profile fields are missing.");
          return;
        }
        // Сохраняем профиль
        this.saveProfile(importedData.profile);

        // Импортируем записи дневника
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

        // Импортируем данные плана квартиры, если они существуют
        if (importedData.apartment && Array.isArray(importedData.apartment)) {
          if (apartmentPlanManager) {
            apartmentPlanManager.rooms = importedData.apartment;
            apartmentPlanManager.renderRooms();
          }
        }

        // Импортируем прогресс квестов
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
   * Сохраняет прогресс по призракам (например, текущий шаг квеста).
   * @param {Object} progress – объект с данными прогресса (например, { ghostId: число, phenomenonIndex: число }).
   */
  saveGhostProgress(progress) {
    localStorage.setItem('ghostProgress', JSON.stringify(progress));
  }

  /**
   * Получает сохранённый прогресс по призракам.
   * @returns {Object|null} Объект с данными прогресса или null, если данных нет.
   */
  getGhostProgress() {
    const progress = localStorage.getItem('ghostProgress');
    return progress ? JSON.parse(progress) : null;
  }

  /**
   * Сбрасывает прогресс по призракам, удаляя соответствующий ключ из localStorage.
   */
  resetGhostProgress() {
    localStorage.removeItem('ghostProgress');
  }

  /**
   * Сохраняет тип локации, выбранный пользователем.
   * @param {string} locationType – название типа локации.
   */
  saveLocationType(locationType) {
    localStorage.setItem('locationType', locationType);
  }

  /**
   * Получает сохранённый тип локации.
   * @returns {string|null} Название типа локации или null, если не задан.
   */
  getLocationType() {
    return localStorage.getItem('locationType');
  }
}