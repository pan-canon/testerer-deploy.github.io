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

/**
 * Класс App – основная точка входа приложения.
 * Он управляет экранами (регистрация, селфи, основной блог),
 * инициализацией менеджеров (EventManager, QuestManager и т.д.), 
 * а также хранит selfieData, если пользователь сделал селфи.
 *
 * Логика по активации квестов ("Запостить", "Заснять") перенесена
 * в QuestManager, чтобы разгрузить App и обеспечить более гибкую архитектуру.
 */
export class App {
  constructor() {
    // Привязываем метод switchScreen к глобальному объекту (window),
    // чтобы его можно было вызывать из HTML по необходимости.
    window.switchScreen = this.switchScreen.bind(this);

    // Флаг, показывающий, открыт ли режим камеры.
    this.isCameraOpen = false;

    // === Получаем основные DOM-элементы. ===
    // Экраны регистрации, селфи, основного блога:
    this.registrationScreen = document.getElementById('registration-screen');
    this.selfieScreen       = document.getElementById('selfie-screen');
    this.mainScreen         = document.getElementById('main-screen');

    // Поля и кнопки регистрации:
    this.nameInput    = document.getElementById('player-name');
    this.genderSelect = document.getElementById('player-gender');
    this.nextStepBtn  = document.getElementById('next-step-btn');
    this.captureBtn   = document.getElementById('capture-btn');
    this.selfiePreview= document.getElementById('selfie-preview');
    this.completeBtn  = document.getElementById('complete-registration');

    // Элементы профиля:
    this.profileNameElem  = document.getElementById('profile-name');
    this.profilePhotoElem = document.getElementById('profile-photo');

    // Кнопки сброса/экспорта/импорта
    this.resetBtn        = document.getElementById('reset-data');
    this.exportBtn       = document.getElementById('export-profile-btn');
    this.importFileInput = document.getElementById('import-file');
    this.importBtn       = document.getElementById('import-profile-btn');

    // Кнопка "Запостить" (логика зеркального квеста – в QuestManager)
    this.postBtn = document.getElementById('post-btn');

    // Панель управления (и визуальные эффекты)
    this.controlsPanel = document.getElementById("controls-panel");
    this.visualEffectsManager = new VisualEffectsManager(this, this.controlsPanel);

    // Инициализируем менеджеры: язык, камера, профиль, база данных
    this.languageManager      = new LanguageManager('language-selector');
    this.cameraSectionManager = new cameraSectionManager();
    this.profileManager       = new ProfileManager();
    this.databaseManager      = new DatabaseManager();

    // GhostManager и EventManager (связь между ними)
    this.ghostManager = new GhostManager(null, this.profileManager, this);
    this.eventManager = new EventManager(
      this.databaseManager,
      this.languageManager,
      this.ghostManager,
      this.visualEffectsManager
    );
    this.ghostManager.eventManager = this.eventManager;

    // QuestManager (управляет квестами, кнопкой "Запостить" и т.д.)
    this.questManager     = new QuestManager(this.eventManager, this);
    this.gameEventManager = new GameEventManager(this.eventManager, this, this.languageManager);
    this.showProfileModal = new ShowProfileModal(this);

    // Временная канва для обработки селфи (может потребоваться при регистрации).
    this.tempCanvas = document.createElement("canvas");
    this.tempCtx    = this.tempCanvas.getContext("2d");

    // Храним пользовательское селфи (полученное при регистрации).
    this.selfieData = null;

    // Привязываем обработчики событий и затем инициализируем приложение.
    this.bindEvents();
    this.init();
  }

