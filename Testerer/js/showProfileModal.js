export class ShowProfileModal() {
  // Получаем текущий профиль
  const profile = this.profileManager.getProfile();
  if (!profile) {
    alert("Профиль не найден.");
    return;
  }
  
  // Создаём оверлей для модального окна
  const modalOverlay = document.createElement("div");
  modalOverlay.id = "profile-modal-overlay";
  Object.assign(modalOverlay.style, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000
  });
  
  // Создаём контейнер модального окна
  const modal = document.createElement("div");
  modal.id = "profile-modal";
  Object.assign(modal.style, {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    width: "90%",
    maxWidth: "500px",
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
  avatarImg.style.width = "100px";
  avatarImg.style.height = "100px";
  avatarImg.style.borderRadius = "50%";
  avatarContainer.appendChild(avatarImg);
  
  // Кнопка обновления селфи
  const updateSelfieBtn = document.createElement("button");
  updateSelfieBtn.textContent = "Обновить селфи";
  updateSelfieBtn.style.marginTop = "10px";
  updateSelfieBtn.addEventListener("click", () => {
    // Здесь можно вызвать метод, который открывает окно камеры
    // Например, если у вас есть метод goToSelfieScreen(), можно его вызвать,
    // либо реализовать похожую логику внутри модального окна.
    // Для примера: переходим к экрану селфи и при удачном снимке обновляем аватар.
    this.goToSelfieScreen();
    // После успешного обновления селфи, можно обновить avatarImg.src.
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
  
  // Отрисовка карты (плана квартиры)
  const planContainer = document.createElement("div");
  planContainer.id = "profile-plan-container";
  planContainer.style.border = "1px solid #ccc";
  planContainer.style.padding = "10px";
  planContainer.style.marginBottom = "15px";
  // Если у вас уже существует ApartmentPlanManager с данными,
  // можно вызвать его метод renderRooms() и прикрепить результат сюда.
  // Например, если this.apartmentPlanManager существует:
  if (this.apartmentPlanManager) {
    // Создаем клон таблицы плана (или используем метод, который возвращает HTML-контейнер)
    const planClone = this.apartmentPlanManager.table.cloneNode(true);
    planContainer.appendChild(planClone);
    // Если этажей несколько, можно добавить кнопки переключения:
    const floorControls = document.createElement("div");
    floorControls.style.textAlign = "center";
    floorControls.style.marginTop = "10px";
    const prevFloorBtn = document.createElement("button");
    prevFloorBtn.textContent = "Предыдущий этаж";
    prevFloorBtn.addEventListener("click", () => {
      this.apartmentPlanManager.prevFloor();
      // Обновляем план в модальном окне
      planContainer.innerHTML = "";
      const newPlan = this.apartmentPlanManager.table.cloneNode(true);
      planContainer.appendChild(newPlan);
    });
    const nextFloorBtn = document.createElement("button");
    nextFloorBtn.textContent = "Следующий этаж";
    nextFloorBtn.style.marginLeft = "10px";
    nextFloorBtn.addEventListener("click", () => {
      this.apartmentPlanManager.nextFloor();
      planContainer.innerHTML = "";
      const newPlan = this.apartmentPlanManager.table.cloneNode(true);
      planContainer.appendChild(newPlan);
    });
    floorControls.appendChild(prevFloorBtn);
    floorControls.appendChild(nextFloorBtn);
    planContainer.appendChild(floorControls);
  } else {
    planContainer.textContent = "План квартиры отсутствует.";
  }
  modal.appendChild(planContainer);
  
  // Нестандартная надпись (не редактируется)
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
    // Обновляем данные профиля
    const updatedProfile = Object.assign({}, profile, {
      name: loginInput.value,
      selfie: avatarImg.src // предполагается, что если селфи обновлено, то src изменится
    });
    this.profileManager.saveProfile(updatedProfile);
    // Можно обновить элементы на главном экране, если нужно
    this.profileNameElem.textContent = updatedProfile.name;
    this.profilePhotoElem.src = updatedProfile.selfie;
    document.body.removeChild(modalOverlay);
  });
  btnContainer.appendChild(saveBtn);
  
  modal.appendChild(btnContainer);
  
  // Добавляем модальное окно в документ
  modalOverlay.appendChild(modal);
  document.body.appendChild(modalOverlay);
}