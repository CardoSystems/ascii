// ============================================================
// ui.js — DOM-facing UI helpers: loading, errors, zoom, sidebar, theme
// ============================================================

import { baseFontSize } from './config.js';
import { clamp } from './utils.js';

// ---- Loading indicator ------------------------------------------

export function showLoadingIndicator() {
  const container = document.querySelector('.main-content');
  let loading = document.querySelector('.loading');
  if (!loading) {
    loading = document.createElement('div');
    loading.className = 'loading';
    loading.textContent = 'Processing image...';
    container.appendChild(loading);
  } else {
    loading.style.display = 'block';
  }
  document.querySelectorAll('.control input, .control select, .control button').forEach(el => {
    el.disabled = true;
  });
}

export function hideLoadingIndicator() {
  const loading = document.querySelector('.loading');
  if (loading) loading.style.display = 'none';
  document.querySelectorAll('.control input, .control select, .control button').forEach(el => {
    el.disabled = false;
  });
}

// ---- Error display -----------------------------------------------

export function displayError(message) {
  const asciiArt = document.getElementById('ascii-art');
  asciiArt.textContent = `Error: ${message}\nPlease try again with a different image or settings.`;
  console.error(message);
}

// ---- Zoom --------------------------------------------------------

export function updateAsciiZoom() {
  const zoom = document.getElementById('zoom').value;
  const fontFamily = document.getElementById('fontFamily').value;
  document.querySelectorAll('.ascii-output').forEach(el => {
    el.style.fontSize = `${(zoom / 100) * baseFontSize}px`;
    el.style.fontFamily = fontFamily;
  });
}

export function incrementZoom(amount) {
  const zoomSlider = document.getElementById('zoom');
  if (!zoomSlider) return;
  const newZoom = parseInt(zoomSlider.value, 10) + amount;
  zoomSlider.value = clamp(newZoom, parseInt(zoomSlider.min, 10), parseInt(zoomSlider.max, 10));
  updateAsciiZoom();
  const zoomLabel = document.getElementById('zoomVal');
  if (zoomLabel) zoomLabel.textContent = zoomSlider.value;
}

// ---- Sidebar -----------------------------------------------------

export function toggleSidebarCollapse() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('collapsed');
    document.querySelector('.main-content').classList.toggle('expanded');
  }
}

export function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('show');
}

// ---- Theme -------------------------------------------------------

export function updateThemeIcon(toggleEl) {
  const icon = toggleEl.querySelector('i');
  if (!icon) return;
  icon.className = document.body.classList.contains('light-mode')
    ? 'fas fa-moon'
    : 'fas fa-sun';
}

export function applysavedTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') {
    document.body.classList.add('light-mode');
  } else if (saved === 'dark') {
    document.body.classList.remove('light-mode');
  } else {
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    document.body.classList.toggle('light-mode', !prefersDark);
  }
}
