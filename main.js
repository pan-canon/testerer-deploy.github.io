/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./build/triads lazy recursive ^\\.\\/triad\\-.*$":
/*!*****************************************************************************************!*\
  !*** ./build/triads/ lazy ^\.\/triad\-.*$ chunkName: triads/[request] namespace object ***!
  \*****************************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var map = {
	"./triad-final_event": [
		"./build/triads/triad-final_event.js",
		"triads/triad-final_event"
	],
	"./triad-final_event.js": [
		"./build/triads/triad-final_event.js",
		"triads/triad-final_event"
	],
	"./triad-post_mirror_event": [
		"./build/triads/triad-post_mirror_event.js",
		"triads/triad-post_mirror_event"
	],
	"./triad-post_mirror_event.js": [
		"./build/triads/triad-post_mirror_event.js",
		"triads/triad-post_mirror_event"
	],
	"./triad-post_repeating_event": [
		"./build/triads/triad-post_repeating_event.js",
		"triads/triad-post_repeating_event"
	],
	"./triad-post_repeating_event.js": [
		"./build/triads/triad-post_repeating_event.js",
		"triads/triad-post_repeating_event"
	],
	"./triad-welcome": [
		"./build/triads/triad-welcome.js",
		"triads/triad-welcome"
	],
	"./triad-welcome.js": [
		"./build/triads/triad-welcome.js",
		"triads/triad-welcome"
	]
};
function webpackAsyncContext(req) {
	if(!__webpack_require__.o(map, req)) {
		return Promise.resolve().then(() => {
			var e = new Error("Cannot find module '" + req + "'");
			e.code = 'MODULE_NOT_FOUND';
			throw e;
		});
	}

	var ids = map[req], id = ids[0];
	return __webpack_require__.e(ids[1]).then(() => {
		return __webpack_require__(id);
	});
}
webpackAsyncContext.keys = () => (Object.keys(map));
webpackAsyncContext.id = "./build/triads lazy recursive ^\\.\\/triad\\-.*$";
module.exports = webpackAsyncContext;

/***/ }),

/***/ "./src/App.js":
/*!********************!*\
  !*** ./src/App.js ***!
  \********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   App: () => (/* binding */ App)
/* harmony export */ });
/* harmony import */ var _config_paths_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./config/paths.js */ "./src/config/paths.js");
/* harmony import */ var _utils_ImageUtils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils/ImageUtils.js */ "./src/utils/ImageUtils.js");
/* harmony import */ var _managers_VisualEffectsManager_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./managers/VisualEffectsManager.js */ "./src/managers/VisualEffectsManager.js");
/* harmony import */ var _managers_SQLiteDataManager_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./managers/SQLiteDataManager.js */ "./src/managers/SQLiteDataManager.js");
/* harmony import */ var _managers_DatabaseManager_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./managers/DatabaseManager.js */ "./src/managers/DatabaseManager.js");
/* harmony import */ var _managers_StateManager_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./managers/StateManager.js */ "./src/managers/StateManager.js");
/* harmony import */ var _managers_ErrorManager_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./managers/ErrorManager.js */ "./src/managers/ErrorManager.js");
/* harmony import */ var _managers_ViewManager_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./managers/ViewManager.js */ "./src/managers/ViewManager.js");
/* harmony import */ var _managers_LanguageManager_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./managers/LanguageManager.js */ "./src/managers/LanguageManager.js");
/* harmony import */ var _managers_CameraSectionManager_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./managers/CameraSectionManager.js */ "./src/managers/CameraSectionManager.js");
/* harmony import */ var _managers_ProfileManager_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./managers/ProfileManager.js */ "./src/managers/ProfileManager.js");
/* harmony import */ var _managers_GhostManager_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./managers/GhostManager.js */ "./src/managers/GhostManager.js");
/* harmony import */ var _managers_EventManager_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./managers/EventManager.js */ "./src/managers/EventManager.js");
/* harmony import */ var _managers_QuestManager_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./managers/QuestManager.js */ "./src/managers/QuestManager.js");
/* harmony import */ var _managers_GameEventManager_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./managers/GameEventManager.js */ "./src/managers/GameEventManager.js");
/* harmony import */ var _managers_ShowProfileModal_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./managers/ShowProfileModal.js */ "./src/managers/ShowProfileModal.js");
/* harmony import */ var _managers_ChatManager_js__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./managers/ChatManager.js */ "./src/managers/ChatManager.js");
// File: src/App.js


















// NEW IMPORTS FOR CHAT MODULE using the wrapper for simplified instantiation


/**
 * Main application class.
 * This class initializes core managers, sets up the UI,
 * loads persisted state, and launches the test chat section ("support").
 *
 * All chat-related logic (state management, dialogue, localization)
 * is encapsulated within ChatManager.
 */
class App {
  constructor(deps = {}) {
    // Initialize or inject ViewManager and bind UI events.
    this.viewManager = deps.viewManager || new _managers_ViewManager_js__WEBPACK_IMPORTED_MODULE_7__.ViewManager(this);
    this.viewManager.bindEvents(this);

    // Create or inject persistence managers.
    this.sqliteDataManager = deps.sqliteDataManager || new _managers_SQLiteDataManager_js__WEBPACK_IMPORTED_MODULE_3__.SQLiteDataManager();
    this.databaseManager = deps.databaseManager || new _managers_DatabaseManager_js__WEBPACK_IMPORTED_MODULE_4__.DatabaseManager(this.sqliteDataManager);

    // Application state variables.
    this.isCameraOpen = false;
    this.selfieData = null;

    // Initialize core domain managers.
    this.languageManager = deps.languageManager || new _managers_LanguageManager_js__WEBPACK_IMPORTED_MODULE_8__.LanguageManager('language-selector');
    this.cameraSectionManager = deps.cameraSectionManager || new _managers_CameraSectionManager_js__WEBPACK_IMPORTED_MODULE_9__.CameraSectionManager();
    this.viewManager.setCameraManager(this.cameraSectionManager);
    this.profileManager = deps.profileManager || new _managers_ProfileManager_js__WEBPACK_IMPORTED_MODULE_10__.ProfileManager(this.sqliteDataManager);
    this.visualEffectsManager = deps.visualEffectsManager || new _managers_VisualEffectsManager_js__WEBPACK_IMPORTED_MODULE_2__.VisualEffectsManager(this, this.viewManager.controlsPanel);
    const savedSequenceIndex = parseInt(_managers_StateManager_js__WEBPACK_IMPORTED_MODULE_5__.StateManager.get('currentSequenceIndex'), 10) || 0;
    this.ghostManager = deps.ghostManager || new _managers_GhostManager_js__WEBPACK_IMPORTED_MODULE_11__.GhostManager(savedSequenceIndex, this.profileManager, this);

    // Create EventManager first (handles diary operations, persists posts, etc.).
    this.eventManager = deps.eventManager || new _managers_EventManager_js__WEBPACK_IMPORTED_MODULE_12__.EventManager(this.databaseManager, this.languageManager, this.ghostManager, this.visualEffectsManager);
    this.eventManager.viewManager = this.viewManager;
    this.ghostManager.eventManager = this.eventManager;

    // Then create GameEventManager (wraps EventManager, loads event classes, etc.).
    this.gameEventManager = deps.gameEventManager || new _managers_GameEventManager_js__WEBPACK_IMPORTED_MODULE_14__.GameEventManager(this.eventManager, this, this.languageManager);

    // Now pass GameEventManager into QuestManager (so activateEvent is available).
    this.questManager = deps.questManager || new _managers_QuestManager_js__WEBPACK_IMPORTED_MODULE_13__.QuestManager(this.gameEventManager, this);
    this.showProfileModal = deps.showProfileModal || new _managers_ShowProfileModal_js__WEBPACK_IMPORTED_MODULE_15__.ShowProfileModal(this);

    // Initialize ChatManager for the "support" chat section using the wrapper.
    this.chatManager = deps.chatManager || _managers_ChatManager_js__WEBPACK_IMPORTED_MODULE_16__.ChatManager.createChatManagerWrapper({
      databaseManager: this.databaseManager,
      languageManager: this.languageManager,
      sectionKey: 'support'
    });

    // Begin application initialization.
    this.init();
  }

  /**
   * Loads previously saved application state.
   */
  loadAppState() {
    const savedGhostId = _managers_StateManager_js__WEBPACK_IMPORTED_MODULE_5__.StateManager.get('currentGhostId');
    if (savedGhostId) {
      this.ghostManager.setCurrentGhost(parseInt(savedGhostId));
    } else {
      this.ghostManager.setCurrentGhost(1);
    }
  }

  /**
   * Initializes the application.
   * Among other tasks, this method launches the support chat section.
   */
  async init() {
    await this.databaseManager.initDatabasePromise;
    console.log("Database initialization complete.");
    this.loadAppState();
    // Preload AI model before any camera usage
    await this.cameraSectionManager.preloadModel();
    await this.questManager.syncQuestState();
    this.questManager.restoreAllActiveQuests();
    // If the camera was marked as open before reload, restore the button state,
    // but do NOT reopen the camera or call getUserMedia automatically.
    if (_managers_StateManager_js__WEBPACK_IMPORTED_MODULE_5__.StateManager.isCameraOpen()) {
      this.viewManager.setCameraButtonActive(true);
      console.log("Camera button active state restored based on saved state.");
    }
    this.viewManager.showToggleCameraButton();
    this.viewManager.createTopCameraControls();

    // Initialize the chat section for "support"
    await this.chatManager.init();
    // Schedule support chat conversation to start after 5 seconds.
    this.chatManager.scheduleConversationStartIfInactive(5000);

    // If a profile exists, switch to main screen (and only then re-call updateDiaryDisplay).
    // IMPORTANT: Pass `this` as the third param so `ViewManager` can reference your main app instance.
    if (await this.profileManager.isProfileSaved()) {
      const profile = await this.profileManager.getProfile();
      console.log("Profile found:", profile);
      await this.viewManager.switchScreen('main-screen', 'main-buttons', this);
      this.viewManager.showToggleCameraButton();

      // Read state from previous save
      const postButtonDisabled = _managers_StateManager_js__WEBPACK_IMPORTED_MODULE_5__.StateManager.get("postButtonDisabled") === "true";
      this.viewManager.setPostButtonEnabled(!postButtonDisabled);
      this.viewManager.updateProfileDisplay(profile);
      this.selfieData = profile.selfie;

      // Render only the latest posts (lazy mode)
      await this.viewManager.loadLatestDiaryPosts();
    } else {
      console.log("Profile not found, showing landing screen.");

      // ALSO pass `this` here. Without it, `app` will be undefined in `ViewManager`.
      await this.viewManager.switchScreen('landing-screen', 'landing-buttons', this);
    }

    // In src/App.js, at the very end of init():
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.style.display = 'none';
      console.log("[App] Preloader hidden after AI model preload and app init.");
    }
  }
}

/***/ }),

/***/ "./src/config/paths.js":
/*!*****************************!*\
  !*** ./src/config/paths.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ASSETS_PATH: () => (/* binding */ ASSETS_PATH),
/* harmony export */   BASE_PATH: () => (/* binding */ BASE_PATH),
/* harmony export */   COCO_SSD_MODEL: () => (/* binding */ COCO_SSD_MODEL),
/* harmony export */   COCO_SSD_URL: () => (/* binding */ COCO_SSD_URL),
/* harmony export */   SQL_WASM_URL: () => (/* binding */ SQL_WASM_URL),
/* harmony export */   TFJS_URL: () => (/* binding */ TFJS_URL)
/* harmony export */ });
// config/paths.js
const BASE_PATH = window.location.hostname.includes("github.io") ? "/testerer-deploy.github.io" : "";
const ASSETS_PATH = `${BASE_PATH}/assets`;
const SQL_WASM_URL = `${ASSETS_PATH}/libs/db/sql-wasm.js`;
const TFJS_URL = `${ASSETS_PATH}/libs/tf.min.js`;
const COCO_SSD_URL = `${ASSETS_PATH}/libs/coco-ssd.min.js`;
const COCO_SSD_MODEL = `${ASSETS_PATH}/models/coco-ssd/model.json`;

/***/ }),

/***/ "./src/config/stateKeys.js":
/*!*********************************!*\
  !*** ./src/config/stateKeys.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// config/stateKeys.js
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  CURRENT_SEQUENCE_INDEX: 'currentSequenceIndex',
  POST_BUTTON_DISABLED: 'postButtonDisabled',
  CAMERA_BUTTON_ACTIVE: 'cameraButtonActive',
  CAMERA_OPEN: 'cameraOpen',
  ACTIVE_QUEST_KEY: 'activeQuestKey',
  MIRROR_QUEST_READY: 'mirrorQuestReady',
  WELCOME_DONE: 'welcomeDone',
  REPEATING_QUEST_STATE: 'quest_state_repeating_quest',
  GAME_FINALIZED: 'gameFinalized'
});

/***/ }),

/***/ "./src/locales/chatLocales_en.js":
/*!***************************************!*\
  !*** ./src/locales/chatLocales_en.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
const chatLocales_en = {
  // Initial greeting from the chat bot
  "greeting": "Hello! How may I assist you today?",
  // Prompt for the user to choose an option
  "response_prompt": "Please choose one of the following options:",
  // Answer options for the initial dialogue
  "option_1": "Tell me more about this.",
  "option_2": "I don't understand.",
  "option_3": "Ignore.",
  // Additional option variants (if needed)
  "option_1_1": "Could you elaborate further?",
  "option_1_2": "I'd like more details.",
  "option_2_1": "Please explain further.",
  // User and spirit messages in subsequent dialogues
  "user_reply_1": "I have a question regarding the service.",
  "spirit_response_1": "Certainly, let me explain.",
  "user_reply_2": "I'm still not clear on this.",
  "spirit_response_2": "Allow me to provide additional information.",
  "user_reply_3": "Thank you for the clarification.",
  "spirit_response_3": "You're welcome.",
  // End-of-conversation message
  "end_of_conversation": "Thank you for chatting!",
  // Conversation section name for support chat
  "chat_support": "Support Chat"
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (chatLocales_en);

/***/ }),

/***/ "./src/locales/chatLocales_ru.js":
/*!***************************************!*\
  !*** ./src/locales/chatLocales_ru.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
const chatLocales_ru = {
  // Initial greeting from the chat bot
  "greeting": "Здравствуйте! Чем могу помочь?",
  // Prompt for the user to choose an option
  "response_prompt": "Пожалуйста, выберите один из вариантов:",
  // Answer options for the initial dialogue
  "option_1": "Расскажите подробнее.",
  "option_2": "Я не понимаю.",
  "option_3": "Игнорировать.",
  // Additional option variants (if needed)
  "option_1_1": "Можете рассказать подробнее?",
  "option_1_2": "Нужны дополнительные детали.",
  "option_2_1": "Пожалуйста, объясните подробнее.",
  // User and spirit messages in subsequent dialogues
  "user_reply_1": "У меня есть вопрос по услуге.",
  "spirit_response_1": "Конечно, разрешите объяснить.",
  "user_reply_2": "Я все еще не понимаю.",
  "spirit_response_2": "Позвольте предоставить дополнительную информацию.",
  "user_reply_3": "Спасибо за разъяснение.",
  "spirit_response_3": "Пожалуйста.",
  // End-of-conversation message
  "end_of_conversation": "Спасибо за беседу!",
  // Conversation section name for support chat
  "chat_support": "Служба поддержки"
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (chatLocales_ru);

/***/ }),

/***/ "./src/locales/chatLocales_uk.js":
/*!***************************************!*\
  !*** ./src/locales/chatLocales_uk.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
const chatLocales_uk = {
  // Initial greeting from the chat bot
  "greeting": "Вітаємо! Чим можу допомогти?",
  // Prompt for the user to choose an option
  "response_prompt": "Будь ласка, оберіть один із варіантів:",
  // Answer options for the initial dialogue
  "option_1": "Розкажіть докладніше.",
  "option_2": "Я не розумію.",
  "option_3": "Ігнорувати.",
  // Additional option variants (if needed)
  "option_1_1": "Будь ласка, розкажіть детальніше.",
  "option_1_2": "Мені потрібні додаткові подробиці.",
  "option_2_1": "Поясніть, будь ласка, детальніше.",
  // User and spirit messages in subsequent dialogues
  "user_reply_1": "У мене є питання щодо послуги.",
  "spirit_response_1": "Звичайно, дозвольте пояснити.",
  "user_reply_2": "Я все ще не розумію.",
  "spirit_response_2": "Дозвольте надати додаткову інформацію.",
  "user_reply_3": "Дякую за роз'яснення.",
  "spirit_response_3": "Будь ласка.",
  // End-of-conversation message
  "end_of_conversation": "Дякуємо за розмову!",
  // Conversation section name for support chat
  "chat_support": "Підтримка"
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (chatLocales_uk);

/***/ }),

/***/ "./src/locales/locales.js":
/*!********************************!*\
  !*** ./src/locales/locales.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
const locales = {
  "en": {
    "welcome": "Welcome!",
    "post_repeating_event": "Отлично, ты справился с предыдущим заданием! Вот тебе новое.",
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
    "import": "Import",
    "answer": "Answer",
    "ignore": "Ignore",
    "open_camera": "Open Camera",
    "open_diary": "Open Diary",
    "mirror_quest": "They are asking me to come to the mirror...",
    "ignored_call": "I didn't answer, I don't know who it was. Hm.... Text. “З”. What would that mean...",
    "what_was_it": "What was that?"
  },
  "ru": {
    "welcome": "Добро пожаловать!",
    "post_repeating_event": "Отлично, ты справился с предыдущим заданием! Вот тебе новое.",
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
    "import": "Импорт",
    "answer": "Ответить",
    "ignore": "Игнорировать",
    "open_camera": "Открыть камеру",
    "open_diary": "Открыть дневник",
    "mirror_quest": "Они просят подойти меня к зеркалу.",
    "ignored_call": "Я не ответил(а), я не знаю, кто это. Хм.... Смс. \"З\". Что бы это значило...",
    "what_was_it": "Что это было?"
  },
  "uk": {
    "welcome": "Ласкаво просимо!",
    "post_repeating_event": "Отлично, ты справился с предыдущим заданием! Вот тебе новое.",
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
    "import": "Імпорт",
    "answer": "Відповісти",
    "ignore": "Ігнорувати",
    "open_camera": "Відкрити камеру",
    "open_diary": "Відкрити щоденник",
    "mirror_quest": "Вони просять підійти мене до дзеркала.",
    "ignored_call": "Я не відповів(ла), я не знаю, хто це. Хм.... Смс. «З». Що б це означало...",
    "what_was_it": "What was that?"
  }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (locales);

/***/ }),

/***/ "./src/managers/ApartmentPlanManager.js":
/*!**********************************************!*\
  !*** ./src/managers/ApartmentPlanManager.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ApartmentPlanManager: () => (/* binding */ ApartmentPlanManager)
/* harmony export */ });
/* harmony import */ var _ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ErrorManager.js */ "./src/managers/ErrorManager.js");
/* harmony import */ var _StateManager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./StateManager.js */ "./src/managers/StateManager.js");


class ApartmentPlanManager {
  /**
   * Constructor for ApartmentPlanManager.
   * @param {string} containerId - ID of the container where the apartment plan will be displayed.
   * @param {DatabaseManager} dbManager - Manager for database persistence.
   * @param {App} appInstance - Reference to the main application instance.
   */
  constructor(containerId, dbManager, appInstance) {
    this.app = appInstance; // Reference to main app (for UI delegation)
    this.container = document.getElementById(containerId);
    this.dbManager = dbManager;

    // Array of room objects for the current floor.
    // Each room has properties: { floor, startRow, startCol, endRow, endCol, type }
    this.rooms = [];

    // Current floor.
    this.currentFloor = 1;

    // Flags for cell selection.
    this.isSelecting = false;
    this.startCell = null;
    this.endCell = null;

    // Grid dimensions (16×16 cells).
    this.gridRows = 16;
    this.gridCols = 16;

    // Create grid and bind events.
    this.createGrid();
    this.attachEvents();

    // Load plan data for the current floor after DB initialization.
    this.dbManager.initDatabasePromise.then(() => {
      this.loadFromDB();
    });

    // Bind event listener for the "Next" button on the apartment plan screen.
    const nextBtn = document.getElementById("apartment-plan-next-btn");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        // Optionally disable the button to prevent double-clicks.
        nextBtn.disabled = true;
        // Delegate transition to the selfie screen via ViewManager.
        this.app.viewManager.goToSelfieScreen(this.app);
      });
    } else {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__.ErrorManager.logError("Apartment plan Next button not found during initialization.", "ApartmentPlanManager");
    }
  }

  /**
   * createGrid – Creates a grid container for the apartment plan.
   */
  createGrid() {
    this.gridContainer = document.createElement('div');
    this.gridContainer.style.display = "grid";
    this.gridContainer.style.gridTemplateColumns = `repeat(${this.gridCols}, 50px)`;
    this.gridContainer.style.gridAutoRows = "50px";
    this.gridContainer.style.gap = "1px";
    this.container.innerHTML = "";
    this.container.appendChild(this.gridContainer);
    this.initGrid();
  }

  /**
   * initGrid – Initializes the grid by creating cells.
   */
  initGrid() {
    this.gridContainer.innerHTML = "";
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const cell = document.createElement("div");
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.style.width = "50px";
        cell.style.height = "50px";
        cell.style.border = "1px solid #ccc";
        cell.style.textAlign = "center";
        cell.style.verticalAlign = "middle";
        cell.style.cursor = "pointer";
        this.gridContainer.appendChild(cell);
      }
    }
  }

  /**
   * attachEvents – Binds mouse and touch event handlers for cell selection.
   */
  attachEvents() {
    this.gridContainer.addEventListener("mousedown", e => this.startSelection(e));
    this.gridContainer.addEventListener("mousemove", e => this.updateSelection(e));
    document.addEventListener("mouseup", e => this.finishSelection(e));
    this.gridContainer.addEventListener("touchstart", e => this.handleTouchStart(e));
    this.gridContainer.addEventListener("touchmove", e => this.handleTouchMove(e));
    this.gridContainer.addEventListener("touchend", e => this.handleTouchEnd(e));
  }
  handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.tagName === "DIV") {
      this.startSelection({
        clientX: touch.clientX,
        clientY: touch.clientY,
        target
      });
    }
  }
  handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.tagName === "DIV") {
      this.updateSelection({
        clientX: touch.clientX,
        clientY: touch.clientY,
        target
      });
    }
  }
  handleTouchEnd(e) {
    e.preventDefault();
    this.finishSelection(e);
  }

  /**
   * startSelection – Begins cell selection.
   */
  startSelection(e) {
    if (e.target.tagName === "DIV") {
      this.isSelecting = true;
      const row = parseInt(e.target.dataset.row);
      const col = parseInt(e.target.dataset.col);
      this.startCell = {
        row,
        col
      };
      this.endCell = {
        row,
        col
      };
      this.highlightSelection();
    }
  }

  /**
   * updateSelection – Updates cell selection as the pointer moves.
   */
  updateSelection(e) {
    if (this.isSelecting && e.target.tagName === "DIV") {
      const row = parseInt(e.target.dataset.row);
      const col = parseInt(e.target.dataset.col);
      this.endCell = {
        row,
        col
      };
      this.highlightSelection();
    }
  }

  /**
   * finishSelection – Completes cell selection and shows the location type modal.
   */
  finishSelection(e) {
    // Ignore events inside modal overlay.
    if (e.target.closest('#location-type-modal-overlay')) return;
    if (this.isSelecting) {
      this.isSelecting = false;
      if (!this.startCell || !this.endCell) {
        this.startCell = {
          row: 0,
          col: 0
        };
        this.endCell = {
          row: this.gridRows - 1,
          col: this.gridCols - 1
        };
      }
      // Delegate modal display to ViewManager.
      this.app.viewManager.showLocationTypeModal(selectedType => {
        // Confirm callback: save location type and add room.
        if (this.app && this.app.profileManager) {
          this.app.profileManager.saveLocationType(selectedType);
        }
        const room = {
          floor: this.currentFloor,
          startRow: Math.min(this.startCell.row, this.endCell.row),
          startCol: Math.min(this.startCell.col, this.endCell.col),
          endRow: Math.max(this.startCell.row, this.endCell.row),
          endCol: Math.max(this.startCell.col, this.endCell.col),
          type: selectedType
        };
        this.rooms.push(room);
        this.saveToDB();
        this.renderRooms();
        // Enable the "Next" button on the apartment plan screen.
        if (this.app && this.app.viewManager && typeof this.app.viewManager.setApartmentPlanNextButtonEnabled === 'function') {
          this.app.viewManager.setApartmentPlanNextButtonEnabled(true);
        }
      }, () => {
        // Cancel callback: use default type "Other".
        console.log("No location selected, default type 'Other' chosen.");
        if (this.app && this.app.profileManager) {
          this.app.profileManager.saveLocationType("Other");
        }
        const room = {
          floor: this.currentFloor,
          startRow: Math.min(this.startCell.row, this.endCell.row),
          startCol: Math.min(this.startCell.col, this.endCell.col),
          endRow: Math.max(this.startCell.row, this.endCell.row),
          endCol: Math.max(this.startCell.col, this.endCell.col),
          type: "Other"
        };
        this.rooms.push(room);
        this.saveToDB();
        this.renderRooms();
        if (this.app && this.app.viewManager && typeof this.app.viewManager.setApartmentPlanNextButtonEnabled === 'function') {
          this.app.viewManager.setApartmentPlanNextButtonEnabled(true);
        }
      });
    }
  }

  /**
   * highlightSelection – Visually highlights the selected area in the grid.
   */
  highlightSelection() {
    Array.from(this.gridContainer.children).forEach(cell => {
      cell.style.backgroundColor = "";
    });
    if (!this.startCell || !this.endCell) return;
    const startRow = Math.min(this.startCell.row, this.endCell.row);
    const endRow = Math.max(this.startCell.row, this.endCell.row);
    const startCol = Math.min(this.startCell.col, this.endCell.col);
    const endCol = Math.max(this.startCell.col, this.endCell.col);
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const cell = this.gridContainer.querySelector(`div[data-row='${r}'][data-col='${c}']`);
        if (cell) cell.style.backgroundColor = "rgba(255, 0, 0, 0.3)";
      }
    }
  }

  /**
   * renderRooms – Recreates the grid and highlights cells corresponding to saved rooms for the current floor.
   */
  renderRooms() {
    this.initGrid();
    this.rooms.forEach(room => {
      if (room.floor === this.currentFloor) {
        for (let r = room.startRow; r <= room.endRow; r++) {
          for (let c = room.startCol; c <= room.endCol; c++) {
            const cell = this.gridContainer.querySelector(`div[data-row='${r}'][data-col='${c}']`);
            if (cell) cell.style.backgroundColor = "rgba(0, 150, 255, 0.5)";
          }
        }
      }
    });
  }

  /**
   * saveToDB – Saves the apartment plan (rooms) for the current floor to the database.
   */
  saveToDB() {
    const currentRooms = this.rooms.filter(room => room.floor === this.currentFloor);
    console.log("Saving rooms to DB: ", currentRooms);
    this.dbManager.addApartmentRooms(this.currentFloor, currentRooms);
  }

  /**
   * loadFromDB – Loads the apartment plan data for the current floor from the database.
   */
  loadFromDB() {
    console.log("Loading data for floor: ", this.currentFloor);
    this.dbManager.getApartmentPlan(this.currentFloor, rooms => {
      if (!rooms || rooms.length === 0) {
        console.log(`No rooms found for floor ${this.currentFloor}, using default.`);
      } else {
        console.log(`Rooms found for floor ${this.currentFloor}: `, rooms);
      }
      this.rooms = rooms;
      this.renderRooms();
    });
  }

  /**
   * nextFloor – Switches to the next floor and loads its data.
   */
  nextFloor() {
    console.log("Switching to next floor");
    this.currentFloor++;
    this.loadFromDB();
  }

  /**
   * prevFloor – Switches to the previous floor if possible.
   */
  prevFloor() {
    if (this.currentFloor > 1) {
      console.log("Switching to previous floor");
      this.currentFloor--;
      this.loadFromDB();
    }
  }
}

