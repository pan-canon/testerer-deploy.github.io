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
    
    // Контейнер модального окна с максимальной высотой и прокруткой
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
    
    // Кнопка для редактирования селфи – открывает отдельное окно
    const updateSelfieBtn = document.createElement("button");
    updateSelfieBtn.textContent = "Обновить селфи";
    updateSelfieBtn.style.marginTop = "10px";
    updateSelfieBtn.addEventListener("click", () => {
      // Запускаем окно редактирования селфи поверх текущего.
      // Например, создадим новый оверлей для селфи. При этом используем существующий метод goToSelfieScreen().
      this.showSelfieEditModal();
    });
    avatarContainer.appendChild(updateSelfieBtn);
    
    modal.appendChild(avatarContainer);
    
    // Поле для редактирования логина
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
    
    // Блок отображения плана квартиры
    const planContainer = document.createElement("div");
    planContainer.id = "profile-plan-container";
    planContainer.style.border = "1px solid #ccc";
    planContainer.style.padding = "10px";
    planContainer.style.marginBottom = "15px";
    // Если план квартиры существует и задан хотя бы один этаж
    if (this.app.apartmentPlanManager && this.app.apartmentPlanManager.rooms.length > 0) {
      // Отображаем снимок (клон таблицы)
      const planClone = this.app.apartmentPlanManager.table.cloneNode(true);
      planContainer.appendChild(planClone);
      
      // Если в плане есть информация о нескольких этажах, отрисовываем кнопки переключения
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
          // Обновляем отображение плана в модальном окне
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
    
    // Нестандартная надпись, не редактируемая
    const note = document.createElement("p");
    note.textContent = "Переехать и начать с чистого листа - это иногда помогает избавиться от привидений, но не всегда.";
    note.style.fontStyle = "italic";
    modal.appendChild(note);
    
    // Кнопки сохранения и отмены
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
      // Обновляем профиль
      const updatedProfile = Object.assign({}, profile, {
        name: loginInput.value,
        selfie: avatarImg.src
      });
      this.app.profileManager.saveProfile(updatedProfile);
      // Обновляем данные на главном экране
      this.app.profileNameElem.textContent = updatedProfile.name;
      this.app.profilePhotoElem.src = updatedProfile.selfie;
      document.body.removeChild(modalOverlay);
    });
    btnContainer.appendChild(saveBtn);
    
    modal.appendChild(btnContainer);
    
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
  }

  // Метод для запуска отдельного окна редактирования селфи
  showSelfieEditModal() {
    // Создаем отдельный оверлей для селфи-редактирования
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
      zIndex: "2100"
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
    
    // Здесь можно встроить существующую логику для селфи, например, вызвать метод goToSelfieScreen()
    const info = document.createElement("p");
    info.textContent = "Нажмите 'Начать', чтобы обновить селфи.";
    selfieModal.appendChild(info);
    
    const startBtn = document.createElement("button");
    startBtn.textContent = "Начать";
    startBtn.addEventListener("click", () => {
      // Закрываем окно редактирования селфи и переходим к экрану селфи
      document.body.removeChild(selfieOverlay);
      this.app.goToSelfieScreen();
    });
    selfieModal.appendChild(startBtn);
    
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Отмена";
    cancelBtn.style.marginLeft = "10px";
    cancelBtn.addEventListener("click", () => {
      document.body.removeChild(selfieOverlay);
    });
    selfieModal.appendChild(cancelBtn);
    
    selfieOverlay.appendChild(selfieModal);
    document.body.appendChild(selfieOverlay);
  }
}
