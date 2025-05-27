// Файл: ghostTextsConfig.js
const ghostTextsConfig = {
  ghost1: [
    {
      stage: 1,
      template: "Призрак %ghostName% шепчет: 'Первый этап, моя первая буква — %letter%'",
      params: { letter: "Г" }
    },
    {
      stage: 2,
      template: "Призрак %ghostName% продолжает: 'Второй этап, буква — %letter%'",
      params: { letter: "H" }
    },
    {
      stage: 3,
      template: "Призрак %ghostName% завершает: 'Третий этап, буква — %letter%'",
      params: { letter: "O" }
    }
  ]
};

export default ghostTextsConfig;