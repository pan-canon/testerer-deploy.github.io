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
   * Internal cache to avoid refetching the same templates.
   * @type {Map<string, string>}
   */
  static #cache = new Map();

  /**
   * Renders an HTML template string using the provided data.
   *
   * @param {string} template - The template string containing placeholders.
   * @param {Object} data - The data object with keys corresponding to placeholder names.
   * @returns {string} - The rendered HTML string with placeholders replaced by data values.
   */
  static render(template, data) {
    return template.replace(/{{\s*([\s\S]+?)\s*}}/g, (match, key) => {
      const trimmedKey = key.trim();
      return Object.prototype.hasOwnProperty.call(data, trimmedKey) ? data[trimmedKey] : match;
    });
  }

  /**
   * Asynchronously loads an HTML template file via fetch, substitutes data using {@link render},
   * and returns the resulting HTML string.
   *
   * @param {string} templatePath - Path or URL to the HTML template file.
   * @param {Object} [data={}] - Data to interpolate into the template.
   * @param {Object} [options={}] - Optional settings.
   * @param {boolean} [options.cache=true] - Enable in‑memory caching of fetched templates.
   * @returns {Promise<string>} Rendered HTML string.
   * @throws {Error} When the fetch request fails or no path is provided.
   */
  static async renderFile(templatePath, data = {}, options = {}) {
    if (!templatePath) {
      throw new Error("TemplateEngine.renderFile: 'templatePath' argument is required.");
    }

    const { cache = true } = options;
    let templateText = null;

    // Return from cache when available
    if (cache && TemplateEngine.#cache.has(templatePath)) {
      templateText = TemplateEngine.#cache.get(templatePath);
    } else {
      const response = await fetch(templatePath, { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`Failed to load template: ${templatePath} (status ${response.status})`);
      }
      templateText = await response.text();
      if (cache) {
        TemplateEngine.#cache.set(templatePath, templateText);
      }
    }

    // Interpolate and return HTML
    return TemplateEngine.render(templateText, data);
  }

  /**
   * Clears the internal template cache. Useful for debugging or template hot‑reloading.
   */
  static clearCache() {
    TemplateEngine.#cache.clear();
  }
}