/***/ }),

/***/ "./src/managers/CameraSectionManager.js":
/*!**********************************************!*\
  !*** ./src/managers/CameraSectionManager.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CameraSectionManager: () => (/* binding */ CameraSectionManager)
/* harmony export */ });
/* harmony import */ var _ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ErrorManager.js */ "./src/managers/ErrorManager.js");
/* harmony import */ var _config_paths_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../config/paths.js */ "./src/config/paths.js");
// CameraSectionManager.js


class CameraSectionManager {
  /**
   * Constructor for CameraSectionManager.
   * Initializes:
   * - videoElement: Created dynamically on the first call to attachTo().
   * - stream: Stores the MediaStream obtained from getUserMedia.
   * - onVideoReady: Callback invoked when the video stream is ready (after loadedmetadata event).
   * - onCameraClosed: Callback invoked after the camera is stopped.
   */
  constructor() {
    this.videoElement = null;
    this.stream = null;
    this.onVideoReady = null;
    this.onCameraClosed = null;

    // New properties for extended functionality
    this.isDetecting = false;
    this.aiDetectionTimer = null;
    this.aiModel = null;
    this.aiDetectionInterval = 5000; // 5 seconds default
    this.currentDetectionConfig = null; // To be generated for repeating quests

    this.recordingStartTime = null;
    this.recordingTimerId = null;

    // Persistent detection frame element
    this.detectionFrame = null;

    // Reset detection frame when repeating quest completes
    document.addEventListener('questCompleted', e => {
      if (e.detail === 'repeating_quest') {
        this.resetDetectionFrame();
      }
    });
  }

  /**
   * preloadModel – Preloads the COCO-SSD model so that detection can start immediately later.
   * Stores the loading promise to avoid double-loading.
   */
  async preloadModel() {
    if (!this.modelPromise) {
      console.log("[CameraSectionManager] Preloading AI model...");
      this.modelPromise = cocoSsd.load({
        modelUrl: _config_paths_js__WEBPACK_IMPORTED_MODULE_1__.COCO_SSD_MODEL
      });
    }
    try {
      this.aiModel = await this.modelPromise;
      console.log("[CameraSectionManager] AI model preloaded successfully.");
    } catch (error) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__.ErrorManager.logError(error, "CameraSectionManager.preloadModel");
    }
  }

  /**
   * attachTo(containerId, options)
   * Attaches the video element to the specified container.
   * Creates the video element if it doesn't exist, applies style options,
   * and clears the container before appending.
   *
   * @param {string} containerId - The ID of the container.
   * @param {Object} [options={}] - CSS style properties for the video element.
   */
  attachTo(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__.ErrorManager.logError(`Container with id "${containerId}" not found!`, "attachTo");
      return;
    }
    if (!this.videoElement) {
      this.videoElement = document.createElement('video');
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;
      // Ensure global id for referencing in AR.js
      this.videoElement.id = "global-camera-video";
    } else if (this.videoElement.parentNode) {
      this.videoElement.parentNode.removeChild(this.videoElement);
    }
    for (const prop in options) {
      this.videoElement.style[prop] = options[prop];
    }
    container.innerHTML = "";
    container.appendChild(this.videoElement);
  }

  /**
   * startCamera – Starts the camera by requesting access via getUserMedia.
   * If already running, logs a message and does nothing.
   * Upon success, sets the video element's source to the stream.
   * Once the video metadata is loaded, calls onVideoReady (if defined)
   * and dispatches the custom "cameraReady" event.
   */
  async startCamera() {
    if (this.stream) {
      console.log("Camera already started");
      return;
    }
    try {
      // Automatically attach video element if not created yet.
      if (!this.videoElement) {
        this.attachTo("global-camera", {
          width: "100%",
          height: "100%",
          filter: "grayscale(100%)"
        });
        console.log("Video element was not created; auto-attached to 'global-camera'.");
      }
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const constraints = {
        video: {
          facingMode: isMobile ? "environment" : "user"
        }
      };
      console.log(`Starting camera with facing mode: ${constraints.video.facingMode}`);
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (!this.videoElement) {
        _ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__.ErrorManager.logError("Video element not created!", "startCamera");
        return;
      }
      this.videoElement.srcObject = this.stream;

      // Если метаданные уже загружены (быстрый F5), запускаем сразу
      if (this.videoElement.readyState >= 2) {
        console.log("Video metadata already ready; dispatching cameraReady immediately");
        if (typeof this.onVideoReady === "function") {
          this.onVideoReady();
        }
        document.dispatchEvent(new CustomEvent("cameraReady"));
        // Create persistent detection frame once video is ready
        this.createDetectionFrame();
      } else {
        // Иначе ждём обычный loadedmetadata
        this.videoElement.addEventListener("loadedmetadata", () => {
          console.log("loadedmetadata: Video stream is ready");
          if (typeof this.onVideoReady === "function") {
            this.onVideoReady();
          }
          document.dispatchEvent(new CustomEvent("cameraReady"));
          // Create persistent detection frame once video is ready
          this.createDetectionFrame();
        }, {
          once: true
        });
      }
    } catch (error) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__.ErrorManager.logError(error, "startCamera");
    }
  }

  /**
   * stopCamera – Stops the current camera stream.
   * Iterates over all tracks in the stream and stops them.
   * Resets the stream property to null and calls onCameraClosed (if defined).
   */
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
      if (typeof this.onCameraClosed === "function") {
        this.onCameraClosed();
      }
    }
  }

  // ---------------- Extended Methods ----------------

  /**
   * createDetectionFrame – Creates a full-screen white border that pulses.
   */
  createDetectionFrame() {
    // Inject pulsing keyframes once
    if (!document.getElementById('detection-frame-style')) {
      const style = document.createElement('style');
      style.id = 'detection-frame-style';
      style.textContent = `
  @keyframes detectionPulse {
    0%   { transform: scale(1);   opacity: 0.8; }
    50%  { transform: scale(1.02);opacity: 1;   }
    100% { transform: scale(1);   opacity: 0.8; }
  }`;
      document.head.appendChild(style);
    }
    this.detectionFrame = document.createElement('div');
    Object.assign(this.detectionFrame.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      border: '3px solid #fff',
      boxSizing: 'border-box',
      pointerEvents: 'none',
      animation: 'detectionPulse 2s infinite'
    });
    document.body.appendChild(this.detectionFrame);
    console.log('Detection frame initialized and pulsing.');
  }

  /**
   * updateDetectionFrame – Shrinks the frame to match detected object's bbox.
   * @param {Array<number>} bbox – [x, y, width, height]
   */
  updateDetectionFrame(bbox) {
    const [x, y, w, h] = bbox;
    this.detectionFrame.style.transition = 'all 0.3s ease-out';
    this.detectionFrame.style.left = `${x}px`;
    this.detectionFrame.style.top = `${y}px`;
    this.detectionFrame.style.width = `${w}px`;
    this.detectionFrame.style.height = `${h}px`;
    // Stop pulsing while focused on object
    this.detectionFrame.style.animation = '';
    console.log(`Detection frame moved to bbox: ${bbox}`);
  }

  /**
   * resetDetectionFrame – Returns the frame back to full-screen and re-enables pulsing.
   */
  resetDetectionFrame() {
    this.detectionFrame.style.transition = 'all 0.5s ease-out';
    this.detectionFrame.style.left = '0';
    this.detectionFrame.style.top = '0';
    this.detectionFrame.style.width = '100%';
    this.detectionFrame.style.height = '100%';
    this.detectionFrame.style.animation = 'detectionPulse 2s infinite';
    console.log('Detection frame reset to full-screen and pulsing.');
  }

  /**
   * startARMode
   * Activates AR mode by inserting an AR.js scene that uses the same video stream.
   */
  startARMode() {
    // Use the global video element id for AR.js reference
    if (!this.videoElement || !this.stream) {
      console.warn("Camera is not active. AR mode cannot be started.");
      return;
    }
    // Create AR scene markup with reference to the video element id
    const arMarkup = `
      <a-scene embedded arjs="sourceType: video; videoElement: #${this.videoElement.id}">
        <a-marker preset="hiro">
          <a-box position="0 0.5 0" material="color: red;"></a-box>
        </a-marker>
        <a-camera-static></a-camera-static>
      </a-scene>
    `;
    // Insert AR scene into DOM (for example, at the end of the body)
    document.body.insertAdjacentHTML('beforeend', arMarkup);
    console.log("AR mode activated.");
  }

  /**
   * stopARMode
   * Deactivates AR mode by removing the AR.js scene from the DOM.
   */
  stopARMode() {
    const arScene = document.querySelector('a-scene[arjs]');
    if (arScene) {
      arScene.remove();
      console.log("AR mode deactivated.");
    }
  }

  /**
   * applyFilter
   * Applies a CSS filter to the video element.
   * @param {string} filterType - 'nightVision', 'blackWhite' or '' for none.
   */
  applyFilter(filterType) {
    if (!this.videoElement) return;
    if (filterType === 'nightVision') {
      this.videoElement.style.filter = 'brightness(150%) contrast(120%) sepia(100%) hue-rotate(90deg)';
    } else if (filterType === 'blackWhite') {
      this.videoElement.style.filter = 'grayscale(100%)';
    } else {
      this.videoElement.style.filter = '';
    }
    console.log(`Filter applied: ${filterType}`);
  }

  /**
   * startRecordingTimer
   * Starts a timer (via UI overlay managed externally) for recording duration.
   */
  startRecordingTimer() {
    this.recordingStartTime = Date.now();
    // Here we assume that the UI overlay for timer is created by ViewManager.
    // In case it is not, you can create a temporary element.
    const timerElem = document.getElementById("recording-timer");
    if (timerElem) {
      timerElem.style.display = "block";
      this.recordingTimerId = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
        timerElem.innerText = `Recording: ${elapsed} sec`;
      }, 1000);
    }
  }

  /**
   * stopRecordingTimer
   * Stops the recording timer and hides the UI overlay.
   */
  stopRecordingTimer() {
    clearInterval(this.recordingTimerId);
    const timerElem = document.getElementById("recording-timer");
    if (timerElem) {
      timerElem.style.display = "none";
    }
  }

  /**
   * updateBatteryStatus
   * Retrieves battery status using the Battery API and displays it in a UI overlay.
   */
  async updateBatteryStatus() {
    try {
      const battery = await navigator.getBattery();
      const batteryElem = document.getElementById("battery-status");
      const update = () => {
        if (batteryElem) {
          batteryElem.innerText = `Battery: ${Math.floor(battery.level * 100)}%`;
        }
      };
      update();
      battery.addEventListener('levelchange', update);
      if (batteryElem) {
        batteryElem.style.display = "block";
      }
    } catch (error) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__.ErrorManager.logError(error, "updateBatteryStatus");
    }
  }

  /**
   * startAIDetection
   * Loads the COCO-SSD model if necessary and begins detection loop.
   * Stores only the `target` property from config for quest logic.
   * @param {{ target?: string }} config
   */
  async startAIDetection(config = {}) {
    this.currentDetectionConfig = {
      target: config.target || null
    };
    this.isDetecting = true;
    console.log(`[CameraSectionManager] startAIDetection(): target = "${this.currentDetectionConfig.target}"`);
    if (!this.aiModel) {
      console.log("[CameraSectionManager] Waiting for preloaded model…");
      await this.modelPromise; // если вы уже сделали preloadModel
      if (!this.aiModel) {
        console.error("[CameraSectionManager] Model failed to preload");
        return;
      }
    }
    this.runAIDetection();
  }

  /**
   * runAIDetection
   * Performs object detection on the current video frame and processes predictions.
   */
  async runAIDetection() {
    if (!this.isDetecting) {
      return;
    }
    if (!this.videoElement || this.videoElement.readyState < 2) {
      // video not ready yet; try again shortly
      this.aiDetectionTimer = setTimeout(() => this.runAIDetection(), this.aiDetectionInterval);
      return;
    }
    try {
      const predictions = await this.aiModel.detect(this.videoElement);
      console.log("[CameraSectionManager] predictions:", predictions);
      this.handleAIPredictions(predictions);
    } catch (error) {
      console.error("[CameraSectionManager] Error during detect():", error);
    }
    this.aiDetectionTimer = setTimeout(() => this.runAIDetection(), this.aiDetectionInterval);
  }

  /**
   * handleAIPredictions
   * Filters predictions by the current target and confidence,
   * draws a frame and dispatches `objectDetected` when found.
   * @param {Array<{class: string, score: number, bbox: number[]}>} predictions
   */
  handleAIPredictions(predictions) {
    const target = this.currentDetectionConfig?.target;
    console.log(`[CameraSectionManager] handleAIPredictions(): looking for "${target}"`);
    if (!target) return;
    for (const pred of predictions) {
      // Only process high-confidence hits for the current target
      if (pred.score > 0.6 && pred.class === target) {
        console.log(`[CameraSectionManager] MATCH for "${target}" (score=${pred.score.toFixed(3)})`, pred.bbox);
        this.animateCornerFrame(pred.bbox);
        // Notify quest logic that the target was found
        document.dispatchEvent(new CustomEvent("objectDetected", {
          detail: target
        }));
      }
    }
  }

  /**
   * animateCornerFrame – Shrinks the persistent frame to bbox instead of creating a new one.
   */
  animateCornerFrame(bbox) {
    if (!this.detectionFrame) return;
    this.updateDetectionFrame(bbox);
  }

  /**
   * stopAIDetection
   * Stops the AI detection loop.
   */
  stopAIDetection() {
    this.isDetecting = false;
    if (this.aiDetectionTimer) {
      clearTimeout(this.aiDetectionTimer);
      this.aiDetectionTimer = null;
    }
    console.log("[CameraSectionManager] AI detection stopped.");
  }
}

/***/ }),

/***/ "./src/managers/ChatManager.js":
/*!*************************************!*\
  !*** ./src/managers/ChatManager.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ChatManager: () => (/* binding */ ChatManager)
/* harmony export */ });
/* harmony import */ var _config_paths_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../config/paths.js */ "./src/config/paths.js");
/* harmony import */ var _utils_TemplateEngine_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/TemplateEngine.js */ "./src/utils/TemplateEngine.js");
/* harmony import */ var _utils_SpiritBoardUtils_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/SpiritBoardUtils.js */ "./src/utils/SpiritBoardUtils.js");
/* harmony import */ var _StateManager_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./StateManager.js */ "./src/managers/StateManager.js");




class ChatManager {
  /**
   * @param {Object} options - Configuration options for the chat.
   *  - templateUrl: URL to fetch the chat template fragment (default: dynamic base path + '/templates/chat_template.html')
   *  - mode: 'full' (default) for full chat, or 'board-only' for displaying only the spirit board.
   *  - basePath: (optional) override for the base path.
   *  - databaseManager: (optional) instance of DatabaseManager to load chat messages.
   *  - languageManager: (optional) instance of LanguageManager for locale integration.
   *  - sectionKey: (optional) unique identifier for the chat section.
   */
  constructor(options = {}) {
    this.templateUrl = options.templateUrl || `${_config_paths_js__WEBPACK_IMPORTED_MODULE_0__.BASE_PATH}/templates/chat_template.html`;
    this.mode = options.mode || 'full';
    this.container = null; // DOM element for the chat section
    this.databaseManager = options.databaseManager || null;
    // Optional language manager for localized strings.
    this.languageManager = options.languageManager || null;
    // Optional unique key to identify a chat section.
    this.sectionKey = options.sectionKey || null;
    // We'll store the scenario manager here if needed.
    this.scenarioManager = null;
  }

  /**
   * Static method to create a ChatManager instance with default options merged with any provided overrides.
   *
   * @param {Object} options - Custom options to override default values.
   * @returns {ChatManager} A new instance of ChatManager.
   */
  static createChatManagerWrapper(options = {}) {
    const defaultOptions = {
      templateUrl: `${_config_paths_js__WEBPACK_IMPORTED_MODULE_0__.BASE_PATH}/templates/chat_template.html`,
      mode: 'full'
    };
    return new ChatManager({
      ...defaultOptions,
      ...options
    });
  }

  /**
   * Returns the full state key by combining the section key (if provided) with the base key.
   *
   * @param {string} baseKey - The base key string (e.g. 'chat_started').
   * @returns {string} The composite state key.
   */
  getStateKey(baseKey) {
    return this.sectionKey ? `${this.sectionKey}_${baseKey}` : baseKey;
  }

  /**
   * Helper method to fetch a localized string by key.
   * If a languageManager is provided and contains the key, it returns the localized value.
   * Otherwise, returns the defaultValue.
   *
   * @param {string} key - The localization key.
   * @param {string} defaultValue - The fallback value if no localization is found.
   * @returns {string} Localized string.
   */
  getLocalizedString(key, defaultValue) {
    if (this.languageManager && this.languageManager.locales && typeof this.languageManager.getLanguage === 'function') {
      const lang = this.languageManager.getLanguage();
      if (this.languageManager.locales[lang] && this.languageManager.locales[lang][key]) {
        return this.languageManager.locales[lang][key];
      }
    }
    return defaultValue;
  }

