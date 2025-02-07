import { LanguageManager } from './languageManager.js';
import { cameraSectionManager } from './cameraSectionManager.js';
import { ImageUtils } from './utils/imageUtils.js';
import { ProfileManager } from './profileManager.js';
import { ApartmentPlanManager } from './ApartmentPlanManager.js';
import { DatabaseManager } from './databaseManager.js';
import { EventManager } from './eventManager.js';
import { CallManager } from './callManager.js';
import { QuestManager } from './questManager.js';
import { GameEventManager } from './gameEventManager.js';

export class App {
  constructor() {
    // DOM-элементы экранов и формы
    this.registrationScreen = document.getElementById('registration-screen');
    this.selfieScreen = document.getElementById('selfie-screen');
    this.mainScreen = document.getElementById('main-screen');
    this.nameInput = document.getElementById('player-name');
    this.genderSelect = document.getElementById('player-gender');
    this.nextStepBtn = document.getElementById('next-step-btn');
    this.selfieVideo = document.getElementById('selfie-video');
    this.captureBtn = document.getElementById('capture-btn');
    this.selfiePreview = document.getElementById('selfie-preview');
    this.completeBtn = document.getElementById('complete-registration');
    this.profileNameElem = document.getElementById('profile-name');
    this.profilePhotoElem = document.getElementById('profile-photo');
    this.resetBtn = document.getElementById('reset-data');
    this.exportBtn = document.getElementById('export-profile');
    this.importFileInput = document.getElementById('import-file');
    this.importBtn = document.getElementById('import-profile-btn');
    
    // Менеджеры
    this.languageManager = new LanguageManager('language-selector');
    this.cameraSectionManager = new cameraSectionManager();
    this.profileManager = new ProfileManager();
    this.databaseManager = new DatabaseManager();
    // Сначала создаём eventManager, затем CallManager, QuestManager и GameEventManager
this.eventManager = new EventManager(this.databaseManager, this.languageManager);
this.callManager = new CallManager(this.eventManager, this, this.languageManager);
this.questManager = new QuestManager(this.eventManager, this);
this.gameEventManager = new GameEventManager(this.eventManager, this, this.languageManager);

    // Технические поля для обработки изображений
    this.tempCanvas = document.createElement("canvas");
    this.tempCtx = this.tempCanvas.getContext("2d");

    this.bindEvents();
    this.init();
  }
  
  bindEvents() {
    // Привязка событий формы и переключения экранов
    this.nameInput.addEventListener('input', () => this.validateRegistration());
    this.genderSelect.addEventListener('change', () => this.validateRegistration());
    this.nextStepBtn.addEventListener('click', () => this.goToApartmentPlanScreen());
    this.captureBtn.addEventListener('click', () => this.captureSelfie());
    this.completeBtn.addEventListener('click', () => this.completeRegistration());
    this.resetBtn.addEventListener('click', () => this.profileManager.resetProfile());
    this.exportBtn.addEventListener('click', () => this.exportProfile());
    this.importBtn.addEventListener('click', () => this.importProfile());
    document.getElementById("apartment-plan-next-btn").addEventListener("click", () => this.goToSelfieScreen());
    document.getElementById("prev-floor-btn").addEventListener("click", () => {
      if (this.apartmentPlanManager) {
        this.apartmentPlanManager.prevFloor();
      }
    });
    document.getElementById("next-floor-btn").addEventListener("click", () => {
      if (this.apartmentPlanManager) {
        this.apartmentPlanManager.nextFloor();
      }
    });
    document.getElementById("toggle-camera").addEventListener("click", () => this.toggleCameraView());
    document.getElementById("toggle-diary").addEventListener("click", () => this.toggleCameraView());
  }
  
