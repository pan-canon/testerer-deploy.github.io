import { LanguageManager } from './languageManager.js';
import { CameraManager } from './cameraManager.js';
import { ProfileManager } from './profileManager.js';
import { DatabaseManager } from './databaseManager.js';
import { EventManager } from './eventManager.js';

/**
 * Основной класс приложения с контролем селфи-дистанции и распознаванием лиц
 */
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
    this.cameraManager = new CameraManager('selfie-video'); // ваш дефолтный cameraManager
    this.profileManager = new ProfileManager();
    this.databaseManager = new DatabaseManager(); 
    this.eventManager = new EventManager(this.databaseManager, this.languageManager);
    
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

    // Переключение камеры/дневника
    document.getElementById("toggle-camera").addEventListener("click", () => this.toggleCameraView());
    document.getElementById("toggle-diary").addEventListener("click", () => this.toggleCameraView());
  }

  /**
   * Инициализация приложения:
   * 1) Ждём БД
   * 2) Создаём таблицу для хранения face embeddings, если ещё нет
   * 3) Проверяем профиль -> mainScreen или registration
   */
  async init() {
    console.log("🔄 Идёт инициализация приложения...");
    await this.databaseManager.initDatabasePromise;

    // Создаём таблицу для embeddings (храним JSON-координаты)
    this.databaseManager.db.run(`
      CREATE TABLE IF NOT EXISTS face_embeddings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        embedding TEXT,
        timestamp TEXT
      );
    `);

    console.log("✅ Таблица face_embeddings готова!");

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

    // Запускаем камеру
    this.cameraManager.start();
    this.completeBtn.disabled = true;
  }

  /**
   * (1) Снимаем фото с камеры
   * (2) Проверяем, что лицо не слишком далеко
   * (3) Если ок, сохраняем preview, разблокируем "Complete"
   */
  async captureSelfie() {
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
      // Снимаем кадр
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Не удалось получить контекст рисования.");

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const selfieData = canvas.toDataURL("image/png");
      if (!selfieData || selfieData.length < 100) {
        throw new Error("Ошибка обработки изображения.");
      }

      // Проверяем "не слишком ли далеко" лицо
      const isOk = await this.checkDistanceDuringSelfie(selfieData);
      if (!isOk) {
        alert("Лицо слишком далеко или не найдено. Повторите селфи!");
        return;
      }

      // Если всё ок, показываем превью
      this.selfiePreview.src = selfieData;
      this.selfiePreview.style.display = 'block';
      this.completeBtn.disabled = false;

      console.log("✅ Снимок успешно сделан!");
    } catch (error) {
      console.error("❌ Ошибка при создании снимка:", error);
      alert("Ошибка при создании снимка! Попробуйте снова.");
    }
  }

  /**
   * Проверяем дистанцию лица при селфи (bounding box).
   * Если всё хорошо, параллельно сохраняем embedding в БД.
   */
  async checkDistanceDuringSelfie(base64Image) {
    console.log("🔍 Проверяем дистанцию при селфи...");
    try {
      // Создаём <img> для face-landmarks-detection
      const img = new Image();
      img.src = base64Image;
      await new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve; // не зависаем
      });

      // Загружаем модель
      console.log("⚙️ Загружаем модель для проверки лица...");
      const model = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
      );
      console.log("✅ Модель загружена (селфи-этап).");

      // Ищем лицо
      const predictions = await model.estimateFaces({ input: img });
      if (!predictions.length) {
        console.warn("❌ Лицо не найдено на фото!");
        return false;
      }
      const face = predictions[0];
      console.log("📍 Найдено лицо:", face);

      // Проверяем размер boundingBox
      const bbox = face.boundingBox;
      const width = bbox.bottomRight[0] - bbox.topLeft[0];
      const height = bbox.bottomRight[1] - bbox.topLeft[1];
      console.log(`👀 Ширина лица: ${width}, Высота лица: ${height}`);
      if (width < 100 || height < 100) {
        console.warn("❌ Лицо слишком далеко!");
        return false;
      }

      // Если всё ок — параллельно сохраняем embedding в БД (для дальнейших сравнений)
      const embedding = face.scaledMesh; // координаты точек
      await this.saveFaceEmbeddingToDB(embedding);

      return true;
    } catch (err) {
      console.error("❌ checkDistanceDuringSelfie error:", err);
      return false;
    }
  }

  /**
   * Сохраняем embedding в таблицу face_embeddings (в JSON-виде).
   */
  async saveFaceEmbeddingToDB(embedding) {
    if (!embedding) return;
    const embeddingStr = JSON.stringify(embedding);
    const timestamp = new Date().toISOString();
    console.log("💾 Сохраняем embedding в БД:", embeddingStr.slice(0, 60) + "...");

    this.databaseManager.db.run(
      `INSERT INTO face_embeddings (embedding, timestamp) VALUES (?, ?)`,
      [embeddingStr, timestamp]
    );
    this.databaseManager.saveDatabase();
    console.log("✅ Face embedding сохранён в БД!");
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

    // Запускаем "звонок" через 5 секунд (пример)
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

  //===== Сценарий звонка (не меняем особо) =====
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
      
      // Пример: через 5 секунд добавляем "mirror_quest" и открываем камеру
      setTimeout(async () => {
        await this.eventManager.addDiaryEntry("mirror_quest");
        this.toggleCameraView();
      }, 5000);
    });

    // При игнорировании
    ignoreCallBtn.addEventListener("click", async () => {
      await this.endCall(ringtone, answerCallBtn, ignoreCallBtn, "ignored_call");
    });

    this.mainScreen.appendChild(answerCallBtn);
    this.mainScreen.appendChild(ignoreCallBtn);
  }

  async endCall(ringtone, answerCallBtn, ignoreCallBtn, eventKey) {
    ringtone.pause();
    answerCallBtn.remove();
    ignoreCallBtn.remove();

    if (!this.eventManager.isEventLogged(eventKey)) {
      await this.eventManager.addDiaryEntry(eventKey);
    }
    // Показываем кнопку камеры
    const cameraBtn = document.getElementById("toggle-camera");
    cameraBtn.style.display = "inline-block";
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

  showMirrorTask() {
    const mirrorTask = document.createElement("p");
    mirrorTask.textContent = this.languageManager.locales[this.languageManager.getLanguage()]["go_to_mirror"];
    mirrorTask.id = "mirror-task";
    document.getElementById("diary").appendChild(mirrorTask);
  }

  //===== Сравнение лица при переключении камеры =====
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

      // === Через 3 секунды сравниваем лицо с сохранённым embedding
      setTimeout(() => {
        this.compareCurrentFace();
      }, 3000);

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

  /**
   * 1) Берём последнее embedding из face_embeddings
   * 2) Сравниваем с текущим лицом в video
   */
  async compareCurrentFace() {
    console.log("🔎 compareCurrentFace() start...");
    const videoElement = document.getElementById("camera-view");
    if (!videoElement) {
      console.warn("❌ Нет элемента video для сравнения!");
      return;
    }

    // Получаем последнюю запись из face_embeddings
    const selectRes = this.databaseManager.db.exec(
      "SELECT embedding FROM face_embeddings ORDER BY id DESC LIMIT 1"
    );
    if (!selectRes.length || !selectRes[0].values.length) {
      console.warn("❌ В БД нет сохранённого embedding!");
      return;
    }
    const row = selectRes[0].values[0];
    const embeddingStr = row[0];
    const embedding = JSON.parse(embeddingStr);

    // Загружаем модель, сравниваем
    console.log("⚙️ Загружаем модель для сравнения лица...");
    const model = await faceLandmarksDetection.load(
      faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
    );
    console.log("✅ Модель загружена (compare-face).");

    const predictions = await model.estimateFaces({ input: videoElement });
    if (!predictions.length) {
      console.warn("❌ Лицо в реальном времени не обнаружено!");
      alert("Лицо в кадре не обнаружено. Попробуйте ближе к камере!");
      return;
    }
    const realTimeMesh = predictions[0].scaledMesh;
    console.log("📹 Лицо в реальном времени:", realTimeMesh);

    // Считаем среднее евклидовое расстояние
    let distanceSum = 0;
    const count = Math.min(embedding.length, realTimeMesh.length);
    for (let i = 0; i < count; i++) {
      distanceSum += Math.pow(embedding[i][0] - realTimeMesh[i][0], 2);
      distanceSum += Math.pow(embedding[i][1] - realTimeMesh[i][1], 2);
      distanceSum += Math.pow(embedding[i][2] - realTimeMesh[i][2], 2);
    }
    const meanDist = Math.sqrt(distanceSum / count);
    console.log("📏 Расстояние между лицами:", meanDist);

    const threshold = 20;
    if (meanDist < threshold) {
      alert("✅ Лицо совпадает!");
    } else {
      alert("❌ Лицо НЕ совпадает!");
    }
  }

  //===== Экспорт / Импорт профиля (как у вас было) =====
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
