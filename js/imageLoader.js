// ============================================================
// imageLoader.js — File upload, URL loading, sample gallery
// ============================================================

import { SAMPLE_IMAGES } from './config.js';
import {
  setCurrentImage,
  setOriginalImageDataUrl
} from './state.js';
import { showLoadingIndicator, hideLoadingIndicator, displayError } from './ui.js';
import { generateWithCurrentSettings } from './asciiGenerator.js';

// ---- URL loading ------------------------------------------------

export function loadImageFromURL(url) {
  showLoadingIndicator();
  const img = new Image();
  img.crossOrigin = 'Anonymous';

  img.onload = () => {
    setCurrentImage(img);
    setOriginalImageDataUrl(url);
    document.getElementById('originalImage').src = url;
    document.getElementById('sideBySideOriginal').src = url;
    generateWithCurrentSettings();
    hideLoadingIndicator();
  };

  img.onerror = () => {
    console.error('Failed to load image from URL:', url);
    displayError('Failed to load the image. Please try another URL or upload your own image.');
    hideLoadingIndicator();
    loadDefaultImage();
  };

  img.src = url;
}

// ---- Default / sample images ------------------------------------

export function loadDefaultImage() {
  if (SAMPLE_IMAGES && SAMPLE_IMAGES.length > 0) {
    loadSampleImage(0);
    return;
  }

  const placeholderUrl = 'https://via.placeholder.com/500x300/333/fff?text=Upload+an+image';
  const img = new Image();

  img.onload = () => {
    setCurrentImage(img);
    const canvas = document.createElement('canvas');
    canvas.width  = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setOriginalImageDataUrl(dataUrl);
    document.getElementById('originalImage').src = dataUrl;
    document.getElementById('sideBySideOriginal').src = dataUrl;
    generateWithCurrentSettings();
  };

  img.onerror = () => {
    console.error('Failed to load placeholder image');
    displayError('Failed to load a default image. Please upload your own image.');
  };

  img.src = placeholderUrl;
}

export function loadSampleImage(index) {
  if (!SAMPLE_IMAGES || index >= SAMPLE_IMAGES.length) {
    console.error('Sample image not available');
    return;
  }

  showLoadingIndicator();
  const sample = SAMPLE_IMAGES[index];
  const img    = new Image();
  img.crossOrigin = 'Anonymous';

  img.onload = () => {
    setCurrentImage(img);
    setOriginalImageDataUrl(sample.url);
    document.getElementById('originalImage').src = sample.url;
    document.getElementById('sideBySideOriginal').src = sample.url;

    const fileNameEl = document.getElementById('currentFileName');
    if (fileNameEl) fileNameEl.textContent = sample.name;

    generateWithCurrentSettings();
    hideLoadingIndicator();
  };

  img.onerror = () => {
    console.error('Failed to load sample image:', sample.url);
    displayError('Failed to load the sample image. Please try another one or upload your own.');
    hideLoadingIndicator();
  };

  img.src = sample.url;
}

// ---- Sample gallery setup ---------------------------------------

export function setupSampleImages() {
  const container = document.querySelector('.sample-thumbnails');
  if (!container) return;
  container.innerHTML = '';

  SAMPLE_IMAGES.forEach((sample, index) => {
    const thumb = document.createElement('img');
    thumb.src       = sample.url;
    thumb.alt       = sample.name;
    thumb.title     = sample.name;
    thumb.className = 'sample-thumbnail';
    thumb.addEventListener('click', () => loadSampleImage(index));
    container.appendChild(thumb);
  });
}

// ---- File upload handler ----------------------------------------

function processSelectedFile(file, fileNameElement) {
  if (!file) return;

  if (!file.type || !file.type.startsWith('image/')) {
    displayError('Please select a valid image file.');
    return;
  }

  showLoadingIndicator();
  const reader = new FileReader();

  reader.onload = e => {
    const img = new Image();

    img.onload = () => {
      setCurrentImage(img);
      setOriginalImageDataUrl(e.target.result);
      document.getElementById('originalImage').src = e.target.result;
      document.getElementById('sideBySideOriginal').src = e.target.result;

      if (fileNameElement) fileNameElement.textContent = file.name;

      generateWithCurrentSettings();
      hideLoadingIndicator();
    };

    img.onerror = () => {
      displayError('The selected file is not a valid image.');
      hideLoadingIndicator();
    };

    img.src = e.target.result;
  };

  reader.onerror = () => {
    displayError('Failed to read the selected file.');
    hideLoadingIndicator();
  };

  reader.readAsDataURL(file);
}

export function handleFileUpload(event) {
  const file = event?.target?.files?.[0] || event?.dataTransfer?.files?.[0] || null;
  if (!file) return;

  const fileNameEl = document.getElementById('currentFileName');
  processSelectedFile(file, fileNameEl);

  if (event?.target && 'value' in event.target) {
    event.target.value = '';
  }
}

// ---- Drag-and-drop setup ----------------------------------------

export function setupDragAndDrop() {
  const dropZone  = document.getElementById('dropZone');
  const fileInput = document.getElementById('upload');
  if (!dropZone || !fileInput) return;

  dropZone.addEventListener('click', e => {
    if (e.target === fileInput) return;
    fileInput.click();
  });
  fileInput.addEventListener('click', e => e.stopPropagation());

  const prevent = e => { e.preventDefault(); e.stopPropagation(); };
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev => dropZone.addEventListener(ev, prevent));

  ['dragenter', 'dragover'].forEach(ev =>
    dropZone.addEventListener(ev, () => dropZone.classList.add('dragover')));

  ['dragleave', 'drop'].forEach(ev =>
    dropZone.addEventListener(ev, () => dropZone.classList.remove('dragover')));

  dropZone.addEventListener('drop', e => {
    const files = e.dataTransfer.files;
    if (files?.length > 0) {
      handleFileUpload({ dataTransfer: { files } });
    }
  });
}
