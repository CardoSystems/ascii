// ============================================================
// utils.js — Pure utility helpers
// ============================================================

// Clamp a value between min and max.
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Debounce: delay invoking func until after wait ms have elapsed.
export function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Update a single range input's corresponding value-label span.
// Spans are expected to have id = inputId + 'Val' (e.g. "asciiWidthVal").
export function updateValueLabel(input) {
  if (!input) return;
  const label = document.getElementById(input.id + 'Val');
  if (label) label.textContent = input.value;
}

// Refresh all range-input value labels on the page.
export function updateUIValues() {
  document.querySelectorAll('input[type="range"]').forEach(updateValueLabel);
}
