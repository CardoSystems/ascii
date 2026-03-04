// ============================================================
// presets.js — Built-in and user-saved preset management
// ============================================================

import { PRESETS } from './config.js';
import { getCurrentImage } from './state.js';
import { updateUIValues } from './utils.js';

// ---- localStorage helpers ---------------------------------------

export function getSavedPresets() {
  const json = localStorage.getItem('ascii_presets');
  return json ? JSON.parse(json) : {};
}

export function saveCurrentSettingsAsPreset(name) {
  const settings = {
    asciiWidth:       parseInt(document.getElementById('asciiWidth').value, 10),
    brightness:       parseFloat(document.getElementById('brightness').value),
    contrastValue:    parseFloat(document.getElementById('contrast').value),
    blurValue:        parseFloat(document.getElementById('blur').value),
    ditheringEnabled: document.getElementById('dithering').checked,
    ditherAlgorithm:  document.getElementById('ditherAlgorithm').value,
    invertEnabled:    document.getElementById('invert').checked,
    ignoreWhite:      document.getElementById('ignoreWhite').checked,
    charset:          document.getElementById('charset').value,
    edgeMethod:       document.querySelector('input[name="edgeMethod"]:checked').value,
    edgeThreshold:    parseInt(document.getElementById('edgeThreshold').value, 10),
    dogEdgeThreshold: parseInt(document.getElementById('dogEdgeThreshold').value, 10)
  };

  const saved = getSavedPresets();
  saved[name] = settings;
  localStorage.setItem('ascii_presets', JSON.stringify(saved));
  updatePresetDropdown();
  alert(`Preset "${name}" has been saved.`);
}

// ---- Dropdown management ----------------------------------------

export function updatePresetDropdown() {
  const dropdown = document.getElementById('presets');
  if (!dropdown) return;

  for (const name of Object.keys(getSavedPresets())) {
    if (!dropdown.querySelector(`option[value="${name}"]`)) {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      dropdown.appendChild(option);
    }
  }
}

// ---- Apply preset -----------------------------------------------

export function applyPreset(presetName) {
  const preset = PRESETS[presetName] ?? getSavedPresets()[presetName];
  if (!preset) return;
  applySettings(preset);
  if (getCurrentImage()) {
    import('./asciiGenerator.js').then(({ generateWithCurrentSettings }) => generateWithCurrentSettings());
  }
}

// ---- Apply settings object to UI --------------------------------

export function applySettings(settings) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el !== null && val !== undefined) el.value = val;
  };
  const check = (id, val) => {
    const el = document.getElementById(id);
    if (el !== null && val !== undefined) el.checked = val;
  };

  set('asciiWidth',      settings.asciiWidth);
  set('brightness',      settings.brightness);
  set('contrast',        settings.contrastValue ?? settings.contrast);
  set('blur',            settings.blurValue ?? settings.blur);
  set('ditherAlgorithm', settings.ditherAlgorithm);
  set('charset',         settings.charset);
  set('edgeThreshold',   settings.edgeThreshold);
  set('dogEdgeThreshold', settings.dogEdgeThreshold);

  check('dithering', settings.ditheringEnabled ?? settings.dithering);
  check('invert',    settings.invertEnabled ?? settings.invert);
  check('ignoreWhite', settings.ignoreWhite);

  if (settings.edgeMethod !== undefined) {
    const radio = document.querySelector(`input[name="edgeMethod"][value="${settings.edgeMethod}"]`);
    if (radio) {
      radio.checked = true;
      document.getElementById('sobelThresholdControl').style.display =
        settings.edgeMethod === 'sobel' ? 'flex' : 'none';
      document.getElementById('dogThresholdControl').style.display =
        settings.edgeMethod === 'dog'   ? 'flex' : 'none';
    }
  }

  updateUIValues();
}
