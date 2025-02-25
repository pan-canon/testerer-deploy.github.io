import { WelcomeEvent } from './events/welcomeEvent.js';
import { FinalEvent } from './events/finalEvent.js';
import { PostMirrorEvent } from './events/postMirrorEvent.js';
import { PostRepeatingEvent } from './events/postRepeatingEvent.js';

/**
 * GameEventManager – A class responsible for handling "short" (one-time) events.
 * Unlike larger quests (MirrorQuest, RepeatingQuest, FinalQuest),
 * these events simply trigger the start of the required quest or post.
 */
export class GameEventManager {
  constructor(eventManager, appInstance, languageManager) {
    this.eventManager = eventManager;
    this.app = appInstance;
    this.languageManager = languageManager;

    // Array of one-time events; their activation is not chained automatically.
    this.events = [
      new WelcomeEvent(this.eventManager, this.app, this.languageManager),
      new PostMirrorEvent(this.eventManager, this.app),
      new PostRepeatingEvent(this.eventManager, this.app),
      new FinalEvent(this.eventManager, this.app, this.languageManager)
    ];
    
    // State to track the completion of the repeating quest cycle.
    // Final quest will now be triggered only by explicit user action.
    this.repeatingQuestCompleted = false;
  }

  /**
   * activateEvent – Activates the specified event by key.
   * This method only activates the given event and does not automatically trigger any subsequent event.
   * @param {string} key - The unique key of the event to activate.
   */
  async activateEvent(key) {
    const event = this.events.find(e => e.key === key);
    if (event) {
      await event.activate();
      console.log(`Event '${key}' activated.`);
      // Automatic chaining removed – subsequent events must be triggered explicitly.
    } else {
      console.warn(`[GameEventManager] Event "${key}" not found in the list.`);
    }
  }

  /**
   * handleRepeatingQuestCompletion – Handles the completion of the repeating quest cycle.
   * Marks repeating quests as completed. Final quest should be triggered explicitly by the user.
   */
  async handleRepeatingQuestCompletion() {
    this.repeatingQuestCompleted = true;
    console.log("Repeating quest completed. Final quest can now be triggered manually.");
    // Here you could notify the user that the final quest is available.
  }

  /**
   * startQuest – Example helper method to start a ghost quest.
   * This method explicitly activates the event for the ghost quest, if available,
   * otherwise it starts the quest directly via QuestManager.
   */
  async startQuest() {
    const ghost = this.app.ghostManager.getCurrentGhost();
    const questKey = `ghost_${ghost.id}_quest`;
    const event = this.events.find(e => e.key === questKey);
    if (event) {
      await this.activateEvent(questKey);
    } else {
      // Alternatively, start the quest directly via QuestManager.
      await this.app.questManager.activateQuest(questKey);
    }
  }

  /**
   * startMirrorQuest – Example helper method to explicitly start the mirror quest event.
   */
  async startMirrorQuest() {
    await this.activateEvent('mirror_quest');
    console.log("🪞 Mirror Quest started (event).");
  }

  /**
   * updatePostButtonState – Updates the "Post" button state.
   * The button is enabled only if mirrorQuestReady is set and userPostSubmitted is not set.
   */
  updatePostButtonState() {
    const mirrorReady = localStorage.getItem("mirrorQuestReady") === "true";
    const repeatingActive = localStorage.getItem("repeatingQuestActive") === "true";
    const userSubmitted = localStorage.getItem("userPostSubmitted") === "true";
    // The button should be enabled if mirrorQuestReady is true or repeating quest is active,
    // and userPostSubmitted is not set.
    const awaitingUserPost = (mirrorReady || repeatingActive) && !userSubmitted;
    const postBtn = this.app.postBtn;
    if (postBtn) {
      postBtn.disabled = !awaitingUserPost;
    }
    console.log("[QuestManager] updatePostButtonState => awaitingUserPost:", awaitingUserPost);
  }

  /**
   * handlePostButtonClick – Called when the "Post" button is clicked.
   * On click, the button is immediately disabled, mirrorQuestReady is removed,
   * and the flag userPostSubmitted is set. Then, the mirror quest is triggered.
   */
  async handlePostButtonClick() {
    const postBtn = this.app.postBtn;
    if (postBtn) {
      // Disable the button immediately to prevent multiple clicks.
      postBtn.disabled = true;
    }
    // Remove mirrorQuestReady and set userPostSubmitted flag.
    localStorage.removeItem("mirrorQuestReady");
    localStorage.setItem("userPostSubmitted", "true");
    this.updatePostButtonState();
    console.log("[QuestManager] Triggering mirror quest from handlePostButtonClick.");
      
    // Highlight the camera button.
    const cameraBtn = document.getElementById("toggle-camera");
    if (cameraBtn) cameraBtn.classList.add("glowing");

    await this.activateEvent("mirror_quest");
  }

  /**
   * updateCameraButtonState – Highlights the camera button if mirrorQuestActive is true.
   */
  updateCameraButtonState() {
    const cameraBtn = document.getElementById("toggle-camera");
    if (!cameraBtn) return;
    if (localStorage.getItem("mirrorQuestActive") === "true") {
      cameraBtn.classList.add("glowing");
    } else {
      cameraBtn.classList.remove("glowing");
    }
  }

  /**
   * triggerMirrorQuestIfActive – If mirrorQuestActive is true, explicitly check the mirror quest.
   */
  async triggerMirrorQuestIfActive() {
    if (localStorage.getItem("mirrorQuestActive") === "true") {
      console.log("[QuestManager] triggerMirrorQuestIfActive: finishing mirror_quest");
      await this.checkQuest("mirror_quest");
    }
  }

  /**
   * checkMirrorQuestOnCamera – A shortcut to check the mirror quest.
   */
  async checkMirrorQuestOnCamera() {
    await this.checkQuest("mirror_quest");
  }
}