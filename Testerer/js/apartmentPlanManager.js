goToApartmentPlanScreen() {
  const regData = {
    name: this.nameInput.value.trim(),
    gender: this.genderSelect.value,
    language: document.getElementById('language-selector').value
  };
  localStorage.setItem('regData', JSON.stringify(regData));
  this.registrationScreen.style.display = 'none';
  // Показываем экран геолокации
  document.getElementById('apartment-plan-screen').style.display = 'block';
  
  // Если ранее создавался ApartmentPlanManager – можно его не использовать или удалить
  // this.apartmentPlanManager = new ApartmentPlanManager('apartment-plan-container', this.databaseManager);
}
