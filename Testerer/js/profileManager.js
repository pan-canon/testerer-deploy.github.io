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
   * Удаляются данные регистрации, базы данных дневника, прогресс призраков,
   * тип локации, состояние квестов и анимированные записи.
   * После сброса страница перезагружается.
   */
  resetProfile() {
    // Сохраняем значение языка, чтобы его не потерять при сбросе
    const language = localStorage.getItem("language");

    // Удаляем все данные профиля и связанные ключи:
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

    // Восстанавливаем сохранённый язык (если он был)
    if (language !== null) {
      localStorage.setItem("language", language);
    }

    // Перезагружаем страницу
    window.location.reload();
  }

  /**
   * Экспортирует данные профиля вместе с дневником, планом квартиры и прогрессом квестов.
   * Данные формируются в виде JSON и сохраняются в файл profile.json.
   * @param {Object} databaseManager – менеджер базы данных.
   * @param {Object} apartmentPlanManager – менеджер плана квартиры.
   */
  exportProfileData(databaseManager, apartmentPlanManager) {
    // Получаем профиль из localStorage.
    const profileStr = localStorage.getItem('profile');
    if (!profileStr) {
      alert("No profile found to export.");
      return;
    }
    // Получаем записи дневника.
    const diaryEntries = databaseManager.getDiaryEntries();
    // Получаем данные плана квартиры, если они существуют.
    const apartmentPlanData = apartmentPlanManager ? apartmentPlanManager.rooms : [];
    
    // Получаем данные прогресса квестов. Поскольку метод getQuestProgress требует ключ,
    // выполняем SQL-запрос для получения всех записей из таблицы quest_progress.
    let questProgressData = [];
    const result = databaseManager.db.exec("SELECT * FROM quest_progress ORDER BY id DESC");
    if (result.length > 0) {
      questProgressData = result[0].values.map(row => ({
        id: row[0],
        quest_key: row[1],
        status: row[2]
      }));
    }

    // Формируем объект экспорта, включающий профиль, дневник, данные квартиры и прогресс квестов.
    const exportData = {
      profile: JSON.parse(profileStr),
      diary: diaryEntries,
      apartment: apartmentPlanData,
      quests: questProgressData
    };

    // Создаем Blob из JSON-строки с отступами для удобного чтения.
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
   * После импорта обновляются профиль, дневник, план квартиры и прогресс квестов,
   * затем страница перезагружается.
   * @param {File} file – файл с данными профиля.
   * @param {Object} databaseManager – менеджер базы данных.
   * @param {Object} apartmentPlanManager – менеджер плана квартиры.
   */
  importProfileData(file, databaseManager, apartmentPlanManager) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        // Проверяем наличие основных полей профиля.
        if (!importedData.profile || !importedData.profile.name || !importedData.profile.gender ||
            !importedData.profile.selfie || !importedData.profile.language) {
          alert("Invalid profile file. Required profile fields are missing.");
          return;
        }
        // Сохраняем профиль.
        this.saveProfile(importedData.profile);

        // Импортируем записи дневника.
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

        // Импортируем данные плана квартиры, если они существуют.
        if (importedData.apartment && Array.isArray(importedData.apartment)) {
          if (apartmentPlanManager) {
            apartmentPlanManager.rooms = importedData.apartment;
            apartmentPlanManager.renderRooms();
          }
        }

        // Импортируем прогресс квестов.
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