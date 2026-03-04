// ============================================================
// dithering.js — Dithering algorithm implementations
// ============================================================

import { clamp } from './utils.js';

// ---- Dispatcher -------------------------------------------------

export function applyDithering(gray, grayOriginal, settings) {
  const { ditherAlgorithm } = settings;
  const ditheredGray = [...gray];
  switch (ditherAlgorithm) {
    case 'floyd':   return floydSteinbergDithering(ditheredGray, grayOriginal, settings);
    case 'atkinson': return atkinsonDithering(ditheredGray, grayOriginal, settings);
    case 'noise':   return noiseDithering(ditheredGray, grayOriginal, settings);
    case 'ordered': return orderedDithering(ditheredGray, grayOriginal, settings);
    default:        return floydSteinbergDithering(ditheredGray, grayOriginal, settings);
  }
}

// ---- Floyd–Steinberg --------------------------------------------

function floydSteinbergDithering(gray, grayOriginal, settings) {
  const { asciiWidth, gradient, nLevels, ignoreWhite } = settings;
  const asciiHeight = gray.length / asciiWidth;
  let result = '';
  const ditheredGray = [...gray];

  for (let y = 0; y < asciiHeight; y++) {
    let line = '';
    for (let x = 0; x < asciiWidth; x++) {
      const idx = y * asciiWidth + x;
      const oldPixel = ditheredGray[idx];

      if (ignoreWhite && grayOriginal[idx] === 255) { line += ' '; continue; }

      const computedLevel = Math.round((oldPixel / 255) * (nLevels - 1));
      line += gradient.charAt(computedLevel);

      const newPixel = Math.round((computedLevel / (nLevels - 1)) * 255);
      const error = oldPixel - newPixel;

      if (x + 1 < asciiWidth)                      ditheredGray[idx + 1]              += error * 7 / 16;
      if (y + 1 < asciiHeight) {
        if (x > 0)                                  ditheredGray[idx + asciiWidth - 1] += error * 3 / 16;
                                                    ditheredGray[idx + asciiWidth]     += error * 5 / 16;
        if (x + 1 < asciiWidth)                     ditheredGray[idx + asciiWidth + 1] += error * 1 / 16;
      }
    }
    result += line + '\n';
  }
  return result;
}

// ---- Atkinson ---------------------------------------------------

function atkinsonDithering(gray, grayOriginal, settings) {
  const { asciiWidth, gradient, nLevels, ignoreWhite } = settings;
  const asciiHeight = gray.length / asciiWidth;
  let result = '';
  const ditheredGray = [...gray];

  for (let y = 0; y < asciiHeight; y++) {
    let line = '';
    for (let x = 0; x < asciiWidth; x++) {
      const idx = y * asciiWidth + x;
      const oldPixel = ditheredGray[idx];

      if (ignoreWhite && grayOriginal[idx] === 255) { line += ' '; continue; }

      const computedLevel = Math.round((oldPixel / 255) * (nLevels - 1));
      line += gradient.charAt(computedLevel);

      const newPixel = Math.round((computedLevel / (nLevels - 1)) * 255);
      const error = Math.floor((oldPixel - newPixel) / 8);

      if (x + 1 < asciiWidth)                      ditheredGray[idx + 1]                  += error;
      if (x + 2 < asciiWidth)                      ditheredGray[idx + 2]                  += error;
      if (y + 1 < asciiHeight) {
        if (x - 1 >= 0)                            ditheredGray[idx + asciiWidth - 1]     += error;
                                                   ditheredGray[idx + asciiWidth]          += error;
        if (x + 1 < asciiWidth)                    ditheredGray[idx + asciiWidth + 1]     += error;
      }
      if (y + 2 < asciiHeight)                     ditheredGray[idx + 2 * asciiWidth]     += error;
    }
    result += line + '\n';
  }
  return result;
}

// ---- Ordered (Bayer 4×4) ----------------------------------------

function orderedDithering(gray, grayOriginal, settings) {
  const { asciiWidth, gradient, nLevels, ignoreWhite } = settings;
  const asciiHeight = gray.length / asciiWidth;
  let result = '';

  const bayerMatrix = [
    [ 0,  8,  2, 10],
    [12,  4, 14,  6],
    [ 3, 11,  1,  9],
    [15,  7, 13,  5]
  ];
  const thresholdScale = 16;

  for (let y = 0; y < asciiHeight; y++) {
    let line = '';
    for (let x = 0; x < asciiWidth; x++) {
      const idx = y * asciiWidth + x;

      if (ignoreWhite && grayOriginal[idx] === 255) { line += ' '; continue; }

      const threshold = (bayerMatrix[y % 4][x % 4] / thresholdScale) * 255;
      const limited = clamp(gray[idx] + threshold - 128, 0, 255);
      const computedLevel = Math.round((limited / 255) * (nLevels - 1));
      line += gradient.charAt(computedLevel);
    }
    result += line + '\n';
  }
  return result;
}

// ---- Noise ------------------------------------------------------

function noiseDithering(gray, grayOriginal, settings) {
  const { asciiWidth, gradient, nLevels, ignoreWhite } = settings;
  const asciiHeight = gray.length / asciiWidth;
  const noiseRange = 40;
  let result = '';

  for (let y = 0; y < asciiHeight; y++) {
    let line = '';
    for (let x = 0; x < asciiWidth; x++) {
      const idx = y * asciiWidth + x;

      if (ignoreWhite && grayOriginal[idx] === 255) { line += ' '; continue; }

      const noise = (Math.random() - 0.5) * noiseRange;
      const pixelValue = clamp(gray[idx] + noise, 0, 255);
      const computedLevel = Math.round((pixelValue / 255) * (nLevels - 1));
      line += gradient.charAt(computedLevel);
    }
    result += line + '\n';
  }
  return result;
}
