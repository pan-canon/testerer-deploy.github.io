/**
 * SpiritBoardUtils.js
 *
 * This module provides utility functions for visual effects on the spirit board.
 * It includes functions to animate text by sequentially revealing letters.
 */

/**
 * animateText
 * Sequentially animates each letter of the given text within the provided HTML element.
 * It splits the text into individual letters, wraps each in a span, and applies a fade-in effect.
 *
 * @param {HTMLElement} element - The target element where the text animation will occur.
 * @param {string} text - The text to be animated.
 */
export function animateText(element, text) {
  // Clear the current content of the element
  element.innerHTML = '';

  // Split the text into individual letters
  const letters = text.split('');

  // Create a span for each letter and animate its appearance
  letters.forEach((letter, index) => {
    const span = document.createElement('span');
    span.innerText = letter;
    // Set initial opacity to 0 for the animation effect
    span.style.opacity = '0';
    span.style.transition = 'opacity 0.3s ease-in';
    element.appendChild(span);

    // Reveal each letter sequentially with a delay (e.g., 100ms between letters)
    setTimeout(() => {
      span.style.opacity = '1';
    }, index * 100);
  });
}