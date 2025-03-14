export class GhostTextManager {
  constructor(textsConfig) {
    // textsConfig можно передавать либо как отдельный файл конфигурации текстов,
    // либо как часть общей конфигурации.
    this.textsConfig = textsConfig;
  }

  /**
   * Возвращает текст для указанного призрака и этапа, подставляя параметры.
   * @param {string|number} ghostId — идентификатор или имя призрака (например, "ghost1")
   * @param {number} stage — номер этапа (начинается с 1)
   * @param {object} extraParams — дополнительные параметры для подстановки (например, letter)
   * @returns {string} — итоговый текст
   */
  getText(ghostId, stage, extraParams = {}) {
    // Преобразуем числовой id в строку вида "ghost1", если необходимо
    const ghostKey = typeof ghostId === "number" ? `ghost${ghostId}` : ghostId;
    // Предположим, что в конфигурации текстов для призраков ключ совпадает с ghostKey,
    // а сами шаблоны хранятся в виде массива, где каждый объект соответствует этапу.
    const ghostTexts = this.textsConfig[ghostKey];
    if (!ghostTexts) return "";
    const stageData = ghostTexts.find(item => item.stage === stage);
    if (!stageData) return "";
    const params = { ...stageData.params, ...extraParams, ghostName: ghostKey };
    return this.interpolate(stageData.template, params);
  }

  /**
   * Функция интерполяции заменяет плейсхолдеры вида %param% на их значения.
   * @param {string} template — шаблон с плейсхолдерами
   * @param {object} params — объект с параметрами
   * @returns {string}
   */
  interpolate(template, params) {
    return template.replace(/%([^%]+)%/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }
}