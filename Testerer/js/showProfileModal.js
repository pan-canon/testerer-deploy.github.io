export class ShowProfileModal {
  /**
   * @param {App} appInstance - ссылка на главный объект приложения
   */
  constructor(appInstance) {
    this.app = appInstance;
  }

  show() {
    // Получаем текущий профиль
    const profile = this.app.profileManager.getProfile();
    if (!profile) {
      alert("Профиль не найден.");
      return;
    }
    
    // Создаем оверлей для модального окна с прокруткой
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
    
    // Контейнер модального окна
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
    
    // Заголовок
    const title = document.createElement("h2");
    title.textContent = "Редактирование профиля";
    modal.appendChild(title);
    
    // Блок аватара
    const avatarContainer = document.createElement("div");
    avatarContainer.style.textAlign = "center";
    
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
    
    // Кнопка обновления селфи
    const updateSelfieBtn = document.createElement("button");
    updateSelfieBtn.textContent = "Обновить селфи";
    updateSelfieBtn.style.marginTop = "10px";
    updateSelfieBtn.addEventListener("click", () => {
      // Запускаем отдельное модальное окно для редактирования селфи
      this.showSelfieEditModal((newSelfieSrc) => {
        // Колбэк после успешного захвата селфи: обновляем аватар в мини-профиле
        avatarImg.src = newSelfieSrc;
      });
    });
    avatarContainer.appendChild(updateSelfieBtn);
    
    modal.appendChild(avatarContainer);
    
    // Поле редактирования логина
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
    
    // Блок отображения плана квартиры (если план существует)
    const planContainer = document.createElement("div");
    planContainer.id = "profile-plan-container";
    planContainer.style.border = "1px solid #ccc";
    planContainer.style.padding = "10px";
    planContainer.style.marginBottom = "15px";
    if (this.app.apartmentPlanManager && this.app.apartmentPlanManager.rooms.length > 0) {
      // Клонируем таблицу плана
      const planClone = this.app.apartmentPlanManager.table.cloneNode(true);
      planContainer.appendChild(planClone);
      // Добавляем кнопки переключения этажей только если этажей больше одного
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
    modal.appendChild(planContainer);
    
    // Нестандартная надпись (без возможности редактирования)
    const note = document.createElement("p");
    note.textContent = "Переехать и начать с чистого листа - это иногда помогает избавиться от привидений, но не всегда.";
    note.style.fontStyle = "italic";
    modal.appendChild(note);
    
    // Кнопки "Отмена" и "Сохранить"
    const btnContainer = document.createElement("div");
    btnContainer.style.textAlign = "right";
    btnContainer.style.marginTop = "20px";
    
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Отмена";
    cancelBtn.style.marginRight = "10px";
    cancelBtn.addEventListener("click", () => {
      document.body.removeChild(modalOverlay);
    });
    btnContainer.appendChild(cancelBtn);
    
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Сохранить изменения";
    saveBtn.addEventListener("click", () => {
      const updatedProfile = Object.assign({}, profile, {
        name: loginInput.value,
        selfie: avatarImg.src
      });
      this.app.profileManager.saveProfile(updatedProfile);
      this.app.profileNameElem.textContent = updatedProfile.name;
      this.app.profilePhotoElem.src = updatedProfile.selfie;
      document.body.removeChild(modalOverlay);
    });
    btnContainer.appendChild(saveBtn);
    
    modal.appendChild(btnContainer);
    
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
  }

  // Метод, открывающий отдельное модальное окно для редактирования селфи
  showSelfieEditModal(onSelfieCaptured) {
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
    
    const title = document.createElement("h3");
    title.textContent = "Редактирование селфи";
    selfieModal.appendChild(title);
    
    // Контейнер для видео
    const videoContainer = document.createElement("div");
    videoContainer.id = "selfie-video-container";
    videoContainer.style.width = "100%";
    videoContainer.style.maxWidth = "400px";
    videoContainer.style.margin = "10px auto";
    selfieModal.appendChild(videoContainer);
    
    // Прикрепляем видео к контейнеру с нужными опциями (например, с фильтром)
    this.app.cameraSectionManager.attachTo("selfie-video-container", {
      width: "100%",
      maxWidth: "400px",
      filter: "grayscale(100%)"
    });
    
    // Запускаем камеру
    this.app.cameraSectionManager.startCamera();
    
    // Кнопка захвата селфи
    const captureBtn = document.createElement("button");
    captureBtn.textContent = "Сделать селфи";
    captureBtn.style.display = "block";
    captureBtn.style.margin = "10px auto";
    captureBtn.addEventListener("click", () => {
      // Захватываем текущий кадр
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
      // Преобразуем изображение в ЧБ (если требуется)
      const selfieData = window.ImageUtils ? window.ImageUtils.convertToGrayscale(canvas) : canvas.toDataURL();
      // Останавливаем камеру
      this.app.cameraSectionManager.stopCamera();
      // Закрываем окно редактирования селфи
      document.body.removeChild(selfieOverlay);
      // Вызываем колбэк для обновления аватара в мини-профиле
      if (onSelfieCaptured) onSelfieCaptured(selfieData);
    });
    selfieModal.appendChild(captureBtn);
    
    // Кнопка отмены редактирования селфи
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Отмена";
    cancelBtn.style.display = "block";
    cancelBtn.style.margin = "10px auto";
    cancelBtn.addEventListener("click", () => {
      // Останавливаем камеру и закрываем окно
      this.app.cameraSectionManager.stopCamera();
      document.body.removeChild(selfieOverlay);
    });
    selfieModal.appendChild(cancelBtn);
    
    selfieOverlay.appendChild(selfieModal);
    document.body.appendChild(selfieOverlay);
  }
}
