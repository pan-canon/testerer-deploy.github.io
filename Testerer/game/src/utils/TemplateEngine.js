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
    window.TemplateEngine = TemplateEngine;
    return template.replace(/{{\s*([^}]+)\s*}}/g, (match, key) => {
      // If the key exists in the data object, replace the placeholder; otherwise, keep it unchanged.
      return data.hasOwnProperty(key) ? data[key] : match;
    });
  }
}