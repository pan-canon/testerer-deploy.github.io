import { NotificationManager } from './notificationManager.js';

/**
 * ErrorManager
 *
 * Centralized module for logging errors and displaying error notifications.
 * All errors in the application should be handled using logError and showError.
 */
export class ErrorManager {
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
    const notificationManager = new NotificationManager();
    notificationManager.showNotification(message);
  }
}