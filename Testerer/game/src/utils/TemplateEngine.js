// TemplateEngine.js

/**
 * TemplateEngine
 *
 * A simple templating engine that replaces placeholders in the format {{ key }}
 * with corresponding values from a provided data object.
 *
 * Example:
 *   const template = "<h1>{{ title }}</h1><p>{{ message }}</p>";
 *   const data = { title: "Hello", message: "World" };
 *   const result = TemplateEngine.render(template, data);
 *   // result: "<h1>Hello</h1><p>World</p>"
 */
export class TemplateEngine {
  /**
   * Renders the template by replacing all placeholders with data.
   *
   * @param {string} template - The template string containing placeholders.
   * @param {Object} data - The data object containing key-value pairs for substitution.
   * @returns {string} - The rendered template with placeholders replaced by corresponding data.
   */
  static render(template, data) {
    return template.replace(/{{\s*(\w+)\s*}}/g, (match, key) => {
      return data.hasOwnProperty(key) ? data[key] : "";
    });
  }
}