  /**
   * Initializes the ChatManager by fetching the chat template fragment,
   * rendering it using the TemplateEngine with initial data (loading messages from DB if available),
   * and inserting it into the chat section in index.html.
   * Also initializes the conversation if not marked as completed.
   *
   * @returns {Promise<void>}
   */
  async init() {
    try {
      // Fetch the chat template fragment.
      const response = await fetch(this.templateUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch template from ${this.templateUrl}`);
      }
      const templateText = await response.text();

      // Load saved messages from the DatabaseManager.
      let messagesStr = "";
      if (this.databaseManager) {
        const chatMessages = this.databaseManager.getChatMessages();
        if (chatMessages && chatMessages.length > 0) {
          messagesStr = chatMessages.map(msg => `<div class="chat-message ${msg.sender}" style="margin-bottom: 0.5rem; padding: 0.5rem; border-radius: 4px; max-width: 80%; word-wrap: break-word;">${msg.message}</div>`).join("");
        }
      }

      // Get localized string for the spirit board content.
      const localizedSpiritBoardContent = this.getLocalizedString('spirit_board', 'Spirit Board');

      // Render the template.
      const data = {
        messages: messagesStr,
        spiritBoardContent: localizedSpiritBoardContent,
        options: '' // Initially no dialogue options.
      };
      const renderedHTML = _utils_TemplateEngine_js__WEBPACK_IMPORTED_MODULE_1__.TemplateEngine.render(templateText, data);

      // Insert rendered HTML into chat container.
      this.container = document.getElementById('chat-section');
      if (!this.container) {
        throw new Error('Chat section container (id="chat-section") not found in index.html');
      }
      this.container.innerHTML = renderedHTML;
      this.container.style.display = 'none';

      // If mode is 'board-only', hide the options container.
      if (this.mode === 'board-only') {
        const optionsEl = this.container.querySelector('#chat-options');
        if (optionsEl) {
          optionsEl.style.display = 'none';
        }
      }
      console.log('ChatManager initialized.');

      // --- Resume conversation only if it was started and not completed,
      // and only if no messages are currently shown (to avoid duplicate append) ---
      if (!this.isConversationActive()) {
        try {
          const module = await __webpack_require__.e(/*! import() */ "src_managers_ChatScenarioManager_js").then(__webpack_require__.bind(__webpack_require__, /*! ./ChatScenarioManager.js */ "./src/managers/ChatScenarioManager.js"));
          this.scenarioManager = new module.ChatScenarioManager(this, null);
          await this.scenarioManager.init();
        } catch (e) {
          console.error("Failed to resume ChatScenarioManager:", e);
        }
      } else {
        console.log("Conversation already active; skipping dialogue load to prevent duplicates.");
      }
    } catch (error) {
      console.error('Error initializing ChatManager:', error);
    }
  }

  /**
   * Returns true if a conversation is already active,
   * i.e. the chat has been started and there are messages in the chat.
   *
   * @returns {boolean}
   */
  isConversationActive() {
    const conversationStarted = _StateManager_js__WEBPACK_IMPORTED_MODULE_3__.StateManager.get(this.getStateKey('chat_started')) === 'true';
    const messagesEl = this.container && this.container.querySelector('#chat-messages');
    const hasMessages = messagesEl && messagesEl.children.length > 0;
    return conversationStarted && hasMessages;
  }

  /**
   * Shows the chat section.
   */
  show() {
    if (this.container) {
      this.container.style.display = 'block';
      console.log('ChatManager is now visible.');
    }
  }

  /**
   * Hides the chat section.
   */
  hide() {
    if (this.container) {
      this.container.style.display = 'none';
      console.log('ChatManager is now hidden.');
    }
  }

  /**
   * Sends an initial localized message to the chat.
   *
   * @param {string} localizedText - The text to send.
   */
  sendInitialMessage(localizedText) {
    if (!this.container) {
      console.error('ChatManager is not initialized.');
      return;
    }
    const messagesEl = this.container.querySelector('#chat-messages');
    if (messagesEl) {
      const messageHTML = `<div class="chat-message spirit" style="margin-bottom: 0.5rem; padding: 0.5rem; border-radius: 4px; max-width: 80%; word-wrap: break-word;">${localizedText}</div>`;
      messagesEl.innerHTML += messageHTML;
      console.log('Initial message sent:', localizedText);
    }
  }

  /**
   * Saves a chat message using the DatabaseManager.
   * @param {Object} msg - An object with properties: sender and text.
   */
  async saveMessage(msg) {
    if (this.databaseManager && typeof this.databaseManager.addChatMessage === 'function') {
      await this.databaseManager.addChatMessage(msg.sender, msg.text);
      console.log(`Message saved: [${msg.sender}] ${msg.text}`);
    }
  }

  /**
   * Loads a dialogue configuration and updates the chat content.
   *
   * The expected dialogueConfig format:
   * {
   *   messages: [
   *     { sender: 'spirit'|'user', text: '...', animateOnBoard: true|false },
   *     ...
   *   ],
   *   options: [
   *     { text: 'Option 1', onSelect: function },
   *     ...
   *   ]
   * }
   *
   * @param {Object} dialogueConfig - The dialogue configuration object.
   */
  async loadDialogue(dialogueConfig) {
    if (!this.container) {
      console.error('ChatManager is not initialized.');
      return;
    }
    let messagesHTML = '';
    for (const msg of dialogueConfig.messages) {
      // Get localized message text if available.
      const localizedMsg = this.getLocalizedString(msg.text, msg.text);
      messagesHTML += `<div class="chat-message ${msg.sender}" style="margin-bottom: 0.5rem; padding: 0.5rem; border-radius: 4px; max-width: 80%; word-wrap: break-word;">${localizedMsg}</div>`;
      if (msg.animateOnBoard) {
        const boardEl = this.container.querySelector('#spirit-board');
        if (boardEl) {
          (0,_utils_SpiritBoardUtils_js__WEBPACK_IMPORTED_MODULE_2__.animateText)(boardEl, localizedMsg);
        }
      }
      await this.saveMessage({
        sender: msg.sender,
        text: localizedMsg
      });
    }
    const messagesEl = this.container.querySelector('#chat-messages');
    if (messagesEl) {
      // Append new messages (history is preserved).
      messagesEl.innerHTML += messagesHTML;
    }

    // Update dialogue options using the new method.
    this.updateDialogueOptions(dialogueConfig.options);
    const boardEl = this.container.querySelector('#spirit-board');
    if (boardEl) {
      boardEl.innerHTML = '';
    }
    console.log('Dialogue loaded in ChatManager.');
  }

  /**
   * Updates the dialogue options block with the given options array.
   * This method re-renders the options block with localized option texts
   * and attaches click event listeners for each option.
   *
   * @param {Array} options - Array of dialogue option objects.
   */
  updateDialogueOptions(options) {
    const optionsEl = this.container.querySelector('#chat-options');
    if (optionsEl) {
      let optionsHTML = '';
      if (options && options.length > 0) {
        options.forEach((option, index) => {
          // Get localized option text if available.
          const localizedOptionText = this.getLocalizedString(option.text, option.text);
          optionsHTML += `<button class="button is-link dialogue-option" style="margin-bottom: 0.5rem;">${localizedOptionText}</button>`;
        });
      }
      // Set maxHeight if there are many options.
      if (options && options.length > 3) {
        optionsEl.style.maxHeight = '200px';
        optionsEl.style.overflowY = 'auto';
      } else {
        optionsEl.style.maxHeight = '';
        optionsEl.style.overflowY = '';
      }
      // Replace options to show current choices.
      optionsEl.innerHTML = optionsHTML;

      // Attach click event listeners to each option.
      const optionButtons = optionsEl.querySelectorAll('.dialogue-option');
      optionButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
          if (this.scenarioManager && typeof this.scenarioManager.advanceDialogue === 'function') {
            this.scenarioManager.advanceDialogue(index);
          } else {
            const option = options[index];
            console.log(`Option selected: ${option.text}`);
          }
        });
      });
      console.log('Dialogue options updated in ChatManager.');
    } else {
      console.error('Options container not found in ChatManager.');
    }
  }

  /**
   * Sets the display mode for the chat.
   *
   * @param {string} mode - 'full' for full chat, or 'board-only' for only the spirit board.
   */
  setMode(mode) {
    this.mode = mode;
    if (this.container) {
      const optionsEl = this.container.querySelector('#chat-options');
      if (mode === 'board-only' && optionsEl) {
        optionsEl.style.display = 'none';
      } else if (optionsEl) {
        optionsEl.style.display = 'block';
      }
    }
    console.log(`ChatManager mode set to: ${mode}`);
  }

  /**
   * Resets the current conversation by clearing saved state and reinitializing the dialogue.
   * This allows for independent conversation sessions without restarting the entire chat.
   */
  async restartConversation() {
    // Mark conversation as started.
    _StateManager_js__WEBPACK_IMPORTED_MODULE_3__.StateManager.set(this.getStateKey('chat_started'), 'true');
    // Clear conversation state in StateManager.
    _StateManager_js__WEBPACK_IMPORTED_MODULE_3__.StateManager.remove(this.getStateKey('chat_conversation_completed'));
    _StateManager_js__WEBPACK_IMPORTED_MODULE_3__.StateManager.remove(this.getStateKey('chat_currentDialogueIndex'));

    // Clear chat messages container to prevent duplicate messages.
    if (this.container) {
      const messagesEl = this.container.querySelector('#chat-messages');
      if (messagesEl) {
        messagesEl.innerHTML = '';
      }
    }

    // Reinitialize the scenario manager to start the dialogue from the beginning.
    try {
      const module = await __webpack_require__.e(/*! import() */ "src_managers_ChatScenarioManager_js").then(__webpack_require__.bind(__webpack_require__, /*! ./ChatScenarioManager.js */ "./src/managers/ChatScenarioManager.js"));
      this.scenarioManager = new module.ChatScenarioManager(this, null);
      await this.scenarioManager.init();
      console.log('Conversation restarted for section:', this.sectionKey || '(global)');
    } catch (e) {
      console.error("Failed to restart conversation:", e);
    }
  }

  /**
   * Schedules a conversation restart after a specified delay.
   * Automatically checks if a conversation is already active and aborts restart if so.
   *
   * @param {number} delay - Delay in milliseconds before restarting the conversation (default: 5000 ms).
   */
  scheduleConversationStartIfInactive(delay = 5000) {
    setTimeout(() => {
      if (!this.isConversationActive()) {
        this.restartConversation();
      } else {
        console.log('Conversation is already active; restart aborted.');
      }
    }, delay);
    console.log(`Conversation restart scheduled in ${delay} ms.`);
  }

  /**
   * Clears the chat state.
   * If a sectionKey is provided as an argument, clears only that section.
   * Otherwise, clears the global chat state.
   *
   * @param {string} [sectionKey] - Optional section key to clear.
   */
  clearChat(sectionKey) {
    const prefix = sectionKey ? `${sectionKey}_` : '';
    _StateManager_js__WEBPACK_IMPORTED_MODULE_3__.StateManager.remove(`${prefix}chat_started`);
    _StateManager_js__WEBPACK_IMPORTED_MODULE_3__.StateManager.remove(`${prefix}chat_currentDialogueIndex`);
    _StateManager_js__WEBPACK_IMPORTED_MODULE_3__.StateManager.remove(`${prefix}chat_conversation_completed`);
    console.log(`Chat cleared for section: ${sectionKey || 'global'}`);
  }
}

/***/ }),

/***/ "./src/managers/DatabaseManager.js":
/*!*****************************************!*\
  !*** ./src/managers/DatabaseManager.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DatabaseManager: () => (/* binding */ DatabaseManager)
/* harmony export */ });
/* harmony import */ var _SQLiteDataManager_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./SQLiteDataManager.js */ "./src/managers/SQLiteDataManager.js");
/* harmony import */ var _config_paths_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../config/paths.js */ "./src/config/paths.js");
/* harmony import */ var _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./ErrorManager.js */ "./src/managers/ErrorManager.js");




/**
 * DatabaseManager
 *
 * Responsible for managing the SQL database which stores:
 * - Diary entries
 * - Apartment plans
 * - Quest progress
 * - Ghost states
 * - Events
 * - Quests
 * - Chat messages (new)
 *
 * It uses SQLiteDataManager for persistence (IndexedDB) and ensures that
 * entries (such as diary entries) are stored in a way that the event key checks
 * (via isEventLogged) work correctly.
 */
class DatabaseManager {
  /**
   * Constructor for DatabaseManager.
   * @param {SQLiteDataManager} dataManager - Instance for persistence operations.
   */
  constructor(dataManager) {
    this.dataManager = dataManager; // Reference to the DataManager
    // The SQL.js database instance will be stored here.
    this.db = null;
    // A Promise that resolves after the database has been initialized.
    this.initDatabasePromise = this.initDatabase();
  }

  /**
   * initDatabase – Asynchronously initializes the database.
   * Restores the database from persistence if available;
   * otherwise creates a new database instance and sets up the required tables.
   * Tables: diary, apartment_plan, quest_progress, ghosts, events, quests.
   */
  async initDatabase() {
    try {
      // Load SQL.js, providing a locateFile function to find necessary files.
      const SQL = await initSqlJs({
        locateFile: file => `${_config_paths_js__WEBPACK_IMPORTED_MODULE_1__.BASE_PATH}/assets/libs/db/${file}`
      });

      // Restore database from IndexedDB if saved, otherwise create a new instance.
      this.db = await this.dataManager.initDatabase(SQL);
      console.log("📖 Database initialized!");
    } catch (error) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError(error, "DatabaseManager.initDatabase");
    }
  }

  /**
   * saveDatabase – Exports the database to a base64 string and persists it via the DataManager.
   */
  async saveDatabase() {
    if (!this.db) return;
    const binaryData = this.db.export();
    let binaryStr = "";
    for (let i = 0; i < binaryData.length; i++) {
      binaryStr += String.fromCharCode(binaryData[i]);
    }
    const base64 = btoa(binaryStr);
    await this.dataManager.saveDatabase(base64);
    console.log("Database saved (persisted) successfully.");
  }

  /**
   * addDiaryEntry – Adds a new entry to the diary table.
   * The entry is stored as a JSON string containing an "entry" property and a "postClass" property.
   * This format ensures that isEventLogged (which checks the "entry" field) works correctly.
   *
   * @param {string} entry - The text of the entry (usually a key or message).
   */
  async addDiaryEntry(entry) {
    if (!this.db) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError("Database not initialized!", "addDiaryEntry");
      return;
    }
    const timestamp = new Date().toISOString();
    this.db.run("INSERT INTO diary (entry, timestamp) VALUES (?, ?)", [entry, timestamp]);
    console.log("✅ Entry added:", entry);
    await this.saveDatabase();
  }

  /**
   * getDiaryEntries – Returns an array of diary entries sorted by descending timestamp.
   * Each entry is parsed from JSON, so that the "entry" property can be used for comparisons.
   *
   * @returns {Array} Array of entry objects: { id, entry, postClass, timestamp }.
   */
  getDiaryEntries() {
    if (!this.db) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError("Database not initialized!", "getDiaryEntries");
      return [];
    }
    const result = this.db.exec("SELECT * FROM diary ORDER BY timestamp DESC");
    if (result.length > 0) {
      return result[0].values.map(row => {
        let parsed;
        try {
          parsed = JSON.parse(row[1]);
        } catch (e) {
          // Fallback: if parsing fails, assume a plain entry.
          parsed = {
            entry: row[1],
            postClass: "user-post"
          };
          _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError(e, "getDiaryEntries JSON.parse");
        }
        return {
          id: row[0],
          ...parsed,
          timestamp: row[2]
        };
      });
    }
    return [];
  }

  /**
   * addQuestProgress – Adds a quest progress record to the quest_progress table.
   *
   * @param {string} questKey - The key of the quest.
   * @param {string} status - The status of the quest.
   */
  addQuestProgress(questKey, status) {
    if (!this.db) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError("Database not initialized!", "addQuestProgress");
      return;
    }
    this.db.run("INSERT INTO quest_progress (quest_key, status) VALUES (?, ?)", [questKey, status]);
    console.log(`✅ Quest progress added: ${questKey} - ${status}`);
    this.saveDatabase();
  }

  /**
   * getQuestProgress – Returns an array of progress records for the specified quest.
   *
   * @param {string} questKey - The key of the quest.
   * @returns {Array} Array of progress objects: { id, quest_key, status }.
   */
  getQuestProgress(questKey) {
    if (!this.db) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError("Database not initialized!", "getQuestProgress");
      return null;
    }
    const result = this.db.exec("SELECT * FROM quest_progress WHERE quest_key = ?", [questKey]);
    if (result.length > 0) {
      return result[0].values.map(row => ({
        id: row[0],
        quest_key: row[1],
        status: row[2]
      }));
    }
    return [];
  }

  /**
   * addApartmentRooms – Saves the apartment plan data for the specified floor.
   *
   * @param {number} floor - The floor number.
   * @param {Array} rooms - An array of room objects.
   */
  addApartmentRooms(floor, rooms) {
    if (!this.db) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError("Database not initialized!", "addApartmentRooms");
      return;
    }
    const roomData = JSON.stringify(rooms);
    this.db.run("DELETE FROM apartment_plan WHERE floor_number = ?", [floor]);
    this.db.run("INSERT INTO apartment_plan (floor_number, room_data) VALUES (?, ?)", [floor, roomData]);
    console.log(`✅ Apartment plan for floor ${floor} saved.`);
    this.saveDatabase();
  }

  /**
   * getApartmentPlan – Returns the apartment plan data for the specified floor.
   *
   * @param {number} floor - The floor number.
   * @param {function} callback - Callback function receiving the plan data array.
   */
  getApartmentPlan(floor, callback) {
    if (!this.db) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError("Database not initialized!", "getApartmentPlan");
      callback([]);
      return;
    }
    const result = this.db.exec("SELECT room_data FROM apartment_plan WHERE floor_number = ? ORDER BY id", [floor]);
    if (result.length > 0) {
      const rooms = result[0].values.map(row => {
        try {
          return JSON.parse(row[0]);
        } catch (e) {
          _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError(e, "getApartmentPlan JSON.parse");
          return row[0];
        }
      });
      callback(rooms);
    } else {
      callback([]);
    }
  }

  // ===== Methods for ghosts, events, and quests =====

  /**
   * saveGhostState – Saves or updates the ghost state in the ghosts table.
   *
   * @param {Object} ghost - Ghost object containing id (optional), name, status, progress.
   */
  saveGhostState(ghost) {
    if (!this.db) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError("Database not initialized!", "saveGhostState");
      return;
    }
    this.db.run(`INSERT OR REPLACE INTO ghosts (id, name, status, progress)
       VALUES ((SELECT id FROM ghosts WHERE id = ?), ?, ?, ?)`, [ghost.id || null, ghost.name, ghost.status || "", ghost.progress || 0]);
    console.log("✅ Ghost state saved:", ghost);
    this.saveDatabase();
  }

  /**
   * getGhostState – Retrieves the ghost state by ghost id.
   *
   * @param {number} ghostId - The ID of the ghost.
   * @returns {Object|null} The ghost object or null if not found.
   */
  getGhostState(ghostId) {
    if (!this.db) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError("Database not initialized!", "getGhostState");
      return null;
    }
    const result = this.db.exec("SELECT * FROM ghosts WHERE id = ?", [ghostId]);
    if (result.length > 0) {
      const row = result[0].values[0];
      return {
        id: row[0],
        name: row[1],
        status: row[2],
        progress: row[3]
      };
    }
    return null;
  }

  /**
   * saveEvent – Saves an event record in the events table.
   *
   * @param {Object} eventData - Object with properties: event_key, event_text, timestamp, completed (0 or 1).
   */
  saveEvent(eventData) {
    if (!this.db) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError("Database not initialized!", "saveEvent");
      return;
    }
    this.db.run(`INSERT INTO events (event_key, event_text, timestamp, completed)
       VALUES (?, ?, ?, ?)`, [eventData.event_key, eventData.event_text, eventData.timestamp, eventData.completed ? 1 : 0]);
    console.log("✅ Event saved:", eventData);
    this.saveDatabase();
  }

  /**
   * getEvents – Retrieves all event records from the events table.
   *
   * @returns {Array} An array of event objects.
   */
  getEvents() {
    if (!this.db) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError("Database not initialized!", "getEvents");
      return [];
    }
    const result = this.db.exec("SELECT * FROM events ORDER BY timestamp DESC");
    if (result.length > 0) {
      return result[0].values.map(row => ({
        id: row[0],
        event_key: row[1],
        event_text: row[2],
        timestamp: row[3],
        completed: row[4] === 1
      }));
    }
    return [];
  }

  /**
   * saveQuestRecord – Saves or updates a quest record in the quests table.
   *
   * @param {Object} questData - Object with properties: quest_key, status, current_stage, total_stages.
   */
  saveQuestRecord(questData) {
    if (!this.db) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError("Database not initialized!", "saveQuestRecord");
      return;
    }
    this.db.run(`INSERT OR REPLACE INTO quests (id, quest_key, status, current_stage, total_stages)
       VALUES ((SELECT id FROM quests WHERE quest_key = ?), ?, ?, ?, ?)`, [questData.quest_key, questData.quest_key, questData.status, questData.current_stage, questData.total_stages]);
    console.log("✅ Quest record saved:", questData);
    this.saveDatabase();
  }

  /**
   * getQuestRecord – Retrieves a quest record by quest key.
   *
   * @param {string} questKey - The key of the quest.
   * @returns {Object|null} The quest record or null if not found.
   */
  getQuestRecord(questKey) {
    if (!this.db) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError("Database not initialized!", "getQuestRecord");
      return null;
    }
    const result = this.db.exec("SELECT * FROM quests WHERE quest_key = ?", [questKey]);
    if (result.length > 0) {
      const row = result[0].values[0];
      return {
        id: row[0],
        quest_key: row[1],
        status: row[2],
        current_stage: row[3],
        total_stages: row[4]
      };
    }
    return null;
  }

  // ===== New Methods for Chat Integration =====

  /**
   * addChatMessage – Inserts a new chat message record into the chat_messages table.
   *
   * @param {string} sender - The sender of the message (e.g., 'user' or 'spirit').
   * @param {string} message - The chat message text.
   * @param {string} [timestamp] - Optional timestamp; if not provided, current ISO string is used.
   */
  addChatMessage(sender, message, timestamp = new Date().toISOString()) {
    if (!this.db) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError("Database not initialized!", "addChatMessage");
      return;
    }
    this.db.run("INSERT INTO chat_messages (sender, message, timestamp) VALUES (?, ?, ?)", [sender, message, timestamp]);
    console.log(`✅ Chat message added: [${sender}] ${message}`);
    this.saveDatabase();
  }

  /**
   * getChatMessages – Retrieves all chat message records from the chat_messages table.
   *
   * @returns {Array} Array of chat message objects: { id, sender, message, timestamp }.
   */
  getChatMessages() {
    if (!this.db) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError("Database not initialized!", "getChatMessages");
      return [];
    }
    const result = this.db.exec("SELECT * FROM chat_messages ORDER BY timestamp ASC");
    if (result.length > 0) {
      return result[0].values.map(row => ({
        id: row[0],
        sender: row[1],
        message: row[2],
        timestamp: row[3]
      }));
    }
    return [];
  }
}

/***/ }),

/***/ "./src/managers/ErrorManager.js":
/*!**************************************!*\
  !*** ./src/managers/ErrorManager.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ErrorManager: () => (/* binding */ ErrorManager)
/* harmony export */ });
/* harmony import */ var _NotificationManager_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./NotificationManager.js */ "./src/managers/NotificationManager.js");


/**
 * ErrorManager
 *
 * Centralized module for logging errors and displaying error notifications.
 * All errors in the application should be handled using logError and showError.
 */
class ErrorManager {
  /**
   * Logs an error with optional contextual information.
   *
   * @param {any} error - The error object or message.
   * @param {string} [context] - Optional context indicating where the error occurred.
   */
  static logError(error, context = "") {
    console.error(`Error${context ? " in " + context : ""}:`, error);
  }

  /**
   * Displays an error notification to the user.
   * Uses NotificationManager to show the error message.
   *
   * @param {string} message - The error message to display.
   */
  static showError(message) {
    const notificationManager = new _NotificationManager_js__WEBPACK_IMPORTED_MODULE_0__.NotificationManager();
    notificationManager.showNotification(message);
  }
}

/***/ }),

/***/ "./src/managers/EventManager.js":
/*!**************************************!*\
  !*** ./src/managers/EventManager.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EventManager: () => (/* binding */ EventManager)
/* harmony export */ });
/* harmony import */ var _ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ErrorManager.js */ "./src/managers/ErrorManager.js");


/**
 * EventManager
 * Responsible for handling diary (log) operations and recording system events.
 * - Adds diary entries (both user and ghost posts).
 * - Delegates the diary UI update to ViewManager.
 * - Can trigger short events (e.g., ghost quests) if needed.
 *
 * NOTE: The sequential linking of events is managed by GhostManager.
 */
class EventManager {
  /**
   * @param {DatabaseManager} databaseManager - Instance of the database manager.
   * @param {LanguageManager} languageManager - Localization manager.
   * @param {GhostManager} ghostManager - Manager handling ghost-related operations.
   * @param {VisualEffectsManager} visualEffectsManager - Manager handling visual effects.
   *
   * Note: The viewManager reference is expected to be set externally (e.g. in App.js).
   */
  constructor(databaseManager, languageManager, ghostManager, visualEffectsManager) {
    this.databaseManager = databaseManager;
    this.languageManager = languageManager;
    this.ghostManager = ghostManager;
    this.visualEffectsManager = visualEffectsManager;
    // viewManager is assigned externally after instantiation.
  }

  /**
   * isEventLogged
   * Checks whether an entry with the given event key has already been logged.
   * This method compares the stored entry key with the provided key.
   *
   * @param {string} eventKey - The event key to check.
   * @returns {boolean} True if the event is already logged, otherwise false.
   */
  isEventLogged(eventKey) {
    const entries = this.databaseManager.getDiaryEntries();
    // Compare the stored entry key with the provided key.
    return entries.some(entry => entry.entry === eventKey);
  }

  /**
   * addDiaryEntry
   * Adds an entry to the diary. It constructs an object with the entry text and post type,
   * serializes it as JSON, and saves it to the database. If the entry represents a system event
   * (e.g., from a ghost), it is additionally saved to the events table.
   *
   * After saving, it delegates the UI update (diary rendering) to the ViewManager.
   * Then, it calls the centralized visual effects method to animate the newly added entry.
   *
   * @param {string} entry - The text of the diary entry.
   * @param {boolean} [isPostFromGhost=false] - Flag to mark the entry as a ghost post.
   */
  async addDiaryEntry(entry, isPostFromGhost = false) {
    // Determine post class based on the source.
    const postClass = isPostFromGhost ? "ghost-post" : "user-post";
    const entryData = {
      entry,
      postClass
    };
    const serializedEntry = JSON.stringify(entryData);

    // Save the diary entry to the database.
    await this.databaseManager.addDiaryEntry(serializedEntry);

    // If this is a system event (ghost post), also record it in the events table.
    if (isPostFromGhost) {
      const eventData = {
        event_key: entry,
        event_text: entry,
        timestamp: new Date().toISOString(),
        completed: 0
      };
      this.databaseManager.saveEvent(eventData);
    }

    // Delegate UI update of the diary to the ViewManager.
    if (this.viewManager?.addSingleDiaryPost) {
      this.viewManager.addSingleDiaryPost({
        text: entry,
        // original message
        img: entry.startsWith("data:image") ? entry : "",
        // best‑effort
        timestamp: new Date().toLocaleString(),
        postClass
      });
    } else {
      this.updateDiaryDisplay();
    }

    // After updating the diary display, apply visual effects to newly added diary entries.
    // It is expected that the rendered diary entries have the attribute data-animate-on-board="true"
    // if they need to be animated.
    if (this.viewManager && this.visualEffectsManager && this.viewManager.diaryContainer) {
      const newEntries = this.viewManager.diaryContainer.querySelectorAll('[data-animate-on-board="true"]');
      this.visualEffectsManager.applyEffectsToNewElements(newEntries);
    }
  }

  /**
   * updateDiaryDisplay
   * Retrieves diary entries from the database and instructs the ViewManager
   * to render them. Uses the current language from the LanguageManager.
   */
  updateDiaryDisplay() {
    if (this.viewManager && typeof this.viewManager.renderDiary === 'function') {
      const entries = this.databaseManager.getDiaryEntries();
      const currentLanguage = this.languageManager.getLanguage();
      // Delegate rendering of the diary entries to the ViewManager.
      this.viewManager.renderDiary(entries, currentLanguage, this.visualEffectsManager);
    } else {
      // Log and display an error if the viewManager is not available.
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__.ErrorManager.logError("ViewManager is not available. Cannot update diary display.", "updateDiaryDisplay");
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__.ErrorManager.showError("Unable to update diary display.");
    }
  }
}

/***/ }),

/***/ "./src/managers/GameEventManager.js":
/*!******************************************!*\
  !*** ./src/managers/GameEventManager.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GameEventManager: () => (/* binding */ GameEventManager)
/* harmony export */ });
/* harmony import */ var _StateManager_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./StateManager.js */ "./src/managers/StateManager.js");
/* harmony import */ var _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ErrorManager.js */ "./src/managers/ErrorManager.js");
/* harmony import */ var _utils_GameEntityLoader_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/GameEntityLoader.js */ "./src/utils/GameEntityLoader.js");
// File: src/managers/GameEventManager.js





/**
 * GameEventManager class
 * 
 * Manages one-time game events. It loads event definitions dynamically from
 * a unified JSON configuration. The configuration (including event class names,
 * dependencies and keys) is defined entirely in the config file.
 *
 * NOTE: Sequential linking of events and quests is now handled by GhostManager and QuestManager.
 */
class GameEventManager {
  /**
   * @param {EventManager} eventManager - Manager for diary/event operations.
   * @param {App} appInstance - The main application instance.
   * @param {LanguageManager} languageManager - Localization manager.
   */
  constructor(eventManager, appInstance, languageManager) {
    this.eventManager = eventManager;
    this.app = appInstance;
    this.languageManager = languageManager;
    this.events = [];

    // Load the unified configuration and instantiate only those events
    // whose keys appear in the "sequence" array.
    (0,_utils_GameEntityLoader_js__WEBPACK_IMPORTED_MODULE_2__.loadGameEntitiesConfig)().then(async config => {
      // Build a Set of all eventKeys that are part of the sequence
      const sequenceKeys = new Set(config.sequence.map(triad => triad.eventKey));

      // Build a lookup from eventKey to its corresponding config object
      const eventConfigByKey = {};
      for (const ev of config.events) {
        eventConfigByKey[ev.key] = ev;
      }

      // For each eventKey in the sequence, create one instance
      for (const eventKey of sequenceKeys) {
        const eventCfg = eventConfigByKey[eventKey];
        if (!eventCfg) {
          _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.logError(`No event configuration found for key "${eventKey}" in sequence.`, "GameEventManager");
          continue;
        }

        // Build params for constructor: [eventManager, app, config, languageManager]
        const params = [this.eventManager, this.app, eventCfg, this.languageManager];
        try {
          // Dynamically import the triad bundle for this eventKey via alias "triads"
          const module = await __webpack_require__("./build/triads lazy recursive ^\\.\\/triad\\-.*$")(`./triad-${eventKey}`);
          const EventClass = module[eventCfg.className];
          if (!EventClass) {
            _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.logError(`Event class "${eventCfg.className}" is not exported from triads/triad-${eventKey}.js.`, "GameEventManager");
            continue;
          }
          // Pass config object as third argument
          const instance = new EventClass(...params);
          this.events.push(instance);
        } catch (error) {
          _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.logError(`Failed to import triad for event "${eventKey}": ${error.message}`, "GameEventManager");
        }
      }
      console.log("Game events loaded from sequence:", this.events.map(e => e.key));
    }).catch(error => {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.logError(error, "GameEventManager.loadConfig");
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.showError("Failed to load game events configuration");
    });
  }

  /**
   * Activates an event by its key.
   * @param {string} key - The event key.
   */
  async activateEvent(key) {
    let event = this.events.find(e => e.key === key);
    // Fallback for dynamic keys (e.g. "post_repeating_event_stage_X")
    if (!event && key.startsWith("post_repeating_event")) {
      event = this.events.find(e => e.key === "post_repeating_event");
    }
    if (event) {
      await event.activate(key);
      console.log(`Event '${key}' activated.`);
    } else {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.logError(`Event "${key}" not found`, "GameEventManager.activateEvent");
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.showError(`Cannot activate event "${key}"`);
    }
  }

  /**
   * Automatically launches the welcome event (after 5 seconds) post-registration,
   * if the "welcomeDone" flag is not set.
   */
  async autoLaunchWelcomeEvent() {
    if (_StateManager_js__WEBPACK_IMPORTED_MODULE_0__.StateManager.get(_StateManager_js__WEBPACK_IMPORTED_MODULE_0__.StateManager.KEYS.WELCOME_DONE) === "true") {
      console.log("Welcome event already completed; auto-launch skipped.");
      return;
    }
    console.log("Auto-launching welcome event in 5 seconds...");
    setTimeout(async () => {
      await this.activateEvent("welcome");
    }, 5000);
  }
}

/***/ }),

/***/ "./src/managers/GhostManager.js":
/*!**************************************!*\
  !*** ./src/managers/GhostManager.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GhostManager: () => (/* binding */ GhostManager)
/* harmony export */ });
/* harmony import */ var _ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ErrorManager.js */ "./src/managers/ErrorManager.js");
/* harmony import */ var _StateManager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./StateManager.js */ "./src/managers/StateManager.js");
/* harmony import */ var _utils_GameEntityLoader_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/GameEntityLoader.js */ "./src/utils/GameEntityLoader.js");
/* harmony import */ var _utils_SequenceManager_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/SequenceManager.js */ "./src/utils/SequenceManager.js");
// File: src/managers/GhostManager.js






/**
 * GhostManager class
 * 
 * Manages the list of ghosts and their state. Responsibilities include:
 * - Maintaining the active ghost and tracking its phenomenon (quest step) progress.
 * - Saving ghost state via DatabaseManager.
 * - Triggering events (e.g., final event) via GameEventManager.
 *
 * NEW CHANGES:
 * - The event–quest sequence is now loaded from a unified JSON configuration.
 * - The active quest key is stored persistently using StateManager.
 * - A unified method 'canStartQuest' is provided to check if a quest can start:
 *    1. A non-finished quest record does not exist.
 *    2. There is no active quest registered in the StateManager.
 *    3. The quest key matches the expected next quest in the sequence.
 * - Auto-launch of the first event (e.g., "welcome") is performed if registration is complete.
 * - Dynamic update of the Post button state added via updatePostButtonState():
 *    the button is enabled only if no quest is active.
 * - **New:** On starting a quest the camera button is set to active,
 *   and upon quest completion the active state (class) is removed.
 */
class GhostManager {
  /**
   * @param {number} currentSequenceIndex - Starting index for the event–quest sequence (from StateManager).
   * @param {ProfileManager} profileManager - Manager for saving ghost progress.
   * @param {App} app - The main application instance.
   */
  constructor(currentSequenceIndex, profileManager, app) {
    // Set initial sequence index (will be updated after loading config).
    this.currentSequenceIndex = currentSequenceIndex;
    this.profileManager = profileManager;
    this.app = app;

    // In-memory flag for the active quest key (persisted in StateManager).
    this.activeQuestKey = _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.getActiveQuestKey();
    this.questActive = !!this.activeQuestKey; // true if an active quest key is stored.

    // eventManager will be assigned externally (see App.js).
    this.eventManager = null;

    // Initialize ghost list with only the default ghost.
    this.ghosts = [];
    this.setupGhosts();

    // Set the active ghost (default ID = 1).
    this.currentGhostId = 1;
    // Current phenomenon (quest step) index for the active ghost.
    this.currentPhenomenonIndex = 0;
    const currentGhost = this.getCurrentGhost();
    console.log(`Current active ghost: ${currentGhost ? currentGhost.name : 'not found'}`);

    // Load the unified configuration and initialize the sequence manager from the "sequence" section.
    (0,_utils_GameEntityLoader_js__WEBPACK_IMPORTED_MODULE_2__.loadGameEntitiesConfig)().then(config => {
      this.sequenceManager = new _utils_SequenceManager_js__WEBPACK_IMPORTED_MODULE_3__.SequenceManager(config.sequence);
      const savedIndex = parseInt(_StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.get(_StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.KEYS.CURRENT_SEQUENCE_INDEX), 10) || 0;
      this.sequenceManager.currentIndex = savedIndex;
      console.log(`Sequence configuration loaded. Current index: ${this.sequenceManager.currentIndex}`);

      // Auto-launch the first event if registration is complete and the welcome event has not been executed.
      if (_StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.get("registrationCompleted") === "true" && _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.get("welcomeDone") !== "true") {
        const firstEntry = this.sequenceManager.getCurrentEntry();
        if (firstEntry) {
          console.log(`Auto-launching initial event: ${firstEntry.eventKey}`);
          this.eventManager.activateEvent(firstEntry.eventKey);
          // Save the active quest key using the universal mechanism.
          this.activeQuestKey = firstEntry.questKey;
          _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.set("activeQuestKey", this.activeQuestKey);
        }
      }
    }).catch(error => {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__.ErrorManager.logError(error, "GhostManager.loadConfig");
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__.ErrorManager.showError("Failed to load game configuration");
    });

    // Subscribe to global events for completions.
    document.addEventListener("gameEventCompleted", e => {
      this.onEventCompleted(e.detail);
    });
    document.addEventListener("questCompleted", e => {
      this.onQuestCompleted(e.detail);
    });
  }

  /**
   * Generates the list of ghosts.
   * CURRENT CHANGE: Only the default ghost is created.
   */
  setupGhosts() {
    const defaultGhost = {
      id: 1,
      name: "ghost 1",
      // Default ghost name.
      phenomenaCount: 3,
      // Fixed number of phenomena (quest steps).
      isFinished: false
    };
    this.ghosts = [defaultGhost];
  }

  /**
   * Returns the active ghost based on currentGhostId.
   * @returns {object|undefined} The ghost object, or undefined if not found.
   */
  getCurrentGhost() {
    return this.ghosts.find(g => g.id === this.currentGhostId);
  }

  /**
   * Sets the active ghost by its ID and saves its state.
   * @param {number} ghostId - The ID of the ghost to activate.
   */
  async setCurrentGhost(ghostId) {
    this.currentGhostId = ghostId;
    const ghost = this.getCurrentGhost();
    if (ghost) {
      console.log(`Ghost ${ghost.name} activated.`);
      await this.app.databaseManager.saveGhostState(ghost);
    } else {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__.ErrorManager.logError(`Ghost with ID=${ghostId} not found!`, "setCurrentGhost");
    }
  }

  /**
   * Marks the current ghost as finished and saves its state.
   */
  async finishCurrentGhost() {
    const ghost = this.getCurrentGhost();
    if (ghost) {
      ghost.isFinished = true;
      console.log(`Ghost ${ghost.name} finished.`);
      await this.app.databaseManager.saveGhostState(ghost);
    } else {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__.ErrorManager.logError("Cannot finish ghost: ghost not found.", "finishCurrentGhost");
    }
  }

  /**
   * Checks if the current ghost is finished.
   * @returns {boolean} True if finished; otherwise, false.
   */
  isCurrentGhostFinished() {
    const ghost = this.getCurrentGhost();
    return ghost ? ghost.isFinished : false;
  }

  /**
   * Initiates the next phenomenon (quest step) for the current ghost.
   * Adds a diary entry and updates progress. If all steps are complete, triggers the final event.
   */
  async triggerNextPhenomenon() {
    const ghost = this.getCurrentGhost();
    if (!ghost) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__.ErrorManager.logError("No ghost found to trigger phenomenon.", "triggerNextPhenomenon");
      return;
    }
    if (ghost.isFinished) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__.ErrorManager.logError(`Ghost "${ghost.name}" is already finished; phenomena unavailable.`, "triggerNextPhenomenon");
      return;
    }
    if (this.currentPhenomenonIndex < ghost.phenomenaCount) {
      const phenomenonNumber = this.currentPhenomenonIndex + 1;
      const phenomenonEntry = `${ghost.name}: Phenomenon ${phenomenonNumber} - Approach the mirror`;
      await this.eventManager.addDiaryEntry(phenomenonEntry);
      console.log(`Triggered phenomenon for ${ghost.name}: ${phenomenonEntry}`);
      this.currentPhenomenonIndex++;
      await this.profileManager.saveGhostProgress({
        ghostId: this.currentGhostId,
        phenomenonIndex: this.currentPhenomenonIndex
      });
      if (this.currentPhenomenonIndex === ghost.phenomenaCount) {
        const finalEntry = `${ghost.name}: Final phenomenon – ghost finished!`;
        await this.eventManager.addDiaryEntry(finalEntry);
        console.log(finalEntry);
        console.log(`Triggering final event for ghost "${ghost.name}"...`);
        await this.app.gameEventManager.activateEvent("ghost_final_event");
      }
    } else {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__.ErrorManager.logError(`All phenomena for ghost ${ghost.name} have been completed (index=${this.currentPhenomenonIndex}).`, "triggerNextPhenomenon");
    }
  }

  /**
   * Resets the ghost chain: sets active ghost to default, resets phenomenon index,
   * clears ghost progress, and updates the database.
   */
  async resetGhostChain() {
    this.currentGhostId = 1;
    this.currentPhenomenonIndex = 0;
    await this.profileManager.resetGhostProgress();
    console.log("Ghost chain has been reset.");
    const ghost = this.getCurrentGhost();
    if (ghost) {
      ghost.isFinished = false;
      await this.app.databaseManager.saveGhostState(ghost);
    } else {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__.ErrorManager.logError("Failed to reset ghost chain: default ghost not found.", "resetGhostChain");
    }
  }

  // --------------- New API: Sequential Event and Quest Management ---------------

  /**
   * Checks if the provided quest key matches the expected quest from the sequence configuration.
   * @param {string} questKey - The quest key to check.
   * @returns {boolean} True if it matches; otherwise, false.
   */
  isNextInSequence(questKey) {
    return this.sequenceManager ? this.sequenceManager.isNextQuest(questKey) : false;
  }

  /**
   * Checks if the provided event key matches the expected event from the sequence configuration.
   * @param {string} eventKey - The event key to check.
   * @returns {boolean} True if it matches; otherwise, false.
   */
  isNextEvent(eventKey) {
    return this.sequenceManager ? this.sequenceManager.isNextEvent(eventKey) : false;
  }

  /**
   * Determines if a quest can be started.
   * Checks that there is no active unfinished record in the database, no active quest in the StateManager,
   * and that the quest key is the next expected in the sequence.
   * @param {string} questKey - The quest key to start.
   * @returns {boolean} True if the quest can be launched; false otherwise.
   */
  canStartQuest(questKey) {
    // 1) Check for an existing unfinished quest record.
    const record = this.app.databaseManager.getQuestRecord(questKey);
    if (record && record.status !== "finished") {
      console.warn(`Quest "${questKey}" is already active with status "${record.status}".`);
      return false;
    }
    // 2) Check if an active quest is already recorded.
    const activeQuestKey = _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.getActiveQuestKey();
    // Block if an active quest exists and it does not match the quest we're trying to start.
    if (activeQuestKey && activeQuestKey !== questKey) {
      console.warn(`Another quest "${activeQuestKey}" is already active, cannot start quest "${questKey}".`);
      return false;
    }
    // 3) Check if this quest is the next expected in the sequence.
    if (!this.isNextInSequence(questKey)) {
      console.error(`Quest "${questKey}" is not the next expected quest in the sequence.`);
      return false;
    }
    return true;
  }

  /**
   * Starts a quest after verifying eligibility using the unified check.
   * @param {string} questKey - The quest key to start.
   */
  async startQuest(questKey) {
    if (!this.canStartQuest(questKey)) {
      console.error(`Cannot start quest with key: ${questKey}. Unified check failed.`);
      return;
    }
    console.log(`GhostManager: Starting quest with key: ${questKey}`);
    await this.app.questManager.activateQuest(questKey);
    // Update the active quest key universally.
    this.activeQuestKey = questKey;
    _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.setActiveQuestKey(questKey);
    await this.app.questManager.syncQuestState();
    // When a quest starts, mark the camera button as active.
    this.app.viewManager.setCameraButtonActive(true);
  }

  /**
   * Starts an event.
   * @param {string} eventKey - The event key to start.
   * @param {boolean} [isFollowup=false] - If true, bypasses the sequence check.
   */
  async startEvent(eventKey, isFollowup = false) {
    if (!isFollowup && !this.isNextEvent(eventKey)) {
      console.error(`Event "${eventKey}" is not next in sequence.`);
      return;
    }
    console.log(`GhostManager: Starting event with key: ${eventKey}`);
    await this.app.gameEventManager.activateEvent(eventKey);
  }

  /**
   * Updates the Post button state based on whether an active quest is present.
   * If an active quest exists, the button is disabled; otherwise, it is enabled.
   */
  updatePostButtonState() {
    // Получаем следующий элемент последовательности (или null)
    const nextEntry = this.sequenceManager ? this.sequenceManager.getCurrentEntry() : null;
    // Есть ли валидный questKey и можно ли его запустить?
    const canStart = nextEntry ? this.canStartQuest(nextEntry.questKey) : false;
    // Применяем к ViewManager
    this.app.viewManager.setPostButtonEnabled(canStart);
    console.log(`[GhostManager] Post button state updated: enabled=${canStart}`);
  }

  /**
   * Handles the Post button click.
   * Immediately disables the button, retrieves the next sequence entry, and checks if the quest can be started.
   */
  async handlePostButtonClick() {
    // Disable the Post button immediately to prevent double-clicks.
    this.app.viewManager.setPostButtonEnabled(false);
    const nextEntry = this.sequenceManager ? this.sequenceManager.getCurrentEntry() : null;
    if (!nextEntry) {
      console.warn("No next sequence entry found.");
      this.updatePostButtonState();
      return;
    }
    console.log(`GhostManager: Handling Post button click. Next expected quest: ${nextEntry.questKey}`);
    if (!this.canStartQuest(nextEntry.questKey)) {
      this.updatePostButtonState();
      return;
    }
    await this.startQuest(nextEntry.questKey);
    // After starting the quest, update the Post button state.
    this.updatePostButtonState();
  }

  /**
   * Called when a game event completes.
   * Increments the sequence index if the completed event matches the expected next event.
   * @param {string} eventKey - The completed event key.
   */
  onEventCompleted(eventKey) {
    console.log(`GhostManager: Event completed with key: ${eventKey}`);
    if (this.sequenceManager && this.sequenceManager.getCurrentEntry().nextEventKey === eventKey) {
      this.sequenceManager.increment();
      _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.set(_StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.KEYS.CURRENT_SEQUENCE_INDEX, String(this.sequenceManager.currentIndex));
      console.log(`GhostManager: Sequence index incremented to ${this.sequenceManager.currentIndex}`);
    }
  }

  /**
   * Called when a quest completes.
   * For repeating quests, triggers a dynamic event for intermediate stages;
   * if the quest is fully completed, uses the final event key from the configuration.
   * For non-repeating quests, starts the next event as defined in the sequence.
   * @param {string} questKey - The completed quest key.
   */
  async onQuestCompleted(questKey) {
    console.log(`GhostManager: Quest completed with key: ${questKey}`);
    // Clear the active quest key.
    this.activeQuestKey = null;
    _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.setActiveQuestKey(null);

    // Update the Post button state after quest completion.
    this.updatePostButtonState();
    // Deactivate the camera button since the quest is finished.
    this.app.viewManager.setCameraButtonActive(false);
    if (questKey === "repeating_quest") {
      const repeatingQuest = this.app.questManager.quests.find(q => q.key === "repeating_quest");
      const questStatus = repeatingQuest ? await repeatingQuest.getCurrentQuestStatus() : {
        currentStage: 1,
        totalStages: 1
      };
      console.log("Repeating quest status:", questStatus);
      if (questStatus.currentStage <= questStatus.totalStages) {
        // Intermediate stage: dynamically generate the event key.
        const dynamicEventKey = `post_repeating_event_stage_${questStatus.currentStage}`;
        console.log(`Repeating quest stage completed. Triggering generated event: ${dynamicEventKey}`);
        await this.startEvent(dynamicEventKey, true);
        return;
      } else {
        // Quest has reached its final stage: use the final event key from config.
        const currentEntry = this.sequenceManager ? this.sequenceManager.getCurrentEntry() : null;
        if (currentEntry && currentEntry.nextEventKey) {
          console.log(`Repeating quest fully completed. Now starting ghost event from config: ${currentEntry.nextEventKey}`);
          await this.startEvent(currentEntry.nextEventKey, true);
        } else {
          console.warn("No final event configured for repeating quest completion. Unable to start final event.");
        }
        this.sequenceManager.increment();
        _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.set(_StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.KEYS.CURRENT_SEQUENCE_INDEX, String(this.sequenceManager.currentIndex));
        return;
      }
    }
    const currentEntry = this.sequenceManager ? this.sequenceManager.getCurrentEntry() : null;
    if (currentEntry && currentEntry.questKey === questKey && currentEntry.nextEventKey) {
      console.log(`GhostManager: Quest completed. Now starting ghost event: ${currentEntry.nextEventKey}`);
      await this.startEvent(currentEntry.nextEventKey, true);
    }
  }
}

/***/ }),

/***/ "./src/managers/LanguageManager.js":
/*!*****************************************!*\
  !*** ./src/managers/LanguageManager.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LanguageManager: () => (/* binding */ LanguageManager)
/* harmony export */ });
/* harmony import */ var _locales_locales_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../locales/locales.js */ "./src/locales/locales.js");
/* harmony import */ var _locales_chatLocales_en_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../locales/chatLocales_en.js */ "./src/locales/chatLocales_en.js");
/* harmony import */ var _locales_chatLocales_ru_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../locales/chatLocales_ru.js */ "./src/locales/chatLocales_ru.js");
/* harmony import */ var _locales_chatLocales_uk_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../locales/chatLocales_uk.js */ "./src/locales/chatLocales_uk.js");
// Import base locales and chat locales, then merge them





// Merge base and chat locales for each language
const mergedLocales = {
  en: {
    ..._locales_locales_js__WEBPACK_IMPORTED_MODULE_0__["default"].en,
    ..._locales_chatLocales_en_js__WEBPACK_IMPORTED_MODULE_1__["default"]
  },
  ru: {
    ..._locales_locales_js__WEBPACK_IMPORTED_MODULE_0__["default"].ru,
    ..._locales_chatLocales_ru_js__WEBPACK_IMPORTED_MODULE_2__["default"]
  },
  uk: {
    ..._locales_locales_js__WEBPACK_IMPORTED_MODULE_0__["default"].uk,
    ..._locales_chatLocales_uk_js__WEBPACK_IMPORTED_MODULE_3__["default"]
  }
};

/**
 * LanguageManager is responsible for managing localization in the application.
 * It loads the translation dictionaries (locales), listens for changes on the language selector,
 * and updates all page elements that have the data-i18n attribute.
 * This class also saves the selected language in localStorage to preserve the choice between sessions.
 */
class LanguageManager {
  /**
   * Constructor for LanguageManager.
   * @param {string} selectorId - The ID of the <select> element used for language selection.
   *
   * During initialization:
   * - The merged translation dictionary is loaded.
   * - The current language is set from localStorage (or defaults to 'en').
   * - The selector's value is updated, and applyLanguage() is called to update the UI.
   * - A change event listener is added to the selector to handle language switching.
   */
  constructor(selectorId) {
    // Use merged locales (base + chat)
    this.locales = mergedLocales;

    // Get the language selector element by its ID.
    this.selector = document.getElementById(selectorId);
    if (!this.selector) {
      console.error(`Language selector with id "${selectorId}" not found.`);
    }

    // Set the current language from localStorage, defaulting to 'en'.
    this.currentLanguage = localStorage.getItem('language') || 'en';

    // Update the selector to reflect the current language.
    if (this.selector) {
      this.selector.value = this.currentLanguage;
    }

    // Apply the selected language to all elements with the data-i18n attribute.
    this.applyLanguage();

    // Add an event listener to update the language when the selector's value changes.
    if (this.selector) {
      this.selector.addEventListener('change', () => {
        this.currentLanguage = this.selector.value;
        localStorage.setItem('language', this.currentLanguage);
        this.applyLanguage();
      });
    }
  }

  /**
   * applyLanguage – Updates the text content of all elements with the data-i18n attribute
   * based on the selected language.
   *
   * This method iterates over all elements with data-i18n, retrieves the translation key,
   * and replaces the element's text content with the corresponding translation from the dictionary.
   */
  applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      // If a translation exists for the key in the current language, update the text.
      if (this.locales[this.currentLanguage] && this.locales[this.currentLanguage][key]) {
        el.textContent = this.locales[this.currentLanguage][key];
      }
    });
  }

  /**
   * updateContainerLanguage – Updates the text content of all elements with the data-i18n attribute
   * within a specific container. This is useful for dynamically inserted content.
   *
   * @param {HTMLElement} container - The container element in which to update localized text.
   */
  updateContainerLanguage(container) {
    if (!container) return;
    container.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (this.locales[this.currentLanguage] && this.locales[this.currentLanguage][key]) {
        el.textContent = this.locales[this.currentLanguage][key];
      }
    });
  }

  /**
   * Optional method: startObservingContainer
   * Sets up a MutationObserver on a given container to automatically update any newly
   * added elements with the data-i18n attribute.
   *
   * @param {HTMLElement} container - The container element to observe.
   * @returns {MutationObserver} The observer instance (can be disconnected when no longer needed).
   */
  startObservingContainer(container) {
    if (!container) return;
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // If the new node itself has data-i18n attribute, update it.
            if (node.hasAttribute && node.hasAttribute('data-i18n')) {
              const key = node.getAttribute('data-i18n');
              if (this.locales[this.currentLanguage] && this.locales[this.currentLanguage][key]) {
                node.textContent = this.locales[this.currentLanguage][key];
              }
            }
            // Also update any descendant elements.
            if (node.querySelectorAll) {
              node.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (this.locales[this.currentLanguage] && this.locales[this.currentLanguage][key]) {
                  el.textContent = this.locales[this.currentLanguage][key];
                }
              });
            }
          }
        });
      });
    });
    observer.observe(container, {
      childList: true,
      subtree: true
    });
    console.log("[LanguageManager] Started observing container for localization updates.");
    return observer;
  }

  /**
   * getLanguage – Returns the currently selected language.
   * @returns {string} The current language (e.g., 'en', 'ru', 'uk').
   */
  getLanguage() {
    return this.currentLanguage;
  }

  /**
   * translate – Returns the localized text for the given key.
   *
   * @param {string} key - The localization key.
   * @param {string} [defaultValue=key] - The default value if no translation is found.
   * @returns {string} The localized text.
   */
  translate(key, defaultValue = key) {
    if (this.locales[this.currentLanguage] && this.locales[this.currentLanguage][key]) {
      return this.locales[this.currentLanguage][key];
    }
    return defaultValue;
  }
}

/***/ }),

/***/ "./src/managers/NotificationManager.js":
/*!*********************************************!*\
  !*** ./src/managers/NotificationManager.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NotificationManager: () => (/* binding */ NotificationManager)
/* harmony export */ });
class NotificationManager {
  showNotification(message) {
    if (!("Notification" in window)) {
      console.warn("⚠️ Notifications are not supported in this browser.");
      return;
    }
    if (Notification.permission === "granted") {
      new Notification(message);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification(message);
        }
      });
    }
  }
}

/***/ }),

/***/ "./src/managers/ProfileManager.js":
/*!****************************************!*\
  !*** ./src/managers/ProfileManager.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ProfileManager: () => (/* binding */ ProfileManager)
/* harmony export */ });
/* harmony import */ var _StateManager_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./StateManager.js */ "./src/managers/StateManager.js");
/* harmony import */ var _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ErrorManager.js */ "./src/managers/ErrorManager.js");


class ProfileManager {
  /**
   * Constructor for ProfileManager.
   * @param {SQLiteDataManager} dataManager - An instance of the DataManager responsible for profile persistence.
   */
  constructor(dataManager) {
    // Save a reference to the DataManager for profile and related data persistence.
    this.dataManager = dataManager;
  }

  /**
   * isProfileSaved – Asynchronously checks if a profile is saved via the DataManager.
   * @returns {Promise<boolean>} Resolves to true if a profile exists, otherwise false.
   */
  async isProfileSaved() {
    const profile = await this.dataManager.getProfile();
    return !!profile;
  }

  /**
   * getProfile – Asynchronously retrieves the profile from the DataManager.
   * @returns {Promise<Object|null>} Resolves to the profile object or null if not found.
   */
  async getProfile() {
    return await this.dataManager.getProfile();
  }

  /**
   * saveProfile – Asynchronously saves the given profile object via the DataManager.
   *
   * IMPORTANT: Registration data (name, gender, language, selfie, etc.) should be 
   * integrated into the profile object. Do not store additional transient keys.
   *
   * @param {Object} profile - The profile object (should include registration fields).
   * @returns {Promise<void>}
   */
  async saveProfile(profile) {
    await this.dataManager.saveProfile(profile);
  }

  /**
   * resetProfile – Resets the profile and all related data.
   * Calls the DataManager to remove profile data along with ghost and quest progress,
   * and clears all transient state keys from localStorage (except for the language key).
   * Also resets the SQL database stored in IndexedDB.
   * After reset, the service worker cache is cleared and the page is reloaded.
   */
  resetProfile() {
    Promise.all([this.dataManager.resetProfile(),
    // Deletes the 'profile' key.
    this.dataManager.resetDatabase() // Deletes the SQL database saved under 'sqlite', fully clearing tables.
    ]).then(() => {
      // Clear all keys from localStorage except the language-related key.
      const preserveKeys = ["language"]; // Adjust this array if language key is stored under a different name.
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (!preserveKeys.includes(key)) {
          localStorage.removeItem(key);
        }
      }

      // NEW: Tell the Service Worker to skip waiting and clear caches
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // ask the new SW to activate immediately
        navigator.serviceWorker.controller.postMessage({
          type: 'SKIP_WAITING'
        });
        // clear all caches so that clients navigates and picks up the new version
        navigator.serviceWorker.controller.postMessage({
          action: 'CLEAR_CACHE'
        });
        console.log("Service Worker skipWaiting and CLEAR_CACHE messages sent.");
      }
      // Reload will be handled by the SW via controllerchange → clients.navigate()
    }).catch(err => {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.logError(err, "resetProfile");
    });
  }

  /**
   * exportProfileData – Exports the profile along with diary entries, apartment plan,
   * quest progress, and chat messages to a JSON file.
   * @param {Object} databaseManager - The database manager for retrieving diary, quest, and chat data.
   * @param {Object} apartmentPlanManager - The apartment plan manager.
   */
  exportProfileData(databaseManager, apartmentPlanManager) {
    this.getProfile().then(profile => {
      if (!profile) {
        alert("No profile found to export.");
        return;
      }
      // Filter profile to include only essential registration fields.
      const filteredProfile = {
        name: profile.name,
        gender: profile.gender,
        language: profile.language,
        selfie: profile.selfie
      };

      // Retrieve diary entries.
      const diaryEntries = databaseManager.getDiaryEntries();
      // Retrieve chat messages.
      const chatMessages = databaseManager.getChatMessages();
      // Retrieve apartment plan data if available.
      const apartmentPlanData = apartmentPlanManager ? apartmentPlanManager.rooms : [];

      // Retrieve quest progress data from the database.
      let questProgressData = [];
      const result = databaseManager.db.exec("SELECT * FROM quest_progress ORDER BY id DESC");
      if (result.length > 0) {
        questProgressData = result[0].values.map(row => ({
          id: row[0],
          quest_key: row[1],
          status: row[2]
        }));
      }

      // Form the export object including chat messages.
      const exportData = {
        profile: filteredProfile,
        diary: diaryEntries,
        apartment: apartmentPlanData,
        quests: questProgressData,
        chat: chatMessages
      };

      // Create a Blob from the JSON string.
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'profile.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  /**
   * importProfileData – Imports profile data from the selected JSON file.
   * After import, updates the profile, diary, apartment plan, quest progress, and chat messages, then reloads the page.
   * @param {File} file - The file containing the profile data.
   * @param {Object} databaseManager - The database manager.
   * @param {Object} apartmentPlanManager - The apartment plan manager.
   */
  importProfileData(file, databaseManager, apartmentPlanManager) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const importedData = JSON.parse(e.target.result);
        // Validate essential profile fields.
        if (!importedData.profile || !importedData.profile.name || !importedData.profile.gender || !importedData.profile.selfie || !importedData.profile.language) {
          alert("Invalid profile file. Required profile fields are missing.");
          return;
        }
        // Save the profile via DataManager.
        this.saveProfile(importedData.profile);

        // Import diary entries.
        if (importedData.diary && Array.isArray(importedData.diary)) {
          importedData.diary.forEach(entry => {
            if (entry.entry && entry.timestamp) {
              databaseManager.db.run("INSERT INTO diary (entry, timestamp) VALUES (?, ?)", [entry.entry, entry.timestamp]);
            }
          });
          databaseManager.saveDatabase();
        }

        // Import apartment plan data, if available.
        if (importedData.apartment && Array.isArray(importedData.apartment)) {
          if (apartmentPlanManager) {
            apartmentPlanManager.rooms = importedData.apartment;
            apartmentPlanManager.renderRooms();
          }
        }

        // Import quest progress.
        if (importedData.quests && Array.isArray(importedData.quests)) {
          importedData.quests.forEach(progress => {
            if (progress.quest_key && progress.status) {
              databaseManager.addQuestProgress(progress.quest_key, progress.status);
            }
          });
        }

        // Import chat messages.
        if (importedData.chat && Array.isArray(importedData.chat)) {
          importedData.chat.forEach(msg => {
            if (msg.sender && msg.message && msg.timestamp) {
              databaseManager.db.run("INSERT INTO chat_messages (sender, message, timestamp) VALUES (?, ?, ?)", [msg.sender, msg.message, msg.timestamp]);
            }
          });
          databaseManager.saveDatabase();
        }

        // Clear transient state keys using StateManager.
        _StateManager_js__WEBPACK_IMPORTED_MODULE_0__.StateManager.remove("cameraButtonActive");
        _StateManager_js__WEBPACK_IMPORTED_MODULE_0__.StateManager.remove("shootButtonActive");
        _StateManager_js__WEBPACK_IMPORTED_MODULE_0__.StateManager.remove("quest_state_repeating_quest");
        alert("Profile imported successfully. Reloading page.");
        window.location.reload();
      } catch (err) {
        _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.logError(err, "importProfileData");
        alert("Error parsing the profile file.");
      }
    };
    reader.readAsText(file);
  }

  /**
   * saveGhostProgress – Saves ghost progress data via the DataManager.
   * @param {Object} progress - Progress data (e.g., { ghostId: number, phenomenonIndex: number }).
   */
  saveGhostProgress(progress) {
    this.dataManager.saveGhostProgress(progress);
  }

  /**
   * getGhostProgress – Retrieves the saved ghost progress via the DataManager.
   * @returns {Object|null} The progress object or null if not set.
   */
  getGhostProgress() {
    return this.dataManager.getGhostProgress();
  }

  /**
   * resetGhostProgress – Resets ghost progress via the DataManager.
   */
  resetGhostProgress() {
    this.dataManager.resetGhostProgress();
  }

  /**
   * saveLocationType – Saves the user's selected location type via the DataManager.
   * @param {string} locationType - The location type.
   */
  saveLocationType(locationType) {
    this.dataManager.saveLocationType(locationType);
  }

  /**
   * getLocationType – Retrieves the saved location type via the DataManager.
   * @returns {string|null} The location type or null if not set.
   */
  getLocationType() {
    return this.dataManager.getLocationType();
  }
}

/***/ }),

/***/ "./src/managers/QuestManager.js":
/*!**************************************!*\
  !*** ./src/managers/QuestManager.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   QuestManager: () => (/* binding */ QuestManager)
/* harmony export */ });
/* harmony import */ var _StateManager_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./StateManager.js */ "./src/managers/StateManager.js");
/* harmony import */ var _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ErrorManager.js */ "./src/managers/ErrorManager.js");
/* harmony import */ var _utils_GameEntityLoader_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/GameEntityLoader.js */ "./src/utils/GameEntityLoader.js");
// File: src/managers/QuestManager.js





/**
 * QuestManager class
 * 
 * Responsible for managing quest activation, state updates, and UI restoration.
 * It loads quest definitions dynamically from a unified JSON configuration.
 */
class QuestManager {
  /**
   * @param {EventManager} eventManager     - The event manager handling diary entries.
   * @param {GameEventManager} gameEventMgr - The game event manager for activating next events.
   * @param {App} appInstance               - The main application instance.
   */
  constructor(eventManager, gameEventMgr, appInstance) {
    this.eventManager = eventManager;
    this.gameEventManager = gameEventMgr;
    this.app = appInstance;
    this.quests = [];

    // Load the unified configuration and instantiate quests dynamically.
    // Also prepare a mapping from questKey to its parent eventKey.
    Promise.all([(0,_utils_GameEntityLoader_js__WEBPACK_IMPORTED_MODULE_2__.loadGameEntitiesConfig)(), (0,_utils_GameEntityLoader_js__WEBPACK_IMPORTED_MODULE_2__.getQuestKeyToEventKeyMap)()]).then(async ([config, questKeyToEventKey]) => {
      // Build a Map of questKey → eventKey from configuration
      this.questKeyToEventKey = questKeyToEventKey;

      // Instantiate each quest class based on config
      for (const questCfg of config.quests) {
        // Build dependency mapping.
        const dependencyMapping = {
          eventManager: this.eventManager,
          app: this.app
        };
        const params = questCfg.dependencies.map(dep => dependencyMapping[dep]);
        // If quest-specific configuration exists, append it.
        if (questCfg.config) {
          params.push(questCfg.config);
        }

        // Determine which triad chunk this quest belongs to.
        const eventKey = questKeyToEventKey[questCfg.key];
        if (!eventKey) {
          _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.logError(`Cannot find parent eventKey for quest "${questCfg.key}".`, "QuestManager");
          continue;
        }

        // Dynamically import the triad bundle for that eventKey instead of individual quest file.
        try {
          // Import via alias "triads" so Webpack resolves build/triads/triad-<eventKey>.js
          const module = await __webpack_require__("./build/triads lazy recursive ^\\.\\/triad\\-.*$")(`./triad-${eventKey}`);
          const QuestClass = module[questCfg.className];
          if (!QuestClass) {
            _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.logError(`Quest class "${questCfg.className}" is not exported from triads/triad-${eventKey}.js.`, "QuestManager");
            continue;
          }
          const instance = new QuestClass(...params);
          // Set the key as specified in the configuration.
          instance.key = questCfg.key;
          this.quests.push(instance);
        } catch (error) {
          _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.logError(`Failed to import triad for quest "${questCfg.key}": ${error.message}`, "QuestManager");
        }
      }
      console.log("Quests loaded from configuration:", this.quests.map(q => q.key));

      // Register listener for questCompleted events
      document.addEventListener("questCompleted", async e => {
        const completedQuestKey = e.detail; // e.g. "mirror_quest"
        const nextEventKey = this.questKeyToEventKey[completedQuestKey];
        if (!nextEventKey) {
          _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.logError(`No next eventKey defined for quest "${completedQuestKey}".`, "QuestManager");
          return;
        }
        try {
          await this.gameEventManager.activateEvent(nextEventKey);
        } catch (err) {
          _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.logError(`Failed to activate event "${nextEventKey}" after quest "${completedQuestKey}": ${err.message}`, "QuestManager");
        }
      });
    }).catch(error => {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.logError(error, "QuestManager.loadConfig");
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.showError("Failed to load quests configuration");
    });
    this.initCameraListeners();

    // Restore UI state for the repeating quest if a saved state exists.
    if (_StateManager_js__WEBPACK_IMPORTED_MODULE_0__.StateManager.get(_StateManager_js__WEBPACK_IMPORTED_MODULE_0__.StateManager.KEYS.REPEATING_QUEST_STATE)) {
      console.log("[QuestManager] Detected saved state for repeating quest.");
      this.restoreRepeatingQuestUI();
    }
    if (this.app.viewManager && typeof this.app.viewManager.restoreCameraButtonState === 'function') {
      this.app.viewManager.restoreCameraButtonState();
    }
    // *** Add restoration for the Shoot button ***
    if (this.app.viewManager && typeof this.app.viewManager.restoreShootButtonState === 'function') {
      this.app.viewManager.restoreShootButtonState();
    }
  }

  /**
   * Registers listeners for camera readiness and closure events.
   */
  initCameraListeners() {
    const cameraManager = this.app.cameraSectionManager;
    if (!cameraManager) return;
    cameraManager.onVideoReady = async () => {
      console.log("[QuestManager] onVideoReady signal received.");
      if (_StateManager_js__WEBPACK_IMPORTED_MODULE_0__.StateManager.getActiveQuestKey() === "repeating_quest") {
        const repeatingQuest = this.quests.find(q => q.key === "repeating_quest");
        console.log(`[QuestManager] Detection target is "${repeatingQuest.currentTarget}"`);
        const config = repeatingQuest.generateDetectionConfig();
        await this.app.cameraSectionManager.startAIDetection(config);
      }
    };
    cameraManager.onCameraClosed = () => {
      console.log("[QuestManager] onCameraClosed signal received. Stopping detection.");
      this.app.cameraSectionManager.stopAIDetection();
    };
  }

  /**
   * Universal method to synchronize the state for a given quest.
   * Uses the universal active quest key stored in StateManager.
   * If the active quest key matches the provided questKey, the Post button is disabled;
   * otherwise, the Post button is enabled.
   * @param {string} questKey - The key of the quest to synchronize.
   */
  async syncQuestStateForQuest(questKey) {
    // If the game is finalized, disable Post button.
    if (_StateManager_js__WEBPACK_IMPORTED_MODULE_0__.StateManager.get(_StateManager_js__WEBPACK_IMPORTED_MODULE_0__.StateManager.KEYS.GAME_FINALIZED) === "true") {
      if (this.app.viewManager && typeof this.app.viewManager.setPostButtonEnabled === 'function') {
        this.app.viewManager.setPostButtonEnabled(false);
      }
      console.log(`[QuestManager.syncQuestStateForQuest] Game finalized; Post button disabled for quest "${questKey}".`);
      return;
    }
    // Retrieve the universal active quest key.
    const canPost = _StateManager_js__WEBPACK_IMPORTED_MODULE_0__.StateManager.canPost();
    this.app.viewManager.setPostButtonEnabled(canPost);
    console.log(`[QuestManager] Post button ${canPost ? "enabled" : "disabled"} for quest "${questKey}".`);
  }

  /**
   * Synchronizes the quest state for predefined quests.
   */
  async syncQuestState() {
    for (const quest of this.quests) {
      await this.syncQuestStateForQuest(quest.key);
    }
  }

  /**
   * Finds a quest by its key and activates it.
   * After activation, updates the universal active quest key.
   * @param {string} key - The quest key.
   */
  async activateQuest(key) {
    const quest = this.quests.find(q => q.key === key);
    if (!quest) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.logError(`Quest "${key}" not found`, "QuestManager.activateQuest");
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.showError(`Cannot activate quest "${key}"`);
      return;
    }
    console.log(`[QuestManager] Activating quest: ${key}`);
    await quest.activate();
    _StateManager_js__WEBPACK_IMPORTED_MODULE_0__.StateManager.setActiveQuestKey(key);
    await this.syncQuestState();
  }

  /**
   * Finalizes a quest by calling its finish() method and updates the UI.
   * @param {string} key - The quest key.
   */
  async checkQuest(key) {
    const quest = this.quests.find(q => q.key === key);
    if (!quest) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.logError(`Quest "${key}" not found`, "QuestManager.checkQuest");
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.showError(`Cannot finish quest "${key}"`);
      return;
    }
    console.log(`[QuestManager] Finishing quest: ${key}`);
    await quest.finish();
    await this.syncQuestState();
  }

  /**
   * Saves the quest progress to the database.
   * @param {string} questKey - The quest key.
   * @param {number} currentStage - The current stage.
   * @param {number} totalStages - The total number of stages.
   * @param {string} status - The quest status.
   */
  async updateQuestProgress(questKey, currentStage, totalStages, status) {
    const questData = {
      quest_key: questKey,
      current_stage: currentStage,
      total_stages: totalStages,
      status
    };
    await this.app.databaseManager.saveQuestRecord(questData);
    console.log("[QuestManager] Quest progress updated:", questData);
  }

  /**
   * Restores the UI for the repeating quest.
   */
  restoreRepeatingQuestUI() {
    const repeatingQuest = this.quests.find(q => q.key === "repeating_quest");
    if (repeatingQuest && typeof repeatingQuest.restoreUI === "function") {
      console.log("[QuestManager] Restoring repeating quest UI...");
      repeatingQuest.restoreUI();
    }
  }

  /**
   * Re-initializes UI for all active quests.
   * For each quest, if a corresponding database record exists with active status,
   * the quest's restoreUI method is called to reinitialize its UI.
   */
  restoreAllActiveQuests() {
    console.log("[QuestManager] Attempting to restore UI for all active quests...");
    this.quests.forEach(quest => {
      const record = this.app.databaseManager.getQuestRecord(quest.key);
      if (record && (record.status === "active" || record.status === "finished" && quest.currentStage <= quest.totalStages) && !quest.finished) {
        console.log(`[QuestManager] Found active quest "${quest.key}". Restoring UI...`);
        if (typeof quest.restoreUI === "function") {
          quest.restoreUI();
        } else {
          console.log(`[QuestManager] Quest "${quest.key}" does not implement restoreUI().`);
        }
      }
    });
    // Update the Post button state after UI restoration
    if (this.app.ghostManager && typeof this.app.ghostManager.updatePostButtonState === 'function') {
      this.app.ghostManager.updatePostButtonState();
    }
  }
}

/***/ }),

/***/ "./src/managers/SQLiteDataManager.js":
/*!*******************************************!*\
  !*** ./src/managers/SQLiteDataManager.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SQLiteDataManager: () => (/* binding */ SQLiteDataManager)
/* harmony export */ });
class SQLiteDataManager {
  /**
   * Constructor for SQLiteDataManager.
   * @param {Object} options - Configuration options.
   *   - dbName: Name of the IndexedDB database (default: 'sqliteDB').
   *   - storeName: Name of the object store (default: 'dbStore').
   *   - key: Key under which the database is stored (default: 'sqlite').
   */
  constructor(options = {}) {
    this.dbName = options.dbName || 'sqliteDB';
    this.storeName = options.storeName || 'dbStore';
    this.key = options.key || 'sqlite';
  }

  /**
   * openDB – Opens (or creates) the IndexedDB database.
   * @returns {Promise<IDBDatabase>} Resolves with the opened database instance.
   */
  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = event => {
        console.error("Error opening IndexedDB:", event.target.error);
        reject(event.target.error);
      };
      request.onupgradeneeded = event => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      request.onsuccess = event => {
        resolve(event.target.result);
      };
    });
  }

  /**
   * initDatabase – Initializes the SQL.js database.
   * If saved database data is found in IndexedDB, restores it.
   * Otherwise, creates a new database instance.
   *
   * After restoration or creation, migration queries are executed
   * to ensure that all required tables (diary, apartment_plan, quest_progress,
   * ghosts, events, quests, chat_messages) exist.
   *
   * @param {Object} SQL - The SQL.js module.
   * @returns {Promise<SQL.Database>} Resolves to the SQL.js database instance.
   */
  async initDatabase(SQL) {
    const savedDbBase64 = await this.loadDatabase();
    let dbInstance;
    if (savedDbBase64) {
      // Restore database from saved base64 data.
      const binaryStr = atob(savedDbBase64);
      const binaryData = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        binaryData[i] = binaryStr.charCodeAt(i);
      }
      dbInstance = new SQL.Database(binaryData);
      console.log("Database restored from IndexedDB.");
    } else {
      // Create a new database instance.
      dbInstance = new SQL.Database();
      console.log("New database instance created.");
    }

    // Run migration queries to ensure all required tables exist.
    this.migrateDatabase(dbInstance);
    if (!savedDbBase64) {
      console.log("New database created and tables initialized.");
    } else {
      console.log("Database migration complete.");
    }
    return dbInstance;
  }

  /**
   * migrateDatabase – Runs migration queries to update the database schema.
   * Ensures that all required tables exist.
   *
   * @param {SQL.Database} dbInstance - The SQL.js database instance.
   */
  migrateDatabase(dbInstance) {
    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS diary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry TEXT,
        timestamp TEXT
      );
      CREATE TABLE IF NOT EXISTS apartment_plan (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        floor_number INTEGER,
        room_data TEXT
      );
      CREATE TABLE IF NOT EXISTS quest_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quest_key TEXT,
        status TEXT
      );
      CREATE TABLE IF NOT EXISTS ghosts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        status TEXT,
        progress INTEGER
      );
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_key TEXT,
        event_text TEXT,
        timestamp TEXT,
        completed INTEGER
      );
      CREATE TABLE IF NOT EXISTS quests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quest_key TEXT,
        status TEXT,
        current_stage INTEGER,
        total_stages INTEGER
      );
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT,
        message TEXT,
        timestamp TEXT
      );
    `);
  }

  /**
   * saveDatabase – Exports the database to a base64 string and persists it via IndexedDB.
   *
   * @param {string} base64Data - The base64-encoded database data.
   * @returns {Promise<void>} Resolves when saving is complete.
   */
  async saveDatabase(base64Data) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      transaction.oncomplete = () => {
        console.log("Database saved successfully in IndexedDB.");
        resolve();
      };
      transaction.onerror = event => {
        console.error("Transaction error during saveDatabase:", event.target.error);
        reject(event.target.error);
      };
      const store = transaction.objectStore(this.storeName);
      const putRequest = store.put(base64Data, this.key);
      putRequest.onerror = event => {
        console.error("Error saving database data:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * loadDatabase – Loads the database data from IndexedDB.
   *
   * @returns {Promise<string>} Resolves to the base64 string representing the database, or undefined if not found.
   */
  async loadDatabase() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      transaction.onerror = event => {
        console.error("Transaction error during loadDatabase:", event.target.error);
        reject(event.target.error);
      };
      const store = transaction.objectStore(this.storeName);
      const getRequest = store.get(this.key);
      getRequest.onsuccess = event => {
        console.log("Database loaded successfully from IndexedDB.");
        resolve(event.target.result);
      };
      getRequest.onerror = event => {
        console.error("Error loading database data:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * resetDatabase – Deletes the saved SQL database data (base64 string) from IndexedDB.
   *
   * @returns {Promise<void>} Resolves when the database data is successfully deleted.
   */
  async resetDatabase() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      transaction.oncomplete = () => {
        console.log("SQL database reset successfully in IndexedDB.");
        resolve();
      };
      transaction.onerror = event => {
        console.error("Transaction error during resetDatabase:", event.target.error);
        reject(event.target.error);
      };
      const store = transaction.objectStore(this.storeName);
      const deleteRequest = store.delete(this.key);
      deleteRequest.onerror = event => {
        console.error("Error deleting SQL database data:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * saveProfile – Saves the profile data to IndexedDB.
   *
   * @param {Object} profile - The profile object to be saved.
   * @returns {Promise<void>}
   */
  async saveProfile(profile) {
    const profileKey = 'profile';
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      transaction.oncomplete = () => {
        console.log("Profile saved successfully in IndexedDB.");
        resolve();
      };
      transaction.onerror = event => {
        console.error("Transaction error during saveProfile:", event.target.error);
        reject(event.target.error);
      };
      const store = transaction.objectStore(this.storeName);
      const putRequest = store.put(JSON.stringify(profile), profileKey);
      putRequest.onerror = event => {
        console.error("Error saving profile data:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * getProfile – Loads the profile data from IndexedDB.
   *
   * @returns {Promise<Object|null>} Resolves to the profile object or null if not found.
   */
  async getProfile() {
    const profileKey = 'profile';
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      transaction.onerror = event => {
        console.error("Transaction error during getProfile:", event.target.error);
        reject(event.target.error);
      };
      const store = transaction.objectStore(this.storeName);
      const getRequest = store.get(profileKey);
      getRequest.onsuccess = event => {
        const result = event.target.result;
        if (result) {
          resolve(JSON.parse(result));
        } else {
          resolve(null);
        }
      };
      getRequest.onerror = event => {
        console.error("Error loading profile data:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * resetProfile – Deletes the profile data from IndexedDB.
   *
   * @returns {Promise<void>} Resolves when the profile is successfully reset.
   */
  async resetProfile() {
    const profileKey = 'profile';
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      transaction.oncomplete = () => {
        console.log("Profile reset successfully in IndexedDB.");
        resolve();
      };
      transaction.onerror = event => {
        console.error("Transaction error during resetProfile:", event.target.error);
        reject(event.target.error);
      };
      const store = transaction.objectStore(this.storeName);
      const deleteRequest = store.delete(profileKey);
      deleteRequest.onerror = event => {
        console.error("Error deleting profile:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  // Additional methods for ghosts, events, quests can be added here:
  // async saveGhostProgress(progress) { ... }
  // async getGhostProgress() { ... }
  // async saveLocationType(locationType) { ... }
  // async getLocationType() { ... }
}

/***/ }),

/***/ "./src/managers/ShowProfileModal.js":
/*!******************************************!*\
  !*** ./src/managers/ShowProfileModal.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ShowProfileModal: () => (/* binding */ ShowProfileModal)
/* harmony export */ });
/**
 * Класс ShowProfileModal отвечает за отображение модального окна профиля,
 * где пользователь может редактировать данные своего профиля, включая селфи,
 * логин, просматривать план квартиры и видеть награды (прогресс призраков).
 */
class ShowProfileModal {
  /**
   * Конструктор класса.
   * @param {App} appInstance - Ссылка на главный объект приложения для доступа ко всем менеджерам и данным.
   */
  constructor(appInstance) {
    // Сохраняем ссылку на главный объект приложения.
    this.app = appInstance;
  }

  /**
   * Метод show – открывает модальное окно профиля.
   * В этом окне отображается текущий профиль, позволяющее пользователю редактировать данные.
   */
  show() {
    // Получаем текущий профиль через менеджер профиля.
    const profile = this.app.profileManager.getProfile();
    if (!profile) {
      alert("Профиль не найден.");
      return;
    }

    // Создаем оверлей для модального окна с фиксированным позиционированием и затемненным фоном.
    const modalOverlay = document.createElement("div");
    modalOverlay.id = "profile-modal-overlay";
    Object.assign(modalOverlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: "2000",
      overflowY: "auto"
    });

    // Создаем контейнер модального окна.
    const modal = document.createElement("div");
    modal.id = "profile-modal";
    Object.assign(modal.style, {
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "8px",
      width: "90%",
      maxWidth: "500px",
      maxHeight: "90%",
      overflowY: "auto",
      boxShadow: "0 0 10px rgba(0,0,0,0.3)"
    });

    // Заголовок модального окна.
    const title = document.createElement("h2");
    title.textContent = "Редактирование профиля";
    modal.appendChild(title);

    // Блок для отображения аватара (селфи).
    const avatarContainer = document.createElement("div");
    avatarContainer.style.textAlign = "center";

    // Создаем элемент изображения для аватара.
    const avatarImg = document.createElement("img");
    avatarImg.id = "profile-modal-avatar";
    avatarImg.src = profile.selfie;
    avatarImg.alt = "Аватар";
    Object.assign(avatarImg.style, {
      width: "100px",
      height: "100px",
      borderRadius: "50%"
    });
    avatarContainer.appendChild(avatarImg);

    // Кнопка для обновления селфи.
    const updateSelfieBtn = document.createElement("button");
    updateSelfieBtn.textContent = "Обновить селфи";
    updateSelfieBtn.style.marginTop = "10px";
    updateSelfieBtn.addEventListener("click", () => {
      // Открываем отдельное модальное окно для редактирования селфи.
      this.showSelfieEditModal(newSelfieSrc => {
        // После успешного захвата селфи обновляем аватар.
        avatarImg.src = newSelfieSrc;
      });
    });
    avatarContainer.appendChild(updateSelfieBtn);
    modal.appendChild(avatarContainer);

    // Поле для редактирования логина.
    const loginLabel = document.createElement("label");
    loginLabel.textContent = "Логин:";
    loginLabel.style.display = "block";
    loginLabel.style.marginTop = "15px";
    modal.appendChild(loginLabel);
    const loginInput = document.createElement("input");
    loginInput.type = "text";
    loginInput.value = profile.name;
    loginInput.style.width = "100%";
    loginInput.style.marginBottom = "15px";
    modal.appendChild(loginInput);

    // Блок для отображения плана квартиры.
    const planContainer = document.createElement("div");
    planContainer.id = "profile-plan-container";
    planContainer.style.border = "1px solid #ccc";
    planContainer.style.padding = "10px";
    planContainer.style.marginBottom = "15px";
    // Если менеджер плана квартиры существует, пытаемся отобразить план.
    if (this.app.apartmentPlanManager) {
      // Если таблица еще не создана, пытаемся её создать.
      if (!this.app.apartmentPlanManager.table) {
        this.app.apartmentPlanManager.createTable();
      }
      // Если таблица успешно создана, клонируем ее для отображения.
      if (this.app.apartmentPlanManager.table) {
        const planClone = this.app.apartmentPlanManager.table.cloneNode(true);
        planContainer.appendChild(planClone);
        // Если существует несколько этажей, добавляем кнопки переключения этажей.
        const floors = this.app.apartmentPlanManager.rooms.map(room => room.floor);
        const uniqueFloors = [...new Set(floors)];
        if (uniqueFloors.length > 1) {
          const floorControls = document.createElement("div");
          floorControls.style.textAlign = "center";
          floorControls.style.marginTop = "10px";
          const prevFloorBtn = document.createElement("button");
          prevFloorBtn.textContent = "Предыдущий этаж";
          prevFloorBtn.addEventListener("click", () => {
            this.app.apartmentPlanManager.prevFloor();
            planContainer.innerHTML = "";
            if (this.app.apartmentPlanManager.table) {
              const newPlan = this.app.apartmentPlanManager.table.cloneNode(true);
              planContainer.appendChild(newPlan);
            } else {
              planContainer.textContent = "План квартиры отсутствует.";
            }
          });
          const nextFloorBtn = document.createElement("button");
          nextFloorBtn.textContent = "Следующий этаж";
          nextFloorBtn.style.marginLeft = "10px";
          nextFloorBtn.addEventListener("click", () => {
            this.app.apartmentPlanManager.nextFloor();
            planContainer.innerHTML = "";
            if (this.app.apartmentPlanManager.table) {
              const newPlan = this.app.apartmentPlanManager.table.cloneNode(true);
              planContainer.appendChild(newPlan);
            } else {
              planContainer.textContent = "План квартиры отсутствует.";
            }
          });
          floorControls.appendChild(prevFloorBtn);
          floorControls.appendChild(nextFloorBtn);
          planContainer.appendChild(floorControls);
        }
      } else {
        planContainer.textContent = "План квартиры отсутствует.";
      }
    } else {
      planContainer.textContent = "План квартиры отсутствует.";
    }
    modal.appendChild(planContainer);

    // Информационная надпись.
    const note = document.createElement("p");
    note.textContent = "Переехать и начать с чистого листа - это иногда помогает избавиться от привидений, но не всегда.";
    note.style.fontStyle = "italic";
    modal.appendChild(note);

    // Блок для отображения наград (прогресс призраков).
    const rewardsContainer = document.createElement("div");
    rewardsContainer.id = "ghost-rewards-container";
    Object.assign(rewardsContainer.style, {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      marginTop: "20px"
    });
    // Получаем список призраков из менеджера призраков.
    const ghostList = this.app.ghostManager && this.app.ghostManager.ghosts || [];
    ghostList.forEach(ghost => {
      const ghostIcon = document.createElement("div");
      ghostIcon.className = "ghost-icon";
      Object.assign(ghostIcon.style, {
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        border: "2px solid #ccc",
        margin: "5px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "12px",
        fontWeight: "bold",
        position: "relative"
      });
      // Получаем прогресс призрака из менеджера профиля.
      const ghostProgress = this.app.profileManager.getGhostProgress();
      if (ghostProgress && ghostProgress.ghostId === ghost.id) {
        // Если призрак активен, отображаем текущий шаг и общее количество шагов.
        ghostIcon.textContent = `${ghostProgress.phenomenonIndex}/${ghost.phenomenaCount}`;
        ghostIcon.style.borderColor = "#4caf50"; // Зеленая рамка для активного призрака.
      } else {
        // Для остальных призраков отображаем имя с эффектом серой гаммы.
        ghostIcon.textContent = ghost.name;
        ghostIcon.style.filter = "grayscale(100%)";
      }
      rewardsContainer.appendChild(ghostIcon);
    });
    modal.appendChild(rewardsContainer);

    // Контейнер для кнопок "Отмена" и "Сохранить изменения".
    const btnContainer = document.createElement("div");
    btnContainer.style.textAlign = "right";
    btnContainer.style.marginTop = "20px";

    // Кнопка "Отмена" закрывает модальное окно.
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Отмена";
    cancelBtn.style.marginRight = "10px";
    cancelBtn.addEventListener("click", () => {
      document.body.removeChild(modalOverlay);
    });
    btnContainer.appendChild(cancelBtn);

    // Кнопка "Сохранить изменения" обновляет профиль с новыми данными и закрывает окно.
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Сохранить изменения";
    saveBtn.addEventListener("click", () => {
      // Обновляем профиль, объединяя старые данные с новыми (логин и селфи).
      const updatedProfile = Object.assign({}, profile, {
        name: loginInput.value,
        selfie: avatarImg.src
      });
      this.app.profileManager.saveProfile(updatedProfile);
      // Обновляем мини-профиль в основном интерфейсе.
      this.app.profileNameElem.textContent = updatedProfile.name;
      this.app.profilePhotoElem.src = updatedProfile.selfie;
      document.body.removeChild(modalOverlay);
    });
    btnContainer.appendChild(saveBtn);
    modal.appendChild(btnContainer);

    // Добавляем контейнер модального окна в оверлей и помещаем его в body.
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
  }

  /**
   * Метод showSelfieEditModal – открывает отдельное модальное окно для редактирования селфи.
   * После захвата нового селфи вызывается переданный колбэк для обновления аватара.
   * @param {Function} onSelfieCaptured - функция, вызываемая с новым селфи (dataURL) после его захвата.
   */
  showSelfieEditModal(onSelfieCaptured) {
    // Создаем оверлей для модального окна редактирования селфи.
    const selfieOverlay = document.createElement("div");
    selfieOverlay.id = "selfie-edit-overlay";
    Object.assign(selfieOverlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.7)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: "2100",
      overflowY: "auto"
    });

    // Контейнер для модального окна редактирования селфи.
    const selfieModal = document.createElement("div");
    selfieModal.id = "selfie-edit-modal";
    Object.assign(selfieModal.style, {
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "8px",
      width: "90%",
      maxWidth: "400px",
      maxHeight: "90%",
      overflowY: "auto",
      boxShadow: "0 0 10px rgba(0,0,0,0.3)"
    });

    // Заголовок модального окна редактирования селфи.
    const title = document.createElement("h3");
    title.textContent = "Редактирование селфи";
    selfieModal.appendChild(title);

    // Контейнер для видео, где будет отображаться видеопоток с камеры.
    const videoContainer = document.createElement("div");
    videoContainer.id = "selfie-video-container";
    Object.assign(videoContainer.style, {
      width: "100%",
      maxWidth: "400px",
      margin: "10px auto"
    });
    selfieModal.appendChild(videoContainer);

    // Прикрепляем видео к контейнеру с заданными опциями (например, с фильтром).
    this.app.cameraSectionManager.attachTo("selfie-video-container", {
      width: "100%",
      maxWidth: "400px",
      filter: "grayscale(100%)"
    });
    // Запускаем камеру.
    this.app.cameraSectionManager.startCamera();

    // Кнопка для захвата селфи.
    const captureBtn = document.createElement("button");
    captureBtn.textContent = "Сделать селфи";
    captureBtn.style.display = "block";
    captureBtn.style.margin = "10px auto";
    captureBtn.addEventListener("click", () => {
      // Проверяем, активна ли камера.
      if (!this.app.cameraSectionManager.videoElement || !this.app.cameraSectionManager.videoElement.srcObject) {
        alert("Камера не включена.");
        return;
      }
      const video = this.app.cameraSectionManager.videoElement;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      // Преобразуем изображение в оттенки серого.
      const selfieData = window.ImageUtils ? window.ImageUtils.convertToGrayscale(canvas) : canvas.toDataURL();
      // Останавливаем камеру.
      this.app.cameraSectionManager.stopCamera();
      // Закрываем окно редактирования селфи.
      document.body.removeChild(selfieOverlay);
      // Вызываем колбэк для обновления аватара.
      if (onSelfieCaptured) onSelfieCaptured(selfieData);
    });
    selfieModal.appendChild(captureBtn);

    // Кнопка для отмены редактирования селфи.
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Отмена";
    cancelBtn.style.display = "block";
    cancelBtn.style.margin = "10px auto";
    cancelBtn.addEventListener("click", () => {
      // Останавливаем камеру и закрываем окно редактирования селфи.
      this.app.cameraSectionManager.stopCamera();
      document.body.removeChild(selfieOverlay);
    });
    selfieModal.appendChild(cancelBtn);
    selfieOverlay.appendChild(selfieModal);
    document.body.appendChild(selfieOverlay);
  }
}

/***/ }),

/***/ "./src/managers/StateManager.js":
/*!**************************************!*\
  !*** ./src/managers/StateManager.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   StateManager: () => (/* binding */ StateManager)
/* harmony export */ });
/* harmony import */ var _ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ErrorManager.js */ "./src/managers/ErrorManager.js");
/* harmony import */ var _config_stateKeys_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../config/stateKeys.js */ "./src/config/stateKeys.js");



/**
 * StateManager
 *
 * Centralized module for managing application state.
 * Provides static methods to get, set, and remove values from localStorage.
 * All parts of the application should use these methods to access or modify state.
 *
 * Note: Values are stored as strings, so for objects or arrays use JSON.stringify() before setting,
 * and JSON.parse() when retrieving.
 */
class StateManager {
  // Load all state-keys from external JS module
  static KEYS = _config_stateKeys_js__WEBPACK_IMPORTED_MODULE_1__["default"];

