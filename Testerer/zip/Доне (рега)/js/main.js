document.addEventListener("DOMContentLoaded", function() {
  // ===============================
  // 1. Инициализация языка
  // ===============================
  const locales = {
    "en": {
      "welcome": "Welcome!",
      "enter_name": "Enter your name:",
      "select_gender": "Select your gender:",
      "male": "Male",
      "female": "Female",
      "other": "Other",
      "next": "Next",
      "take_selfie": "Take a Selfie",
      "capture": "Capture",
      "complete": "Complete",
      "diary": "Your Diary",
      "empty_diary": "No entries yet...",
      "select_language": "Select Language",
      "reset": "Reset Data",
      "export": "Export Profile"
    },
    "ru": {
      "welcome": "Добро пожаловать!",
      "enter_name": "Введите ваше имя:",
      "select_gender": "Выберите ваш пол:",
      "male": "Мужской",
      "female": "Женский",
      "other": "Другой",
      "next": "Далее",
      "take_selfie": "Сделайте селфи",
      "capture": "Сделать фото",
      "complete": "Завершить",
      "diary": "Ваш дневник",
      "empty_diary": "Записей пока нет...",
      "select_language": "Выберите язык",
      "reset": "Сбросить данные",
      "export": "Экспорт профиля"
    },
    "uk": {
      "welcome": "Ласкаво просимо!",
      "enter_name": "Введіть ваше ім'я:",
      "select_gender": "Оберіть вашу стать:",
      "male": "Чоловіча",
      "female": "Жіноча",
      "other": "Інша",
      "next": "Далі",
      "take_selfie": "Зробіть селфі",
      "capture": "Зробити фото",
      "complete": "Завершити",
      "diary": "Ваш щоденник",
      "empty_diary": "Записів поки немає...",
      "select_language": "Оберіть мову",
      "reset": "Скинути дані",
      "export": "Експорт профілю"
    }
  };

  function changeLanguage(lang) {
    document.querySelectorAll('[data-i18n]').forEach(function(element) {
      const key = element.getAttribute('data-i18n');
      if (locales[lang] && locales[lang][key]) {
        element.textContent = locales[lang][key];
      }
    });
  }

  // Устанавливаем язык из localStorage или по умолчанию 'en'
  const savedLang = localStorage.getItem('language') || 'en';
  document.getElementById('language-selector').value = savedLang;
  changeLanguage(savedLang);

  document.getElementById('language-selector').addEventListener('change', function() {
    const newLang = this.value;
    localStorage.setItem('language', newLang);
    changeLanguage(newLang);
  });

  // ===============================
  // 2. Проверка сохранённого профиля
  // ===============================
  const profileJSON = localStorage.getItem('profile');
  if (profileJSON) {
    // Профиль существует — сразу переходим на главный экран
    const profile = JSON.parse(profileJSON);
    document.getElementById('registration-screen').style.display = 'none';
    document.getElementById('selfie-screen').style.display = 'none';
    document.getElementById('main-screen').style.display = 'block';
    document.getElementById('profile-name').textContent = profile.name;
    const profilePhoto = document.getElementById('profile-photo');
    profilePhoto.src = profile.selfie;
    profilePhoto.style.display = 'block';
  } else {
    // Профиль отсутствует — показываем экран регистрации
    document.getElementById('registration-screen').style.display = 'block';
    document.getElementById('selfie-screen').style.display = 'none';
    document.getElementById('main-screen').style.display = 'none';
  }

  // ===============================
  // 3. Обработка формы регистрации
  // ===============================
  const nameInput = document.getElementById('player-name');
  const genderSelect = document.getElementById('player-gender');
  const nextStepBtn = document.getElementById('next-step-btn');

  function validateRegistration() {
    if (nameInput.value.trim() !== "" && genderSelect.value !== "") {
      nextStepBtn.disabled = false;
    } else {
      nextStepBtn.disabled = true;
    }
  }
  nameInput.addEventListener('input', validateRegistration);
  genderSelect.addEventListener('change', validateRegistration);

  // При нажатии на кнопку "Next" переходим к экрану селфи
  nextStepBtn.addEventListener('click', function() {
    // Сохраняем введённые данные временно
    const regData = {
      name: nameInput.value.trim(),
      gender: genderSelect.value,
      language: document.getElementById('language-selector').value
    };
    localStorage.setItem('regData', JSON.stringify(regData));
    document.getElementById('registration-screen').style.display = 'none';
    document.getElementById('selfie-screen').style.display = 'block';
    startVideo();
  });

  // ===============================
  // 4. Функциональность камеры и селфи
  // ===============================
  const selfieVideo = document.getElementById('selfie-video');
  const captureBtn = document.getElementById('capture-btn');
  const selfiePreview = document.getElementById('selfie-preview');
  let videoStream = null;

  function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
      .then(function(stream) {
        selfieVideo.srcObject = stream;
        videoStream = stream;
      })
      .catch(function(error) {
        console.error("Ошибка при доступе к камере:", error);
      });
  }

  captureBtn.addEventListener('click', function() {
    const canvas = document.createElement('canvas');
    canvas.width = selfieVideo.videoWidth;
    canvas.height = selfieVideo.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(selfieVideo, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL("image/png");
    selfiePreview.src = dataURL;
    selfiePreview.style.display = 'block';
    
    // Активируем кнопку "Complete", так как селфи успешно сделано
    document.getElementById('complete-registration').disabled = false;
  });

  // ===============================
  // 5. Завершение регистрации и сохранение профиля
  // ===============================
  document.getElementById('complete-registration').addEventListener('click', function() {
    if (!selfiePreview.src || selfiePreview.src === "") {
      alert("Please capture your selfie before completing registration.");
      return;
    }
    const regDataStr = localStorage.getItem('regData');
    if (!regDataStr) {
      alert("Registration data missing.");
      return;
    }
    const regData = JSON.parse(regDataStr);
    const profile = {
      name: regData.name,
      gender: regData.gender,
      language: regData.language,
      selfie: selfiePreview.src
    };
    localStorage.setItem('profile', JSON.stringify(profile));

    // Останавливаем видеопоток
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }

    // Переходим на главный экран
    document.getElementById('selfie-screen').style.display = 'none';
    document.getElementById('main-screen').style.display = 'block';
    document.getElementById('profile-name').textContent = profile.name;
    const profilePhoto = document.getElementById('profile-photo');
    profilePhoto.src = profile.selfie;
    profilePhoto.style.display = 'block';
  });

  // ===============================
  // 6. Обработчик для импорта профиля (альтернативный вход)
  // ===============================
  document.getElementById('import-profile-btn').addEventListener('click', function() {
    const fileInput = document.getElementById('import-file');
    if (fileInput.files.length === 0) {
      alert("Please select a profile file to import.");
      return;
    }
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const importedProfile = JSON.parse(e.target.result);
        // Проверяем, что профиль содержит необходимые поля
        if (!importedProfile.name || !importedProfile.gender || !importedProfile.selfie || !importedProfile.language) {
          alert("Invalid profile file. Required fields are missing.");
          return;
        }
        localStorage.setItem('profile', JSON.stringify(importedProfile));
        alert("Profile imported successfully. Reloading page.");
        window.location.reload();
      } catch (err) {
        alert("Error parsing the profile file.");
      }
    };
    reader.readAsText(file);
  });

  // ===============================
  // 7. Сброс данных и возврат к регистрации (на главном экране)
  // ===============================
  document.getElementById('reset-data').addEventListener('click', function() {
    localStorage.removeItem('profile');
    localStorage.removeItem('regData');
    window.location.reload();
  });

  // ===============================
  // 8. Регистрация сервис-воркера
  // ===============================
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(function(registration) {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(function(error) {
        console.error('Service Worker registration failed:', error);
      });
  }

// Функция экспорта профиля
document.getElementById('export-profile').addEventListener('click', function() {
  // Получаем профиль из localStorage
  const profile = localStorage.getItem('profile');
  if (!profile) {
    alert("No profile found to export.");
    return;
  }
  
  // Создаем Blob из JSON-строки
  const blob = new Blob([profile], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // Создаем временный элемент-ссылку и инициируем скачивание
  const a = document.createElement('a');
  a.href = url;
  a.download = 'profile.json';  // Имя файла
  document.body.appendChild(a);
  a.click();
  
  // Удаляем ссылку и освобождаем объект URL
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

});