class NotificationManager {
    showNotification(message) {
        if (!("Notification" in window)) {
            console.warn("⚠️ Уведомления не поддерживаются в этом браузере.");
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
