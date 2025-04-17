// EventManager.js
import { ErrorManager } from "./ErrorManager.js";

/**
 * EventManager
 * ---------------------------------------------------------------------------
 *  • Adds diary entries (user & ghost) and records short system events.
 *  • Delegates visual effects and UI updates to ViewManager / VisualEffectsMgr.
 *  • Keeps DB‑access and UI‑logic strictly separated.
 * ---------------------------------------------------------------------------
 *
 * NOTE: A reference to ViewManager *must* be assigned externally
 *       right after EventManager instantiation:
 *          eventManager.viewManager = app.viewManager;
 */
export class EventManager {
  /**
   * @param {DatabaseManager}      databaseManager
   * @param {LanguageManager}      languageManager
   * @param {GhostManager}         ghostManager
   * @param {VisualEffectsManager} visualEffectsManager
   */
  constructor(
    databaseManager,
    languageManager,
    ghostManager,
    visualEffectsManager
  ) {
    this.databaseManager      = databaseManager;
    this.languageManager      = languageManager;
    this.ghostManager         = ghostManager;
    this.visualEffectsManager = visualEffectsManager;

    /* Will be injected by App.js */
    this.viewManager = null;
  }

  /* --------------------------------------------------------------------- */
  /*  Public helpers                                                       */
  /* --------------------------------------------------------------------- */

  /**
   * Returns TRUE if a diary entry whose text equals `eventKey`
   * is already present in the DB.
   *
   * @param  {string}  eventKey
   * @return {boolean}
   */
  isEventLogged(eventKey) {
    const entries = this.databaseManager.getDiaryEntries();
    return entries.some((e) => e.entry === eventKey);
  }

  /* --------------------------------------------------------------------- */
  /*  Main entry‑adding routine                                            */
  /* --------------------------------------------------------------------- */

  /**
   * Adds a new diary entry, persists it, and updates the UI incrementally.
   *
   * @param {string}  entryText       – raw text to appear in the diary
   * @param {boolean} isPostFromGhost – TRUE → ghost post, FALSE → user post
   */
  async addDiaryEntry(entryText, isPostFromGhost = false) {
    /* 1. Build entry object ------------------------------------------------ */
    const entryData = {
      entry     : entryText,
      postClass : isPostFromGhost ? "ghost-post" : "user-post",
      /* Store timestamp once, so DB & UI use the same value */
      timestamp : new Date().toISOString()
    };

    /* 2. Persist into diary table ----------------------------------------- */
    await this.databaseManager.addDiaryEntry(JSON.stringify(entryData));

    /* 3. Persist into events table if needed ------------------------------ */
    if (isPostFromGhost) {
      this.databaseManager.saveEvent({
        event_key : entryText,
        event_text: entryText,
        timestamp : entryData.timestamp,
        completed : 0
      });
    }

    /* 4. UI update – prefer incremental path ------------------------------ */
    if (
      this.viewManager &&
      typeof this.viewManager.addSingleDiaryPost === "function"
    ) {
      try {
        await this.viewManager.addSingleDiaryPost(entryData);
      } catch (err) {
        /* Fallback to full redraw on failure */
        ErrorManager.logError(err, "addSingleDiaryPost");
        this._fullDiaryRefresh();
      }
    } else {
      /* ViewManager unavailable or old version → full redraw */
      this._fullDiaryRefresh();
    }
  }

  /* --------------------------------------------------------------------- */
  /*  Private helpers                                                      */
  /* --------------------------------------------------------------------- */

  /**
   * Performs a complete diary re‑render and reapplies text effects.
   * Called only as a fallback when incremental rendering is not possible.
   *
   * @private
   */
  _fullDiaryRefresh() {
    if (
      !this.viewManager ||
      typeof this.viewManager.renderDiary !== "function"
    ) {
      ErrorManager.logError(
        "ViewManager is not available. Cannot refresh diary.",
        "_fullDiaryRefresh"
      );
      ErrorManager.showError("Unable to update diary display.");
      return;
    }

    const entries         = this.databaseManager.getDiaryEntries();
    const currentLanguage = this.languageManager.getLanguage();

    this.viewManager.renderDiary(
      entries,
      currentLanguage,
      this.visualEffectsManager
    );

    /* Apply effects to any freshly rendered <p data‑animate-on-board> */
    const animatedNodes =
      this.viewManager.diaryContainer?.querySelectorAll(
        "[data-animate-on-board='true']"
      ) ?? [];
    this.visualEffectsManager.applyEffectsToNewElements(animatedNodes);
  }

  /**
   * updateDiaryDisplay
   * --------------------------------------------------------------
   * Back‑compat wrapper retained for legacy callers. Internally
   * delegates to the new private full‑refresh routine.
   */
  updateDiaryDisplay() {
    this._fullDiaryRefresh();
  }
}