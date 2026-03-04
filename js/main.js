// ============================================================
// main.js — Application entry point: init and event wiring
// ============================================================

import { updateUIValues, debounce, updateValueLabel } from './utils.js';
import {
  updateAsciiZoom, incrementZoom,
  toggleSidebarCollapse, toggleSidebar,
  applysavedTheme, updateThemeIcon,
  displayError
} from './ui.js';
import { generateWithCurrentSettings } from './asciiGenerator.js';
import { downloadPNG, downloadSvg, downloadTxt, downloadHtml, copyToClipboard } from './export.js';
import { updatePresetDropdown, applyPreset, saveCurrentSettingsAsPreset } from './presets.js';
import { generateShareableURL, applySettingsFromURL } from './share.js';
import { handleFileUpload, setupDragAndDrop, setupSampleImages, loadDefaultImage } from './imageLoader.js';
import { getCurrentImage } from './state.js';

document.addEventListener('DOMContentLoaded', () => {

  // ---- Theme --------------------------------------------------
  applysavedTheme();
  const themeToggle = document.getElementById('toggleTheme');
  if (themeToggle) {
    updateThemeIcon(themeToggle);
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
      updateThemeIcon(themeToggle);
    });
  }

  // ---- Sidebar ------------------------------------------------
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebarCollapse);

  const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
  if (mobileSidebarToggle) mobileSidebarToggle.addEventListener('click', toggleSidebar);

  // ---- Upload + drag-and-drop ---------------------------------
  setupDragAndDrop();
  const fileInput = document.getElementById('upload');
  if (fileInput) fileInput.addEventListener('change', handleFileUpload);

  // ---- Sample gallery -----------------------------------------
  setupSampleImages();

  // ---- Presets ------------------------------------------------
  updatePresetDropdown();

  const presetsDropdown = document.getElementById('presets');
  if (presetsDropdown) {
    presetsDropdown.addEventListener('change', function () {
      if (this.value !== 'default') applyPreset(this.value);
    });
  }

  const savePresetBtn = document.getElementById('savePresetBtn');
  if (savePresetBtn) {
    savePresetBtn.addEventListener('click', () => {
      const nameInput = document.getElementById('savePresetName');
      const name = nameInput?.value?.trim();
      if (!name) return;
      saveCurrentSettingsAsPreset(name);
      const dropdown = document.getElementById('presets');
      if (dropdown) dropdown.value = name;
      if (nameInput) nameInput.value = '';
    });
  }

  const resetBtn = document.getElementById('reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => applyPreset('default'));
  }

  // ---- Zoom & font --------------------------------------------
  const zoomSlider = document.getElementById('zoom');
  if (zoomSlider) zoomSlider.addEventListener('input', updateAsciiZoom);

  const fontFamilyDropdown = document.getElementById('fontFamily');
  if (fontFamilyDropdown) fontFamilyDropdown.addEventListener('change', updateAsciiZoom);

  // ---- Export buttons -----------------------------------------
  document.getElementById('downloadBtn')   ?.addEventListener('click', downloadPNG);
  document.getElementById('downloadPngBtn')?.addEventListener('click', downloadPNG);
  document.getElementById('downloadSvgBtn')?.addEventListener('click', downloadSvg);
  document.getElementById('downloadTxtBtn')?.addEventListener('click', downloadTxt);
  document.getElementById('downloadHtmlBtn')?.addEventListener('click', downloadHtml);
  document.getElementById('copyBtn')       ?.addEventListener('click', copyToClipboard);

  // ---- Share --------------------------------------------------
  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const url = generateShareableURL();
      const shareUrlInput = document.getElementById('shareUrl');
      if (shareUrlInput) { shareUrlInput.value = url; shareUrlInput.select(); }
      const shareModal = document.getElementById('shareModal');
      if (shareModal) new bootstrap.Modal(shareModal).show();
    });
  }

  const copyShareUrlBtn = document.getElementById('copyShareUrlBtn');
  if (copyShareUrlBtn) {
    copyShareUrlBtn.addEventListener('click', function () {
      const input = document.getElementById('shareUrl');
      if (input) {
        input.select();
        document.execCommand('copy');
        const orig = this.textContent;
        this.textContent = 'Copied!';
        setTimeout(() => { this.textContent = orig; }, 2000);
      }
    });
  }

  // ---- Color controls -----------------------------------------
  const colorizeCheckbox = document.getElementById('colorized');
  if (colorizeCheckbox) {
    colorizeCheckbox.addEventListener('change', function () {
      document.getElementById('colorControls').style.display = this.checked ? 'block' : 'none';
      if (getCurrentImage()) generateWithCurrentSettings();
    });
  }

  const textColorPicker = document.getElementById('textColor');
  const bgColorPicker   = document.getElementById('bgColor');
  if (textColorPicker) {
    textColorPicker.addEventListener('input', debounce(() => {
      if (getCurrentImage()) generateWithCurrentSettings();
    }, 300));
  }
  if (bgColorPicker) {
    bgColorPicker.addEventListener('input', debounce(() => {
      if (getCurrentImage()) generateWithCurrentSettings();
    }, 300));
  }

  // ---- Charset controls ---------------------------------------
  const charsetSelect = document.getElementById('charset');
  if (charsetSelect) {
    charsetSelect.addEventListener('change', function () {
      document.getElementById('manualCharControl').style.display   = this.value === 'manual' ? 'flex' : 'none';
      document.getElementById('customCharsetControl').style.display = this.value === 'custom' ? 'flex' : 'none';
      if (getCurrentImage()) generateWithCurrentSettings();
    });
  }

  // ---- Edge detection mode ------------------------------------
  document.querySelectorAll('input[name="edgeMethod"]').forEach(radio => {
    radio.addEventListener('change', function () {
      document.getElementById('sobelThresholdControl').style.display =
        this.value === 'sobel' ? 'flex' : 'none';
      document.getElementById('dogThresholdControl').style.display =
        this.value === 'dog'   ? 'flex' : 'none';
      if (getCurrentImage()) generateWithCurrentSettings();
    });
  });

  // ---- All other settings sliders/selects/checkboxes ----------
  const settingInputs = document.querySelectorAll(
    'input[type="range"], input[type="number"], input[type="checkbox"], ' +
    'select:not(#presets):not(#fontFamily):not(#charset)'
  );
  settingInputs.forEach(input => {
    if (input.type === 'range' || input.type === 'number') {
      input.addEventListener('input', () => updateValueLabel(input));
    }
    const event = input.type === 'range' ? 'input' : 'change';
    input.addEventListener(event, debounce(() => {
      if (getCurrentImage()) generateWithCurrentSettings();
    }, 300));
  });

  // ---- Keyboard shortcuts -------------------------------------
  document.addEventListener('keydown', e => {
    const isMac    = navigator.platform.toUpperCase().includes('MAC');
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    if (modifier) {
      switch (e.key.toLowerCase()) {
        case 'o': e.preventDefault(); document.getElementById('upload')?.click(); break;
        case 's': e.preventDefault(); downloadPNG(); break;
        case 'c': if (e.shiftKey) { e.preventDefault(); copyToClipboard(); } break;
        case '+': case '=': e.preventDefault(); incrementZoom(10);  break;
        case '-':            e.preventDefault(); incrementZoom(-10); break;
      }
    }

    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.show').forEach(modal => {
        bootstrap.Modal.getInstance(modal)?.hide();
      });
    }
  });

  // ---- Bootstrap tooltips -------------------------------------
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
    new bootstrap.Tooltip(el);
  });

  // ---- Initial state ------------------------------------------
  updateUIValues();
  applySettingsFromURL();

  // Load default image only when no URL params were provided
  if (!new URLSearchParams(window.location.search).toString()) {
    loadDefaultImage();
  }
});
