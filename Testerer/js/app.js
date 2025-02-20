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
 * Он управляет экранами (регистрация, селфи, блог), инициализацией менеджеров
 * (EventManager, QuestManager и т.д.) и хранит selfieData.
 *
 * Логика по активации квестов ("Запостить", "Заснять") вынесена в QuestManager.
 */
export class App {
  constructor() {
    // Привязываем метод switchScreen к глобальному объекту (window)
    window.switchScreen = this.switchScreen.bind(this);

    // Флаг, показывающий, открыт ли режим камеры.
    this.isCameraOpen = false;

    // === Получаем основные DOM-элементы. ===
    // Экраны приложения
    this.registrationScreen = document.getElementById('registration-screen');
    this.selfieScreen       = document.getElementById('selfie-screen');
    this.mainScreen         = document.getElementById('main-screen');

    // Элементы регистрации
    this.nameInput    = document.getElementById('player-name');
    this.genderSelect = document.getElementById('player-gender');
    this.nextStepBtn  = document.getElementById('next-step-btn');
    this.captureBtn   = document.getElementById('capture-btn');
    this.selfiePreview= document.getElementById('selfie-preview');
    this.completeBtn  = document.getElementById('complete-registration');

    // Элементы профиля
    this.profileNameElem  = document.getElementById('profile-name');
    this.profilePhotoElem = document.getElementById('profile-photo');

    // Кнопки сброса/экспорта/импорта
    this.resetBtn        = document.getElementById('reset-data');
    this.exportBtn       = document.getElementById('export-profile-btn');
    this.importFileInput = document.getElementById('import-file');
    this.importBtn       = document.getElementById('import-profile-btn');

    // Кнопка "Запостить" (видна только на экране блога)
    this.postBtn = document.getElementById('post-btn');

    // Панель управления и визуальные эффекты
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

    // QuestManager и другие сервисы
    this.questManager     = new QuestManager(this.eventManager, this);
    this.gameEventManager = new GameEventManager(this.eventManager, this, this.languageManager);
    this.showProfileModal = new ShowProfileModal(this);

    // Временная канва для обработки селфи (при регистрации)
    this.tempCanvas = document.createElement("canvas");
    this.tempCtx    = this.tempCanvas.getContext("2d");

    // Храним пользовательское селфи (полученное при регистрации)
    this.selfieData = null;

    this.bindEvents();
    this.init();
  }

  /**
   * loadAppState – загружает состояние приложения (например, текущего призрака) из localStorage.
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
   * init – асинхронная инициализация приложения:
   *  1) Загружаем состояние (loadAppState)
   *  2) Ждём инициализацию базы данных
   *  3) Обновляем дневник
   *  4) В зависимости от наличия профиля переключаем экран (main или registration)
   *  5) Если профиль зарегистрирован, запускаем welcomeEvent и подсвечиваем toggle-camera, если необходимо.
   */
  async init() {
    this.loadAppState();
    await this.databaseManager.initDatabasePromise;

    // Делаем кнопку "toggle-camera" видимой (на главном экране)
    const cameraBtn = document.getElementById("toggle-camera");
    cameraBtn.style.display = "inline-block";

    // Обновляем дневник (выводим все записи)
    this.eventManager.updateDiaryDisplay();

    if (this.profileManager.isProfileSaved()) {
      const profile = this.profileManager.getProfile();
      console.log("Profile found:", profile);
      this.showMainScreen();

      // Если регистрация завершена, через 5 секунд запускаем welcomeEvent через gameEventManager
      if (localStorage.getItem("registrationCompleted") === "true") {
        setTimeout(() => {
          this.gameEventManager.activateEvent("welcome");
        }, 5000);
      }

      // Обновляем состояние кнопки камеры в зависимости от активности зеркального квеста
      this.questManager.updateCameraButtonState();
    } else {
      console.log("Profile not found, showing registration screen.");
      this.showRegistrationScreen();
    }
  }

  /**
   * switchScreen – универсальный метод переключения экранов (<section>)
   * и групп кнопок (div.buttons) внутри #controls-panel.
   * @param {string} screenId - ID экрана, который нужно показать.
   * @param {string} buttonsGroupId - ID группы кнопок в #controls-panel.
   */
  switchScreen(screenId, buttonsGroupId) {
    // Скрываем все экраны
    document.querySelectorAll('section').forEach(section => {
      section.style.display = 'none';
    });

    // Показываем нужный экран
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.style.display = 'block';
    }

    // Скрываем все группы кнопок и блокируем клики
    document.querySelectorAll('#controls-panel > .buttons').forEach(group => {
      group.style.display = 'none';
      group.style.pointerEvents = 'none';
    });

