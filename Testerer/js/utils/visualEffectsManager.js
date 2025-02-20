export class VisualEffectsManager {
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
     * Универсальная функция анимации текста с разбором HTML-тегов.
     * @param {HTMLElement} targetElem - элемент, в который анимируем текст.
     * @param {string} text - текст (включая теги) для анимации.
     * @param {number} speed - скорость "печатания" в мс.
     * @param {HTMLAudioElement} [audioObj] - объект аудио, который воспроизводится во время анимации.
     * @param {Function} [callback] - функция, вызываемая после завершения анимации.
     */
    animateHTMLText(targetElem, text, speed, audioObj, callback) {
        // Подготовка: очищаем элемент, обнуляем счётчики
        targetElem.innerHTML = "";
        let pos = 0;          // позиция в строке
        let currentHTML = ""; // то, что уже выведено
        let isTag = false;    // флаг "внутри тега"
        let tagBuffer = "";   // накапливаем строку тега

        const intervalId = setInterval(() => {
            const char = text[pos];
            if (!char) {
                // Если вышли за пределы текста, завершаем анимацию
                clearInterval(intervalId);
                if (audioObj) audioObj.pause();
                if (callback) callback();
                return;
            }

            // Логика разбора: если видим '<', значит начинаем считывать тег
            if (char === "<") {
                isTag = true;
            }
            if (isTag) {
                tagBuffer += char;
                if (char === ">") {
                    // тег закончился
                    currentHTML += tagBuffer;
                    tagBuffer = "";
                    isTag = false;
                }
            } else {
                // обычный текст
                currentHTML += char;
            }

            targetElem.innerHTML = currentHTML;
            pos++;
        }, speed);
    }

    /**
     * triggerMirrorEffect – запускает визуальный эффект для зеркального квеста.
     *
     * Эффект затемняет фон страницы и воспроизводит аудио (например, звук звонка).
     * Эффект выполняется только если глобальный контейнер камеры (global-camera) виден,
     * что указывает на активный режим квеста.
     */
    triggerMirrorEffect() {
        const globalCamera = document.getElementById('global-camera');
        if (!globalCamera || globalCamera.style.display === "none") {
            console.log("Эффект зеркального квеста не запускается, камера не активна.");
            return;
        }

        // Плавное затемнение на 1 секунду
        document.body.style.transition = "background 1s";
        document.body.style.background = "black";
        setTimeout(() => {
            document.body.style.background = "";
        }, 1000);

        // Воспроизводим аудио-звонок и останавливаем через 3 секунды
        this.playAudioWithStop('audio/phone_ringtone.mp3', 3000);
    }

    /**
     * triggerGhostAppearanceEffect – запускает визуальный эффект появления призрака.
     *
     * Создает элемент, представляющий призрачное изображение, который появляется по центру экрана.
     * Эффект предназначен для вызова, когда квест с призраком активен.
     *
     * @param {string} ghostId - Идентификатор призрака, используемый для выбора изображения.
     */
    triggerGhostAppearanceEffect(ghostId) {
        const globalCamera = document.getElementById('global-camera');
        if (!globalCamera || globalCamera.style.display === "none") {
            console.log("Эффект появления призрака не запускается, камера не активна.");
            return;
        }
        
        // Создаём элемент призрачного эффекта
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
            transition: "opacity 2s" // немного плавного исчезновения
        });

        // Добавляем эффект на страницу
        document.body.appendChild(ghostEffect);
        // Спустя 3 секунды — плавное исчезновение
        setTimeout(() => {
            ghostEffect.style.opacity = "0";
        }, 3000);
        // И ещё через 2 секунды — удаляем элемент из DOM
        setTimeout(() => {
            ghostEffect.remove();
        }, 5000);
    }

    /**
     * triggerWhisperEffect – запускает эффект шёпота.
     *
     * Воспроизводит аудио-шёпот для создания атмосферы.
     */
    triggerWhisperEffect() {
        // Воспроизводим шёпот и останавливаем через 5 секунд
        this.playAudioWithStop('audio/whisper.mp3', 5000);
    }

    /**
     * triggerGhostTextEffect – плавно проявляет текст в targetElem, проигрывая звук эффекта.
     * @param {HTMLElement} targetElem - элемент, в который будет анимирован текст.
     * @param {string} text - текст (с возможными HTML-тегами).
     * @param {Function} [callback] - функция, вызываемая после завершения анимации.
     */
    triggerGhostTextEffect(targetElem, text, callback) {
        // Запускаем звук призрака (без ручной остановки — остановим сами при завершении)
        const ghostSound = new Audio('audio/ghost_effect.mp3');
        ghostSound.play();

        // Анимируем текст за 100 мс на символ
        this.animateHTMLText(targetElem, text, 100, ghostSound, callback);
    }

    /**
     * triggerUserTextEffect – имитирует эффект печатания текста с иконкой карандаша и звуковым сопровождением.
     * Блокирует элементы управления до завершения анимации.
     *
     * @param {HTMLElement} targetElem - элемент, в который будет анимирован текст.
     * @param {string} text - текст (с возможными HTML-тегами).
     * @param {Function} [callback] - функция, вызываемая после завершения анимации.
     */
    triggerUserTextEffect(targetElem, text, callback) {
        // Добавляем иконку карандаша
        const pencilIcon = document.createElement("img");
        pencilIcon.src = "images/pencil.png";
        pencilIcon.alt = "Пишется...";
        Object.assign(pencilIcon.style, {
            width: "24px",
            height: "24px",
            position: "absolute",
            top: "-30px"
        });

        // Блокируем панель управления
        const controls = document.getElementById("controls-panel");
        if (controls) {
            controls.style.pointerEvents = "none";
        }

        // Размещаем иконку над targetElem
        targetElem.parentElement.style.position = "relative";
        targetElem.parentElement.insertBefore(pencilIcon, targetElem);

        // Воспроизводим звук печатания (без автопаузы — останавливаем сами)
        const typeSound = new Audio('audio/type_sound.mp3');
        typeSound.loop = true;
        typeSound.play();

        // Анимация "печатания" (100 мс на символ)
        this.animateHTMLText(targetElem, text, 100, typeSound, () => {
            // По завершении
            pencilIcon.remove(); // убираем иконку
            if (controls) controls.style.pointerEvents = "auto"; // снимаем блокировку
            if (callback) callback();
        });
    }
}