  /**
   * Retrieves the value associated with the specified key from localStorage.
   *
   * @param {string} key - The key to retrieve.
   * @returns {string|null} The stored value as a string, or null if not found or on error.
   */
  static get(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__.ErrorManager.logError(`StateManager.get error for key "${key}": ${error}`, "StateManager.get");
      return null;
    }
  }

  /**
   * Stores the given value in localStorage under the specified key.
   *
   * @param {string} key - The key under which to store the value.
   * @param {string} value - The value to store (should be a string; use JSON.stringify() if needed).
   */
  static set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__.ErrorManager.logError(`StateManager.set error for key "${key}": ${error}`, "StateManager.set");
    }
  }

  /**
   * Removes the item with the specified key from localStorage.
   *
   * @param {string} key - The key of the item to remove.
   */
  static remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_0__.ErrorManager.logError(`StateManager.remove error for key "${key}": ${error}`, "StateManager.remove");
    }
  }

  /**
   * Mark camera as open or closed.
   * @param {boolean} isOpen
   */
  static setCameraOpen(isOpen) {
    StateManager.set(StateManager.KEYS.CAMERA_OPEN, isOpen ? 'true' : 'false');
  }

  /**
   * Check whether camera is currently open.
   * @returns {boolean}
   */
  static isCameraOpen() {
    return StateManager.get(StateManager.KEYS.CAMERA_OPEN) === 'true';
  }

  /**
   * Store or clear the active quest key.
   * @param {string|null} key
   */
  static setActiveQuestKey(key) {
    if (key) {
      StateManager.set(StateManager.KEYS.ACTIVE_QUEST_KEY, key);
    } else {
      StateManager.remove(StateManager.KEYS.ACTIVE_QUEST_KEY);
    }
  }

  /**
   * Retrieve the current active quest key, or null if none.
   * @returns {string|null}
   */
  static getActiveQuestKey() {
    return StateManager.get(StateManager.KEYS.ACTIVE_QUEST_KEY);
  }

  /**
   * Return true if both the camera is open and a quest is active.
   * @returns {boolean}
   */
  static canShoot() {
    return this.get(StateManager.KEYS.CAMERA_BUTTON_ACTIVE) === "true" && !!this.getActiveQuestKey();
  }

  /**
   * Return true if no quest is active (i.e. user may press Post).
   * @returns {boolean}
   */
  static canPost() {
    return !StateManager.getActiveQuestKey();
  }
}

