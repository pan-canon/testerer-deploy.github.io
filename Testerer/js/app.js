import { LanguageManager } from './languageManager.js';
import { CameraManager } from './cameraManager.js';
import { ProfileManager } from './profileManager.js';
import { DatabaseManager } from './databaseManager.js';
import { EventManager } from './eventManager.js';
import { QuestManager } from './questManager.js';

export class App {
  constructor() {
    // DOM-элементы
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
    this.cameraManager = new CameraManager('selfie-video');
    this.profileManager = new ProfileManager();
    this.databaseManager = new DatabaseManager();
    this.eventManager = new EventManager(this.databaseManager, this.languageManager);

    // Класс "задания" (mirror quest)
    this.questManager = new QuestManager(this.eventManager, this);

    // Технические поля для пиксельного сравнения
    this.selfieData = null; // где хранить grayscale селфи
    this.tempCanvas = document.createElement("canvas");
    this.tempCtx = this.tempCanvas.getContext("2d");

    this.bindEvents();
    this.init();
  }

  bindEvents() {
    this.nameInput.addEventListener('input', () => this.validateRegistration());
    this.genderSelect.addEventListener('change', () => this.validateRegistration());

    this.nextStepBtn.addEventListener('click', () => this.goToSelfieScreen());
    this.captureBtn.addEventListener('click', () => this.captureSelfie());
    this.completeBtn.addEventListener('click', () => this.completeRegistration());

    this.resetBtn.addEventListener('click', () => this.profileManager.resetProfile());
    this.exportBtn.addEventListener('click', () => this.exportProfile());
    this.importBtn.addEventListener('click', () => this.importProfile());

    document.getElementById("toggle-camera").addEventListener("click", () => this.toggleCameraView());
    document.getElementById("toggle-diary").addEventListener("click", () => this.toggleCameraView());
  }

  async init() {
    await this.databaseManager.initDatabasePromise;
    console.log("🔄 Приложение инициализировано.");

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
    if (video.readyState < 2) {
      console.warn("⏳ Камера ещё не готова...");
      alert("Подождите, пока камера загрузится.");
      return;
    }
    try {
      this.tempCanvas.width = video.videoWidth || 640;
      this.tempCanvas.height = video.videoHeight || 480;
      this.tempCtx.drawImage(video, 0, 0, this.tempCanvas.width, this.tempCanvas.height);

      // Делаем grayscale
      const grayscaleData = this.convertToGrayscale(this.tempCanvas);
      if (!grayscaleData) {
        throw new Error("Ошибка при формировании grayscale.");
      }
      this.selfiePreview.src = grayscaleData;
      this.selfiePreview.style.display = 'block';
      this.completeBtn.disabled = false;

      // Сохраняем в поле
      this.selfieData = grayscaleData;

      console.log("✅ Снимок успешно сделан (grayscale)!");
    } catch (error) {
      console.error("❌ Ошибка при создании снимка:", error);
      alert("Ошибка при создании снимка! Попробуйте снова.");
    }
  }

