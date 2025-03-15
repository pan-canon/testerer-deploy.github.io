// Класс для управления языком
class LanguageManager {
  constructor(locales, selectorId) {
    this.locales = locales;
    this.selector = document.getElementById(selectorId);
    this.currentLanguage = localStorage.getItem('language') || 'en';
    this.selector.value = this.currentLanguage;
    this.applyLanguage();
    this.selector.addEventListener('change', () => {
      this.currentLanguage = this.selector.value;
      localStorage.setItem('language', this.currentLanguage);
      this.applyLanguage();
    });
  }
  
  applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (this.locales[this.currentLanguage] && this.locales[this.currentLanguage][key]) {
        el.textContent = this.locales[this.currentLanguage][key];
      }
    });
  }
  
  getLanguage() {
    return this.currentLanguage;
  }
}

// Класс для управления камерой
class CameraManager {
  constructor(videoElementId) {
    this.videoElement = document.getElementById(videoElementId);
    this.stream = null;
  }
  
  start() {
    return navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
      .then(stream => {
        this.videoElement.srcObject = stream;
        this.stream = stream;
      })
      .catch(error => {
        console.error("Ошибка при доступе к камере:", error);
      });
  }
  
  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }
  
  capture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  }
}

// Класс для управления профилем
class ProfileManager {
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

// Основной класс приложения
class App {
  constructor() {
    // DOM-элементы экранов
    this.registrationScreen = document.getElementById('registration-screen');
    this.selfieScreen = document.getElementById('selfie-screen');
    this.mainScreen = document.getElementById('main-screen');
    
    // Элементы формы регистрации
    this.nameInput = document.getElementById('player-name');
    this.genderSelect = document.getElementById('player-gender');
    this.nextStepBtn = document.getElementById('next-step-btn');
    
    // Элементы экрана селфи
    this.selfieVideo = document.getElementById('selfie-video');
    this.captureBtn = document.getElementById('capture-btn');
    this.selfiePreview = document.getElementById('selfie-preview');
    this.completeBtn = document.getElementById('complete-registration');
    
    // Элементы главного экрана
    this.profileNameElem = document.getElementById('profile-name');
    this.profilePhotoElem = document.getElementById('profile-photo');
    this.resetBtn = document.getElementById('reset-data');
    this.exportBtn = document.getElementById('export-profile');
    this.importFileInput = document.getElementById('import-file');
    this.importBtn = document.getElementById('import-profile-btn');
    
    // Менеджеры
    this.languageManager = new LanguageManager(this.getLocales(), 'language-selector');
    this.cameraManager = new CameraManager('selfie-video');
    this.profileManager = new ProfileManager();
    
    this.bindEvents();
    this.init();
  }
  
  getLocales() {
    return {
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
        "export": "Export Profile",
        "import_profile": "Import Profile",
        "import": "Import"
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
        "export": "Экспорт профиля",
        "import_profile": "Импорт профиля",
        "import": "Импорт"
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
        "export": "Експорт профілю",
        "import_profile": "Імпорт профілю",
        "import": "Імпорт"
      }
    };
  }
  
  bindEvents() {
    // Регистрация: валидация формы
    this.nameInput.addEventListener('input', () => this.validateRegistration());
    this.genderSelect.addEventListener('change', () => this.validateRegistration());
    
    this.nextStepBtn.addEventListener('click', () => this.goToSelfieScreen());
    this.captureBtn.addEventListener('click', () => this.captureSelfie());
    this.completeBtn.addEventListener('click', () => this.completeRegistration());
    this.resetBtn.addEventListener('click', () => this.profileManager.resetProfile());
    this.exportBtn.addEventListener('click', () => this.exportProfile());
    this.importBtn.addEventListener('click', () => this.importProfile());
  }
  
  init() {
    if (this.profileManager.isProfileSaved()) {
      this.showMainScreen();
    } else {
      this.showRegistrationScreen();
    }
  }
  
  validateRegistration() {
    if (this.nameInput.value.trim() !== "" && this.genderSelect.value !== "") {
      this.nextStepBtn.disabled = false;
    } else {
      this.nextStepBtn.disabled = true;
    }
  }
  
  goToSelfieScreen() {
    // Сохраняем данные регистрации временно
    const regData = {
      name: this.nameInput.value.trim(),
      gender: this.genderSelect.value,
      language: document.getElementById('language-selector').value
    };
    localStorage.setItem('regData', JSON.stringify(regData));
    this.registrationScreen.style.display = 'none';
    this.selfieScreen.style.display = 'block';
    this.cameraManager.start();
  }
  
  captureSelfie() {
    const selfieData = this.cameraManager.capture();
    this.selfiePreview.src = selfieData;
    this.selfiePreview.style.display = 'block';
    this.completeBtn.disabled = false;
  }
  
  completeRegistration() {
    if (!this.selfiePreview.src || this.selfiePreview.src === "") {
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
      selfie: this.selfiePreview.src
    };
    this.profileManager.saveProfile(profile);
    this.cameraManager.stop();
    this.showMainScreen();
  }
  
  showMainScreen() {
    this.registrationScreen.style.display = 'none';
    this.selfieScreen.style.display = 'none';
    this.mainScreen.style.display = 'block';
    const profile = this.profileManager.getProfile();
    if (profile) {
      this.profileNameElem.textContent = profile.name;
      this.profilePhotoElem.src = profile.selfie;
      this.profilePhotoElem.style.display = 'block';
    }
  }
  
  showRegistrationScreen() {
    this.registrationScreen.style.display = 'block';
    this.selfieScreen.style.display = 'none';
    this.mainScreen.style.display = 'none';
  }
  
  exportProfile() {
    const profileStr = this.profileManager.exportProfile();
    if (!profileStr) {
      alert("No profile found to export.");
      return;
    }
    const blob = new Blob([profileStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'profile.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  importProfile() {
    if (this.importFileInput.files.length === 0) {
      alert("Please select a profile file to import.");
      return;
    }
    const file = this.importFileInput.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedProfile = JSON.parse(e.target.result);
        if (!importedProfile.name || !importedProfile.gender || !importedProfile.selfie || !importedProfile.language) {
          alert("Invalid profile file. Required fields are missing.");
          return;
        }
        this.profileManager.saveProfile(importedProfile);
        alert("Profile imported successfully. Reloading page.");
        window.location.reload();
      } catch (err) {
        alert("Error parsing the profile file.");
      }
    };
    reader.readAsText(file);
  }
}

// Инициализация приложения
document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  
  // Регистрация сервис-воркера
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(function(registration) {
         console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(function(error) {
         console.error('Service Worker registration failed:', error);
      });
  }
});
