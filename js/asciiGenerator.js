// ============================================================
// asciiGenerator.js — Core ASCII-art generation pipeline
// ============================================================

import { CHARSETS } from './config.js';
import { clamp } from './utils.js';
import { applyDithering } from './dithering.js';
import { applyEdgeDetection, differenceOfGaussians2D, applySobel2D, nonMaxSuppression } from './edgeDetection.js';
import { showLoadingIndicator, hideLoadingIndicator, displayError } from './ui.js';
import { getCurrentImage, getIsProcessing, setIsProcessing, setLastSettings } from './state.js';

const FONT_ASPECT_RATIO = 0.55;

// ---- Settings reader --------------------------------------------

export function getSettingsFromUI() {
  const asciiWidth    = parseInt(document.getElementById('asciiWidth').value, 10);
  const brightness    = parseFloat(document.getElementById('brightness').value);
  const contrastValue = parseFloat(document.getElementById('contrast').value);
  const blurValue     = parseFloat(document.getElementById('blur').value);
  const ditheringEnabled = document.getElementById('dithering').checked;
  const ditherAlgorithm  = document.getElementById('ditherAlgorithm').value;
  const invertEnabled    = document.getElementById('invert').checked;
  const ignoreWhite      = document.getElementById('ignoreWhite').checked;
  const charset          = document.getElementById('charset').value;
  const edgeThreshold    = parseInt(document.getElementById('edgeThreshold').value, 10);

  let gradient;
  if (charset === 'manual') {
    const manualChar = document.getElementById('manualCharInput').value || '0';
    gradient = manualChar + ' ';
  } else {
    gradient = CHARSETS[charset] || CHARSETS.detailed;
  }

  return {
    asciiWidth,
    brightness,
    contrastValue,
    blurValue,
    ditheringEnabled,
    ditherAlgorithm,
    invertEnabled,
    ignoreWhite,
    charset,
    edgeThreshold,
    gradient,
    nLevels: gradient.length
  };
}

// ---- Shared pixel helper ----------------------------------------

function pixelsToGrayscale(data, settings) {
  const { brightness, contrastValue, invertEnabled } = settings;
  const contrastFactor = (259 * (contrastValue + 255)) / (255 * (259 - contrastValue));
  const total = data.length / 4;
  const gray = new Array(total);
  const grayOriginal = new Array(total);

  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    let lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (invertEnabled) lum = 255 - lum;
    const adjusted = clamp(contrastFactor * (lum - 128) + 128 + brightness, 0, 255);
    gray[j] = adjusted;
    grayOriginal[j] = adjusted;
  }
  return { gray, grayOriginal };
}

function drawImageToCanvas(img, settings) {
  const asciiHeight = Math.round((img.height / img.width) * settings.asciiWidth * FONT_ASPECT_RATIO);
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  canvas.width = settings.asciiWidth;
  canvas.height = asciiHeight;
  ctx.filter = settings.blurValue > 0 ? `blur(${settings.blurValue}px)` : 'none';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, settings.asciiWidth, asciiHeight);
  return { ctx, asciiHeight };
}

// ---- Simple char mapping ----------------------------------------

export function convertGrayscaleToAscii(gray, grayOriginal, settings) {
  const { asciiWidth, gradient, nLevels, ignoreWhite } = settings;
  const asciiHeight = gray.length / asciiWidth;
  let result = '';

  for (let y = 0; y < asciiHeight; y++) {
    let line = '';
    for (let x = 0; x < asciiWidth; x++) {
      const idx = y * asciiWidth + x;
      if (ignoreWhite && grayOriginal[idx] === 255) { line += ' '; continue; }
      const level = Math.round((gray[idx] / 255) * (nLevels - 1));
      line += gradient.charAt(level);
    }
    result += line + '\n';
  }
  return result;
}

// ---- Colorized output -------------------------------------------