  async init() {
    await this.databaseManager.initDatabasePromise;
    
    const entries = this.databaseManager.getDiaryEntries();
    console.log("Проверяем дневник после инициализации:", entries);
    
    if (entries.length > 0) {
      const cameraBtn = document.getElementById("toggle-camera");
      cameraBtn.style.display = "inline-block";
    }
    
    if (this.profileManager.isProfileSaved()) {
      this.showMainScreen();
      this.eventManager.updateDiaryDisplay();
      
      // Если регистрация завершена, но звонок ещё не обработан, активируем событие "welcome"
if (
  localStorage.getItem("registrationCompleted") === "true" &&
  localStorage.getItem("callHandled") !== "true"
) {
  setTimeout(() => {
    this.gameEventManager.activateEvent("welcome");
  }, 5000);
}
      
      if (
        localStorage.getItem("registrationCompleted") === "true" &&
        localStorage.getItem("callHandled") === "true" &&
        localStorage.getItem("mirrorQuestActive") === "true"
      ) {
        const cameraBtn = document.getElementById("toggle-camera");
        cameraBtn.style.display = "inline-block";
        cameraBtn.classList.add("glowing");
      }
    } else {
      this.showRegistrationScreen();
    }
  }
  
  validateRegistration() {
    this.nextStepBtn.disabled = !(this.nameInput.value.trim() !== "" && this.genderSelect.value !== "");
  }

  goToApartmentPlanScreen() {
    const regData = {
      name: this.nameInput.value.trim(),
      gender: this.genderSelect.value,
      language: document.getElementById('language-selector').value
    };
    localStorage.setItem('regData', JSON.stringify(regData));
    this.registrationScreen.style.display = 'none';
    document.getElementById('apartment-plan-screen').style.display = 'block';
    if (!this.apartmentPlanManager) {
      this.apartmentPlanManager = new ApartmentPlanManager('apartment-plan-container', this.databaseManager);
    }
  }
  
  goToSelfieScreen() {
    document.getElementById('apartment-plan-screen').style.display = 'none';
    this.selfieScreen.style.display = 'block';
    const selfieContainer = document.getElementById('selfie-container');
    selfieContainer.style.display = 'block';
    this.cameraSectionManager.attachTo('selfie-container', {
      width: "100%",
      maxWidth: "400px",
      filter: "grayscale(100%)"
    });
    this.cameraSectionManager.startCamera();
    this.completeBtn.disabled = true;
  }
  
