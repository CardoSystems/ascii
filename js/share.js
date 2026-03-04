// ============================================================
// share.js — Shareable URL generation and URL-param parsing
// ============================================================

import { getOriginalImageDataUrl } from './state.js';
import { clamp } from './utils.js';
import { updateUIValues } from './utils.js';

export function generateShareableURL() {
  const params = new URLSearchParams();

  if (getOriginalImageDataUrl()) params.append('image', getOriginalImageDataUrl());

  params.append('width',            document.getElementById('asciiWidth').value);
  params.append('brightness',       document.getElementById('brightness').value);
  params.append('contrast',         document.getElementById('contrast').value);
  params.append('blur',             document.getElementById('blur').value);
  params.append('dithering',        document.getElementById('dithering').checked);
  params.append('ditherAlgorithm',  document.getElementById('ditherAlgorithm').value);
  params.append('invert',           document.getElementById('invert').checked);
  params.append('ignoreWhite',      document.getElementById('ignoreWhite').checked);
  params.append('charset',          document.getElementById('charset').value);
  params.append('edgeMethod',       document.querySelector('input[name="edgeMethod"]:checked').value);
  params.append('edgeThreshold',    document.getElementById('edgeThreshold').value);
  params.append('dogEdgeThreshold', document.getElementById('dogEdgeThreshold').value);
  params.append('zoom',             document.getElementById('zoom').value);
  params.append('fontFamily',       document.getElementById('fontFamily').value);

  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

export function applySettingsFromURL() {
  const p = new URLSearchParams(window.location.search);
  if (!p.toString()) return;

  const setRange = (id, key, mn, mx) => {
    if (!p.has(key)) return;
    document.getElementById(id).value = clamp(parseFloat(p.get(key)), mn, mx);
  };
  const setSelect = (id, key) => {
    if (!p.has(key)) return;
    const val = p.get(key);
    const sel = document.getElementById(id);
    if (Array.from(sel.options).some(o => o.value === val)) sel.value = val;
  };
  const setCheck = (id, key) => {
    if (!p.has(key)) return;
    document.getElementById(id).checked = p.get(key) === 'true';
  };

  setRange('asciiWidth', 'width', 20, 300);
  setRange('brightness', 'brightness', -100, 100);
  setRange('contrast',   'contrast',   -100, 100);
  setRange('blur',       'blur',       0, 10);
  setRange('edgeThreshold',    'edgeThreshold',    0, 255);
  setRange('dogEdgeThreshold', 'dogEdgeThreshold', 0, 255);
  setRange('zoom', 'zoom', 20, 600);

  setCheck('dithering',   'dithering');
  setCheck('invert',      'invert');
  setCheck('ignoreWhite', 'ignoreWhite');

  setSelect('ditherAlgorithm', 'ditherAlgorithm');
  setSelect('charset',         'charset');
  setSelect('fontFamily',      'fontFamily');

  if (p.has('edgeMethod')) {
    const method = p.get('edgeMethod');
    const radio  = document.querySelector(`input[name="edgeMethod"][value="${method}"]`);
    if (radio) {
      radio.checked = true;
      document.getElementById('sobelThresholdControl').style.display =
        method === 'sobel' ? 'flex' : 'none';
      document.getElementById('dogThresholdControl').style.display =
        method === 'dog'   ? 'flex' : 'none';
    }
  }

  updateUIValues();

  if (p.has('image')) {
    import('./imageLoader.js').then(({ loadImageFromURL }) => loadImageFromURL(p.get('image')));
  }
}
