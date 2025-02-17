/**
 * Класс ShowProfileModal отвечает за отображение модального окна профиля.
 * В нём реализовано редактирование профиля, включая обновление селфи, изменение логина,
 * просмотр плана квартиры и отображение наград (прогресса призраков).
 */
export class ShowProfileModal {
  /**
   * @param {App} appInstance - ссылка на главный объект приложения
   */
  constructor(appInstance) {
    // Сохраняем ссылку на главный объект приложения для доступа к его менеджерам и данным.
    this.app = appInstance;
  }

  /**
   * Метод show – открывает модальное окно профиля.
   * Здесь происходит:
   *  - Извлечение текущего профиля;
   *  - Создание оверлея и контейнера модального окна;
   *  - Отображение аватара, кнопки обновления селфи, полей для редактирования логина;
   *  - Если доступен план квартиры, отображается его клон и кнопки переключения этажей;
   *  - Отображение блока с наградами (прогресс призраков);
   *  - Кнопки для отмены и сохранения изменений.
   */
  show() {
    // Получаем текущий профиль через менеджер профиля.
    const profile = this.app.profileManager.getProfile();
    if (!profile) {
      alert("Профиль не найден.");
      return;
    }

    // Создаем оверлей для модального окна с возможностью прокрутки.
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

    // Создаем контейнер самого модального окна.
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

    // Блок для аватара (селфи).
    const avatarContainer = document.createElement("div");
    avatarContainer.style.textAlign = "center";
    // Создаем изображение для аватара.
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
    // При нажатии открывается отдельное модальное окно для захвата нового селфи.
    updateSelfieBtn.addEventListener("click", () => {
      this.showSelfieEditModal((newSelfieSrc) => {
        // После успешного захвата селфи обновляем аватар в модальном окне.
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
    // Если менеджер плана квартиры существует и содержит данные комнат, клонируем таблицу плана.
    if (this.app.apartmentPlanManager) {
      // Если таблица ещё не создана, пытаемся её создать
      if (!this.app.apartmentPlanManager.table) {
        this.app.apartmentPlanManager.createTable();
      }
      if (this.app.apartmentPlanManager.table) {
        // Если таблица теперь существует, клонируем её и отображаем
        const planClone = this.app.apartmentPlanManager.table.cloneNode(true);
        planContainer.appendChild(planClone);
        // Если этажей больше одного, добавляем кнопки для переключения этажей
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
            const newPlan = this.app.apartmentPlanManager.table.cloneNode(true);
            planContainer.appendChild(newPlan);
          });
          const nextFloorBtn = document.createElement("button");
          nextFloorBtn.textContent = "Следующий этаж";
          nextFloorBtn.style.marginLeft = "10px";
          nextFloorBtn.addEventListener("click", () => {
            this.app.apartmentPlanManager.nextFloor();
            planContainer.innerHTML = "";
            const newPlan = this.app.apartmentPlanManager.table.cloneNode(true);
            planContainer.appendChild(newPlan);
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

    // Отображаем информационную надпись.
    const note = document.createElement("p");
    note.textContent = "Переехать и начать с чистого листа - это иногда помогает избавиться от привидений, но не всегда.";
    note.style.fontStyle = "italic";
    modal.appendChild(note);

    // Блок для отображения наград (прогресс призраков).
    const rewardsContainer = document.createElement("div");
    rewardsContainer.id = "ghost-rewards-container";
    rewardsContainer.style.display = "flex";
    rewardsContainer.style.flexWrap = "wrap";
    rewardsContainer.style.justifyContent = "center";
    rewardsContainer.style.marginTop = "20px";

    // Если менеджер призраков доступен, получаем список призраков.
    const ghostList = (this.app.ghostManager && this.app.ghostManager.ghosts) || [];
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

      // Получаем прогресс призрака из profileManager.
      const ghostProgress = this.app.profileManager.getGhostProgress();
      if (ghostProgress && ghostProgress.ghostId === ghost.id) {
        // Если призрак активен, отображаем текущий шаг и общее количество.
        ghostIcon.textContent = `${ghostProgress.phenomenonIndex}/${ghost.phenomenaCount}`;
        ghostIcon.style.borderColor = "#4caf50"; // Зеленая рамка для активного призрака.
      } else {
        // Для остальных отображаем имя или номер призрака с эффектом серой гаммы.
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
      // Обновляем профиль, объединяя старые данные с изменениями.
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
   * После захвата нового селфи вызывается переданный колбэк для обновления аватара в модальном окне профиля.
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

    // Прикрепляем видео к контейнеру с заданными опциями (например, фильтр).
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
      if (!this.app.cameraSectionManager.videoElement ||
          !this.app.cameraSectionManager.videoElement.srcObject) {
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