export function generateColorizedAscii(img, settings) {
  const asciiHeight = Math.round((img.height / img.width) * settings.asciiWidth * FONT_ASPECT_RATIO);
  const offCanvas = document.createElement('canvas');
  const ctx = offCanvas.getContext('2d');
  offCanvas.width = settings.asciiWidth;
  offCanvas.height = asciiHeight;
  ctx.filter = settings.blurValue > 0 ? `blur(${settings.blurValue}px)` : 'none';
  ctx.clearRect(0, 0, offCanvas.width, offCanvas.height);
  ctx.drawImage(img, 0, 0, offCanvas.width, offCanvas.height);

  const { brightness, contrastValue, invertEnabled } = settings;
  const contrastFactor = (259 * (contrastValue + 255)) / (255 * (259 - contrastValue));
  const data = ctx.getImageData(0, 0, offCanvas.width, offCanvas.height).data;
  const grayscale = [];
  const colors = [];

  for (let i = 0; i < data.length; i += 4) {
    let r = clamp(contrastFactor * (data[i]     - 128) + 128 + brightness, 0, 255);
    let g = clamp(contrastFactor * (data[i + 1] - 128) + 128 + brightness, 0, 255);
    let b = clamp(contrastFactor * (data[i + 2] - 128) + 128 + brightness, 0, 255);
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    grayscale.push(invertEnabled ? 255 - lum : lum);
    colors.push(`rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`);
  }

  const { asciiWidth, gradient, nLevels, ignoreWhite } = settings;
  let result = '';

  for (let y = 0; y < asciiHeight; y++) {
    let line = '';
    for (let x = 0; x < asciiWidth; x++) {
      const idx = y * asciiWidth + x;
      if (ignoreWhite && grayscale[idx] >= 250) { line += ' '; continue; }
      const level = Math.round((grayscale[idx] / 255) * (nLevels - 1));
      line += `<span style="color:${colors[idx]};">${gradient.charAt(level)}</span>`;
    }
    result += line + '\n';
  }
  return result;
}

// ---- Contour (DoG + Sobel) mode ---------------------------------

export function generateContourASCII(img, dogThreshold) {
  if (!img) { displayError('No image available to process'); return ''; }
  if (getIsProcessing()) return '';
  setIsProcessing(true);
  showLoadingIndicator();

  setTimeout(() => {
    try {
      const settings  = getSettingsFromUI();
      const threshold = dogThreshold ?? parseInt(document.getElementById('dogEdgeThreshold').value, 10);
      const { ctx, asciiHeight } = drawImageToCanvas(img, settings);
      const { brightness, contrastValue, invertEnabled } = settings;
      const contrastFactor = (259 * (contrastValue + 255)) / (255 * (259 - contrastValue));
      const data = ctx.getImageData(0, 0, settings.asciiWidth, asciiHeight).data;

      const gray2d = [];
      for (let y = 0; y < asciiHeight; y++) {
        gray2d[y] = [];
        for (let x = 0; x < settings.asciiWidth; x++) {
          const idx = (y * settings.asciiWidth + x) * 4;
          let lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          if (invertEnabled) lum = 255 - lum;
          gray2d[y][x] = clamp(contrastFactor * (lum - 128) + 128 + brightness, 0, 255);
        }
      }

      const dog = differenceOfGaussians2D(gray2d, 0.5, 1.0, 3);
      const { mag, angle } = applySobel2D(dog, settings.asciiWidth, asciiHeight);
      const suppressed = nonMaxSuppression(mag, angle, settings.asciiWidth, asciiHeight);

      let ascii = '';
      for (let y = 0; y < asciiHeight; y++) {
        let line = '';
        for (let x = 0; x < settings.asciiWidth; x++) {
          if (suppressed[y][x] > threshold) {
            const a = (angle[y][x] + 90) % 180;
            line += a < 22.5 || a >= 157.5 ? '-' : a < 67.5 ? '/' : a < 112.5 ? '|' : '\\';
          } else {
            line += ' ';
          }
        }
        ascii += line + '\n';
      }

      document.getElementById('ascii-art').textContent = ascii;
      return ascii;
    } catch (err) {
      console.error('Error generating contour ASCII:', err);
      displayError('Error generating contour ASCII: ' + err.message);
      return '';
    } finally {
      hideLoadingIndicator();
      setIsProcessing(false);
    }
  }, 50);

  return '';
}

// ---- Standard (non-DoG) generator ------------------------------

