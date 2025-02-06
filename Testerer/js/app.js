import { LanguageManager } from './languageManager.js';
import { CameraManager } from './cameraManager.js';
import { ProfileManager } from './profileManager.js';
import { DatabaseManager } from './databaseManager.js';
import { ApartmentPlanManager } from './ApartmentPlanManager.js';
import { EventManager } from './eventManager.js';
import { QuestManager } from './questManager.js';

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
    this.questManager = new QuestManager(this.eventManager, this);
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
this.questManager = new QuestManager(this.eventManager, this);
this.apartmentManager = new ApartmentPlanManager('apartment-canvas', this.databaseManager);
// Технические поля для обработки изображений
this.tempCanvas = document.createElement("canvas");
this.tempCtx = this.tempCanvas.getContext("2d");

    this.bindEvents();
document.getElementById('next-floor-btn').addEventListener('click', () => {
    this.apartmentManager.nextFloor();
});

document.getElementById('prev-floor-btn').addEventListener('click', () => {
    this.apartmentManager.prevFloor();
});
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
  // Сначала ждём инициализации БД
  await this.databaseManager.initDatabasePromise;

  // Прямой вызов метода databaseManager, чтобы получить записи
  const entries = this.databaseManager.getDiaryEntries();
  console.log("Проверяем дневник после инициализации:", entries);

  // Если массив не пустой, значит в БД уже есть хотя бы одна запись
  if (entries.length > 0) {
    // Показываем кнопку
    const cameraBtn = document.getElementById("toggle-camera");
    cameraBtn.style.display = "inline-block";
  }

  // Далее — логика профиля, как раньше
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
    this.completeBtn.disabled = true;
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
const grayscaleData = this.convertToGrayscale(canvas);
this.selfiePreview.src = grayscaleData;
this.selfiePreview.style.display = 'block';
this.completeBtn.disabled = false;

// Сохраняем полученное селфи для сравнения
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
    this.cameraManager.stop();
// Переход к созданию плана квартиры
this.selfieScreen.style.display = 'none';
document.getElementById('apartment-screen').style.display = 'block';
  }

  showApartmentScreen() {
      this.registrationScreen.style.display = 'none';
      this.selfieScreen.style.display = 'none';
      this.mainScreen.style.display = 'none';
      document.getElementById('apartment-screen').style.display = 'block';
  }

async endCall(ringtone, answerCallBtn, ignoreCallBtn, eventKey) {
  // Останавливаем звук звонка
  ringtone.pause();

  // Убираем кнопки ответа/игнора
  answerCallBtn.remove();
  ignoreCallBtn.remove();

  // Если записи в дневнике ещё нет — создаём
  if (!this.eventManager.isEventLogged(eventKey)) {
    await this.eventManager.addDiaryEntry(eventKey);
  }

  // Делаем кнопку камеры видимой сразу
  const cameraBtn = document.getElementById("toggle-camera");
  cameraBtn.style.display = "inline-block";
}

startPhoneCall() {
    const ringtone = new Audio('audio/phone_ringtone.mp3');
    ringtone.play();

    const answerCallBtn = document.createElement("button");
    const ignoreCallBtn = document.createElement("button");

    answerCallBtn.textContent = this.languageManager.locales[this.languageManager.getLanguage()]["answer"];
    ignoreCallBtn.textContent = this.languageManager.locales[this.languageManager.getLanguage()]["ignore"];

    // При ответе
answerCallBtn.addEventListener("click", async () => {
    ringtone.pause();
    answerCallBtn.remove();
    ignoreCallBtn.remove();

    this.triggerMirrorEffect();

setTimeout(async () => {
  await this.eventManager.addDiaryEntry("mirror_quest");
  this.toggleCameraView();
}, 5000);
});


    // При игнорировании
    ignoreCallBtn.addEventListener("click", async () => {
        // Просто сразу считаем, что событие "ignored_call"
        await this.endCall(
          ringtone,
          answerCallBtn,
          ignoreCallBtn,
          "ignored_call"
        );
    });

    this.mainScreen.appendChild(answerCallBtn);
    this.mainScreen.appendChild(ignoreCallBtn);
}

// 🔹 Эффект затемнения + помехи
triggerMirrorEffect() {
    document.body.style.transition = "background 1s";
    document.body.style.background = "black";
    setTimeout(() => {
        document.body.style.background = "";
    }, 1000);

    const staticNoise = new Audio('audio/phone_ringtone.mp3');
    staticNoise.play();
    setTimeout(() => staticNoise.pause(), 3000);
}

// 🔹 Новое задание "Подойти к зеркалу"
showMirrorTask() {
    const mirrorTask = document.createElement("p");
    mirrorTask.textContent = this.languageManager.locales[this.languageManager.getLanguage()]["go_to_mirror"];
    mirrorTask.id = "mirror-task";
    document.getElementById("diary").appendChild(mirrorTask);
}



