import { ImageUtils } from './utils/imageUtils.js';
import { VisualEffectsManager } from './utils/visualEffectsManager.js';
import { DatabaseManager } from './databaseManager.js';
import { LanguageManager } from './languageManager.js';
import { cameraSectionManager } from './cameraSectionManager.js';
import { ProfileManager } from './profileManager.js';
import { ApartmentPlanManager } from './apartmentPlanManager.js';
import { GhostManager } from './ghostManager.js';
import { EventManager } from './eventManager.js';
import { GameEventManager } from './gameEventManager.js';
import { QuestManager } from './questManager.js';
import { ShowProfileModal } from './showProfileModal.js';

export class App {
  constructor() {
    window.switchScreen = this.switchScreen.bind(this);

    this.isCameraOpen = false;

    // Получаем элементы
    this.registrationScreen = document.getElementById('registration-screen');
    this.selfieScreen       = document.getElementById('selfie-screen');
    this.mainScreen         = document.getElementById('main-screen');
    this.nameInput          = document.getElementById('player-name');
    this.genderSelect       = document.getElementById('player-gender');
    this.nextStepBtn        = document.getElementById('next-step-btn');
    this.captureBtn         = document.getElementById('capture-btn');
    this.selfiePreview      = document.getElementById('selfie-preview');
    this.completeBtn        = document.getElementById('complete-registration');
    this.profileNameElem    = document.getElementById('profile-name');
    this.profilePhotoElem   = document.getElementById('profile-photo');
    this.resetBtn           = document.getElementById('reset-data');
    this.exportBtn          = document.getElementById('export-profile-btn');
    this.importFileInput    = document.getElementById('import-file');
    this.importBtn          = document.getElementById('import-profile-btn');
    this.postBtn            = document.getElementById('post-btn');

    this.controlsPanel = document.getElementById("controls-panel");
    this.visualEffectsManager = new VisualEffectsManager(this, this.controlsPanel);

    this.languageManager      = new LanguageManager('language-selector');
    this.cameraSectionManager = new cameraSectionManager();
    this.profileManager       = new ProfileManager();
    this.databaseManager      = new DatabaseManager();

    this.ghostManager = new GhostManager(null, this.profileManager, this);
    this.eventManager = new EventManager(
      this.databaseManager,
      this.languageManager,
      this.ghostManager,
      this.visualEffectsManager
    );
    this.ghostManager.eventManager = this.eventManager;

    this.questManager     = new QuestManager(this.eventManager, this);
    this.gameEventManager = new GameEventManager(this.eventManager, this, this.languageManager);
    this.showProfileModal = new ShowProfileModal(this);

    this.tempCanvas = document.createElement("canvas");
    this.tempCtx    = this.tempCanvas.getContext("2d");
    this.selfieData = null;

    this.bindEvents();
    this.init();
  }

  loadAppState() {
    const savedGhostId = localStorage.getItem('currentGhostId');
    if (savedGhostId) {
      this.ghostManager.setCurrentGhost(parseInt(savedGhostId));
    } else {
      this.ghostManager.setCurrentGhost(1);
    }
  }

  async init() {
    this.loadAppState();
    await this.databaseManager.initDatabasePromise;

    const cameraBtn = document.getElementById("toggle-camera");
    cameraBtn.style.display = "inline-block";

    this.eventManager.updateDiaryDisplay();

    if (this.profileManager.isProfileSaved()) {
      const profile = this.profileManager.getProfile();
      console.log("Profile found:", profile);
      this.showMainScreen();

      if (localStorage.getItem("registrationCompleted") === "true") {
        setTimeout(() => {
          this.gameEventManager.activateEvent("welcome");
        }, 5000);
      }
      if (localStorage.getItem("mirrorQuestActive") === "true") {
        cameraBtn.classList.add("glowing");
      } else {
        cameraBtn.classList.remove("glowing");
      }
    } else {
      console.log("Profile not found, showing registration screen.");
      this.showRegistrationScreen();
    }
  }

  switchScreen(screenId, buttonsGroupId) {
    document.querySelectorAll('section').forEach(section => {
      section.style.display = 'none';
    });

    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.style.display = 'block';
    }

    document.querySelectorAll('#controls-panel > .buttons').forEach(group => {
      group.style.display = 'none';
      group.style.pointerEvents = 'none';
    });