export function generateASCII(img) {
  if (!img) { displayError('No image available to process'); return; }
  if (getIsProcessing()) return;
  setIsProcessing(true);
  showLoadingIndicator();

  setTimeout(() => {
    try {
      const edgeMethod = document.querySelector('input[name="edgeMethod"]:checked').value;
      if (edgeMethod === 'dog') { generateContourASCII(img); return; }

      const settings = getSettingsFromUI();
      setLastSettings(settings);

      const { ctx, asciiHeight } = drawImageToCanvas(img, settings);
      const imageData = ctx.getImageData(0, 0, settings.asciiWidth, asciiHeight);
      let { gray, grayOriginal } = pixelsToGrayscale(imageData.data, settings);

      let ascii;
      if (edgeMethod === 'sobel') {
        gray  = applyEdgeDetection(gray, settings.asciiWidth, asciiHeight, settings.edgeThreshold);
        ascii = convertGrayscaleToAscii(gray, grayOriginal, settings);
      } else if (settings.ditheringEnabled) {
        ascii = applyDithering(gray, grayOriginal, settings);
      } else {
        ascii = convertGrayscaleToAscii(gray, grayOriginal, settings);
      }

      document.getElementById('ascii-art').textContent = ascii;
    } catch (err) {
      console.error('Error generating ASCII art:', err);
      displayError('Error generating ASCII art: ' + err.message);
    } finally {
      hideLoadingIndicator();
      setIsProcessing(false);
    }
  }, 50);
}

// ---- Top-level dispatcher ---------------------------------------

export function generateAscii(img, settings) {
  if (!img) throw new Error('No image provided');

  const colorized  = document.getElementById('colorized')?.checked || false;
  if (colorized) return generateColorizedAscii(img, settings);

  const edgeMethod = document.querySelector('input[name="edgeMethod"]:checked').value;

  if (edgeMethod === 'dog') {
    const dogThreshold = parseInt(document.getElementById('dogEdgeThreshold').value, 10);
    return generateContourASCII(img, dogThreshold);
  }

  const offCanvas = document.createElement('canvas');
  const ctx = offCanvas.getContext('2d');
  const asciiHeight = Math.round((img.height / img.width) * settings.asciiWidth * FONT_ASPECT_RATIO);
  offCanvas.width = settings.asciiWidth;
  offCanvas.height = asciiHeight;
  ctx.filter = settings.blurValue > 0 ? `blur(${settings.blurValue}px)` : 'none';
  ctx.clearRect(0, 0, offCanvas.width, offCanvas.height);
  ctx.drawImage(img, 0, 0, offCanvas.width, offCanvas.height);

  const imageData = ctx.getImageData(0, 0, offCanvas.width, offCanvas.height);
  let { gray, grayOriginal } = pixelsToGrayscale(imageData.data, settings);

  if (edgeMethod === 'sobel') {
    gray = applyEdgeDetection(gray, settings.asciiWidth, asciiHeight, settings.edgeThreshold);
    return convertGrayscaleToAscii(gray, grayOriginal, settings);
  }

  if (settings.ditheringEnabled) return applyDithering(gray, grayOriginal, settings);
  return convertGrayscaleToAscii(gray, grayOriginal, settings);
}

// ---- Full-pipeline entry point for UI ---------------------------

export function generateWithCurrentSettings() {
  const img = getCurrentImage();
  if (!img) { displayError('Please upload an image first.'); return; }

  showLoadingIndicator();
  const settings = getSettingsFromUI();

  setTimeout(() => {
    try {
      const colorized = document.getElementById('colorized')?.checked || false;
      const result    = generateAscii(img, settings);

      // generateContourASCII is async (setTimeout-based) and updates the DOM itself.
      // For all other modes result is a string — update DOM here.
      if (typeof result !== 'string') return;

      const asciiArt      = document.getElementById('ascii-art');
      const sideBySide    = document.getElementById('sideBySideAscii');

      if (colorized) {
        asciiArt.innerHTML   = result;
        sideBySide.innerHTML = result;
        asciiArt.classList.add('color-ascii');
        sideBySide.classList.add('color-ascii');
        asciiArt.style.backgroundColor = document.getElementById('bgColor').value;
        sideBySide.style.backgroundColor = document.getElementById('bgColor').value;
      } else {
        asciiArt.textContent   = result;
        sideBySide.textContent = result;
        asciiArt.classList.remove('color-ascii');
        sideBySide.classList.remove('color-ascii');

        const textColor = document.getElementById('textColor')?.value;
        const bgColor   = document.getElementById('bgColor')?.value;
        document.querySelectorAll('.ascii-output').forEach(el => {
          el.style.color           = textColor || '';
          el.style.backgroundColor = bgColor   || '';
        });
      }

      // Dynamic import to avoid circular deps (history → presets ← asciiGenerator)
      import('./history.js').then(({ addToHistory }) => addToHistory(result, settings));

      hideLoadingIndicator();
    } catch (err) {
      console.error('Error generating ASCII art:', err);
      displayError('Error generating ASCII art: ' + err.message);
      hideLoadingIndicator();
    }
  }, 50);
}
