import { LanguageManager } from './languageManager.js';
import { CameraManager } from './cameraManager.js';
import { ProfileManager } from './profileManager.js';
import { DatabaseManager } from './databaseManager.js';
import { EventManager } from './eventManager.js';
import { EventManager } from './visualEffectsManager.js';

export class App {
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
    this.languageManager = new LanguageManager('language-selector');
    this.cameraManager = new CameraManager('selfie-video');
    this.profileManager = new ProfileManager();
    this.databaseManager = new DatabaseManager();
    this.eventManager = new EventManager(this.databaseManager, this.languageManager);
    this.visualEffectsManager = new VisualEffectsManager();
    
    this.bindEvents();
    this.init();
  }
  
bindEvents() {
    // Валидация формы регистрации
    this.nameInput.addEventListener('input', () => this.validateRegistration());
    this.genderSelect.addEventListener('change', () => this.validateRegistration());

    this.nextStepBtn.addEventListener('click', () => this.goToSelfieScreen());
    this.captureBtn.addEventListener('click', () => this.captureSelfie());
    this.completeBtn.addEventListener('click', () => this.completeRegistration());
    this.resetBtn.addEventListener('click', () => this.profileManager.resetProfile());
    this.exportBtn.addEventListener('click', () => this.exportProfile());
    this.importBtn.addEventListener('click', () => this.importProfile());

    // 🔹 Переключение между камерой и дневником
    document.getElementById("toggle-camera").addEventListener("click", () => this.toggleCameraView());
    document.getElementById("toggle-diary").addEventListener("click", () => this.toggleCameraView());
}

  
async init() {
  await this.databaseManager.initDatabasePromise;
  if (this.profileManager.isProfileSaved()) {
    this.showMainScreen();
    this.eventManager.updateDiaryDisplay();
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
    console.log("📸 Попытка сделать снимок...");

    if (!this.cameraManager.videoElement || !this.cameraManager.videoElement.srcObject) {
        console.error("❌ Камера не активна!");
        alert("Ошибка: Камера не включена.");
        return;
    }

    const video = this.cameraManager.videoElement;

    // Проверяем, готово ли видео
    if (video.readyState < 2) {
        console.warn("⏳ Камера ещё не готова...");
        alert("Подождите, пока камера загрузится.");
        return;
    }

    try {
        // Создаём скрытый `<canvas>`, чтобы захватить кадр
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');

        // Проверяем, есть ли контекст рисования
        if (!ctx) {
            throw new Error("Не удалось получить контекст рисования.");
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const selfieData = canvas.toDataURL("image/png");

        // Проверяем, получили ли данные изображения
        if (!selfieData || selfieData.length < 100) {
            throw new Error("Ошибка обработки изображения.");
        }

        this.selfiePreview.src = selfieData;
        this.selfiePreview.style.display = 'block';
        this.completeBtn.disabled = false;

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
    this.cameraManager.stop();
    this.showMainScreen();

    // Звонок через 5 секунд после завершения регистрации
    setTimeout(() => this.startPhoneCall(), 5000);
  }
  
startPhoneCall() {
    const ringtone = new Audio('audio/phone_ringtone.mp3');
    ringtone.play();

    const answerCallBtn = document.createElement("button");
    const ignoreCallBtn = document.createElement("button");

    answerCallBtn.textContent = this.languageManager.locales[this.languageManager.getLanguage()]["answer"];
    ignoreCallBtn.textContent = this.languageManager.locales[this.languageManager.getLanguage()]["ignore"];

    // При ответе на звонок
    answerCallBtn.addEventListener("click", async () => {
        ringtone.pause();
        answerCallBtn.remove();
        ignoreCallBtn.remove();

        this.visualEffectsManager.triggerDarkScreenEffect();  // 🔹 Затемнение экрана
        this.visualEffectsManager.triggerStaticNoise(true);  // 🔹 Включаем шум

        setTimeout(() => {
            if (!this.eventManager.isEventLogged("mirror_quest")) {
                this.eventManager.addDiaryEntry("mirror_quest");
            }
            this.visualEffectsManager.showMirrorTask(
                this.languageManager.locales[this.languageManager.getLanguage()]["go_to_mirror"]
            );  // 🔹 Добавляем задание

            this.visualEffectsManager.showCameraButton(this);  // 🔹 Показываем кнопку камеры
        }, 3000);
    });

    // Игнорирование звонка
    ignoreCallBtn.addEventListener("click", async () => {
        ringtone.pause();
        if (!this.eventManager.isEventLogged("ignored_call")) {
            await this.eventManager.addDiaryEntry("ignored_call");
        }
        answerCallBtn.remove();
        ignoreCallBtn.remove();
        this.visualEffectsManager.showCameraButton(this);  // 🔹 Показываем кнопку камеры
    });

    this.mainScreen.appendChild(answerCallBtn);
    this.mainScreen.appendChild(ignoreCallBtn);
}



// 🔹 Переключение между камерой и дневником
toggleCameraView() {
    const diary = document.getElementById("diary");
    const cameraContainer = document.getElementById("camera-container");
    const videoElement = document.getElementById("camera-view");
    const toggleCameraBtn = document.getElementById("toggle-camera");
    const toggleDiaryBtn = document.getElementById("toggle-diary");

    // 🔹 Кнопки, которые должны скрываться в режиме камеры
    const buttonsToHide = [
        document.getElementById("reset-data"),
        document.getElementById("export-profile"),
        document.getElementById("import-profile-container")
    ];

    if (!videoElement) {
        console.error("🚨 Ошибка: элемент video не найден!");
        return;
    }

    const isCameraActive = cameraContainer.style.display !== "none";

    if (!isCameraActive) {
        console.log("📸 Переключаемся на камеру...");

        diary.style.display = "none"; // Скрываем дневник
        cameraContainer.style.display = "flex"; // Показываем камеру

        // Переключаем кнопки
        toggleCameraBtn.style.display = "none"; 
        toggleDiaryBtn.style.display = "inline-block"; 

        // 🔹 Скрываем ненужные кнопки
        buttonsToHide.forEach(btn => { if (btn) btn.style.display = "none"; });

        this.cameraManager.videoElement = videoElement;
        this.cameraManager.start();

        // 🔹 Если взято задание "mirror_quest", включаем помехи
        if (this.eventManager.isEventLogged("mirror_quest")) {
            console.log("🔺 Помехи включены!");
            this.visualEffectsManager.triggerStaticNoise(true);
        }

    } else {
        console.log("📓 Возвращаемся в дневник...");

        diary.style.display = "block"; // Показываем дневник
        cameraContainer.style.display = "none"; // Скрываем камеру

        // Переключаем кнопки
        toggleCameraBtn.style.display = "inline-block"; 
        toggleDiaryBtn.style.display = "none"; 

        // 🔹 Показываем скрытые кнопки обратно
        buttonsToHide.forEach(btn => { if (btn) btn.style.display = "block"; });

        this.cameraManager.stop();

        // 🔹 Отключаем помехи
        this.visualEffectsManager.triggerStaticNoise(false);
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
  const diaryEntries = this.databaseManager.getDiaryEntries();
  const exportData = {
    profile: JSON.parse(profileStr),
    diary: diaryEntries
  };
  const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
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
      // Проверяем основные поля профиля
      if (!importedData.profile || !importedData.profile.name || !importedData.profile.gender ||
          !importedData.profile.selfie || !importedData.profile.language) {
        alert("Invalid profile file. Required profile fields are missing.");
        return;
      }
      // Сохраняем профиль
      this.profileManager.saveProfile(importedData.profile);
      // Если в файле есть дневниковые записи, импортируем их
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
      alert("Profile imported successfully. Reloading page.");
      window.location.reload();
    } catch (err) {
      alert("Error parsing the profile file.");
    }
  };
  reader.readAsText(file);
}
}