/***/ }),

/***/ "./src/managers/ViewManager.js":
/*!*************************************!*\
  !*** ./src/managers/ViewManager.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ViewManager: () => (/* binding */ ViewManager)
/* harmony export */ });
/* harmony import */ var _config_paths_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../config/paths.js */ "./src/config/paths.js");
/* harmony import */ var _StateManager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./StateManager.js */ "./src/managers/StateManager.js");
/* harmony import */ var _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./ErrorManager.js */ "./src/managers/ErrorManager.js");
/* harmony import */ var _utils_ImageUtils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/ImageUtils.js */ "./src/utils/ImageUtils.js");
/* harmony import */ var _ApartmentPlanManager_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./ApartmentPlanManager.js */ "./src/managers/ApartmentPlanManager.js");
/* harmony import */ var _utils_TemplateEngine_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/TemplateEngine.js */ "./src/utils/TemplateEngine.js");







/**
 * ViewManager
 *
 * Central UI module responsible for:
 * - Switching screens.
 * - Managing button states.
 * - Updating profile display.
 * - Rendering the diary.
 * - Handling UI effects and notifications.
 *
 * All UI updates and DOM manipulations are centralized here.
 */
class ViewManager {
  constructor(appInstance) {
    this.app = appInstance;
    // --- Cache static UI elements from index.html ---
    this.loadingOlderPosts = false;
    this.controlsPanel = document.getElementById("controls-panel");
    this.languageSelector = document.getElementById('language-selector');
    this.globalCamera = document.getElementById("global-camera");
    this.postBtn = document.getElementById("post-btn");
    this.toggleCameraBtn = document.getElementById("toggle-camera");
    this.toggleDiaryBtn = document.getElementById("toggle-diary");
    this.resetDataBtn = document.getElementById("reset-data");
    this.exportProfileBtn = document.getElementById("export-profile-btn");
    this.updateBtn = document.getElementById("update-btn");

    // Initially, we assign the diaryContainer from the hidden placeholder
    this.diaryContainer = document.getElementById("diary");
    this.cameraManager = null;
    this.languageManager = null;

    // Disable "Post" button initially.
    if (this.postBtn) {
      this.postBtn.disabled = true;
      // Use universal flag storage; initial state is disabled.
      _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.set(_StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.KEYS.POST_BUTTON_DISABLED, "true");
      console.log("[ViewManager] Post button disabled on initialization.");
    }
  }
  setCameraManager(cameraManager) {
    this.cameraManager = cameraManager;
    console.log("[ViewManager] Camera manager set.");
  }
  setLanguageManager(languageManager) {
    this.languageManager = languageManager;
  }
  getRegistrationData() {
    if (!this.nameInput || !this.genderSelect) {
      return null;
    }
    return {
      name: this.nameInput.value.trim(),
      gender: this.genderSelect.value.trim(),
      language: this.languageSelector ? this.languageSelector.value : 'en'
    };
  }
  bindEvents(app) {
    if (this.languageSelector) {
      this.languageSelector.addEventListener('change', () => {
        console.log("Language select changed:", this.languageSelector.value);
      });
    }
    if (this.toggleCameraBtn) {
      this.toggleCameraBtn.addEventListener("click", () => {
        this.toggleCameraView(app);
      });
    }
    if (this.toggleDiaryBtn) {
      this.toggleDiaryBtn.addEventListener("click", () => {
        this.toggleCameraView(app);
      });
    }
    if (this.resetDataBtn) {
      this.resetDataBtn.addEventListener("click", () => {
        console.log("Reset Data button clicked.");
        app.profileManager.resetProfile();
      });
    }
    if (this.exportProfileBtn) {
      this.exportProfileBtn.addEventListener("click", () => {
        console.log("Export Profile button clicked.");
        this.exportProfile(app);
      });
    }
    if (this.updateBtn) {
      this.updateBtn.addEventListener("click", () => {
        console.log("Update button clicked.");
        this.clearCache();
      });
    }
    const chatBtn = document.getElementById("chat-btn");
    if (chatBtn) {
      chatBtn.addEventListener("click", () => {
        console.log("Chat button clicked. Triggering toggleChat().");
        this.toggleChat(app);
      });
    } else {
      console.error("Chat button (id='chat-btn') not found in the DOM.");
    }

    // >>> Add missing event listener for the Post button.
    if (this.postBtn) {
      this.postBtn.addEventListener("click", () => {
        console.log("Post button clicked. Delegating to ghostManager.handlePostButtonClick()...");
        app.ghostManager.handlePostButtonClick();
      });
    } else {
      console.error("Post button (id='post-btn') not found in the DOM.");
    }
  }