    if (buttonsGroupId) {
      const targetGroup = document.getElementById(buttonsGroupId);
      if (targetGroup) {
        targetGroup.style.display = 'flex';
        targetGroup.style.pointerEvents = 'auto';
      }
    }
  }

  bindEvents() {
    this.nameInput.addEventListener('input', () => {
      console.log("Name input changed:", this.nameInput.value);
      this.validateRegistration();
    });
    this.genderSelect.addEventListener('change', () => {
      console.log("Gender select changed:", this.genderSelect.value);
      this.validateRegistration();
    });

    if (this.nextStepBtn) {
      this.nextStepBtn.addEventListener('click', () => {
        console.log("Next button clicked");
        this.goToApartmentPlanScreen();
      });
    }

    this.captureBtn.addEventListener('click', () => this.captureSelfie());
    this.completeBtn.addEventListener('click', () => this.completeRegistration());
    this.resetBtn.addEventListener('click', () => this.profileManager.resetProfile());
    this.exportBtn.addEventListener('click', () => this.exportProfile());
    this.importBtn.addEventListener('click', () => this.importProfile());
    this.profilePhotoElem.addEventListener("click", () => this.showProfileModal.show());

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

    // Здесь вместо handlePostButtonClick — мы дергаем QuestManager
    // (если хотим логику «запустить квест» вне App)
    if (this.postBtn) {
      this.postBtn.addEventListener('click', () => {
        // Вызываем у QuestManager метод, который решит,
        // активировать квест, проверять ready и т.п.
        this.questManager.handlePostButtonClick();
      });
    }

    const shootBtn = document.getElementById("btn_shoot");
    if (shootBtn) {
      shootBtn.addEventListener("click", () => {
        this.questManager.handleShootMirrorQuest();
      });
    }
  }

  validateRegistration() {
    const isValid = (
      this.nameInput.value.trim() !== "" &&
      this.genderSelect.value !== ""
    );
    console.log("validateRegistration:", isValid);
    this.nextStepBtn.disabled = !isValid;
  }

  goToApartmentPlanScreen() {
    const regData = {
      name: this.nameInput.value.trim(),
      gender: this.genderSelect.value,
      language: document.getElementById('language-selector').value
    };
    localStorage.setItem('regData', JSON.stringify(regData));

    window.switchScreen('apartment-plan-screen', 'apartment-plan-buttons');
    if (!this.apartmentPlanManager) {
      this.apartmentPlanManager = new ApartmentPlanManager('apartment-plan-container', this.databaseManager);
    }
  }

  goToSelfieScreen() {
    window.switchScreen('selfie-screen', 'selfie-buttons');
    const globalCamera = document.getElementById('global-camera');
    globalCamera.style.display = 'block';

    this.cameraSectionManager.attachTo('global-camera', {
      width: "100%",
      height: "100%",
      filter: "grayscale(100%)"
    });
    this.cameraSectionManager.startCamera();
    this.completeBtn.disabled = true;
  }

  captureSelfie() {
    console.log("📸 Попытка сделать снимок...");
    const video = this.cameraSectionManager.videoElement;
    if (!video || !video.srcObject) {
      console.error("❌ Камера не активна!");
      alert("Ошибка: Камера не включена.");
      return;
    }
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
        throw new Error("Не удалось получить 2D-контекст рисования.");
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const grayscaleData = ImageUtils.convertToGrayscale(canvas);
      const thumbnail = document.getElementById('selfie-thumbnail');
      thumbnail.src = grayscaleData;
      thumbnail.style.display = 'block';

      this.completeBtn.disabled = false;
      this.selfieData = grayscaleData;
      console.log("✅ Снимок успешно сделан!");
    } catch (error) {
      console.error("❌ Ошибка при создании снимка:", error);
      alert("Ошибка при создании снимка! Попробуйте снова.");
    }
  }

  completeRegistration() {
    const selfieSrc = (this.selfiePreview?.src || document.getElementById('selfie-thumbnail').src);
    if (!selfieSrc || selfieSrc === "") {
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
      selfie: selfieSrc
    };
    this.profileManager.saveProfile(profile);
    localStorage.setItem("registrationCompleted", "true");

    this.cameraSectionManager.stopCamera();
    document.getElementById('global-camera').style.display = 'none';

    this.showMainScreen();
    setTimeout(() => {
      this.gameEventManager.activateEvent("welcome");
    }, 5000);
  }

  async toggleCameraView() {
    const diary = document.getElementById("diary");
    const globalCamera = document.getElementById("global-camera");
    const toggleCameraBtn = document.getElementById("toggle-camera");
    const toggleDiaryBtn  = document.getElementById("toggle-diary");
    const shootBtn        = document.getElementById("btn_shoot");   // Добавили для наглядности
    const buttonsToHide = [
      document.getElementById("reset-data"),
      document.getElementById("export-profile-btn"),
      document.getElementById("import-profile-container")
    ];

    if (!this.isCameraOpen) {
      console.log("📸 Переключаемся на камеру...");
      diary.style.display = "none";
      globalCamera.style.display = "flex";

      if (toggleCameraBtn) toggleCameraBtn.style.display = "none";
      if (toggleDiaryBtn)  toggleDiaryBtn.style.display = "inline-block";
      buttonsToHide.forEach(btn => { if (btn) btn.style.display = "none"; });

      // Показываем «Заснять», но, например, сразу делаем неактивной
      if (shootBtn) {
        shootBtn.style.display = "inline-block";
        shootBtn.disabled = true;
      }

      this.cameraSectionManager.attachTo('global-camera', {
        width: "100%",
        height: "100%"
      });
      await this.cameraSectionManager.startCamera();

      await new Promise(resolve => {
        const vid = this.cameraSectionManager.videoElement;
        if (vid.readyState >= 2) {
          resolve();
        } else {
          vid.onloadedmetadata = () => resolve();
        }
      });
      console.log("Видео готово:", 
        this.cameraSectionManager.videoElement.videoWidth,
        this.cameraSectionManager.videoElement.videoHeight
      );

      // Если mirrorQuestActive, передаём управление QuestManager
      if (localStorage.getItem("mirrorQuestActive") === "true") {
        console.log("🔁 mirrorQuestActive=true, просим QuestManager запустить проверку...");
        // Пример:
        // this.questManager.startMirrorQuestCheckLoop();
      }

      this.isCameraOpen = true;

    } else {
      console.log("📓 Возвращаемся в блог...");
      diary.style.display = "block";
      globalCamera.style.display = "none";

      if (toggleCameraBtn) toggleCameraBtn.style.display = "inline-block";
      if (toggleDiaryBtn)  toggleDiaryBtn.style.display = "none";
      buttonsToHide.forEach(btn => { if (btn) btn.style.display = "block"; });

      // Скрываем «Заснять»
      if (shootBtn) {
        shootBtn.style.display = "none";
      }

      this.cameraSectionManager.stopCamera();
      this.isCameraOpen = false;

      // Сообщаем QuestManager, что камера закрыта (если надо)
      // this.questManager.stopMirrorQuestCheckLoop();
    }
  }

  showMainScreen() {
    window.switchScreen('main-screen', 'main-buttons');

    const toggleCameraBtn = document.getElementById("toggle-camera");
    const toggleDiaryBtn  = document.getElementById("toggle-diary");
    if (toggleCameraBtn) toggleCameraBtn.style.display = "inline-block";
    if (toggleDiaryBtn)  toggleDiaryBtn.style.display = "none";

    const profile = this.profileManager.getProfile();
    if (profile) {
      this.profileNameElem.textContent = profile.name;
      this.profilePhotoElem.src = profile.selfie;
      this.profilePhotoElem.style.display = 'block';
      this.selfieData = profile.selfie;
    }
    // Кнопку «Запостить» обновляет теперь QuestManager или 
    // можно оставить метод, чтобы вызывать его: this.questManager.updatePostButtonState()
  }

  showRegistrationScreen() {
    window.switchScreen('registration-screen', 'registration-buttons');
  }

  exportProfile() {
    this.profileManager.exportProfileData(this.databaseManager, this.apartmentPlanManager);
  }

  importProfile() {
    if (this.importFileInput.files.length === 0) {
      alert("Please select a profile file to import.");
      return;
    }
    const file = this.importFileInput.files[0];
    this.profileManager.importProfileData(file, this.databaseManager, this.apartmentPlanManager);
  }
}