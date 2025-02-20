export class VisualEffectsManager {
    /** 
     * @param {App} appInstance – ссылка на основной объект приложения (содержит флаг isCameraOpen).
     * @param {HTMLElement} controlsPanel – элемент с кнопками управления (для блокировки).
     */
    constructor(appInstance, controlsPanel) {
        this.app = appInstance;
        this.controlsPanel = controlsPanel;
    }

    /**
     * Универсальная функция воспроизведения аудио с автоматической остановкой.
     * @param {string} audioSrc - путь к аудиофайлу.
     * @param {number} stopDelay - время в мс через которое остановить воспроизведение.
     */
    playAudioWithStop(audioSrc, stopDelay) {
        const audio = new Audio(audioSrc);
        audio.play();
        if (stopDelay && stopDelay > 0) {
            setTimeout(() => {
                audio.pause();
            }, stopDelay);
        }
        return audio; // Возвращаем, если нужно ручное управление
    }

    /**
     * Блокируем или разблокируем элементы управления, только если камера закрыта.
     * Если камера открыта, мы ничего не блокируем.
     * @param {boolean} shouldBlock - true=блокировать, false=разблокировать
     */
    setControlsBlocked(shouldBlock) {
        if (!this.controlsPanel) return;
        // Если камера ОТКРЫТА, то не блокируем управление (можно "уйти и посмотреть")
        if (this.app.isCameraOpen) {
            shouldBlock = false;
        }
        this.controlsPanel.style.pointerEvents = shouldBlock ? "none" : "auto";
    }

    /**
     * Универсальная функция анимации текста с разбором HTML-тегов.
     * @param {HTMLElement} targetElem - элемент, в который анимируем текст.
     * @param {string} text - текст (включая теги) для анимации.
     * @param {number} speed - скорость "печатания" в мс.
     * @param {HTMLAudioElement} [audioObj] - объект аудио, который воспроизводится во время анимации.
     * @param {Function} [callback] - функция, вызываемая после завершения анимации.
     * @param {Function} [onChar] - вызывается после каждого вставленного символа (targetElem, currentHTML).
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
 
            // Логика разбора тегов
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
 
            targetElem.innerHTML = currentHTML;
            pos++;
 
            // Если есть onChar, вызываем его после вставки символа/тега
            if (typeof onChar === "function") {
                onChar(targetElem, currentHTML);
            }
        }, speed);
    }

    /**
     * triggerMirrorEffect – запускает визуальный эффект для зеркального квеста.
     * Срабатывает только если камера открыта (app.isCameraOpen == true).
     */
    triggerMirrorEffect() {
        if (!this.app.isCameraOpen) {
            console.log("Зеркальный эффект не запускается: камера закрыта.");
            return;
        }
        // Плавное затемнение фона
        document.body.style.transition = "background 1s";
        document.body.style.background = "black";
        setTimeout(() => {
            document.body.style.background = "";
        }, 1000);
 
        // Воспроизводим аудио-звонок (3 секунды)
        this.playAudioWithStop('audio/phone_ringtone.mp3', 3000);
    }

    /**
     * triggerGhostAppearanceEffect – эффект появления призрака. 
     * Тоже проверяем, что камера открыта, иначе не показываем.
     * @param {string} ghostId
     */
    triggerGhostAppearanceEffect(ghostId) {
        if (!this.app.isCameraOpen) {
            console.log("Эффект появления призрака не запускается: камера закрыта.");
            return;
        }
        const ghostEffect = document.createElement("div");
        Object.assign(ghostEffect.style, {
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "200px",
            height: "200px",
            background: `url('images/${ghostId}.png') no-repeat center center`,
            backgroundSize: "contain",
            opacity: "0.7",
            transition: "opacity 2s"
        });
        document.body.appendChild(ghostEffect);
        setTimeout(() => { ghostEffect.style.opacity = "0"; }, 3000);
        setTimeout(() => { ghostEffect.remove(); }, 5000);
    }

    /**
     * triggerWhisperEffect – эффект шёпота (5 секунд).
     */
    triggerWhisperEffect() {
        this.playAudioWithStop('audio/whisper.mp3', 5000);
    }

    /**
     * triggerGhostTextEffect – печатает "призрачный" текст. 
     * Блокировка управления, если камера закрыта.
     * @param {HTMLElement} targetElem 
     * @param {string} text 
     * @param {Function} callback 
     */
    triggerGhostTextEffect(targetElem, text, callback) {
        // Блокируем кнопки (если камера закрыта)
        this.setControlsBlocked(true);
 
        // Звук призрака
        const ghostSound = new Audio('audio/ghost_effect.mp3');
        ghostSound.play();
 
        this.animateHTMLText(
            targetElem,
            text,
            100,
            ghostSound,
            () => {
                this.setControlsBlocked(false);
                if (callback) callback();
            }
        );
    }
 
    /**
     * triggerUserTextEffect – имитирует печать пользователя. 
     * Карандаш двигается за последним символом. Блокируем управление, если камера закрыта.
     * @param {HTMLElement} targetElem 
     * @param {string} text 
     * @param {Function} callback 
     */
    triggerUserTextEffect(targetElem, text, callback) {
        // Создаём карандаш
        const pencilIcon = document.createElement("img");
        pencilIcon.src = "images/pencil.png";
        pencilIcon.alt = "Пишется...";
        Object.assign(pencilIcon.style, {
            width: "24px",
            height: "24px",
            position: "absolute"
        });
 
        // Размещаем карандаш в родительском элементе targetElem
        const parentElem = targetElem.parentElement;
        parentElem.style.position = "relative";
        parentElem.insertBefore(pencilIcon, targetElem);
 
        // Блокируем кнопки (если камера закрыта)
        this.setControlsBlocked(true);
 
        // Звук печатания
        const typeSound = new Audio('audio/type_sound.mp3');
        typeSound.loop = true;
        typeSound.play();
 
        const onChar = () => {
            // Перемещаем карандаш к последнему символу
            const dummySpan = document.createElement("span");
            dummySpan.innerHTML = "&nbsp;"; // чтобы было, к чему привязаться
            targetElem.appendChild(dummySpan);
 
            const rectDummy = dummySpan.getBoundingClientRect();
            const rectParent = parentElem.getBoundingClientRect();
            // Смещение карандаша
            pencilIcon.style.left = (rectDummy.left - rectParent.left) + "px";
            pencilIcon.style.top  = (rectDummy.top - rectParent.top) + "px";
 
            dummySpan.remove();
        };
 
        this.animateHTMLText(
            targetElem,
            text,
            100,
            typeSound,
            () => {
                pencilIcon.remove();
                this.setControlsBlocked(false);
                if (callback) callback();
            },
            onChar
        );
    }
}