    // Отображаем нужную группу кнопок (если указана)
    if (buttonsGroupId) {
      const targetGroup = document.getElementById(buttonsGroupId);
      if (targetGroup) {
        targetGroup.style.display = 'flex';
        targetGroup.style.pointerEvents = 'auto';
      }
    }
  }

  /**
   * bindEvents – привязывает обработчики событий ко всем элементам.
   * Логику кнопок "Запостить" и "Заснять" передаём QuestManager.
   */
  bindEvents() {
    // Поля регистрации
    this.nameInput.addEventListener('input', () => {
      console.log("Name input changed:", this.nameInput.value);
      this.validateRegistration();
    });
    this.genderSelect.addEventListener('change', () => {
      console.log("Gender select changed:", this.genderSelect.value);
      this.validateRegistration();
    });

    // Кнопка "Next" (регистрация -> план квартиры)
    if (this.nextStepBtn) {
      this.nextStepBtn.addEventListener('click', () => {
        console.log("Next button clicked");
        this.goToApartmentPlanScreen();
      });
    }

    // Кнопки для селфи, регистрации, сброса, экспорта, импорта, и модальное окно профиля
    this.captureBtn.addEventListener('click', () => this.captureSelfie());
    this.completeBtn.addEventListener('click', () => this.completeRegistration());
    this.resetBtn.addEventListener('click', () => this.profileManager.resetProfile());
    this.exportBtn.addEventListener('click', () => this.exportProfile());
    this.importBtn.addEventListener('click', () => this.importProfile());
    this.profilePhotoElem.addEventListener("click", () => this.showProfileModal.show());

    // Переходы между экранами (план -> селфи, этажи)
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

    // Кнопки переключения между камерой и блогом
    document.getElementById("toggle-camera").addEventListener("click", () => this.toggleCameraView());
    document.getElementById("toggle-diary").addEventListener("click", () => this.toggleCameraView());

    // Кнопка "Запостить" – делегируем логику QuestManager
    if (this.postBtn) {
      this.postBtn.addEventListener('click', () => {
        this.questManager.handlePostButtonClick();
      });
    }

    // Кнопка "Заснять" – делегируем логику QuestManager (работает только на экране камеры)
    const shootBtn = document.getElementById("btn_shoot");
    if (shootBtn) {
      shootBtn.addEventListener("click", () => {
        this.questManager.handleShootMirrorQuest();
      });
    }
  }

  /**
   * validateRegistration – проверяет, заполнены ли поля "Name" и "Gender".
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
   * goToApartmentPlanScreen – сохраняет данные регистрации в localStorage,
   * переключает экран на план квартиры и отображает группу "apartment-plan-buttons".
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
   * goToSelfieScreen – переключает экран на "selfie-screen",
   * открывает глобальный контейнер камеры и запускает камеру.
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
    // Пока селфи не сделано – блокируем кнопку Complete
    this.completeBtn.disabled = true;
  }

  /**
   * captureSelfie – делает снимок текущего кадра из камеры,
   * переводит его в ч/б, показывает миниатюру (#selfie-thumbnail) и сохраняет результат в this.selfieData.
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
      // Рисуем кадр из видео на canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Преобразуем изображение в оттенки серого
      const grayscaleData = ImageUtils.convertToGrayscale(canvas);
      const thumbnail = document.getElementById('selfie-thumbnail');
      thumbnail.src = grayscaleData;
      thumbnail.style.display = 'block';

      // Разблокируем кнопку Complete
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
   *  1) Берёт сделанное селфи.
   *  2) Сохраняет профиль (name, gender, language, selfie).
   *  3) Останавливает камеру и скрывает глобальный контейнер.
   *  4) Переключается на основной экран (showMainScreen).
   *  5) Через 5 секунд активирует событие "welcome".
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

    // Останавливаем камеру и скрываем глобальный контейнер камеры
    this.cameraSectionManager.stopCamera();
    document.getElementById('global-camera').style.display = 'none';

    // Переходим на основной экран
    this.showMainScreen();

    // Через 5 секунд активируем событие "welcome"
    setTimeout(() => {
      this.gameEventManager.activateEvent("welcome");
    }, 5000);
  }

  /**
   * toggleCameraView – переключает отображение между камерой и блогом.
   * При открытии камеры:
   *   - Прячем блог (diary), показываем global-camera.
   *   - Скрываем кнопку "Запостить" (postBtn), показываем "Заснять" (shootBtn), но делаем её disabled.
   * При закрытии камеры:
   *   - Возвращаемся в блог, скрываем global-camera.
   *   - Показываем "Запостить", прячем "Заснять".
   *
   * Обратите внимание: логика, специфичная для зеркального квеста, вынесена в соответствующие модули.
   */
  async toggleCameraView() {
    // Получаем необходимые DOM-элементы
    const diary           = document.getElementById("diary");
    const globalCamera    = document.getElementById("global-camera");
    const toggleCameraBtn = document.getElementById("toggle-camera");
    const toggleDiaryBtn  = document.getElementById("toggle-diary");
    const shootBtn        = document.getElementById("btn_shoot");  // Кнопка «Заснять»
    const postBtn         = this.postBtn;                          // Кнопка «Запостить»
    const buttonsToHide   = [
      document.getElementById("reset-data"),
      document.getElementById("export-profile-btn"),
      document.getElementById("import-profile-container")
    ];

    if (!this.isCameraOpen) {
      // === Переходим в режим камеры ===
      console.log("📸 Переключаемся на камеру...");
      diary.style.display = "none";                   // Скрываем блог
      globalCamera.style.display = "flex";            // Показываем камеру

      // Скрываем кнопки, относящиеся к блогу
      if (toggleCameraBtn) toggleCameraBtn.style.display = "none";
      if (toggleDiaryBtn)  toggleDiaryBtn.style.display = "inline-block";
      buttonsToHide.forEach(btn => { if (btn) btn.style.display = "none"; });
      if (postBtn) postBtn.style.display = "none";     // «Запостить» скрываем в режиме камеры

      // Показываем кнопку «Заснять» и делаем её неактивной до выполнения условия
      if (shootBtn) {
        shootBtn.style.display = "inline-block";
        shootBtn.disabled = true;
      }

      // Подключаем камеру к глобальному контейнеру и запускаем видеопоток
      this.cameraSectionManager.attachTo('global-camera', {
        width: "100%",
        height: "100%"
      });
      await this.cameraSectionManager.startCamera();

      // Ждем, пока видеопоток станет готов (readyState >= 2)
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

      // Здесь ранее был запуск цикла проверки зеркального квеста, теперь он вынесен в соответствующие модули

      this.isCameraOpen = true;
    } else {
      // === Выходим из режима камеры, возвращаемся к блогу ===
      console.log("📓 Возвращаемся в блог...");
      diary.style.display = "block";                  // Показываем блог
      globalCamera.style.display = "none";              // Скрываем камеру

      // Отображаем кнопки блога: "toggle-camera" и "Запостить"
      if (toggleCameraBtn) toggleCameraBtn.style.display = "inline-block";
      if (toggleDiaryBtn)  toggleDiaryBtn.style.display = "none";
      buttonsToHide.forEach(btn => { if (btn) btn.style.display = "block"; });
      if (postBtn) postBtn.style.display = "inline-block";  // "Запостить" видна только в блоге

      // Скрываем кнопку «Заснять» и сбрасываем её состояние
      if (shootBtn) {
        shootBtn.style.display = "none";
        shootBtn.disabled = true;
      }

      // Останавливаем камеру и обновляем флаг
      this.cameraSectionManager.stopCamera();
      this.isCameraOpen = false;

      // Если нужно, можно добавить вызов метода для уведомления QuestManager о закрытии камеры
      // Например: this.questManager.handleCameraClosed();
    }
  }

  /**
   * showMainScreen – переключает на основной экран (блог) и группу кнопок "main-buttons".
   * Показывает профиль пользователя, и гарантирует, что на экране блога:
   *  - Кнопка "Запостить" видна,
   *  - Кнопка "Заснять" скрыта,
   *  - Кнопка "toggle-camera" отображается.
   */
  showMainScreen() {
    window.switchScreen('main-screen', 'main-buttons');

    const toggleCameraBtn = document.getElementById("toggle-camera");
    const toggleDiaryBtn  = document.getElementById("toggle-diary");
    if (toggleCameraBtn) toggleCameraBtn.style.display = "inline-block";
    if (toggleDiaryBtn)  toggleDiaryBtn.style.display = "none";

    // На экране блога должна быть видна только кнопка "Запостить"
    const postBtn = this.postBtn;
    if (postBtn) {
      postBtn.style.display = "inline-block";
    }
    // Убеждаемся, что кнопка "Заснять" скрыта
    const shootBtn = document.getElementById("btn_shoot");
    if (shootBtn) {
      shootBtn.style.display = "none";
    }

    const profile = this.profileManager.getProfile();
    if (profile) {
      this.profileNameElem.textContent = profile.name;
      this.profilePhotoElem.src = profile.selfie;
      this.profilePhotoElem.style.display = 'block';
      // Сохраняем селфи для использования в зеркальном квесте
      this.selfieData = profile.selfie;
    }

    // Если нужно, можно обновить состояние кнопки "Запостить" через QuestManager
    // this.questManager.updatePostButtonState();
  }

  /**
   * showRegistrationScreen – переключает на экран регистрации и отображает группу "registration-buttons".
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