  // ------------------ Dynamic Template Loading Methods ------------------

  async loadTemplate(screenId, data = {}) {
    const templateUrl = `${_config_paths_js__WEBPACK_IMPORTED_MODULE_0__.BASE_PATH}/templates/${screenId}_template.html`;
    try {
      const response = await fetch(templateUrl);
      if (!response.ok) {
        throw new Error(`Failed to load template: ${templateUrl}`);
      }
      const templateText = await response.text();
      const renderedHTML = _utils_TemplateEngine_js__WEBPACK_IMPORTED_MODULE_5__.TemplateEngine.render(templateText, data);
      const container = document.getElementById("global-content");
      if (container) {
        container.innerHTML += renderedHTML;
        const newScreen = container.lastElementChild;
        console.log(`[ViewManager] Loaded template for screen: ${screenId}`);
        if (this.languageManager && typeof this.languageManager.updateContainerLanguage === 'function') {
          this.languageManager.updateContainerLanguage(newScreen);
        }
        // APPLY VISUAL EFFECTS TO NEW ELEMENTS IN THE LOADED SCREEN
        if (this.app && this.app.visualEffectsManager && typeof this.app.visualEffectsManager.applyEffectsToNewElements === 'function') {
          const newElements = newScreen.querySelectorAll("[data-animate-on-board='true']");
          this.app.visualEffectsManager.applyEffectsToNewElements(newElements);
        }
        return newScreen;
      } else {
        throw new Error("Global content container (id='global-content') not found.");
      }
    } catch (error) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError(error, "loadTemplate");
      return null;
    }
  }

  /**
   * switchScreen
   * Switches the UI to the target screen. If the screen element does not exist,
   * it dynamically loads the template from the templates folder.
   * Also re-binds dynamic event handlers for newly loaded screens
   * and toggles the global language selector (on landing only).
   *
   * @param {string} screenId - The id of the target screen.
   * @param {string} buttonsGroupId - The id of the control button group to display.
   * @param {App} [app] - The main application instance (if needed for event callbacks).
   */
  async switchScreen(screenId, buttonsGroupId, app) {
    // Hide all sections
    document.querySelectorAll('section').forEach(section => {
      section.style.display = 'none';
    });
    let targetScreen = document.getElementById(screenId);
    if (!targetScreen) {
      // If not found, load the template dynamically.
      targetScreen = await this.loadTemplate(screenId, {});
      if (!targetScreen) {
        console.error(`[ViewManager] Failed to load screen: ${screenId}`);
        return;
      }
    }
    targetScreen.style.display = 'block';
    console.log(`[ViewManager] Switched to screen: ${screenId}`);

    // APPLY VISUAL EFFECTS TO NEW ELEMENTS IN THE SWITCHED SCREEN
    if (this.app && this.app.visualEffectsManager && typeof this.app.visualEffectsManager.applyEffectsToNewElements === 'function') {
      const newElements = targetScreen.querySelectorAll("[data-animate-on-board='true']");
      this.app.visualEffectsManager.applyEffectsToNewElements(newElements);
    }

    // If main-screen, update diaryContainer to the newly loaded #diary
    if (screenId === "main-screen") {
      const diaryElem = targetScreen.querySelector('#diary');
      if (diaryElem) {
        this.diaryContainer = diaryElem;
        console.log("[ViewManager] Updated diary container for main-screen.");
        await this.loadLatestDiaryPosts();
        // подгружаем старые посты при приближении к низу страницы
        window.addEventListener("scroll", this.onScrollLoadOlder.bind(this), {
          passive: true
        });
      }
    }

    // If landing-screen, bind the start-registration button
    if (screenId === "landing-screen") {
      const startRegistrationBtn = targetScreen.querySelector('#start-registration-btn');
      if (startRegistrationBtn) {
        startRegistrationBtn.addEventListener('click', () => {
          this.switchScreen('registration-screen', 'registration-buttons', app);
          console.log("[ViewManager] Start registration button clicked, switching to registration screen.");
        });
      }
    }

    // If registration-screen, re-assign dynamic fields and event handlers
    if (screenId === "registration-screen") {
      this.nameInput = targetScreen.querySelector('#player-name');
      this.genderSelect = targetScreen.querySelector('#player-gender');
      this.nextStepBtn = targetScreen.querySelector('#next-step-btn');
      const checkRegistrationValidity = () => {
        const nameValid = this.nameInput && this.nameInput.value.trim().length > 0;
        const genderValid = this.genderSelect && this.genderSelect.value !== "";
        if (this.nextStepBtn) {
          this.nextStepBtn.disabled = !(nameValid && genderValid);
        }
      };
      if (this.nameInput) {
        this.nameInput.addEventListener('input', () => {
          console.log("Name input changed:", this.nameInput.value);
          checkRegistrationValidity();
        });
      }
      if (this.genderSelect) {
        this.genderSelect.addEventListener('change', () => {
          console.log("Gender select changed:", this.genderSelect.value);
          checkRegistrationValidity();
        });
      }
      if (this.nextStepBtn) {
        this.nextStepBtn.addEventListener('click', async () => {
          await this.goToApartmentPlanScreen(app);
          console.log("[ViewManager] Registration next button clicked. Moving to apartment plan screen.");
        });
      }
    }

    // If selfie-screen: the capture and complete buttons are static in index.html
    if (screenId === "selfie-screen") {
      const captureBtn = document.getElementById('capture-btn');
      if (captureBtn) {
        captureBtn.onclick = () => {
          console.log("Capture button clicked. Capturing selfie...");
          this.captureSelfie(app);
        };
      } else {
        console.error("Capture button (id='capture-btn') not found in the DOM.");
      }
      const completeBtn = document.getElementById('complete-registration');
      if (completeBtn) {
        completeBtn.onclick = () => {
          console.log("Complete registration button clicked.");
          this.completeRegistration(app);
        };
      } else {
        console.error("Complete registration button (id='complete-registration') not found in the DOM.");
      }
    }

    // If apartment-plan-screen
    if (screenId === "apartment-plan-screen" && app) {
      const prevFloorBtn = document.getElementById("prev-floor-btn");
      if (prevFloorBtn) {
        prevFloorBtn.addEventListener("click", () => {
          if (app.apartmentPlanManager) {
            app.apartmentPlanManager.prevFloor();
          }
        });
      }
      const nextFloorBtn = document.getElementById("next-floor-btn");
      if (nextFloorBtn) {
        nextFloorBtn.addEventListener("click", () => {
          if (app.apartmentPlanManager) {
            app.apartmentPlanManager.nextFloor();
          }
        });
      }
      const planNextBtn = targetScreen.querySelector('#apartment-plan-next-btn');
      if (planNextBtn) {
        planNextBtn.addEventListener('click', () => {
          console.log("Apartment Plan next button clicked. Going to selfie screen.");
          this.goToSelfieScreen(app);
        });
      }
    }

    // Hide all groups in the controls panel, then show the relevant group
    document.querySelectorAll('#controls-panel > .buttons').forEach(group => {
      group.style.display = 'none';
      group.style.pointerEvents = 'none';
    });
    if (buttonsGroupId) {
      const targetGroup = document.getElementById(buttonsGroupId);
      if (targetGroup) {
        targetGroup.style.display = 'flex';
        targetGroup.style.pointerEvents = 'auto';
        // On main-screen, hide toggle-diary and btn_shoot to avoid confusion
        if (screenId === "main-screen") {
          const td = targetGroup.querySelector("#toggle-diary");
          if (td) td.style.display = "none";
          const shootBtn = targetGroup.querySelector("#btn_shoot");
          if (shootBtn) shootBtn.style.display = "none";
        }
        console.log(`[ViewManager] Controls panel updated for group: ${buttonsGroupId}`);
      }
    }

    // Make the chat button visible
    const chatContainer = document.getElementById("chat-button-container");
    if (chatContainer) {
      chatContainer.style.display = 'flex';
      chatContainer.style.pointerEvents = 'auto';
      console.log("[ViewManager] Chat button container set to visible.");
    }

    // Show/hide the global language container depending on the screen
    const languageContainer = document.getElementById("language-container");
    if (languageContainer) {
      if (screenId === "landing-screen") {
        languageContainer.style.display = "block";
      } else {
        languageContainer.style.display = "none";
      }
    }
  }
  showToggleCameraButton() {
    if (this.toggleCameraBtn) {
      this.toggleCameraBtn.style.display = 'inline-block';
      console.log("[ViewManager] Toggle Camera button shown.");
    }
  }
  updateProfileDisplay(profile) {
    const profileNameElem = document.getElementById('profile-name');
    const profilePhotoElem = document.getElementById('profile-photo');
    if (profileNameElem) {
      profileNameElem.textContent = profile.name;
    }
    if (profilePhotoElem) {
      profilePhotoElem.src = profile.selfie;
      profilePhotoElem.style.display = 'block';
    }
    console.log("[ViewManager] Profile display updated.");
  }
  updateSelfiePreview(imageData) {
    const selfiePreview = document.getElementById('selfie-thumbnail');
    if (selfiePreview) {
      selfiePreview.src = imageData;
      selfiePreview.style.display = 'block';
      console.log("[ViewManager] Selfie preview updated.");
    } else {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError("Selfie preview element not found.", "updateSelfiePreview");
    }
  }
  enableCompleteButton() {
    const completeBtn = document.getElementById('complete-registration');
    if (completeBtn) {
      completeBtn.disabled = false;
      console.log("[ViewManager] Complete button enabled.");
    }
  }
  disableCompleteButton() {
    const completeBtn = document.getElementById('complete-registration');
    if (completeBtn) {
      completeBtn.disabled = true;
      console.log("[ViewManager] Complete button disabled.");
    }
  }
  getSelfieSource() {
    const selfiePreview = document.getElementById('selfie-thumbnail');
    return selfiePreview ? selfiePreview.src : "";
  }
  getImportFile() {
    const importFileInput = document.getElementById('import-file');
    if (importFileInput && importFileInput.files.length > 0) {
      return importFileInput.files[0];
    }
    return null;
  }
  showGlobalCamera() {
    if (this.globalCamera) {
      this.globalCamera.style.display = 'block';
      console.log("[ViewManager] Global camera displayed.");
    } else {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError("Global camera element not found.", "showGlobalCamera");
    }
  }
  hideGlobalCamera() {
    if (this.globalCamera) {
      this.globalCamera.style.display = 'none';
      console.log("[ViewManager] Global camera hidden.");
    } else {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError("Global camera element not found.", "hideGlobalCamera");
    }
  }
  showDiaryView() {
    const diary = document.getElementById("diary");
    if (diary && this.globalCamera) {
      diary.style.display = "block";
      this.globalCamera.style.display = "none";
      if (this.toggleCameraBtn) this.toggleCameraBtn.style.display = 'inline-block';
      if (this.toggleDiaryBtn) this.toggleDiaryBtn.style.display = "none";
      const shootBtn = document.getElementById("btn_shoot");
      if (shootBtn) shootBtn.style.display = "none";
      this.showPostButton();
      console.log("[ViewManager] Switched to diary view.");
    }
  }
  showCameraView() {
    const diary = document.getElementById("diary");
    if (diary && this.globalCamera) {
      diary.style.display = "none";
      this.globalCamera.style.display = "flex";
      if (this.toggleCameraBtn) this.toggleCameraBtn.style.display = 'none';
      if (this.toggleDiaryBtn) this.toggleDiaryBtn.style.display = 'inline-block';
      this.hidePostButton();
      const shootBtn = document.getElementById("btn_shoot");
      if (shootBtn) {
        shootBtn.style.display = "inline-block";
        console.log("[ViewManager] Shoot button shown for camera view; quest UI will manage its enabled state.");
      }
      console.log("[ViewManager] Switched to camera view.");
    }
  }
  showPostButton() {
    if (this.postBtn) {
      this.postBtn.style.display = 'inline-block';
      console.log("[ViewManager] Post button shown.");
    }
  }
  hidePostButton() {
    if (this.postBtn) {
      this.postBtn.style.display = 'none';
      console.log("[ViewManager] Post button hidden.");
    }
  }

  /**
   * setPostButtonEnabled
   * Sets the Post button state.
   * The passed parameter (isEnabled) is assumed to be pre-computed based on the universal quest state,
   * such as the presence of an active quest key ("activeQuestKey").
   */
  setPostButtonEnabled(isEnabled) {
    const postBtn = document.getElementById("post-btn");
    if (postBtn) {
      const gameFinalized = _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.get(_StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.KEYS.GAME_FINALIZED) === "true";
      if (gameFinalized) {
        postBtn.disabled = true;
        _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.set(_StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.KEYS.POST_BUTTON_DISABLED, "true");
        console.log("[ViewManager] Game finalized. Post button disabled.");
      } else {
        postBtn.disabled = !isEnabled;
        _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.set(_StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.KEYS.POST_BUTTON_DISABLED, isEnabled ? "false" : "true");
        console.log(`[ViewManager] Post button set to ${isEnabled ? "enabled" : "disabled"}.`);
      }
    }
  }

  /**
   * setCameraButtonActive
   * Sets the active state of the camera button.
   */
  setCameraButtonActive(isActive) {
    const cameraBtn = document.getElementById("toggle-camera");
    if (cameraBtn) {
      if (isActive) {
        cameraBtn.classList.add("active");
      } else {
        cameraBtn.classList.remove("active");
      }
      // Optionally, you might remove the old fixed key and rely on universal state instead.
      _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.set(_StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.KEYS.CAMERA_BUTTON_ACTIVE, JSON.stringify(isActive));
      console.log(`[ViewManager] Camera button active state set to ${isActive}.`);
    }
  }

  /**
   * restoreCameraButtonState
   * Restores the camera button state based on the universal quest state ("activeQuestKey").
   */
  restoreCameraButtonState() {
    const activeQuestKey = _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.getActiveQuestKey();
    // If an active quest is present, assume camera button should be active.
    const isActive = activeQuestKey ? true : false;
    this.setCameraButtonActive(isActive);
    console.log("[ViewManager] Camera button state restored using activeQuestKey:", isActive);
  }

  /**
   * setShootButtonActive
   * Sets the active state of the Shoot button.
   */
  setShootButtonActive(isActive) {
    const shootBtn = document.getElementById("btn_shoot");
    if (shootBtn) {
      // disabled и pointerEvents в одном месте
      shootBtn.disabled = !isActive;
      shootBtn.style.pointerEvents = isActive ? "auto" : "none";
      if (isActive) {
        shootBtn.classList.add("active");
      } else {
        shootBtn.classList.remove("active");
      }
      console.log(`[ViewManager] Shoot button active state set to ${isActive}.`);
    } else {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError("Shoot button not found.", "setShootButtonActive");
    }
  }

  /**
   * restoreShootButtonState
   * Restores the Shoot button state based on the universal quest state ("activeQuestKey").
   */
  restoreShootButtonState() {
    // Always start with Shoot disabled on page load.
    this.setShootButtonActive(false);
    console.log("[ViewManager] Shoot button state reset to disabled on restore.");
  }
  setApartmentPlanNextButtonEnabled(isEnabled) {
    const nextBtn = document.getElementById("apartment-plan-next-btn");
    if (nextBtn) {
      nextBtn.disabled = !isEnabled;
      console.log(`Apartment Plan Next button is now ${isEnabled ? "enabled" : "disabled"}.`);
    } else {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError("Apartment plan Next button not found.", "setApartmentPlanNextButtonEnabled");
    }
  }
  startMirrorQuestUI(options) {
    const statusElem = document.getElementById(options.statusElementId);
    if (statusElem) {
      statusElem.style.display = "block";
      statusElem.textContent = "No match...";
      console.log("[ViewManager] Mirror quest UI started, status set to 'No match...'");
    }
    const shootBtn = document.getElementById(options.shootButtonId);
    if (shootBtn) {
      shootBtn.style.display = "inline-block";
      const initialActive = typeof options.initialActive !== 'undefined' ? options.initialActive : false;
      this.setShootButtonActive(initialActive);
      shootBtn.style.pointerEvents = initialActive ? "auto" : "none";
      shootBtn.onclick = () => {
        this.setShootButtonActive(false);
        if (typeof options.onShoot === 'function') {
          options.onShoot();
        }
      };
      console.log("[ViewManager] Shoot button for mirror quest initialized.");
    } else {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError("Shoot button not found in the DOM.", "startMirrorQuestUI");
    }
  }
  updateMirrorQuestStatus(success, statusElementId, shootButtonId) {
    const statusElem = document.getElementById(statusElementId);
    if (statusElem) {
      statusElem.textContent = success ? "You are in front of the mirror!" : "No match...";
    }
    const shootBtn = document.getElementById(shootButtonId);
    if (shootBtn) {
      shootBtn.disabled = !success;
      shootBtn.style.pointerEvents = success ? "auto" : "none";
    }
    console.log(`[ViewManager] Mirror quest status updated. Success: ${success}`);
  }
  stopMirrorQuestUI(statusElementId) {
    const statusElem = document.getElementById(statusElementId);
    if (statusElem) {
      statusElem.style.display = "none";
    }
    this.setCameraButtonActive(false);
    this.setShootButtonActive(false);
    console.log("[ViewManager] Mirror quest UI stopped.");
  }

  /**
   * startRepeatingQuestUI
   * Displays the current target item and stage, and enables the Shoot button.
   * @param {{ statusElementId: string, shootButtonId: string, stage: number, totalStages: number, target?: string, onShoot: Function, quest?: Object }} options
   */
  startRepeatingQuestUI(options) {
    const statusElem = document.getElementById(options.statusElementId);
    if (statusElem) {
      statusElem.style.display = 'block';
      statusElem.textContent = `Stage ${options.stage} of ${options.totalStages}: find "${options.quest.currentTarget}"`;
    }
    const shootBtn = document.getElementById(options.shootButtonId);
    if (shootBtn) {
      shootBtn.style.display = 'inline-block';
      // English comment: disable Shoot by default until AI confirms detection
      this.setShootButtonActive(false);
      shootBtn.style.pointerEvents = 'none';
      shootBtn.onclick = () => {
        // English comment: prevent click if quest already finished
        if (options.quest && options.quest.finished) {
          console.log("[ViewManager] Quest is finished; ignoring Shoot click.");
          return;
        }
        // English comment: turn off again to avoid double clicks
        this.setShootButtonActive(false);
        if (typeof options.onShoot === "function") {
          options.onShoot();
        }
      };
      console.log("[ViewManager] Shoot button for repeating quest initialized.");
    } else {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError("Shoot button not found in the DOM.", "startRepeatingQuestUI");
    }
  }
  disableShootButton(shootButtonId) {
    const shootBtn = document.getElementById(shootButtonId);
    if (shootBtn) {
      shootBtn.disabled = true;
      shootBtn.style.pointerEvents = "none";
      console.log("[ViewManager] Shoot button disabled.");
    }
  }
  stopRepeatingQuestUI(statusElementId) {
    const statusElem = document.getElementById(statusElementId);
    if (statusElem) {
      statusElem.style.display = "none";
    }
    this.setCameraButtonActive(false);
    this.setShootButtonActive(false);
    console.log("[ViewManager] Repeating quest UI stopped.");
  }
  updateUIAfterQuestStage({
    postEnabled,
    cameraActive,
    shootActive
  }) {
    if (typeof postEnabled === 'boolean') {
      this.setPostButtonEnabled(postEnabled);
    }
    if (typeof cameraActive === 'boolean') {
      this.setCameraButtonActive(cameraActive);
    }
    if (typeof shootActive === 'boolean') {
      this.setShootButtonActive(shootActive);
    }
    console.log("[ViewManager] UI updated after quest stage:", {
      postEnabled,
      cameraActive,
      shootActive
    });
  }
  createTopCameraControls() {
    const existing = document.getElementById("top-camera-controls");
    if (existing) existing.remove();
    const topControls = document.createElement("div");
    topControls.id = "top-camera-controls";
    Object.assign(topControls.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      padding: "10px",
      background: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      zIndex: "2100"
    });
    const arBtn = document.createElement("button");
    arBtn.className = "button is-info";
    arBtn.innerText = "AR Mode";
    arBtn.onclick = () => {
      if (this.cameraManager) {
        this.cameraManager.startARMode();
      }
    };
    topControls.appendChild(arBtn);
    const aiBtn = document.createElement("button");
    aiBtn.className = "button is-primary";
    aiBtn.style.marginLeft = "10px";
    aiBtn.innerText = "Start AI Detection";
    aiBtn.onclick = () => {
      if (this.cameraManager) {
        this.cameraManager.startAIDetection();
      }
    };
    topControls.appendChild(aiBtn);
    const nightVisionBtn = document.createElement("button");
    nightVisionBtn.className = "button is-warning";
    nightVisionBtn.style.marginLeft = "10px";
    nightVisionBtn.innerText = "Night Vision";
    nightVisionBtn.onclick = () => {
      if (this.cameraManager) {
        this.cameraManager.applyFilter('nightVision');
      }
    };
    topControls.appendChild(nightVisionBtn);
    const blackWhiteBtn = document.createElement("button");
    blackWhiteBtn.className = "button is-warning";
    blackWhiteBtn.style.marginLeft = "10px";
    blackWhiteBtn.innerText = "Black & White";
    blackWhiteBtn.onclick = () => {
      if (this.cameraManager) {
        this.cameraManager.applyFilter('blackWhite');
      }
    };
    topControls.appendChild(blackWhiteBtn);
    const clearFilterBtn = document.createElement("button");
    clearFilterBtn.className = "button";
    clearFilterBtn.style.marginLeft = "10px";
    clearFilterBtn.innerText = "Clear Filter";
    clearFilterBtn.onclick = () => {
      if (this.cameraManager) {
        this.cameraManager.applyFilter('');
      }
    };
    topControls.appendChild(clearFilterBtn);
    document.body.appendChild(topControls);
    console.log("[ViewManager] Top camera controls created.");
  }
  applyBackgroundTransition(color, duration) {
    document.body.style.transition = `background ${duration}ms`;
    document.body.style.background = color;
    setTimeout(() => {
      document.body.style.background = "";
    }, duration);
    console.log(`[ViewManager] Applied background transition with color ${color} for ${duration}ms.`);
  }
  showGhostAppearanceEffect(ghostId) {
    const ghostEffect = document.createElement("div");
    Object.assign(ghostEffect.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "200px",
      height: "200px",
      background: `url('${_config_paths_js__WEBPACK_IMPORTED_MODULE_0__.BASE_PATH}/assets/images/${ghostId}.png') no-repeat center center`,
      backgroundSize: "contain",
      opacity: "0.7",
      transition: "opacity 2s"
    });
    document.body.appendChild(ghostEffect);
    setTimeout(() => {
      ghostEffect.style.opacity = "0";
    }, 3000);
    setTimeout(() => {
      ghostEffect.remove();
    }, 5000);
    console.log(`[ViewManager] Ghost appearance effect triggered for ghost ${ghostId}.`);
  }
  showNotification(message) {
    const notification = document.createElement("div");
    notification.textContent = message;
    Object.assign(notification.style, {
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: "rgba(0,0,0,0.8)",
      color: "white",
      padding: "10px 20px",
      borderRadius: "5px",
      zIndex: 10000,
      opacity: "0",
      transition: "opacity 0.5s"
    });
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.opacity = "1";
    }, 100);
    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 3000);
    console.log("[ViewManager] Notification shown:", message);
  }
  setControlsBlocked(shouldBlock) {
    if (this.controlsPanel) {
      this.controlsPanel.style.pointerEvents = shouldBlock ? "none" : "auto";
      console.log(`[ViewManager] Controls ${shouldBlock ? "blocked" : "unblocked"}.`);
    }
  }
  clearCache() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        action: 'CLEAR_CACHE'
      });
      console.log("Clear cache message sent to Service Worker.");
    } else {
      console.warn("No active Service Worker controller found.");
    }
  }

  // ------------------ Modified goToApartmentPlanScreen ------------------
  async goToApartmentPlanScreen(app) {
    const regData = this.getRegistrationData();
    if (!regData) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.showError("Registration data missing.");
      return;
    }
    _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.set('regData', JSON.stringify(regData));
    // Await the template loading so that the container is in the DOM.
    await this.switchScreen('apartment-plan-screen', 'apartment-plan-buttons', app);
    if (!app.apartmentPlanManager) {
      app.apartmentPlanManager = new _ApartmentPlanManager_js__WEBPACK_IMPORTED_MODULE_4__.ApartmentPlanManager('apartment-plan-container', app.databaseManager, app);
    }
  }
  // --------------------------------------------------------------------

  goToSelfieScreen(app) {
    this.switchScreen('selfie-screen', 'selfie-buttons', app);
    this.showGlobalCamera();
    if (app.cameraSectionManager) {
      app.cameraSectionManager.startCamera();
    }
    this.disableCompleteButton();
  }
  captureSelfie(app) {
    const video = app.cameraSectionManager.videoElement;
    if (!video || !video.srcObject) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError("Camera is not active!", "captureSelfie");
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.showError("Error: Camera is not active.");
      return;
    }
    if (video.readyState < 2) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError("Camera is not ready yet.", "captureSelfie");
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.showError("Please wait for the camera to load.");
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error("Failed to get 2D drawing context.");
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const grayscaleData = _utils_ImageUtils_js__WEBPACK_IMPORTED_MODULE_3__.ImageUtils.convertToGrayscale(canvas);
      this.updateSelfiePreview(grayscaleData);
      this.enableCompleteButton();
      app.selfieData = grayscaleData;
      console.log("✅ Selfie captured successfully!");
    } catch (error) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.logError(error, "captureSelfie");
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.showError("Error capturing selfie! Please try again.");
    }
  }
  completeRegistration(app) {
    const selfieSrc = this.getSelfieSource();
    if (!selfieSrc || selfieSrc === "") {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.showError("Please capture your selfie before completing registration.");
      return;
    }
    const regDataStr = _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.get('regData');
    if (!regDataStr) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.showError("Registration data missing.");
      return;
    }
    const regData = JSON.parse(regDataStr);
    const profile = {
      name: regData.name,
      gender: regData.gender,
      language: this.languageSelector ? this.languageSelector.value : 'en',
      selfie: selfieSrc
    };
    app.profileManager.saveProfile(profile).then(() => {
      _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.set("registrationCompleted", "true");
      app.cameraSectionManager.stopCamera();
      this.hideGlobalCamera();
      this.switchScreen('main-screen', 'main-buttons', app);
      this.showToggleCameraButton();
      // Use universal activeQuestKey to determine Post button state.
      const activeQuestKey = _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.getActiveQuestKey();
      this.setPostButtonEnabled(Boolean(activeQuestKey));
      app.profileManager.getProfile().then(profile => {
        this.updateProfileDisplay(profile);
        app.selfieData = profile.selfie;
      });
      app.gameEventManager.autoLaunchWelcomeEvent();
    });
  }

  /**
   * toggleCameraView
   * Switches between camera view and diary view, and persists the camera-open state.
   */
  toggleCameraView(app) {
    if (!app.isCameraOpen) {
      this.showCameraView();
      // Mark camera as open in memory and in persistent state
      app.isCameraOpen = true;
      _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.setCameraOpen(true);
      app.cameraSectionManager.startCamera();
      console.log("Camera opened and state saved.");
    } else {
      this.showDiaryView();
      app.cameraSectionManager.stopCamera();
      // Mark camera as closed in memory and in persistent state
      app.isCameraOpen = false;
      _StateManager_js__WEBPACK_IMPORTED_MODULE_1__.StateManager.setCameraOpen(false);
      console.log("Camera closed and state saved.");
    }
  }
  exportProfile(app) {
    app.profileManager.exportProfileData(app.databaseManager, app.apartmentPlanManager);
  }
  importProfile(app) {
    const file = this.getImportFile();
    if (!file) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_2__.ErrorManager.showError("Please select a profile file to import.");
      return;
    }
    app.profileManager.importProfileData(file, app.databaseManager, app.apartmentPlanManager);
  }
  toggleChat(app) {
    if (app.chatManager && app.chatManager.container) {
      if (app.chatManager.container.style.display === 'block') {
        app.chatManager.hide();
      } else {
        app.chatManager.show();
      }
    } else {
      console.error("ChatManager is not initialized or chat container not found.");
    }
  }
  showLocationTypeModal(onConfirm, onCancel) {
    const modalOverlay = document.createElement("div");
    modalOverlay.id = "location-type-modal-overlay";
    Object.assign(modalOverlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: "3000"
    });
    const modal = document.createElement("div");
    modal.id = "location-type-modal";
    Object.assign(modal.style, {
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "8px",
      maxWidth: "400px",
      width: "90%",
      textAlign: "center"
    });
    const title = document.createElement("h3");
    title.textContent = "Select location type";
    modal.appendChild(title);
    const selectElem = document.createElement("select");
    const locationTypes = ["Kitchen", "Bedroom", "Living Room", "Bathroom", "Corridor", "Other", "Entrance", "Office", "Library", "Kids Room", "Storage", "Garage"];
    locationTypes.forEach(type => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      selectElem.appendChild(option);
    });
    selectElem.value = "Other";
    selectElem.style.marginBottom = "15px";
    selectElem.style.display = "block";
    selectElem.style.width = "100%";
    modal.appendChild(selectElem);
    const btnContainer = document.createElement("div");
    btnContainer.style.marginTop = "15px";
    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "Confirm";
    confirmBtn.style.marginRight = "10px";
    confirmBtn.addEventListener("click", () => {
      console.log("Confirm button clicked, selected type:", selectElem.value);
      const selectedType = selectElem.value;
      if (onConfirm) onConfirm(selectedType);
      setTimeout(() => {
        modalOverlay.remove();
      }, 50);
    });
    btnContainer.appendChild(confirmBtn);
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => {
      console.log("Cancel button clicked.");
      if (onCancel) onCancel();
      modalOverlay.remove();
    });
    btnContainer.appendChild(cancelBtn);
    modal.appendChild(btnContainer);
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
  }

  /**
   * renderDiary
   * Renders the diary entries from the database into the diary container.
   * Now checks if entry text *contains* base64 data (`data:image`) anywhere;
   * if found, we separate text + image and render them properly.
   */
  renderDiary(entries, currentLanguage, visualEffectsManager) {
    if (!this.diaryContainer) {
      console.error("Diary container not set. Cannot render diary entries.");
      return;
    }
    this.diaryContainer.innerHTML = "";
    if (!entries || entries.length === 0) {
      const emptyMessage = this.languageManager && this.languageManager.translate("no_diary_entries", "Diary is empty.") || "Diary is empty.";
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "diary-empty";
      emptyDiv.textContent = emptyMessage;
      this.diaryContainer.appendChild(emptyDiv);
      return;
    }
    entries.forEach(entry => {
      let rendered;
      if (entry.entry.includes("data:image")) {
        // Находим начало base64
        const full = entry.entry;
        const idx = full.indexOf("data:image");
        const textLines = full.slice(0, idx).trim();
        const base64Line = full.slice(idx).trim();
        const entryWithImageTemplate = `
          <div class="diary-entry {{postClass}}" data-animate-on-board="true">
            <p>{{text}}</p>
            <img src="{{img}}" alt="Diary Image" data-animate-on-board="true" />
            <span class="diary-timestamp">{{timestamp}}</span>
          </div>
        `;
        rendered = _utils_TemplateEngine_js__WEBPACK_IMPORTED_MODULE_5__.TemplateEngine.render(entryWithImageTemplate, {
          postClass: entry.postClass,
          text: textLines,
          img: base64Line,
          timestamp: entry.timestamp
        });
      } else {
        const diaryEntryTemplate = `
          <div class="diary-entry {{postClass}}" data-animate-on-board="true">
            <p>{{entry}}</p>
            <span class="diary-timestamp">{{timestamp}}</span>
          </div>
        `;
        rendered = _utils_TemplateEngine_js__WEBPACK_IMPORTED_MODULE_5__.TemplateEngine.render(diaryEntryTemplate, {
          postClass: entry.postClass,
          entry: entry.entry,
          timestamp: entry.timestamp
        });
      }
      this.diaryContainer.innerHTML += rendered;
    });
    console.log("[ViewManager] Diary updated with " + entries.length + " entries.");
  }

  /**
   * Loads and renders the latest `limit` diary posts, newest first.
   */
  async loadLatestDiaryPosts(limit = 3) {
    // Получаем все записи
    const entries = await this.app.databaseManager.getDiaryEntries();
    // Сортируем по timestamp: от новых к старым
    entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    // Берём первые `limit` самых свежих
    const latest = entries.slice(0, limit);
    // Рендерим
    this.renderDiary(latest, this.app.languageManager.getLanguage(), this.app.visualEffectsManager);
  }

  /**
   * Inserts a single diary post without re‑rendering the whole list.
   * @param {Object} entryData { text, img, timestamp, postClass }
   */
  async addSingleDiaryPost(entryData) {
    if (!this.diaryContainer) return;

    // разбираем текст на до изображения и само изображение (если есть)
    let textPart = entryData.text;
    let imgSrc = "";
    if (entryData.text.includes("data:image")) {
      const idx = entryData.text.indexOf("data:image");
      textPart = entryData.text.slice(0, idx).trim();
      imgSrc = entryData.text.slice(idx).trim();
    }

    // строим тег <img> только если нашли base64
    const imgTag = imgSrc ? `<img src="${imgSrc}" alt="Diary image" />` : "";

    // абсолютный URL к шаблону
    const templateUrl = `${_config_paths_js__WEBPACK_IMPORTED_MODULE_0__.BASE_PATH}/templates/diaryentry_screen-template.html`;

    // рендерим, подставляя разделённый текст и картинку
    const html = await _utils_TemplateEngine_js__WEBPACK_IMPORTED_MODULE_5__.TemplateEngine.renderFile(templateUrl, {
      postClass: entryData.postClass,
      text: textPart,
      imgTag,
      timestamp: entryData.timestamp
    });

    // вставляем сверху
    this.diaryContainer.insertAdjacentHTML("afterbegin", html);

    // запускаем анимацию печатания только для <p>
    const p = this.diaryContainer.querySelector('.diary-entry:first-child p[data-animate-on-board="true"]');
    if (p && this.app.visualEffectsManager) {
      this.app.visualEffectsManager.applyEffectsToNewElements([p]);
    }
  }
  async loadEarlierDiaryPosts(step = 3) {
    const displayed = this.diaryContainer.querySelectorAll('.diary-entry').length;
    const allEntries = await this.app.databaseManager.getDiaryEntries();
    // Сортируем от новых к старым
    allEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    // Берём следующий кусок
    const nextChunk = allEntries.slice(displayed, displayed + step);
    const templateUrl = `${_config_paths_js__WEBPACK_IMPORTED_MODULE_0__.BASE_PATH}/templates/diaryentry_screen-template.html`;
    for (const entry of nextChunk) {
      // разбираем текст и картинку
      let text = entry.entry;
      let imgTag = "";
      if (text.includes("data:image")) {
        const idx = text.indexOf("data:image");
        const imgSrc = text.slice(idx).trim();
        text = text.slice(0, idx).trim();
        imgTag = `<img src="${imgSrc}" alt="Diary image" />`;
      }
      const html = await _utils_TemplateEngine_js__WEBPACK_IMPORTED_MODULE_5__.TemplateEngine.renderFile(templateUrl, {
        postClass: entry.postClass,
        text,
        imgTag,
        timestamp: entry.timestamp
      });
      this.diaryContainer.insertAdjacentHTML("beforeend", html);
    }
  }

  /**
   * При скролле вниз подгружает ещё по 3 поста.
   */
  async onScrollLoadOlder() {
    if (this.loadingOlderPosts) return;
    const threshold = 150; // px до низа, чтобы сработало чуть раньше
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - threshold) {
      this.loadingOlderPosts = true;
      await this.loadEarlierDiaryPosts();
      this.loadingOlderPosts = false;
    }
  }
}

