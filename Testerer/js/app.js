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
    // Привязываем метод switchScreen к глобальному объекту (window) для вызовов из других модулей.
    window.switchScreen = this.switchScreen.bind(this);

    // Флаг, показывающий, открыт ли режим камеры.
    this.isCameraOpen = false;

    // Получаем DOM-элементы различных экранов/панелей.
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

    // Панель управления (для потенциальной блокировки).
    this.controlsPanel = document.getElementById("controls-panel");

    // Создаем экземпляр визуальных эффектов (общий).
    this.visualEffectsManager = new VisualEffectsManager(this, this.controlsPanel);

    // Инициализируем менеджеры приложения.
    this.languageManager      = new LanguageManager('language-selector');
    this.cameraSectionManager = new cameraSectionManager();
    this.profileManager       = new ProfileManager();
    this.databaseManager      = new DatabaseManager();

    // Создаём ghostManager без eventManager, затем eventManager с ghostManager.
    this.ghostManager = new GhostManager(null, this.profileManager, this);
    this.eventManager = new EventManager(
      this.databaseManager,
      this.languageManager,
      this.ghostManager,
      this.visualEffectsManager
    );
    // Ссылку на eventManager возвращаем в ghostManager.
    this.ghostManager.eventManager = this.eventManager;

    // Инициализируем QuestManager и другие сервисы.
    this.questManager     = new QuestManager(this.eventManager, this);
    this.gameEventManager = new GameEventManager(this.eventManager, this, this.languageManager);
    this.showProfileModal = new ShowProfileModal(this);

    // Канва для обработки изображений (сравнение селфи).
    this.tempCanvas = document.createElement("canvas");
    this.tempCtx    = this.tempCanvas.getContext("2d");

    // Храним пользовательское селфи (заполняется при регистрации).
    this.selfieData = null;

    // Привязываем обработчики событий, запускаем init().
    this.bindEvents();
    this.init();
  }

  /**
   * loadAppState – загружает общее состояние приложения из localStorage (например, currentGhostId).
   */
  loadAppState() {
    const savedGhostId = localStorage.getItem('currentGhostId');
    if (savedGhostId) {
      this.ghostManager.setCurrentGhost(parseInt(savedGhostId));
    } else {
      this.ghostManager.setCurrentGhost(1);
    }
  }

  /**
   * init – инициализирует приложение:
   *   1) Загружает состояние
   *   2) Ждет инициализацию базы данных
   *   3) Обновляет дневник (updateDiaryDisplay)
   *   4) Показывает нужный экран (регистрация / основной блог)
   */
  async init() {
    this.loadAppState();
    await this.databaseManager.initDatabasePromise;

    const cameraBtn = document.getElementById("toggle-camera");
    cameraBtn.style.display = "inline-block";

    // Обновляем дневник
    this.eventManager.updateDiaryDisplay();

    // Если профиль найден, переходим на основной экран, иначе — на регистрацию
    if (this.profileManager.isProfileSaved()) {
      const profile = this.profileManager.getProfile();
      console.log("Profile found:", profile);
      this.showMainScreen();

      // Если регистрация была завершена, возможно запускаем событие welcome
      if (localStorage.getItem("registrationCompleted") === "true") {
        setTimeout(() => {
          this.gameEventManager.activateEvent("welcome");
        }, 5000);
      }
      // Подсвечиваем камеру, если mirrorQuestActive
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

  /**
   * switchScreen – переключает экраны (section) и группы кнопок (div.buttons) внутри controls-panel.
   * @param {string} screenId       - ID экрана, который нужно отобразить
   * @param {string} buttonsGroupId - ID группы кнопок, которую нужно отобразить
   */
  switchScreen(screenId, buttonsGroupId) {
    // Скрываем все <section>
    document.querySelectorAll('section').forEach(section => {
      section.style.display = 'none';
    });

    // Показываем нужный
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.style.display = 'block';
    }

    // Скрываем все группы кнопок
    document.querySelectorAll('#controls-panel > .buttons').forEach(group => {
      group.style.display = 'none';
      group.style.pointerEvents = 'none';
    });

    // Отображаем нужную группу (если задана)
    if (buttonsGroupId) {
      const targetGroup = document.getElementById(buttonsGroupId);
      if (targetGroup) {
        targetGroup.style.display = 'flex';
        targetGroup.style.pointerEvents = 'auto';
      }
    }
  }

  /**
   * bindEvents – привязывает обработчики к кнопкам и полям формы.
   */
  bindEvents() {
    // ====== Поля регистрации ======
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

    // ====== Прочие кнопки ======
    this.captureBtn.addEventListener('click', () => this.captureSelfie());
    this.completeBtn.addEventListener('click', () => this.completeRegistration());
    this.resetBtn.addEventListener('click', () => this.profileManager.resetProfile());
    this.exportBtn.addEventListener('click', () => this.exportProfile());
    this.importBtn.addEventListener('click', () => this.importProfile());
    this.profilePhotoElem.addEventListener("click", () => this.showProfileModal.show());

    // Переходы (план -> селфи)
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

    // Камера / Дневник
    document.getElementById("toggle-camera").addEventListener("click", () => this.toggleCameraView());
    document.getElementById("toggle-diary").addEventListener("click", () => this.toggleCameraView());

    // Кнопка "Запостить"
    if (this.postBtn) {
      this.postBtn.addEventListener('click', () => this.handlePostButtonClick());
    }

    // Кнопка «Заснять» — по прежнему вызывает QuestManager.handleShootMirrorQuest()
    const shootBtn = document.getElementById("btn_shoot");
    if (shootBtn) {
      shootBtn.addEventListener("click", () => {
        this.questManager.handleShootMirrorQuest();
      });
    }
  }

  /**
   * validateRegistration – проверяет заполненность полей "имя" и "пол".
   */
  validateRegistration() {
    const isValid = (
      this.nameInput.value.trim() !== "" &&
      this.genderSelect.value !== ""
    );
    console.log("validateRegistration:", isValid);
    this.nextStepBtn.disabled = !isValid;
  }

  /**
   * goToApartmentPlanScreen – сохраняет данные регистрации в localStorage, переключается на экран плана.
   */
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

  /**
   * goToSelfieScreen – показывает экран селфи, включает камеру.
   */
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

  /**
   * captureSelfie – делает снимок, переводит в ч/б, отображает миниатюру, 
   * позволяет завершить регистрацию.
   */
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

  /**
   * completeRegistration – сохраняет профиль, останавливает камеру, 
   * переключается на основной экран, активирует welcome.
   */
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

  /**
   * toggleCameraView – переключает камеру/дневник (без логики зеркального квеста).
   */
  async toggleCameraView() {
    const diary = document.getElementById("diary");
    const globalCamera = document.getElementById("global-camera");
    const toggleCameraBtn = document.getElementById("toggle-camera");
    const toggleDiaryBtn  = document.getElementById("toggle-diary");
    const buttonsToHide = [
      document.getElementById("reset-data"),
      document.getElementById("export-profile-btn"),
      document.getElementById("import-profile-container")
    ];

    if (!this.isCameraOpen) {
      // Открываем режим камеры
      console.log("📸 Переключаемся на камеру...");
      diary.style.display = "none";
      globalCamera.style.display = "flex";

      if (toggleCameraBtn) toggleCameraBtn.style.display = "none";
      if (toggleDiaryBtn)  toggleDiaryBtn.style.display = "inline-block";
      buttonsToHide.forEach(btn => { if (btn) btn.style.display = "none"; });

      this.cameraSectionManager.attachTo('global-camera', {
        width: "100%",
        height: "100%"
      });
      await this.cameraSectionManager.startCamera();

      // Ожидаем readiness
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

      // Если mirrorQuestActive, просим QuestManager сообщить зеркальному квесту
      if (localStorage.getItem("mirrorQuestActive") === "true") {
        console.log("🔁 mirrorQuestActive=true, просим QuestManager запустить свою проверку...");
        // Например, у QuestManager может быть метод startMirrorQuestCheckLoop()
        this.questManager.startMirrorQuestCheckLoop();
      }

      this.isCameraOpen = true;
    } else {
      // Закрываем камеру, возвращаемся в блог
      console.log("📓 Возвращаемся в блог...");
      diary.style.display = "block";
      globalCamera.style.display = "none";

      if (toggleCameraBtn) toggleCameraBtn.style.display = "inline-block";
      if (toggleDiaryBtn)  toggleDiaryBtn.style.display = "none";
      buttonsToHide.forEach(btn => { if (btn) btn.style.display = "block"; });

      this.cameraSectionManager.stopCamera();
      this.isCameraOpen = false;

      // Завершаем проверку зеркального квеста, если есть (QuestManager или сам квест)
      // Пример: this.questManager.stopMirrorQuestCheckLoop();
    }
  }

  /**
   * showMainScreen – отображает экран "main-screen" (блог), включая профиль,
   * скрывая "Open Diary" и показывая "Open Camera".
   */
  showMainScreen() {
    window.switchScreen('main-screen', 'main-buttons');

    const toggleCameraBtn = document.getElementById("toggle-camera");
    const toggleDiaryBtn  = document.getElementById("toggle-diary");
    if (toggleCameraBtn) toggleCameraBtn.style.display = "inline-block";
    if (toggleDiaryBtn)  toggleDiaryBtn.style.display = "none";

    // Загружаем профиль
    const profile = this.profileManager.getProfile();
    if (profile) {
      this.profileNameElem.textContent = profile.name;
      this.profilePhotoElem.src = profile.selfie;
      this.profilePhotoElem.style.display = 'block';
      // Сохраняем selfie для дальнейшего сравнения
      this.selfieData = profile.selfie;
    }
    this.updatePostButtonState();
  }

  /**
   * showRegistrationScreen – переключает на экран регистрации.
   */
  showRegistrationScreen() {
    window.switchScreen('registration-screen', 'registration-buttons');
  }

  /**
   * exportProfile – экспорт профиля (вместе с дневником, квестами и т.д.) в JSON.
   */
  exportProfile() {
    this.profileManager.exportProfileData(this.databaseManager, this.apartmentPlanManager);
  }

  /**
   * importProfile – импорт профиля из выбранного файла.
   */
  importProfile() {
    if (this.importFileInput.files.length === 0) {
      alert("Please select a profile file to import.");
      return;
    }
    const file = this.importFileInput.files[0];
    this.profileManager.importProfileData(file, this.databaseManager, this.apartmentPlanManager);
  }

  /**
   * updatePostButtonState – обновляет состояние кнопки "Запостить",
   * если квест mirrorQuestReady или нет.
   */
  updatePostButtonState() {
    const isReady = localStorage.getItem("mirrorQuestReady") === "true";
    console.log("updatePostButtonState: mirrorQuestReady =", isReady);
    if (this.postBtn) {
      this.postBtn.disabled = !isReady;
    }
  }

  /**
   * handlePostButtonClick – при нажатии "Запостить":
   *   - Если mirrorQuestReady=true, активируем зеркальный квест,
   *     подсвечиваем камеру, сбрасываем флаг mirrorQuestReady
   *   - Иначе: сообщаем, что надо дождаться приглашения призрака
   */
  async handlePostButtonClick() {
    console.log("Кнопка 'Запостить' нажата");
    if (localStorage.getItem("mirrorQuestReady") === "true") {
      localStorage.removeItem("mirrorQuestReady");
      this.updatePostButtonState();
      console.log("Добавляем пост от пользователя");

      const cameraBtn = document.getElementById("toggle-camera");
      if (cameraBtn) {
        cameraBtn.classList.add("glowing");
      }

      // Активируем зеркальный квест ("mirror_quest")
      await this.questManager.activateQuest("mirror_quest");
    } else {
      alert("Ждите приглашения от призрака для начала квеста.");
    }
  }

  /**
   * compareCurrentFrame – вызываться зеркальным квестом для сравнения кадра с selfie.
   * Возвращает true/false при достаточном совпадении.
   */
  async compareCurrentFrame() {
    console.log("▶️ compareCurrentFrame()");
    if (!this.selfieData) {
      console.warn("❌ Нет сохранённого селфи!");
      return false;
    }
    const videoEl = this.cameraSectionManager.videoElement;
    if (!videoEl || !videoEl.srcObject) {
      console.warn("❌ Камера не активна!");
      return false;
    }
    // Рисуем текущий кадр в tempCanvas
    this.tempCanvas.width  = videoEl.videoWidth  || 640;
    this.tempCanvas.height = videoEl.videoHeight || 480;
    this.tempCtx.drawImage(videoEl, 0, 0, this.tempCanvas.width, this.tempCanvas.height);

    // Преобразуем в grayscale
    const currentFrameData = ImageUtils.convertToGrayscale(this.tempCanvas);

    // Пиксельное и гистограммное сравнение
    const matchPixel     = ImageUtils.pixelWiseComparison(this.selfieData, currentFrameData);
    const matchHistogram = ImageUtils.histogramComparison(this.selfieData, currentFrameData);
    console.log(`🔎 Pixel=${matchPixel.toFixed(2)}, Histogram=${matchHistogram.toFixed(2)}`);
    return (matchPixel > 0.6 && matchHistogram > 0.7);
  }
}