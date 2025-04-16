export class TemplateEngine {
  /**
   * Renders an HTML template using the provided data.
   *
   * @param {string} template - The template string containing placeholders.
   * @param {Object} data - The data object with keys corresponding to placeholder names.
   * @returns {string} - The rendered HTML string with placeholders replaced by data values.
   */
  static render(template, data) {
    return template.replace(/{{\s*([\s\S]+?)\s*}}/g, (match, key) => {
      const trimmedKey = key.trim();
      return data.hasOwnProperty(trimmedKey) ? data[trimmedKey] : match;
    });
  }
  
  /**
   * Asynchronously loads a template file from the given URL, then renders it using the data.
   *
   * @param {string} templateUrl - The URL of the template file.
   * @param {Object} data - The data to replace placeholders.
   * @returns {Promise<string>} - A Promise that resolves to the rendered HTML.
   */
  static async renderFile(templateUrl, data) {
    const response = await fetch(templateUrl);
    if (!response.ok) {
      throw new Error(`Failed to load template from ${templateUrl}`);
    }
    const templateText = await response.text();
    return TemplateEngine.render(templateText, data);
  }
}