/***/ }),

/***/ "./src/managers/VisualEffectsManager.js":
/*!**********************************************!*\
  !*** ./src/managers/VisualEffectsManager.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BaseEffect: () => (/* binding */ BaseEffect),
/* harmony export */   TypewriterEffect: () => (/* binding */ TypewriterEffect),
/* harmony export */   VisualEffectsManager: () => (/* binding */ VisualEffectsManager)
/* harmony export */ });
/* harmony import */ var _config_paths_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../config/paths.js */ "./src/config/paths.js");
/* harmony import */ var _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ErrorManager.js */ "./src/managers/ErrorManager.js");



/**
 * VisualEffectsManager
 *
 * Manages visual effects (fades, animations, transitions) for the application.
 * It delegates UI updates to the ViewManager when available and uses ErrorManager
 * for error handling.
 *
 * @param {App} appInstance - Reference to the main application instance.
 * @param {HTMLElement} controlsPanel - The controls panel element used for blocking interactions.
 */
class VisualEffectsManager {
  constructor(appInstance, controlsPanel) {
    this.app = appInstance;
    this.controlsPanel = controlsPanel;
    // Default effect configuration (can be updated from external config)
    this.effectConfig = {
      userText: {
        speed: 100
      },
      ghostText: {
        speed: 100
      }
    };
  }

