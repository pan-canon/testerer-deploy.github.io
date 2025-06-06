/**
 * TemplateEngine.js
 *
 * A simple template engine for dynamic HTML rendering.
 * It replaces placeholders in the template string with values from a data object.
 *
 * Placeholders are defined using double curly braces, e.g., {{ variableName }}.
 *
 * Example usage:
 *   const template = "<h1>{{ title }}</h1><p>{{ content }}</p>";
 *   const data = { title: "Hello", content: "World" };
 *   const renderedHTML = TemplateEngine.render(template, data);
 *   // renderedHTML: "<h1>Hello</h1><p>World</p>"
 */
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
   * Loads an HTML template from `templatePath` with `fetch`, then renders it with the data.
   * @param {string} templatePath – relative / absolute URL to the HTML file.
   * @param {Object} [data={}] – placeholder values.
   */
  static async renderFile(templatePath, data = {}) {
    const response = await fetch(templatePath);
    if (!response.ok) {
      throw new Error(`[TemplateEngine] Failed to load template: ${templatePath}`);
    }
    const templateText = await response.text();
    return TemplateEngine.render(templateText, data);
  }
}