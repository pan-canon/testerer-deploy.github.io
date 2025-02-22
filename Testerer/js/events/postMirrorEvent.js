import { BaseEvent } from './baseEvent.js';

/**
 * PostMirrorEvent – Событие, которое срабатывает ПОСЛЕ успешного завершения зеркального квеста.
 * Его роль – явным образом переключить к повторяющемуся квесту, вызывая activateQuest("repeating_quest"),
 * без автоматического запуска последующих действий.
 */
export class PostMirrorEvent extends BaseEvent {
  constructor(eventManager, appInstance) {
    super(eventManager);
    this.app = appInstance;
    // Уникальный ключ для этого события.
    this.key = "post_mirror_event";
  }

  /**
   * activate – Переопределённый метод активации для PostMirrorEvent.
   * Логирует событие как пост от имени призрака и явным образом запускает повторяющийся квест через QuestManager.
   *
   * @returns {Promise<void>}
   */
  async activate() {
    if (this.eventManager.isEventLogged(this.key)) {
      console.log(`[PostMirrorEvent] Событие '${this.key}' уже зарегистрировано, пропускаем активацию.`);
      return;
    }
    console.log(`[PostMirrorEvent] Активация события '${this.key}'.`);

    // Логируем событие в дневник как пост от призрака.
    await this.eventManager.addDiaryEntry(this.key, true);

    // Явно запускаем повторяющийся квест через QuestManager.
    console.log("[PostMirrorEvent] Явная активация 'repeating_quest'...");
    await this.app.questManager.activateQuest("repeating_quest");

    // Обновляем кнопку "Запостить" и добавляем эффект на камеру
    this.app.questManager.updatePostButtonState();  // Обновление состояния кнопки "Запостить"
    this.app.visualEffectsManager.setControlsBlocked(false); // Камера теперь активна
  }
}