  captureSelfie() {
    console.log("📸 Попытка сделать снимок...");
    if (!this.cameraSectionManager.videoElement || !this.cameraSectionManager.videoElement.srcObject) {
      console.error("❌ Камера не активна!");
      alert("Ошибка: Камера не включена.");
      return;
    }
    const video = this.cameraSectionManager.videoElement;
    if (video.readyState < 2) {
      console.warn("⏳ Камера ещё не готова...");
      alert("Подождите, пока камера загрузится.");
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error("Не удалось получить контекст рисования.");
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const grayscaleData = ImageUtils.convertToGrayscale(canvas);
      this.selfiePreview.src = grayscaleData;
      this.selfiePreview.style.display = 'block';
      this.completeBtn.disabled = false;
      this.selfieData = grayscaleData;
      console.log("✅ Снимок успешно сделан!");
    } catch (error) {
      console.error("❌ Ошибка при создании снимка:", error);
      alert("Ошибка при создании снимка! Попробуйте снова.");
    }
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
    localStorage.setItem("registrationCompleted", "true");
    this.cameraSectionManager.stopCamera();
    this.showMainScreen();
    
    // Вместо прямого запуска звонка, активируем событие "welcome"
    setTimeout(() => {
      this.gameEventManager.activateEvent("welcome");
    }, 5000);
  }


// 🔹 Переключение между камерой и дневником
async toggleCameraView() {
  const diary = document.getElementById("diary");
  const cameraContainer = document.getElementById("camera-container");
  const toggleCameraBtn = document.getElementById("toggle-camera");
  const toggleDiaryBtn = document.getElementById("toggle-diary");
  const buttonsToHide = [
    document.getElementById("reset-data"),
    document.getElementById("export-profile"),
    document.getElementById("import-profile-container")
  ];

  // Если контейнер скрыт – показываем его
  if (cameraContainer.style.display === "none") {
    console.log("📸 Переключаемся на камеру...");
    diary.style.display = "none";
    cameraContainer.style.display = "flex";
    toggleCameraBtn.style.display = "none";
    toggleDiaryBtn.style.display = "inline-block";
    buttonsToHide.forEach(btn => { if (btn) btn.style.display = "none"; });

    // Прикрепляем видео к контейнеру камеры (без фильтра)
    this.cameraSectionManager.attachTo('camera-container', {
      width: "100%",
      height: "100%"
    });
    await this.cameraSectionManager.startCamera();

await new Promise(resolve => {
  if (this.cameraSectionManager.videoElement.readyState >= 2) {
    resolve();
  } else {
    this.cameraSectionManager.videoElement.onloadedmetadata = () => resolve();
  }
});
console.log("Видео готово:", this.cameraSectionManager.videoElement.videoWidth, this.cameraSectionManager.videoElement.videoHeight);

// Запускаем зеркальный квест только если флаг активен (то есть, звонок был принят)
if (localStorage.getItem("mirrorQuestActive") === "true") {
  this.questManager.checkMirrorQuestOnCamera();
}

  } else {
    console.log("📓 Возвращаемся в блог...");
    diary.style.display = "block";
    cameraContainer.style.display = "none";
    toggleCameraBtn.style.display = "inline-block";
    toggleDiaryBtn.style.display = "none";
    buttonsToHide.forEach(btn => { if (btn) btn.style.display = "block"; });
    this.cameraSectionManager.stopCamera();
  }
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
    // Восстанавливаем сохранённое селфи для последующего сравнения
    this.selfieData = profile.selfie;
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
  // Получаем данные дневника
  const diaryEntries = this.databaseManager.getDiaryEntries();
  // Если у вас реализована регистрация плана квартиры, получаем данные плана
  const apartmentPlanData = this.apartmentPlanManager ? this.apartmentPlanManager.rooms : [];
  
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

  
importProfile() {
  if (this.importFileInput.files.length === 0) {
    alert("Please select a profile file to import.");
    return;
  }
  const file = this.importFileInput.files[0];
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
      this.profileManager.saveProfile(importedData.profile);
      
      // Импортируем записи дневника, если они есть
      if (importedData.diary && Array.isArray(importedData.diary)) {
        importedData.diary.forEach(entry => {
          if (entry.entry && entry.timestamp) {
            this.databaseManager.db.run(
              "INSERT INTO diary (entry, timestamp) VALUES (?, ?)",
              [entry.entry, entry.timestamp]
            );
          }
        });
        this.databaseManager.saveDatabase();
      }
      
      // Импортируем данные плана квартиры, если они есть
      if (importedData.apartment && Array.isArray(importedData.apartment)) {
        // Если объект apartmentPlanManager уже создан, сохраняем данные и перерисовываем таблицу
        if (this.apartmentPlanManager) {
          this.apartmentPlanManager.rooms = importedData.apartment;
          this.apartmentPlanManager.renderRooms();
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


async compareCurrentFrame() {
  console.log("▶️ Начало compareCurrentFrame()");
  
  if (!this.selfieData) {
    console.warn("❌ Нет сохранённого селфи!");
    return false;
  }
  
  if (!this.cameraSectionManager.videoElement || !this.cameraSectionManager.videoElement.srcObject) {
    console.warn("❌ Камера не активна!");
    return false;
  }
  
  // Настройка канвы для захвата текущего кадра
  this.tempCanvas.width = this.cameraSectionManager.videoElement.videoWidth || 640;
  this.tempCanvas.height = this.cameraSectionManager.videoElement.videoHeight || 480;
  this.tempCtx.drawImage(
    this.cameraSectionManager.videoElement,
    0,
    0,
    this.tempCanvas.width,
    this.tempCanvas.height
  );
  
  // Преобразуем изображение в ЧБ через утилиту
  const currentData = ImageUtils.convertToGrayscale(this.tempCanvas);
  this.lastMirrorPhoto = currentData;
  // Получаем коэффициенты сравнения через статические методы
  const matchPixel = ImageUtils.pixelWiseComparison(this.selfieData, currentData);
  const matchHistogram = ImageUtils.histogramComparison(this.selfieData, currentData);
  
  console.log(`🔎 Сравнение кадров: Pixel=${matchPixel.toFixed(2)}, Histogram=${matchHistogram.toFixed(2)}`);
  
  // Если удовлетворяет условию – возвращаем true, иначе false
  if (matchPixel > 0.6 && matchHistogram > 0.7) {
    alert("✅ Вы перед зеркалом!");
    return true;
  } else {
    alert("❌ Нет совпадения!");
    return false;
  }
}



}