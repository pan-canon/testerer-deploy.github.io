import { NotificationManager } from './notificationManager.js';

export class ErrorManager {
  /**
   * Logs an error with optional contextual information.
   * @param {any} error - The error object or message.
   * @param {string} [context] - Optional context indicating where the error occurred.
   */
  static logError(error, context = "") {
    console.error(`Error${context ? " in " + context : ""}:`, error);
  }

  /**
   * Displays an error notification to the user.
   * Utilizes NotificationManager to show a notification if supported.
   * @param {string} message - The error message to display.
   */
  static showError(message) {
    const notificationManager = new NotificationManager();
    notificationManager.showNotification(message);
  }
}