  completeRegistration() {
    if (!this.selfiePreview.src) {
      alert("Сначала сделайте селфи!");
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

    // Запускаем "звонок" через 5 секунд
    setTimeout(() => this.startPhoneCall(), 5000);
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

  //===== Звонок, запуск квеста =====
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
        // Активируем mirror_quest через QuestManager
        await this.questManager.activateMirrorQuest();
        this.toggleCameraView();
      }, 5000);
    });

    // Игнор
    ignoreCallBtn.addEventListener("click", async () => {
      ringtone.pause();
      if (!this.eventManager.isEventLogged("ignored_call")) {
        await this.eventManager.addDiaryEntry("ignored_call");
      }
      answerCallBtn.remove();
      ignoreCallBtn.remove();
    });

    this.mainScreen.appendChild(answerCallBtn);
    this.mainScreen.appendChild(ignoreCallBtn);
  }

  triggerMirrorEffect() {
    document.body.style.transition = "background 1s";
    document.body.style.background = "black";
    setTimeout(() => {
      document.body.style.background = "";
    }, 1000);

    const staticNoise = new Audio('audio/static_noise.mp3');
    staticNoise.play();
    setTimeout(() => staticNoise.pause(), 3000);
  }

  //===== Переключение камеры/дневника =====
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

      // Проверяем квест (mirror_quest) через QuestManager
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

  //===== Методы сравнения пикселей (грейскейл и т.д.) =====

  /**
   * Конвертация canvas в grayscale -> dataURL
   */
  convertToGrayscale(canvas) {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
      let avg = (pixels[i] + pixels[i+1] + pixels[i+2]) / 3;
      pixels[i] = avg;
      pixels[i+1] = avg;
      pixels[i+2] = avg;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  }

  pixelWiseComparison(img1, img2) {
    let image1 = atob(img1.split(',')[1]);
    let image2 = atob(img2.split(',')[1]);

    let matchCount = 0;
    const length = Math.min(image1.length, image2.length);
    for (let i = 0; i < length; i++) {
      if (Math.abs(image1.charCodeAt(i) - image2.charCodeAt(i)) < 100) {
        matchCount++;
      }
    }
    return matchCount / length;
  }

  histogramComparison(img1, img2) {
    let hist1 = this.createHistogram(img1);
    let hist2 = this.createHistogram(img2);
    let diff = 0;
    for (let i = 0; i < hist1.length; i++) {
      diff += Math.abs(hist1[i] - hist2[i]);
    }
    const total1 = hist1.reduce((a, b) => a + b, 0);
    return 1 - (diff / (total1 * 1.2));
  }

  createHistogram(img) {
    let hist = new Array(256).fill(0);
    let imgData = atob(img.split(',')[1]);
    for (let i = 0; i < imgData.length; i++) {
      hist[imgData.charCodeAt(i)]++;
    }
    return hist;
  }

  /**
   * Сравниваем текущее изображение (кадр с камеры) с сохранённым selfieData
   * Возвращаем true/false (успех/неуспех)
   */
  async compareCurrentFrame() {
    if (!this.selfieData) {
      console.warn("❌ Нет сохранённого селфи!");
      return false;
    }
    if (!this.cameraManager.videoElement || !this.cameraManager.videoElement.srcObject) {
      console.warn("❌ Камера не активна!");
      return false;
    }

    // Берём текущий кадр
    const video = this.cameraManager.videoElement;
    this.tempCanvas.width = video.videoWidth || 640;
    this.tempCanvas.height = video.videoHeight || 480;
    this.tempCtx.drawImage(video, 0, 0, this.tempCanvas.width, this.tempCanvas.height);

    // Грейскейл текущего кадра
    const currentData = this.convertToGrayscale(this.tempCanvas);

    let matchPixel = this.pixelWiseComparison(this.selfieData, currentData);
    let matchHistogram = this.histogramComparison(this.selfieData, currentData);

    console.log(`🔎 Сравнение кадров: Pixel=${matchPixel.toFixed(2)}, Hist=${matchHistogram.toFixed(2)}`);

    // Локализованный текст "Что это было?"
    const currentLang = this.languageManager.getLanguage();
    let whatWasItText = this.languageManager.locales[currentLang]["what_was_it"] || "What was it?";

    if (matchPixel > 0.6 && matchHistogram > 0.7) {
      alert("✅ Вы перед зеркалом!");

      // Добавляем запись (что это было + фото) в дневник
      // (ФОТО = currentData)
      await this.eventManager.addDiaryEntry(`${whatWasItText}\n[photo attached]\n${currentData}`);

      // Помечаем задание mirror_done
      if (!this.eventManager.isEventLogged("mirror_done")) {
        await this.eventManager.addDiaryEntry("mirror_done");
      }

      return true;
    } else {
      alert("❌ Нет совпадения!");
      return false;
    }
  }

  //===== Экспорт/импорт =====
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
        if (!importedData.profile || !importedData.profile.name ||
            !importedData.profile.gender || !importedData.profile.selfie ||
            !importedData.profile.language) {
          alert("Invalid profile file. Required profile fields are missing.");
          return;
        }
        this.profileManager.saveProfile(importedData.profile);
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