  /**
   * loadAppState – загружает состояние приложения (например, текущего призрака)
   * из localStorage. Вызывается из init().
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
   * init – асинхронная инициализация:
   *  1) Загружаем состояние (loadAppState),
   *  2) Ждём инициализацию базы данных,
   *  3) Обновляем дневник (updateDiaryDisplay),
   *  4) Проверяем профиль (если есть – показываем mainScreen, иначе – registration).
   *  5) Если профиль зарегистрирован, возможно активируем welcomeEvent, 
   *     подсвечиваем "toggle-camera" (если mirrorQuestActive).
   */
  async init() {
    this.loadAppState();
    await this.databaseManager.initDatabasePromise;

    // Кнопка "toggle-camera" всегда видна (после регистрации),
    // но пока нет профиля – она тоже будет (для дебага).
    const cameraBtn = document.getElementById("toggle-camera");
    cameraBtn.style.display = "inline-block";

    // Сразу обновляем дневник (выведем все записи)
    this.eventManager.updateDiaryDisplay();

    // Если профиль есть, идём на main-screen, иначе – registration
    if (this.profileManager.isProfileSaved()) {
      const profile = this.profileManager.getProfile();
      console.log("Profile found:", profile);
      this.showMainScreen();

      // Если регистрация завершена, через 5с запускаем welcome
      if (localStorage.getItem("registrationCompleted") === "true") {
        setTimeout(() => {
          this.gameEventManager.activateEvent("welcome");
        }, 5000);
      }

      // Если зеркальный квест (mirrorQuestActive) = true,
      // подсвечиваем кнопку "toggle-camera".
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
   * switchScreen – универсальный метод переключения экранов (<section>) и
   * групп кнопок (div.buttons) внутри #controls-panel.
   * @param {string} screenId - ID экрана, который нужно показать
   * @param {string} buttonsGroupId - ID группы кнопок в #controls-panel
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

    // Скрываем все группы кнопок и отключаем клики
    document.querySelectorAll('#controls-panel > .buttons').forEach(group => {
      group.style.display = 'none';
      group.style.pointerEvents = 'none';
    });

    // Отображаем нужную группу (если указана)
    if (buttonsGroupId) {
      const targetGroup = document.getElementById(buttonsGroupId);
      if (targetGroup) {
        targetGroup.style.display = 'flex';
        targetGroup.style.pointerEvents = 'auto';
      }
    }
  }

  /**
   * bindEvents – привязывает обработчики событий ко всем кнопкам и полям.
   * Логику "Запостить" и "Заснять" передаём QuestManager и MirrorQuest.
   */
  bindEvents() {
    // Поля регистрации (имя, пол)
    this.nameInput.addEventListener('input', () => {
      console.log("Name input changed:", this.nameInput.value);
      this.validateRegistration();
    });
    this.genderSelect.addEventListener('change', () => {
      console.log("Gender select changed:", this.genderSelect.value);
      this.validateRegistration();
    });

    // Кнопка "Next" (после ввода имени/пола) -> к плану квартиры
    if (this.nextStepBtn) {
      this.nextStepBtn.addEventListener('click', () => {
        console.log("Next button clicked");
        this.goToApartmentPlanScreen();
      });
    }

    // Кнопки: Capture (селфи), Complete (регистрация),
    // Reset, Export, Import, ShowProfileModal
    this.captureBtn.addEventListener('click', () => this.captureSelfie());
    this.completeBtn.addEventListener('click', () => this.completeRegistration());
    this.resetBtn.addEventListener('click', () => this.profileManager.resetProfile());
    this.exportBtn.addEventListener('click', () => this.exportProfile());
    this.importBtn.addEventListener('click', () => this.importProfile());
    this.profilePhotoElem.addEventListener("click", () => this.showProfileModal.show());

    // Переходы в экранах: план -> селфи, этажи
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

    // Кнопки "toggle-camera" / "toggle-diary" (скрываем/показываем камеру)
    document.getElementById("toggle-camera").addEventListener("click", () => this.toggleCameraView());
    document.getElementById("toggle-diary").addEventListener("click", () => this.toggleCameraView());

    // Кнопка "Запостить" -> QuestManager.handlePostButtonClick()
    if (this.postBtn) {
      this.postBtn.addEventListener('click', () => {
        this.questManager.handlePostButtonClick();
      });
    }

    // Кнопка «Заснять» -> QuestManager.handleShootMirrorQuest()
    // (логика завершения MirrorQuest, если kвест активен).
    const shootBtn = document.getElementById("btn_shoot");
    if (shootBtn) {
      shootBtn.addEventListener("click", () => {
        this.questManager.handleShootMirrorQuest();
      });
    }
  }

  /**
   * validateRegistration – проверяет, заполнены ли поля "Name" и "Gender".
   * Если оба поля валидны, кнопку "Next" делаем активной, иначе нет.
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
   * goToApartmentPlanScreen – сохраняет данные из полей регистрации в localStorage,
   * переключает экран на план квартиры, отображая группу "apartment-plan-buttons".
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
   * goToSelfieScreen – переключает экран на "selfie-screen" (шаг 3),
   * открывает глобальный контейнер камеры (global-camera) и запускает камеру.
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
    // Пока селфи не сделан -> completeBtn.disabled = true
    this.completeBtn.disabled = true;
  }

  /**
   * captureSelfie – делает снимок текущего кадра из камеры,
   * преобразует в ч/б, показывает миниатюру (#selfie-thumbnail) и
   * сохраняет результат в this.selfieData.
   */
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
      // Рисуем кадр из видео
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Преобразуем в оттенки серого
      const grayscaleData = ImageUtils.convertToGrayscale(canvas);
      const thumbnail = document.getElementById('selfie-thumbnail');
      thumbnail.src = grayscaleData;
      thumbnail.style.display = 'block';

      // Теперь можно "Complete registration"
      this.completeBtn.disabled = false;
      this.selfieData = grayscaleData;
      console.log("✅ Снимок успешно сделан!");
    } catch (error) {
      console.error("❌ Ошибка при создании снимка:", error);
      alert("Ошибка при создании снимка! Попробуйте снова.");
    }
  }

  /**
   * completeRegistration – завершает регистрацию:
   *  1) Берёт сделанное селфи,
   *  2) Сохраняет профиль (name, gender, language, selfie),
   *  3) Останавливает камеру, скрывает global-camera,
   *  4) Переходит на основной экран (showMainScreen),
   *  5) Через 5с активирует "welcome" (призрачный пост).
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

    // Закрываем камеру
    this.cameraSectionManager.stopCamera();
    document.getElementById('global-camera').style.display = 'none';

    // Переходим на главный экран
    this.showMainScreen();

    // Через 5 секунд активируем event "welcome"
    setTimeout(() => {
      this.gameEventManager.activateEvent("welcome");
    }, 5000);
  }

  /**
   * toggleCameraView – переключает отображение:
   *  Если камера закрыта -> показываем камеру, скрываем блог
   *  Если камера открыта -> показываем блог, скрываем камеру
   *  При открытии камеры делаем "Заснять" видимой, но disabled,
   *  при закрытии – скрываем.
   */
  async toggleCameraView() {
    const diary           = document.getElementById("diary");
    const globalCamera    = document.getElementById("global-camera");
    const toggleCameraBtn = document.getElementById("toggle-camera");
    const toggleDiaryBtn  = document.getElementById("toggle-diary");
    const shootBtn        = document.getElementById("btn_shoot");
    const buttonsToHide = [
      document.getElementById("reset-data"),
      document.getElementById("export-profile-btn"),
      document.getElementById("import-profile-container")
    ];

    if (!this.isCameraOpen) {
      // === Открываем камеру ===
      console.log("📸 Переключаемся на камеру...");
      diary.style.display = "none";
      globalCamera.style.display = "flex";

      if (toggleCameraBtn) toggleCameraBtn.style.display = "none";
      if (toggleDiaryBtn)  toggleDiaryBtn.style.display = "inline-block";
      buttonsToHide.forEach(btn => { if (btn) btn.style.display = "none"; });

      // Всегда показываем кнопку «Заснять» (но отключаем)
      if (shootBtn) {
        shootBtn.style.display = "inline-block";
        shootBtn.disabled = true;
      }

      // Привязываем камеру
      this.cameraSectionManager.attachTo('global-camera', {
        width: "100%",
        height: "100%"
      });
      await this.cameraSectionManager.startCamera();

      // Ждём, пока камера "готова"
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

      // Если mirrorQuestActive -> можем попросить QuestManager (или сам квест)
      // начать проверку (startMirrorQuestCheckLoop).
      if (localStorage.getItem("mirrorQuestActive") === "true") {
        console.log("🔁 mirrorQuestActive=true, просим QuestManager запустить проверку...");
        // this.questManager.startMirrorQuestCheckLoop(); (пример)
      }

      this.isCameraOpen = true;

    } else {
      // === Закрываем камеру ===
      console.log("📓 Возвращаемся в блог...");
      diary.style.display = "block";
      globalCamera.style.display = "none";

      if (toggleCameraBtn) toggleCameraBtn.style.display = "inline-block";
      if (toggleDiaryBtn)  toggleDiaryBtn.style.display = "none";
      buttonsToHide.forEach(btn => { if (btn) btn.style.display = "block"; });

      // Прячем «Заснять»
      if (shootBtn) {
        shootBtn.style.display = "none";
      }

      this.cameraSectionManager.stopCamera();
      this.isCameraOpen = false;

      // Сообщаем QuestManager, что камера закрыта (если нужно)
      // this.questManager.stopMirrorQuestCheckLoop();
    }
  }

  /**
   * showMainScreen – переключает на основной экран (main-screen) и кнопки (main-buttons),
   * показывает профиль (имя, фото). Если хотим – здесь можно вызвать questManager.updatePostButtonState().
   */
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
      // Сохраняем selfie для зеркального квеста, если нужно
      this.selfieData = profile.selfie;
    }

    // Если хотим сразу обновить "Запостить" после входа:
    // this.questManager.updatePostButtonState();
  }

  /**
   * showRegistrationScreen – показывает экран регистрации и кнопки registration-buttons.
   */
  showRegistrationScreen() {
    window.switchScreen('registration-screen', 'registration-buttons');
  }

  /**
   * exportProfile – экспортирует профиль (и дневник) в файл JSON.
   */
  exportProfile() {
    this.profileManager.exportProfileData(this.databaseManager, this.apartmentPlanManager);
  }

  /**
   * importProfile – импортирует профиль из файла JSON.
   */
  importProfile() {
    if (this.importFileInput.files.length === 0) {
      alert("Please select a profile file to import.");
      return;
    }
    const file = this.importFileInput.files[0];
    this.profileManager.importProfileData(file, this.databaseManager, this.apartmentPlanManager);
  }
}