  /**
   * playAudioWithStop
   * Plays an audio file and stops it automatically after the specified delay.
   *
   * @param {string} audioSrc - Path to the audio file.
   * @param {number} stopDelay - Time in milliseconds after which to stop playback.
   * @returns {HTMLAudioElement|null} The audio object, or null if an error occurred.
   */
  playAudioWithStop(audioSrc, stopDelay) {
    try {
      const audio = new Audio(audioSrc);
      audio.play();
      if (stopDelay && stopDelay > 0) {
        setTimeout(() => {
          audio.pause();
        }, stopDelay);
      }
      return audio;
    } catch (error) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.logError(error, "playAudioWithStop");
      return null;
    }
  }

  /**
   * setControlsBlocked
   * Blocks or unblocks user interaction with the controls.
   * Delegates to the ViewManager if available.
   *
   * @param {boolean} shouldBlock - True to block controls, false to unblock.
   */
  setControlsBlocked(shouldBlock) {
    // Do not block controls if the camera is open.
    if (this.app.isCameraOpen) {
      shouldBlock = false;
    }
    if (this.app.viewManager && typeof this.app.viewManager.setControlsBlocked === 'function') {
      this.app.viewManager.setControlsBlocked(shouldBlock);
    } else if (this.controlsPanel) {
      try {
        this.controlsPanel.style.pointerEvents = shouldBlock ? "none" : "auto";
      } catch (error) {
        _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.logError(error, "setControlsBlocked");
      }
    }
  }

  /**
   * animateHTMLText
   * Animates HTML text by "typing" it into the target element.
   *
   * @param {HTMLElement} targetElem - The target element for text animation.
   * @param {string} text - The text (including HTML tags) to animate.
   * @param {number} speed - Typing speed in milliseconds.
   * @param {HTMLAudioElement} [audioObj] - Optional audio object to play during animation.
   * @param {Function} [callback] - Callback invoked after animation completes.
   * @param {Function} [onChar] - Callback invoked after each character is inserted.
   */
  animateHTMLText(targetElem, text, speed, audioObj, callback, onChar) {
    targetElem.innerHTML = "";
    let pos = 0;
    let currentHTML = "";
    let isTag = false;
    let tagBuffer = "";
    const intervalId = setInterval(() => {
      const char = text[pos];
      if (!char) {
        clearInterval(intervalId);
        if (audioObj) audioObj.pause();
        if (callback) callback();
        return;
      }
      // If the character is a newline, insert a <br>
      if (char === "\n") {
        currentHTML += "<br>";
      } else {
        // Check for HTML tags.
        if (char === "<") {
          isTag = true;
        }
        if (isTag) {
          tagBuffer += char;
          if (char === ">") {
            currentHTML += tagBuffer;
            tagBuffer = "";
            isTag = false;
          }
        } else {
          currentHTML += char;
        }
      }
      targetElem.innerHTML = currentHTML;
      pos++;
      if (typeof onChar === "function") {
        onChar(targetElem, currentHTML);
      }
    }, speed);
  }

  /**
   * triggerMirrorEffect
   * Triggers the mirror effect by applying a background transition and playing a ringtone.
   * Delegates the background transition to the ViewManager when available.
   */
  triggerMirrorEffect() {
    if (!this.app.isCameraOpen) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.logError("Mirror effect not triggered: camera is closed.", "triggerMirrorEffect");
      return;
    }
    if (this.app.viewManager && typeof this.app.viewManager.applyBackgroundTransition === 'function') {
      // Delegate background transition to ViewManager.
      this.app.viewManager.applyBackgroundTransition("black", 1000);
    } else {
      try {
        // Fallback: Direct DOM manipulation.
        document.body.style.transition = "background 1s";
        document.body.style.background = "black";
        setTimeout(() => {
          document.body.style.background = "";
        }, 1000);
      } catch (error) {
        _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.logError(error, "triggerMirrorEffect - fallback");
      }
    }
    // Play the ringtone audio for 3 seconds.
    this.playAudioWithStop(`${_config_paths_js__WEBPACK_IMPORTED_MODULE_0__.ASSETS_PATH}/audio/phone_ringtone.mp3`, 3000);
  }

  /**
   * triggerGhostAppearanceEffect
   * Triggers the ghost appearance effect.
   * Delegates display to ViewManager if available, otherwise uses a fallback.
   *
   * @param {string} ghostId - Identifier for the ghost effect image.
   */
  triggerGhostAppearanceEffect(ghostId) {
    if (!this.app.isCameraOpen) {
      _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.logError("Ghost appearance effect not triggered: camera is closed.", "triggerGhostAppearanceEffect");
      return;
    }
    if (this.app.viewManager && typeof this.app.viewManager.showGhostAppearanceEffect === 'function') {
      this.app.viewManager.showGhostAppearanceEffect(ghostId);
    } else {
      try {
        // Fallback: Direct DOM manipulation.
        const ghostEffect = document.createElement("div");
        Object.assign(ghostEffect.style, {
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "200px",
          height: "200px",
          background: `url('${_config_paths_js__WEBPACK_IMPORTED_MODULE_0__.ASSETS_PATH}/images/${ghostId}.png') no-repeat center center`,
          backgroundSize: "contain",
          opacity: "0.7",
          transition: "opacity 2s"
        });
        document.body.appendChild(ghostEffect);
        setTimeout(() => {
          ghostEffect.style.opacity = "0";
        }, 3000);
        setTimeout(() => {
          ghostEffect.remove();
        }, 5000);
      } catch (error) {
        _ErrorManager_js__WEBPACK_IMPORTED_MODULE_1__.ErrorManager.logError(error, "triggerGhostAppearanceEffect - fallback");
      }
    }
  }

  /**
   * triggerWhisperEffect
   * Triggers the whisper effect by playing a whisper audio for 5 seconds.
   */
  triggerWhisperEffect() {
    this.playAudioWithStop('${ASSETS_PATH}/audio/whisper.mp3', 5000);
  }

  /**
   * triggerGhostTextEffect
   * Triggers a ghost text effect by "typing" ghostly text into the target element.
   * Blocks controls during the animation.
   *
   * @param {HTMLElement} targetElem - The target element for text animation.
   * @param {string} text - The ghost text to animate.
   * @param {Function} callback - Callback invoked after animation completes.
   * @param {Object} [effectConfig] - Optional configuration for the effect (e.g. speed).
   */
  triggerGhostTextEffect(targetElem, text, callback, effectConfig) {
    // Use provided configuration or default ghostText config.
    const config = effectConfig || this.effectConfig.ghostText;

    // Block controls.
    this.setControlsBlocked(true);

    // Play ghost sound.
    const ghostSound = new Audio('../../../../assets/audio/ghost_effect.mp3');
    ghostSound.play();
    this.animateHTMLText(targetElem, text, config.speed, ghostSound, () => {
      this.setControlsBlocked(false);
      if (callback) callback();
    });
  }

  /**
   * triggerUserTextEffect
   * Triggers a user text effect that simulates typing with a moving pencil icon.
   * Blocks controls during the animation.
   *
   * @param {HTMLElement} targetElem - The target element for text animation.
   * @param {string} text - The text to animate.
   * @param {Function} callback - Callback invoked after animation completes.
   * @param {Object} [effectConfig] - Optional configuration for the effect (e.g. speed).
   */
  triggerUserTextEffect(targetElem, text, callback, effectConfig) {
    // Use provided configuration or default userText config.
    const config = effectConfig || this.effectConfig.userText;

    // Create a pencil icon.
    const pencilIcon = document.createElement("img");
    pencilIcon.src = "../../../../assets/images/pencil.png";
    pencilIcon.alt = "Typing...";
    Object.assign(pencilIcon.style, {
      width: "24px",
      height: "24px",
      position: "absolute"
    });

    // Insert the pencil icon into the parent element.
    const parentElem = targetElem.parentElement;
    parentElem.style.position = "relative";
    parentElem.insertBefore(pencilIcon, targetElem);

    // Block controls.
    this.setControlsBlocked(true);

    // Play typing sound.
    const typeSound = new Audio('../../../../assets/audio/type_sound.mp3');
    typeSound.loop = true;
    typeSound.play();
    const onChar = () => {
      const dummySpan = document.createElement("span");
      dummySpan.innerHTML = "&nbsp;"; // For positioning.
      targetElem.appendChild(dummySpan);
      const rectDummy = dummySpan.getBoundingClientRect();
      const rectParent = parentElem.getBoundingClientRect();
      // Update pencil icon position.
      pencilIcon.style.left = rectDummy.left - rectParent.left + "px";
      pencilIcon.style.top = rectDummy.top - rectParent.top + "px";
      dummySpan.remove();
    };
    this.animateHTMLText(targetElem, text, config.speed, typeSound, () => {
      pencilIcon.remove();
      this.setControlsBlocked(false);
      if (callback) callback();
    }, onChar);
  }

  /**
   * slideUpPanel
   * Animates the appearance of a panel by sliding it up from the bottom.
   *
   * @param {HTMLElement} panel - The panel element to animate.
   * @param {number} duration - Animation duration in milliseconds.
   * @param {string} soundPath - Path to the sound to play during the animation.
   */
  slideUpPanel(panel, duration = 1000, soundPath = 'assets/audio/panel_slide.mp3') {
    if (!panel) return;
    // Set initial state: slide the panel out of view (translateY(100%)) and transparent.
    panel.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
    panel.style.transform = "translateY(100%)";
    panel.style.opacity = "0";
    // Force reflow.
    panel.offsetHeight;
    // Play slide-up sound.
    this.playAudioWithStop(soundPath, duration);
    // Animate panel into view.
    panel.style.transform = "translateY(0)";
    panel.style.opacity = "1";
  }

  /**
   * showControlsPanelForUnregistered
   * If the user is not registered (i.e. registrationCompleted flag is not "true"),
   * animates the controls panel by sliding it up from the bottom with sound.
   */
  showControlsPanelForUnregistered() {
    if (StateManager.get("registrationCompleted") !== "true") {
      this.slideUpPanel(this.controlsPanel, 1000, 'assets/audio/panel_slide.mp3');
    }
  }

  /**
   * applyEffectsToNewElements
   * Applies visual effects to newly added DOM elements.
   * It iterates over the provided elements, checks for a data-attribute "data-animate-on-board",
   * and, depending on the "data-animate-effect" attribute ("ghost" or "user", default "user"),
   * triggers the corresponding text effect. After animation, the marker is removed.
   *
   * @param {Array<HTMLElement>} newElements - Array or NodeList of newly added DOM elements.
   */
  applyEffectsToNewElements(newElements) {
    // Ensure we always iterate over a concrete array
    Array.from(newElements).forEach(elem => {
      // Gather only <p data-animate-on-board="true"> inside the element
      const textTargets = elem.matches('p[data-animate-on-board="true"]') ? [elem] : elem.querySelectorAll('p[data-animate-on-board="true"]');
      textTargets.forEach(p => {
        const effectType = p.dataset.animateEffect || 'user';
        const rawText = p.textContent;
        p.textContent = '';
        if (effectType === 'ghost') {
          this.triggerGhostTextEffect(p, rawText, () => delete p.dataset.animateOnBoard);
        } else {
          this.triggerUserTextEffect(p, rawText, () => delete p.dataset.animateOnBoard);
        }
      });
    });
  }
}

/**
 * BaseEffect
 *
 * A base class for visual effects.
 * Subclasses should implement the applyEffect method.
 */
class BaseEffect {
  /**
   * @param {Object} config - Configuration object for the effect.
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * applyEffect
   * Applies the effect to the target element.
   * This method should be overridden in subclasses.
   *
   * @param {HTMLElement} target - The target element.
   * @param {string} text - The text to animate.
   * @param {Function} callback - Callback to call after effect is complete.
   */
  applyEffect(target, text, callback) {
    throw new Error("applyEffect must be implemented by subclass");
  }
}

/**
 * TypewriterEffect
 *
 * An example subclass of BaseEffect that implements a typewriter effect.
 */
class TypewriterEffect extends BaseEffect {
  /**
   * Applies the typewriter effect to the target element.
   *
   * @param {HTMLElement} target - The target element.
   * @param {string} text - The text to animate.
   * @param {Function} callback - Callback to call after effect is complete.
   */
  applyEffect(target, text, callback) {
    // Here we simply delegate to VisualEffectsManager's animateHTMLText using the configured speed.
    // In a real implementation, additional logic could be added.
    // For demonstration, we assume a global instance is available.
    // Alternatively, this method could accept an instance of VisualEffectsManager.
    target.innerHTML = "";
    let pos = 0;
    let currentHTML = "";
    const intervalId = setInterval(() => {
      if (pos >= text.length) {
        clearInterval(intervalId);
        if (callback) callback();
        return;
      }
      currentHTML += text[pos];
      target.innerHTML = currentHTML;
      pos++;
    }, this.config.speed);
  }
}

/***/ }),

/***/ "./src/utils/GameEntityLoader.js":
/*!***************************************!*\
  !*** ./src/utils/GameEntityLoader.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getQuestKeyToEventKeyMap: () => (/* binding */ getQuestKeyToEventKeyMap),
/* harmony export */   loadGameEntitiesConfig: () => (/* binding */ loadGameEntitiesConfig)
/* harmony export */ });
/**
 * GameEntityLoader.js
 * 
 * Provides functions to load the game entities configuration (events, quests, and sequence)
 * from a unified JSON file and derive mappings for use in managers.
 */

/**
 * Loads the game entities configuration by fetching the JSON file.
 * Returns an object containing `events`, `quests`, and `sequence`.
 */
async function loadGameEntitiesConfig() {
  const response = await fetch('config/gameEntities.json');
  if (!response.ok) {
    throw new Error('Failed to load game entities configuration');
  }
  const config = await response.json();
  return config;
}

/**
 * Constructs a mapping from questKey to its parent eventKey based on the sequence.
 * 
 * Example return value:
 * {
 *   "mirror_quest": "welcome",
 *   "repeating_quest": "post_repeating_event",
 *   "final_quest": "final_event"
 * }
 * 
 * Usage:
 *   const questKeyToEventKey = await getQuestKeyToEventKeyMap();
 */
async function getQuestKeyToEventKeyMap() {
  const config = await loadGameEntitiesConfig();
  const map = {};
  config.sequence.forEach(triad => {
    // triad: { eventKey, questKey, nextEventKey }
    map[triad.questKey] = triad.eventKey;
  });
  return map;
}

/***/ }),

/***/ "./src/utils/ImageUtils.js":
/*!*********************************!*\
  !*** ./src/utils/ImageUtils.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ImageUtils: () => (/* binding */ ImageUtils)
/* harmony export */ });
// ImageUtils.js
class ImageUtils {
  /**
   * Converts the canvas image to grayscale and returns the data URL.
   * @param {HTMLCanvasElement} canvas 
   * @returns {string} Data URL with PNG format.
   */
  static convertToGrayscale(canvas) {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
      const avg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      pixels[i] = avg;
      pixels[i + 1] = avg;
      pixels[i + 2] = avg;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  }

  /**
   * Performs pixel-wise comparison between two base64 images.
   * @param {string} img1 Base64 string of the first image.
   * @param {string} img2 Base64 string of the second image.
   * @returns {number} Matching coefficient between 0 and 1.
   */
  static pixelWiseComparison(img1, img2) {
    const decodeBase64 = img => atob(img.split(',')[1]);
    const image1 = decodeBase64(img1);
    const image2 = decodeBase64(img2);
    let matchCount = 0;
    const len = Math.min(image1.length, image2.length);
    for (let i = 0; i < len; i++) {
      if (Math.abs(image1.charCodeAt(i) - image2.charCodeAt(i)) < 100) {
        matchCount++;
      }
    }
    return matchCount / len;
  }

  /**
   * Performs histogram comparison between two base64 images.
   * @param {string} img1 Base64 string of the first image.
   * @param {string} img2 Base64 string of the second image.
   * @returns {number} Matching coefficient between 0 and 1.
   */
  static histogramComparison(img1, img2) {
    const hist1 = this.createHistogram(img1);
    const hist2 = this.createHistogram(img2);
    const diff = hist1.reduce((acc, val, i) => acc + Math.abs(val - hist2[i]), 0);
    const totalPixels = hist1.reduce((sum, val) => sum + val, 0);
    return 1 - diff / (totalPixels * 1.2);
  }

  /**
   * Creates a histogram (256 levels) for a base64 image.
   * @param {string} img Base64 string of the image.
   * @returns {number[]} Array of length 256 with pixel counts.
   */
  static createHistogram(img) {
    const hist = new Array(256).fill(0);
    const imgData = atob(img.split(',')[1]);
    for (let i = 0; i < imgData.length; i++) {
      hist[imgData.charCodeAt(i)]++;
    }
    return hist;
  }

  /**
   * applyFilterToCanvas
   * Applies a filter effect to a canvas and returns a new data URL.
   * For example, for 'nightVision' the image brightness/contrast can be adjusted.
   * @param {HTMLCanvasElement} canvas
   * @param {string} filterType - 'nightVision', 'blackWhite', or ''.
   * @returns {string} Data URL of the processed image.
   */
  static applyFilterToCanvas(canvas, filterType) {
    const ctx = canvas.getContext("2d");
    // Save current state
    ctx.save();
    if (filterType === 'nightVision') {
      // Example: increase brightness and add a green tint
      ctx.filter = 'brightness(150%) contrast(120%) sepia(100%) hue-rotate(90deg)';
    } else if (filterType === 'blackWhite') {
      ctx.filter = 'grayscale(100%)';
    } else {
      ctx.filter = 'none';
    }
    // Redraw the current canvas content with the filter applied
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(imageData, 0, 0);
    // Restore state and return new data URL
    ctx.restore();
    return canvas.toDataURL("image/png");
  }
}

/***/ }),

/***/ "./src/utils/SequenceManager.js":
/*!**************************************!*\
  !*** ./src/utils/SequenceManager.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SequenceManager: () => (/* binding */ SequenceManager)
/* harmony export */ });
/**
 * SequenceManager.js
 * 
 * Provides methods to manage the event–quest sequence.
 *
 * @typedef {Object} SequenceEntry
 * @property {string} eventKey - The event key.
 * @property {string} questKey - The quest key that will be started after the event.
 * @property {string|null} nextEventKey - The key of the next event (or null if the sequence is complete).
 */

class SequenceManager {
  /**
   * @param {SequenceEntry[]} sequenceList - The list of sequence entries.
   */
  constructor(sequenceList) {
    this.sequenceList = sequenceList;
    this.currentIndex = 0;
  }

  /**
   * Returns the current sequence entry.
   * @returns {SequenceEntry|null}
   */
  getCurrentEntry() {
    return this.sequenceList && this.sequenceList[this.currentIndex] || null;
  }

  /**
   * Checks if the provided quest key matches the expected quest in the current sequence entry.
   * @param {string} questKey 
   * @returns {boolean}
   */
  isNextQuest(questKey) {
    const entry = this.getCurrentEntry();
    return entry ? entry.questKey === questKey : false;
  }

  /**
   * Checks if the provided event key matches the expected event in the current sequence entry.
   * @param {string} eventKey 
   * @returns {boolean}
   */
  isNextEvent(eventKey) {
    const entry = this.getCurrentEntry();
    return entry ? entry.eventKey === eventKey : false;
  }

  /**
   * Increments the sequence index if not at the end.
   */
  increment() {
    if (this.currentIndex < this.sequenceList.length - 1) {
      this.currentIndex++;
    }
  }

  /**
   * Resets the sequence index to the beginning.
   */
  reset() {
    this.currentIndex = 0;
  }
}

/***/ }),

/***/ "./src/utils/SpiritBoardUtils.js":
/*!***************************************!*\
  !*** ./src/utils/SpiritBoardUtils.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   animateText: () => (/* binding */ animateText)
/* harmony export */ });
/**
 * SpiritBoardUtils.js
 *
 * This module provides utility functions for visual effects on the spirit board.
 * It includes functions to animate text by sequentially revealing letters.
 */

/**
 * animateText
 * Sequentially animates each letter of the given text within the provided HTML element.
 * It splits the text into individual letters, wraps each in a span, and applies a fade-in effect.
 *
 * @param {HTMLElement} element - The target element where the text animation will occur.
 * @param {string} text - The text to be animated.
 */
function animateText(element, text) {
  // Clear the current content of the element
  element.innerHTML = '';

  // Split the text into individual letters
  const letters = text.split('');

  // Create a span for each letter and animate its appearance
  letters.forEach((letter, index) => {
    const span = document.createElement('span');
    span.innerText = letter;
    // Set initial opacity to 0 for the animation effect
    span.style.opacity = '0';
    span.style.transition = 'opacity 0.3s ease-in';
    element.appendChild(span);

    // Reveal each letter sequentially with a delay (e.g., 100ms between letters)
    setTimeout(() => {
      span.style.opacity = '1';
    }, index * 100);
  });
}

/***/ }),

/***/ "./src/utils/TemplateEngine.js":
/*!*************************************!*\
  !*** ./src/utils/TemplateEngine.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   TemplateEngine: () => (/* binding */ TemplateEngine)
/* harmony export */ });
/**
 * TemplateEngine.js
 *
 * A simple template engine for dynamic HTML rendering.
 * It replaces placeholders in the template string with values from a data object.
 *
 * Placeholders are defined using double curly braces, e.g., {{ variableName }}.
 *
 * Example usage:
 *   const template = "<h1>{{ title }}</h1><p>{{ content }}</p>";
 *   const data = { title: "Hello", content: "World" };
 *   const renderedHTML = TemplateEngine.render(template, data);
 *   // renderedHTML: "<h1>Hello</h1><p>World</p>"
 */
class TemplateEngine {
  /**
   * Renders an HTML template using the provided data.
   *
   * @param {string} template - The template string containing placeholders.
   * @param {Object} data - The data object with keys corresponding to placeholder names.
   * @returns {string} - The rendered HTML string with placeholders replaced by data values.
   */
  static render(template, data) {
    return template.replace(/{{\s*([\s\S]+?)\s*}}/g, (match, key) => {
      const trimmedKey = key.trim();
      return data.hasOwnProperty(trimmedKey) ? data[trimmedKey] : match;
    });
  }

  /**
   * Loads an HTML template from `templatePath` with `fetch`, then renders it with the data.
   * @param {string} templatePath – relative / absolute URL to the HTML file.
   * @param {Object} [data={}] – placeholder values.
   */
  static async renderFile(templatePath, data = {}) {
    const response = await fetch(templatePath);
    if (!response.ok) {
      throw new Error(`[TemplateEngine] Failed to load template: ${templatePath}`);
    }
    const templateText = await response.text();
    return TemplateEngine.render(templateText, data);
  }
}

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/load script */
/******/ 	(() => {
/******/ 		var inProgress = {};
/******/ 		var dataWebpackPrefix = "testerer-deploy.github.io:";
/******/ 		// loadScript function to load a script via script tag
/******/ 		__webpack_require__.l = (url, done, key, chunkId) => {
/******/ 			if(inProgress[url]) { inProgress[url].push(done); return; }
/******/ 			var script, needAttach;
/******/ 			if(key !== undefined) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				for(var i = 0; i < scripts.length; i++) {
/******/ 					var s = scripts[i];
/******/ 					if(s.getAttribute("src") == url || s.getAttribute("data-webpack") == dataWebpackPrefix + key) { script = s; break; }
/******/ 				}
/******/ 			}
/******/ 			if(!script) {
/******/ 				needAttach = true;
/******/ 				script = document.createElement('script');
/******/ 		
/******/ 				script.charset = 'utf-8';
/******/ 				script.timeout = 120;
/******/ 				if (__webpack_require__.nc) {
/******/ 					script.setAttribute("nonce", __webpack_require__.nc);
/******/ 				}
/******/ 				script.setAttribute("data-webpack", dataWebpackPrefix + key);
/******/ 		
/******/ 				script.src = url;
/******/ 			}
/******/ 			inProgress[url] = [done];
/******/ 			var onScriptComplete = (prev, event) => {
/******/ 				// avoid mem leaks in IE.
/******/ 				script.onerror = script.onload = null;
/******/ 				clearTimeout(timeout);
/******/ 				var doneFns = inProgress[url];
/******/ 				delete inProgress[url];
/******/ 				script.parentNode && script.parentNode.removeChild(script);
/******/ 				doneFns && doneFns.forEach((fn) => (fn(event)));
/******/ 				if(prev) return prev(event);
/******/ 			}
/******/ 			var timeout = setTimeout(onScriptComplete.bind(null, undefined, { type: 'timeout', target: script }), 120000);
/******/ 			script.onerror = onScriptComplete.bind(null, script.onerror);
/******/ 			script.onload = onScriptComplete.bind(null, script.onload);
/******/ 			needAttach && document.head.appendChild(script);
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript && document.currentScript.tagName.toUpperCase() === 'SCRIPT')
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) {
/******/ 					var i = scripts.length - 1;
/******/ 					while (i > -1 && (!scriptUrl || !/^http(s?):/.test(scriptUrl))) scriptUrl = scripts[i--].src;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/^blob:/, "").replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"main": 0
/******/ 		};
/******/ 		
/******/ 		__webpack_require__.f.j = (chunkId, promises) => {
/******/ 				// JSONP chunk loading for javascript
/******/ 				var installedChunkData = __webpack_require__.o(installedChunks, chunkId) ? installedChunks[chunkId] : undefined;
/******/ 				if(installedChunkData !== 0) { // 0 means "already installed".
/******/ 		
/******/ 					// a Promise means "currently loading".
/******/ 					if(installedChunkData) {
/******/ 						promises.push(installedChunkData[2]);
/******/ 					} else {
/******/ 						if(true) { // all chunks have JS
/******/ 							// setup Promise in chunk cache
/******/ 							var promise = new Promise((resolve, reject) => (installedChunkData = installedChunks[chunkId] = [resolve, reject]));
/******/ 							promises.push(installedChunkData[2] = promise);
/******/ 		
/******/ 							// start chunk loading
/******/ 							var url = __webpack_require__.p + __webpack_require__.u(chunkId);
/******/ 							// create error before stack unwound to get useful stacktrace later
/******/ 							var error = new Error();
/******/ 							var loadingEnded = (event) => {
/******/ 								if(__webpack_require__.o(installedChunks, chunkId)) {
/******/ 									installedChunkData = installedChunks[chunkId];
/******/ 									if(installedChunkData !== 0) installedChunks[chunkId] = undefined;
/******/ 									if(installedChunkData) {
/******/ 										var errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 										var realSrc = event && event.target && event.target.src;
/******/ 										error.message = 'Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
/******/ 										error.name = 'ChunkLoadError';
/******/ 										error.type = errorType;
/******/ 										error.request = realSrc;
/******/ 										installedChunkData[1](error);
/******/ 									}
/******/ 								}
/******/ 							};
/******/ 							__webpack_require__.l(url, loadingEnded, "chunk-" + chunkId, chunkId);
/******/ 						}
/******/ 					}
/******/ 				}
/******/ 		};
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		// no on chunks loaded
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 		
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunktesterer_deploy_github_io"] = self["webpackChunktesterer_deploy_github_io"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
/*!*****************!*\
  !*** ./main.js ***!
  \*****************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var config_paths_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! config/paths.js */ "./src/config/paths.js");
/* harmony import */ var _src_App_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./src/App.js */ "./src/App.js");



// Function to dynamically load a script and return a Promise
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false; // preserve execution order
    script.onload = () => resolve(src);
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

// 1. Load SQL.js, TF.js and COCO-SSD in sequence before doing anything else
Promise.all([loadScript(config_paths_js__WEBPACK_IMPORTED_MODULE_0__.SQL_WASM_URL), loadScript(config_paths_js__WEBPACK_IMPORTED_MODULE_0__.TFJS_URL), loadScript(config_paths_js__WEBPACK_IMPORTED_MODULE_0__.COCO_SSD_URL)]).then(() => {
  console.log('All external libraries loaded');

  // 2. Wait for DOM, then initialize App and PWA logic
  document.addEventListener('DOMContentLoaded', () => {
    const app = new _src_App_js__WEBPACK_IMPORTED_MODULE_1__.App();

    // PWA installation prompt handling
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredPrompt = e;
      const btn = document.getElementById('install-btn');
      if (btn) btn.style.display = 'block';
    });
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const {
          outcome
        } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        installBtn.style.display = 'none';
        deferredPrompt = null;
      });
    }

    // 3. Service Worker registration with auto-update hooks
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(`${config_paths_js__WEBPACK_IMPORTED_MODULE_0__.BASE_PATH}/sw.js`).then(reg => {
        console.log('Service Worker registered with scope:', reg.scope);

        // If there's an update ready, tell it to skip waiting
        if (reg.waiting) {
          reg.waiting.postMessage({
            type: 'SKIP_WAITING'
          });
        }

        // Listen for new SW installations
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              newSW.postMessage({
                type: 'SKIP_WAITING'
              });
            }
          });
        });
      }).catch(err => console.error('Error during Service Worker registration:', err));
      // When a new SW takes control, reload the page so that all clients use the new version
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log("New Service Worker activated; reloading page");
        window.location.reload();
      });
    }

    // 4. “Update” button clears caches via SW message
    const updateBtn = document.getElementById('update-btn');
    if (updateBtn) {
      updateBtn.addEventListener('click', () => {
        console.log('Update button clicked; clearing caches');
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            action: 'CLEAR_CACHE'
          });
        }
      });
    }
  });
}).catch(err => console.error('Loader error:', err));
})();

/******/ })()
;
//# sourceMappingURL=main.js.map