// 🔹 Переключение между камерой и дневником
async toggleCameraView() {
    const diary = document.getElementById("diary");
    const cameraContainer = document.getElementById("camera-container");
    const videoElement = document.getElementById("camera-view");
    const toggleCameraBtn = document.getElementById("toggle-camera");
    const toggleDiaryBtn = document.getElementById("toggle-diary");
    const buttonsToHide = [
        document.getElementById("reset-data"),
        document.getElementById("export-profile"),
        document.getElementById("import-profile-container")
    ];

    if (!videoElement) {
        console.error("🚨 Ошибка: элемент video не найден!");
        return;
    }

    if (cameraContainer.style.display === "none") {
        console.log("📸 Переключаемся на камеру...");
        diary.style.display = "none";
        cameraContainer.style.display = "flex";
        toggleCameraBtn.style.display = "none";
        toggleDiaryBtn.style.display = "inline-block";
        buttonsToHide.forEach(btn => { if (btn) btn.style.display = "none"; });

        this.cameraManager.videoElement = videoElement;
        await this.cameraManager.start();

        // Дождаться, пока видео загрузит метаданные
        await new Promise(resolve => {
          if (videoElement.readyState >= 2) {
            resolve();
          } else {
            videoElement.onloadedmetadata = () => resolve();
          }
        });
        console.log("Видео готово:", videoElement.videoWidth, videoElement.videoHeight);

        // Запускаем проверку квеста
        this.questManager.checkMirrorQuestOnCamera();
    } else {
        console.log("📓 Возвращаемся в блог...");
        diary.style.display = "block";
        cameraContainer.style.display = "none";
        toggleCameraBtn.style.display = "inline-block";
        toggleDiaryBtn.style.display = "none";
        buttonsToHide.forEach(btn => { if (btn) btn.style.display = "block"; });
        this.cameraManager.stop();
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

async compareCurrentFrame() {
  console.log("▶️ Начало compareCurrentFrame()");
  if (!this.selfieData) {
    console.warn("❌ Нет сохранённого селфи!");
    return false;
  }
  if (!this.cameraManager.videoElement || !this.cameraManager.videoElement.srcObject) {
    console.warn("❌ Камера не активна!");
    return false;
  }
  
  // Настройка временной канвы для захвата текущего кадра
  this.tempCanvas.width = this.cameraManager.videoElement.videoWidth || 640;
  this.tempCanvas.height = this.cameraManager.videoElement.videoHeight || 480;
  this.tempCtx.drawImage(
    this.cameraManager.videoElement,
    0,
    0,
    this.tempCanvas.width,
    this.tempCanvas.height
  );
  
  // Получаем обработанное изображение текущего кадра (градации серого)
  const currentData = this.convertToGrayscale(this.tempCanvas);
  
  // Выполняем сравнения
  let matchPixel = this.pixelWiseComparison(this.selfieData, currentData);
  let matchHistogram = this.histogramComparison(this.selfieData, currentData);
  
  console.log(
    `🔎 Сравнение кадров: Pixel=${matchPixel.toFixed(2)}, Histogram=${matchHistogram.toFixed(2)}`
  );
  
  // Получаем локализованный текст для ключа "what_was_it"
  const currentLang = this.languageManager.getLanguage();
  const whatWasItText =
    this.languageManager.locales[currentLang]["what_was_it"] || "What was it?";
  
  if (matchPixel > 0.6 && matchHistogram > 0.7) {
    alert("✅ Вы перед зеркалом!");
    // Записываем в дневник запись, включающую ключ и изображение
    await this.eventManager.addDiaryEntry(whatWasItText, currentData);
    return true;
  } else {
    alert("❌ Нет совпадения!");
    return false;
  }
}






// ДОБАВЛЯЕМ ПОСЛЕ captureSelfie()

/**
 * Конвертация canvas в градации серого, возвращает dataURL
 */
convertToGrayscale(canvas) {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Проходим по каждому пикселю (RGBA), усредняем
    for (let i = 0; i < pixels.length; i += 4) {
        let avg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        pixels[i] = avg;
        pixels[i + 1] = avg;
        pixels[i + 2] = avg;
    }
    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL("image/png");
}

/**
 * Пиксельная корреляция (сравниваем бинарные байты двух base64-картинок)
 */
pixelWiseComparison(img1, img2) {
    let image1 = atob(img1.split(',')[1]);
    let image2 = atob(img2.split(',')[1]);

    let matchCount = 0;
    // Перебираем все байты
    for (let i = 0; i < image1.length && i < image2.length; i++) {
        if (Math.abs(image1.charCodeAt(i) - image2.charCodeAt(i)) < 100) {
            matchCount++;
        }
    }
    return matchCount / Math.min(image1.length, image2.length);
}

/**
 * Гистограммная корреляция (сравниваем распределение яркостей)
 */
histogramComparison(img1, img2) {
    let hist1 = this.createHistogram(img1);
    let hist2 = this.createHistogram(img2);

    let diff = 0;
    for (let i = 0; i < hist1.length; i++) {
        diff += Math.abs(hist1[i] - hist2[i]);
    }

    // Числитель: сумма отклонений, знаменатель: суммарное число пикселей * некий коэффициент
    let totalPixels1 = hist1.reduce((a, b) => a + b, 0);
    return 1 - (diff / (totalPixels1 * 1.2));
}

/**
 * Создаём гистограмму (256 уровней) из base64
 */
createHistogram(img) {
    let hist = new Array(256).fill(0);
    let imgData = atob(img.split(',')[1]);

    for (let i = 0; i < imgData.length; i++) {
        hist[imgData.charCodeAt(i)]++;
    }
    return hist;
}



}