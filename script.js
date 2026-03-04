// =============== ASCII Art Generator ===============
// This application converts images to ASCII art with various customization options
// including dithering, edge detection, different character sets, and more advanced features.

// ---------------- Global Variables ----------------
let currentImage = null;
const baseFontSize = 7; // Base font size for ASCII art
let isProcessing = false; // Flag to prevent simultaneous processing
let lastSettings = {}; // Store last used settings
let historyItems = []; // Store history of generated ASCII art
let originalImageDataUrl = null; // Original image data URL for sharing

// Configuration defaults
const CONFIG = {
  asciiWidth: 150,
  brightness: 0,
  contrast: 0,
  blur: 0,
  invert: false,
  ignoreWhite: true,
  dithering: true,
  ditherAlgorithm: 'floyd',
  charset: 'detailed',
  edgeMethod: 'none',
  edgeThreshold: 100,
  dogEdgeThreshold: 100,
  zoom: 100,
  theme: 'dark',
  fontFamily: 'monospace',
  colorized: false,
  bgColor: '#000000',
  textColor: '#ffffff'
};

// Character sets
const CHARSETS = {
  standard: "@%#*+=-:.",
  blocks: "█▓▒░ ",
  binary: "01",
  hex: "0123456789ABCDEF",
  detailed: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'."
};

// Preset configurations
const PRESETS = {
  default: {
    asciiWidth: 150,
    brightness: 0,
    contrast: 0,
    blur: 0,
    dithering: true,
    ditherAlgorithm: 'floyd',
    charset: 'detailed',
    edgeMethod: 'none'
  },
  sketch: {
    asciiWidth: 120,
    brightness: 10,
    contrast: 20,
    blur: 0,
    dithering: false,
    edgeMethod: 'sobel',
    edgeThreshold: 80,
    charset: 'standard'
  },
  minimalist: {
    asciiWidth: 80,
    brightness: 0,
    contrast: 30,
    blur: 0.5,
    dithering: true,
    ditherAlgorithm: 'atkinson',
    charset: 'blocks',
    edgeMethod: 'none'
  },
  detailed: {
    asciiWidth: 180,
    brightness: 5,
    contrast: 15,
    blur: 0,
    dithering: true,
    ditherAlgorithm: 'floyd',
    charset: 'detailed',
    edgeMethod: 'none'
  },
  blocky: {
    asciiWidth: 100,
    brightness: 0,
    contrast: 10,
    blur: 0.5,
    dithering: true,
    ditherAlgorithm: 'ordered',
    charset: 'blocks',
    edgeMethod: 'none'
  }
};

// Keyboard shortcuts
const KEYBOARD_SHORTCUTS = {
  'c': () => document.getElementById('copyBtn').click(),
  's': () => document.getElementById('downloadBtn').click(),
  'r': () => document.getElementById('reset').click(),
  'h': () => new bootstrap.Modal(document.getElementById('helpModal')).show(),
  '+': () => incrementZoom(10),
  '-': () => incrementZoom(-10),
  '1': () => document.querySelector('.upload-group').scrollIntoView({ behavior: 'smooth' }),
  '2': () => document.querySelector('.image-processing').scrollIntoView({ behavior: 'smooth' }),
  '3': () => document.querySelector('.dithering-settings').scrollIntoView({ behavior: 'smooth' }),
  '4': () => document.querySelector('.charset-settings').scrollIntoView({ behavior: 'smooth' }),
  '5': () => document.querySelector('.edge-detection-settings').scrollIntoView({ behavior: 'smooth' }),
  '6': () => document.querySelector('.display-settings').scrollIntoView({ behavior: 'smooth' })
};

// ---------------- Helper Functions ----------------

// Clamp a value between min and max.
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Debounce function to limit how often a function can be called
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Toggle sidebar collapse state for responsive design
function toggleSidebarCollapse() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('collapsed');
    document.querySelector('.main-content').classList.toggle('expanded');
  }
}

// Toggle sidebar for mobile view
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('show');
  }
}

// Increment zoom value and update display
function incrementZoom(amount) {
  const zoomSlider = document.getElementById('zoom');
  if (zoomSlider) {
    const newZoom = parseInt(zoomSlider.value, 10) + amount;
    zoomSlider.value = clamp(newZoom, parseInt(zoomSlider.min, 10), parseInt(zoomSlider.max, 10));
    updateAsciiZoom();
    
    // Update the value label
    const zoomLabel = document.getElementById('zoomVal');
    if (zoomLabel) {
      zoomLabel.textContent = zoomSlider.value;
    }
  }
}

// Update ASCII art zoom based on slider
function updateAsciiZoom() {
  const zoom = document.getElementById('zoom').value;
  const fontFamily = document.getElementById('fontFamily').value;
  
  document.querySelectorAll('.ascii-output').forEach(el => {
    el.style.fontSize = `${zoom / 100 * baseFontSize}px`;
    el.style.fontFamily = fontFamily;
  });
}

// Add current ASCII art to history panel
function addToHistory(asciiArt, settings) {
  // Limit history to 10 items
  if (historyItems.length >= 10) {
    historyItems.shift();
  }
  
  // Create timestamp for the history item
  const timestamp = new Date();
  
  // Add to history array
  historyItems.push({
    asciiArt,
    settings: {...settings},
    timestamp
  });
  
  // Update the history panel in the UI
  updateHistoryPanel();
}

// Update history panel with stored history items
function updateHistoryPanel() {
  const historyContainer = document.getElementById('historyItems');
  if (!historyContainer) return;
  
  // Clear container
  historyContainer.innerHTML = '';
  
  // Add each history item
  historyItems.forEach((item, index) => {
    const historyItem = document.createElement('div');
    historyItem.className = 'col-md-4 col-sm-6 history-item';
    historyItem.innerHTML = `
      <div class="history-thumbnail">
        <pre>${item.asciiArt.split('\n').slice(0, 30).join('\n')}</pre>
      </div>
      <div class="history-timestamp">
        ${item.timestamp.toLocaleTimeString()}
      </div>
    `;
    
    // Add click event to restore this history item
    historyItem.addEventListener('click', () => {
      restoreFromHistory(index);
    });
    
    historyContainer.appendChild(historyItem);
  });
  
  // If no history items, show a message
  if (historyItems.length === 0) {
    historyContainer.innerHTML = '<div class="col-12 text-center text-muted">No history items yet</div>';
  }
}

// Restore settings and ASCII art from history
function restoreFromHistory(index) {
  if (index < 0 || index >= historyItems.length) return;
  
  const item = historyItems[index];
  
  // Apply the settings
  applySettings(item.settings);
  
  // Update the ASCII art display
  document.getElementById('ascii-art').textContent = item.asciiArt;
  document.getElementById('sideBySideAscii').textContent = item.asciiArt;
}

// Update preset dropdown with saved presets
function updatePresetDropdown() {
  const presetDropdown = document.getElementById('presets');
  if (!presetDropdown) return;
  
  // Get saved presets from localStorage
  const savedPresets = getSavedPresets();
  
  // Add saved presets to dropdown
  for (const name in savedPresets) {
    // Check if the option already exists
    if (!presetDropdown.querySelector(`option[value="${name}"]`)) {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      presetDropdown.appendChild(option);
    }
  }
}

// Get saved presets from localStorage
function getSavedPresets() {
  const presetsJson = localStorage.getItem('ascii_presets');
  return presetsJson ? JSON.parse(presetsJson) : {};
}

// Apply settings from URL parameters
function applySettingsFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  
  // If no parameters, return
  if (urlParams.toString() === '') return;
  
  // For each possible setting, check URL and apply if present
  if (urlParams.has('width')) {
    const width = parseInt(urlParams.get('width'), 10);
    document.getElementById('asciiWidth').value = clamp(width, 20, 300);
  }
  
  if (urlParams.has('brightness')) {
    const brightness = parseInt(urlParams.get('brightness'), 10);
    document.getElementById('brightness').value = clamp(brightness, -100, 100);
  }
  
  if (urlParams.has('contrast')) {
    const contrast = parseInt(urlParams.get('contrast'), 10);
    document.getElementById('contrast').value = clamp(contrast, -100, 100);
  }
  
  if (urlParams.has('blur')) {
    const blur = parseFloat(urlParams.get('blur'));
    document.getElementById('blur').value = clamp(blur, 0, 10);
  }
  
  if (urlParams.has('dithering')) {
    document.getElementById('dithering').checked = urlParams.get('dithering') === 'true';
  }
  
  if (urlParams.has('ditherAlgorithm')) {
    const algorithm = urlParams.get('ditherAlgorithm');
    const select = document.getElementById('ditherAlgorithm');
    if (Array.from(select.options).some(option => option.value === algorithm)) {
      select.value = algorithm;
    }
  }
  
  if (urlParams.has('invert')) {
    document.getElementById('invert').checked = urlParams.get('invert') === 'true';
  }
  
  if (urlParams.has('ignoreWhite')) {
    document.getElementById('ignoreWhite').checked = urlParams.get('ignoreWhite') === 'true';
  }
  
  if (urlParams.has('charset')) {
    const charset = urlParams.get('charset');
    const select = document.getElementById('charset');
    if (Array.from(select.options).some(option => option.value === charset)) {
      select.value = charset;
    }
  }
  
  if (urlParams.has('edgeMethod')) {
    const method = urlParams.get('edgeMethod');
    const radio = document.querySelector(`input[name="edgeMethod"][value="${method}"]`);
    if (radio) {
      radio.checked = true;
      
      // Show/hide threshold controls
      document.getElementById('sobelThresholdControl').style.display = (method === 'sobel') ? 'flex' : 'none';
      document.getElementById('dogThresholdControl').style.display = (method === 'dog') ? 'flex' : 'none';
    }
  }
  
  if (urlParams.has('edgeThreshold')) {
    const threshold = parseInt(urlParams.get('edgeThreshold'), 10);
    document.getElementById('edgeThreshold').value = clamp(threshold, 0, 255);
  }
  
  if (urlParams.has('dogEdgeThreshold')) {
    const threshold = parseInt(urlParams.get('dogEdgeThreshold'), 10);
    document.getElementById('dogEdgeThreshold').value = clamp(threshold, 0, 255);
  }
  
  if (urlParams.has('zoom')) {
    const zoom = parseInt(urlParams.get('zoom'), 10);
    document.getElementById('zoom').value = clamp(zoom, 20, 600);
  }
  
  if (urlParams.has('fontFamily')) {
    const fontFamily = urlParams.get('fontFamily');
    const select = document.getElementById('fontFamily');
    if (Array.from(select.options).some(option => option.value === fontFamily)) {
      select.value = fontFamily;
    }
  }
  
  // Update value labels and displays
  updateUIValues();
  
  // If URL includes an image parameter, try to load that image
  if (urlParams.has('image')) {
    const imageUrl = urlParams.get('image');
    loadImageFromURL(imageUrl);
  }
}

// Load image from a URL
function loadImageFromURL(url) {
  showLoadingIndicator();
  
  const img = new Image();
  img.crossOrigin = "Anonymous";
  
  img.onload = function() {
    currentImage = img;
    originalImageDataUrl = url;
    
    document.getElementById('originalImage').src = url;
    document.getElementById('sideBySideOriginal').src = url;
    
    generateWithCurrentSettings();
    hideLoadingIndicator();
  };
  
  img.onerror = function() {
    console.error("Failed to load image from URL:", url);
    displayError("Failed to load the image. Please try another URL or upload your own image.");
    hideLoadingIndicator();
    
    // Load default image instead
    loadDefaultImage();
  };
  
  img.src = url;
}

// Apply preset settings
function applyPreset(presetName) {
  // First look in built-in presets
  let preset = PRESETS[presetName];
  
  // If not found, look in saved presets
  if (!preset) {
    const savedPresets = getSavedPresets();
    preset = savedPresets[presetName];
  }
  
  // If still not found, return
  if (!preset) return;
  
  // Apply settings from preset
  applySettings(preset);
  
  // Generate new ASCII art if an image is loaded
  if (currentImage) {
    generateWithCurrentSettings();
  }
}

// Apply settings from an object
function applySettings(settings) {
  // For each setting, apply to the UI if present
  if (settings.asciiWidth !== undefined) {
    document.getElementById('asciiWidth').value = settings.asciiWidth;
  }
  
  if (settings.brightness !== undefined) {
    document.getElementById('brightness').value = settings.brightness;
  }
  
  if (settings.contrastValue !== undefined) {
    document.getElementById('contrast').value = settings.contrastValue;
  }
  
  if (settings.blurValue !== undefined) {
    document.getElementById('blur').value = settings.blurValue;
  }
  
  if (settings.ditheringEnabled !== undefined) {
    document.getElementById('dithering').checked = settings.ditheringEnabled;
  }
  
  if (settings.ditherAlgorithm !== undefined) {
    document.getElementById('ditherAlgorithm').value = settings.ditherAlgorithm;
  }
  
  if (settings.invertEnabled !== undefined) {
    document.getElementById('invert').checked = settings.invertEnabled;
  }
  
  if (settings.ignoreWhite !== undefined) {
    document.getElementById('ignoreWhite').checked = settings.ignoreWhite;
  }
  
  if (settings.charset !== undefined) {
    document.getElementById('charset').value = settings.charset;
  }
  
  if (settings.edgeMethod !== undefined) {
    const radio = document.querySelector(`input[name="edgeMethod"][value="${settings.edgeMethod}"]`);
    if (radio) {
      radio.checked = true;
      
      // Show/hide threshold controls
      document.getElementById('sobelThresholdControl').style.display = (settings.edgeMethod === 'sobel') ? 'flex' : 'none';
      document.getElementById('dogThresholdControl').style.display = (settings.edgeMethod === 'dog') ? 'flex' : 'none';
    }
  }
  
  if (settings.edgeThreshold !== undefined) {
    document.getElementById('edgeThreshold').value = settings.edgeThreshold;
  }
  
  if (settings.dogEdgeThreshold !== undefined) {
    document.getElementById('dogEdgeThreshold').value = settings.dogEdgeThreshold;
  }
  
  // Update UI values
  updateUIValues();
}

// Save current settings as a preset
function saveCurrentSettingsAsPreset(name) {
  // Get current settings
  const settings = {
    asciiWidth: parseInt(document.getElementById('asciiWidth').value, 10),
    brightness: parseFloat(document.getElementById('brightness').value),
    contrastValue: parseFloat(document.getElementById('contrast').value),
    blurValue: parseFloat(document.getElementById('blur').value),
    ditheringEnabled: document.getElementById('dithering').checked,
    ditherAlgorithm: document.getElementById('ditherAlgorithm').value,
    invertEnabled: document.getElementById('invert').checked,
    ignoreWhite: document.getElementById('ignoreWhite').checked,
    charset: document.getElementById('charset').value,
    edgeMethod: document.querySelector('input[name="edgeMethod"]:checked').value,
    edgeThreshold: parseInt(document.getElementById('edgeThreshold').value, 10),
    dogEdgeThreshold: parseInt(document.getElementById('dogEdgeThreshold').value, 10)
  };
  
  // Get existing presets
  const savedPresets = getSavedPresets();
  
  // Add new preset
  savedPresets[name] = settings;
  
  // Save to localStorage
  localStorage.setItem('ascii_presets', JSON.stringify(savedPresets));
  
  // Update dropdown
  updatePresetDropdown();
  
  // Show confirmation message
  alert(`Preset "${name}" has been saved.`);
}

// Generate shareable URL with current settings
function generateShareableURL() {
  const params = new URLSearchParams();
  
  // Add image URL if available
  if (originalImageDataUrl) {
    params.append('image', originalImageDataUrl);
  }
  
  // Add all settings
  params.append('width', document.getElementById('asciiWidth').value);
  params.append('brightness', document.getElementById('brightness').value);
  params.append('contrast', document.getElementById('contrast').value);
  params.append('blur', document.getElementById('blur').value);
  params.append('dithering', document.getElementById('dithering').checked);
  params.append('ditherAlgorithm', document.getElementById('ditherAlgorithm').value);
  params.append('invert', document.getElementById('invert').checked);
  params.append('ignoreWhite', document.getElementById('ignoreWhite').checked);
  params.append('charset', document.getElementById('charset').value);
  params.append('edgeMethod', document.querySelector('input[name="edgeMethod"]:checked').value);
  params.append('edgeThreshold', document.getElementById('edgeThreshold').value);
  params.append('dogEdgeThreshold', document.getElementById('dogEdgeThreshold').value);
  params.append('zoom', document.getElementById('zoom').value);
  params.append('fontFamily', document.getElementById('fontFamily').value);
  
  // Create and return full URL
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

// Setup drag and drop functionality
function setupDragAndDrop() {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('upload');
  
  if (!dropZone || !fileInput) return;
  
  // Show file input when clicking on drop zone
  dropZone.addEventListener('click', () => {
    fileInput.click();
  });
  
  // Handle drag events
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  // Highlight drop zone when file is dragged over
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.add('dragover');
    });
  });
  
  // Remove highlight when file is dragged out
  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.remove('dragover');
    });
  });
  
  // Handle dropped files
  dropZone.addEventListener('drop', e => {
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      fileInput.files = files;
      
      // Trigger change event to process the file
      const event = new Event('change');
      fileInput.dispatchEvent(event);
    }
  });
}

// Download ASCII art as SVG
function downloadSvg() {
  try {
    const preElement = document.getElementById('ascii-art');
    const asciiText = preElement.textContent;
    
    if (!asciiText.trim()) {
      alert("No ASCII art to download.");
      return;
    }
    
    // Parse ASCII art
    const lines = asciiText.split("\n");
    
    // SVG dimensions
    const fontSize = 8;
    const lineHeight = fontSize * 1.2;
    const charWidth = fontSize * 0.6;
    
    // Calculate width and height
    let maxLineLength = 0;
    lines.forEach(line => {
      maxLineLength = Math.max(maxLineLength, line.length);
    });
    
    const width = maxLineLength * charWidth + 40; // Add margin
    const height = lines.length * lineHeight + 40; // Add margin
    
    // Create SVG content
    let svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${document.body.classList.contains('light-mode') ? '#ffffff' : '#000000'}"/>
  <text x="20" y="20" font-family="monospace" font-size="${fontSize}px" fill="${document.body.classList.contains('light-mode') ? '#000000' : '#ffffff'}">`;
    
    // Add each line with a tspan
    lines.forEach((line, i) => {
      if (line.trim()) {
        svgContent += `
    <tspan x="20" dy="${i === 0 ? 0 : lineHeight}">${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</tspan>`;
      } else {
        svgContent += `
    <tspan x="20" dy="${i === 0 ? 0 : lineHeight}"> </tspan>`;
      }
    });
    
    // Close SVG tags
    svgContent += `
  </text>
</svg>`;
    
    // Create download link
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'ascii_art.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading SVG:", error);
    alert("Failed to download: " + error.message);
  }
}

// Download ASCII art as TXT
function downloadTxt() {
  try {
    const preElement = document.getElementById('ascii-art');
    const asciiText = preElement.textContent;
    
    if (!asciiText.trim()) {
      alert("No ASCII art to download.");
      return;
    }
    
    // Create download link
    const blob = new Blob([asciiText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'ascii_art.txt';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading TXT:", error);
    alert("Failed to download: " + error.message);
  }
}

// Download ASCII art as HTML
function downloadHtml() {
  try {
    const preElement = document.getElementById('ascii-art');
    const asciiText = preElement.textContent;
    
    if (!asciiText.trim()) {
      alert("No ASCII art to download.");
      return;
    }
    
    // Create HTML content with styling
    const colorized = document.getElementById('colorized')?.checked || false;
    
    let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ASCII Art</title>
  <style>
    body {
      font-family: monospace;
      background-color: ${document.body.classList.contains('light-mode') ? '#ffffff' : '#000000'};
      color: ${document.body.classList.contains('light-mode') ? '#000000' : '#ffffff'};
      margin: 20px;
    }
    pre {
      white-space: pre;
      font-size: 10px;
      line-height: 1;
    }
  </style>
</head>
<body>
  <pre>${colorized ? preElement.innerHTML : asciiText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;
    
    // Create download link
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'ascii_art.html';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading HTML:", error);
    alert("Failed to download: " + error.message);
  }
}

// Generate a normalized 2D Gaussian kernel.
function gaussianKernel2D(sigma, kernelSize) {
  const kernel = [];
  const half = Math.floor(kernelSize / 2);
  let sum = 0;
  
  // Calculate kernel values using the Gaussian function
  for (let y = -half; y <= half; y++) {
    const row = [];
    for (let x = -half; x <= half; x++) {
      const value = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
      row.push(value);
      sum += value;
    }
    kernel.push(row);
  }
  
  // Normalize the kernel so sum of all values = 1
  for (let y = 0; y < kernelSize; y++) {
    for (let x = 0; x < kernelSize; x++) {
      kernel[y][x] /= sum;
    }
  }
  return kernel;
}

// Convolve a 2D image (array) with a 2D kernel.
function convolve2D(img, kernel) {
  const height = img.length,
        width = img[0].length;
  const kernelSize = kernel.length,
        half = Math.floor(kernelSize / 2);
  const output = [];
  for (let y = 0; y < height; y++) {
    output[y] = [];
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let ky = 0; ky < kernelSize; ky++) {
        for (let kx = 0; kx < kernelSize; kx++) {
          const yy = y + ky - half;
          const xx = x + kx - half;
          let pixel = (yy >= 0 && yy < height && xx >= 0 && xx < width) ? img[yy][xx] : 0;
          sum += pixel * kernel[ky][kx];
        }
      }
      output[y][x] = sum;
    }
  }
  return output;
}

// Compute the Difference of Gaussians on a 2D grayscale image.
function differenceOfGaussians2D(gray, sigma1, sigma2, kernelSize) {
  const kernel1 = gaussianKernel2D(sigma1, kernelSize);
  const kernel2 = gaussianKernel2D(sigma2, kernelSize);
  const blurred1 = convolve2D(gray, kernel1);
  const blurred2 = convolve2D(gray, kernel2);
  const height = gray.length,
        width = gray[0].length;
  const dog = [];
  for (let y = 0; y < height; y++) {
    dog[y] = [];
    for (let x = 0; x < width; x++) {
      dog[y][x] = blurred1[y][x] - blurred2[y][x];
    }
  }
  return dog;
}

// Apply the Sobel operator to a 2D image, returning gradient magnitude and angle arrays.
function applySobel2D(img, width, height) {
  const mag = [],
        angle = [];
  for (let y = 0; y < height; y++) {
    mag[y] = [];
    angle[y] = [];
    for (let x = 0; x < width; x++) {
      mag[y][x] = 0;
      angle[y][x] = 0;
    }
  }
  const kernelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
  const kernelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let Gx = 0, Gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixel = img[y + ky][x + kx];
          Gx += pixel * kernelX[ky + 1][kx + 1];
          Gy += pixel * kernelY[ky + 1][kx + 1];
        }
      }
      const g = Math.sqrt(Gx * Gx + Gy * Gy);
      mag[y][x] = g;
      let theta = Math.atan2(Gy, Gx) * (180 / Math.PI);
      if (theta < 0) theta += 180;
      angle[y][x] = theta;
    }
  }
  return { mag, angle };
}

// Non-maximum suppression to thin out the edges.
function nonMaxSuppression(mag, angle, width, height) {
  const suppressed = [];
  for (let y = 0; y < height; y++) {
    suppressed[y] = [];
    for (let x = 0; x < width; x++) {
      suppressed[y][x] = 0;
    }
  }
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const currentMag = mag[y][x];
      let neighbor1 = 0, neighbor2 = 0;
      const theta = angle[y][x];
      if ((theta >= 0 && theta < 22.5) || (theta >= 157.5 && theta <= 180)) {
        // 0° direction: compare left and right.
        neighbor1 = mag[y][x - 1];
        neighbor2 = mag[y][x + 1];
      } else if (theta >= 22.5 && theta < 67.5) {
        // 45° direction: compare top-right and bottom-left.
        neighbor1 = mag[y - 1][x + 1];
        neighbor2 = mag[y + 1][x - 1];
      } else if (theta >= 67.5 && theta < 112.5) {
        // 90° direction: compare top and bottom.
        neighbor1 = mag[y - 1][x];
        neighbor2 = mag[y + 1][x];
      } else if (theta >= 112.5 && theta < 157.5) {
        // 135° direction: compare top-left and bottom-right.
        neighbor1 = mag[y - 1][x - 1];
        neighbor2 = mag[y + 1][x + 1];
      }
      suppressed[y][x] = (currentMag >= neighbor1 && currentMag >= neighbor2) ? currentMag : 0;
    }
  }
  return suppressed;
}

// Generate standard ASCII art (non-DOG modes).
function generateASCII(img) {
  if (!img) {
    console.error("No image provided for ASCII generation");
    displayError("No image available to process");
    return;
  }
  
  if (isProcessing) return; // Prevent multiple simultaneous processing
  isProcessing = true;
  
  // Show loading indicator
  showLoadingIndicator();
  
  // Use setTimeout to allow the UI to update before the heavy processing
  setTimeout(() => {
    try {
      const edgeMethod = document.querySelector('input[name="edgeMethod"]:checked').value;
      if (edgeMethod === 'dog') {
        generateContourASCII(img);
        return;
      }
      
      // Get all settings from the UI
      const settings = getSettingsFromUI();
      
      // Cache settings to detect changes
      lastSettings = {...settings};
      
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true }); // Optimization for frequent pixel manipulation
      
      const fontAspectRatio = 0.55;
      const asciiHeight = Math.round((img.height / img.width) * settings.asciiWidth * fontAspectRatio);
      
      // Size canvas to the desired output dimensions
      canvas.width = settings.asciiWidth;
      canvas.height = asciiHeight;
      
      // Apply blur if specified
      ctx.filter = settings.blurValue > 0 ? `blur(${settings.blurValue}px)` : "none";
      
      // Draw the image on the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, settings.asciiWidth, asciiHeight);
      
      // Calculate contrast factor once
      const contrastFactor = (259 * (settings.contrastValue + 255)) / (255 * (259 - settings.contrastValue));
      
      // Process the image data
      const imageData = ctx.getImageData(0, 0, settings.asciiWidth, asciiHeight);
      const data = imageData.data;
      
      // Convert to grayscale with brightness, contrast and invert options
      let gray = new Array(data.length / 4);
      let grayOriginal = new Array(data.length / 4);
      
      for (let i = 0, j = 0; i < data.length; i += 4, j++) {
        // Calculate luminance using the standard formula
        let lum = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
        
        // Apply invert if enabled
        if (settings.invertEnabled) lum = 255 - lum;
        
        // Apply brightness and contrast
        const adjusted = clamp(contrastFactor * (lum - 128) + 128 + settings.brightness, 0, 255);
        
        gray[j] = adjusted;
        grayOriginal[j] = adjusted;
      }
      
      // Create the ASCII output based on the selected method
      let ascii = "";
      
      if (edgeMethod === 'sobel') {
        // Sobel edge detection mode
        gray = applyEdgeDetection(gray, settings.asciiWidth, asciiHeight, settings.edgeThreshold);
        ascii = convertGrayscaleToAscii(gray, grayOriginal, settings);
      } else if (settings.ditheringEnabled) {
        // Dithering mode
        ascii = applyDithering(gray, grayOriginal, settings);
      } else {
        // Simple mapping without dithering
        ascii = convertGrayscaleToAscii(gray, grayOriginal, settings);
      }
      
      // Update the UI with the generated ASCII art
      document.getElementById('ascii-art').textContent = ascii;
    } catch (error) {
      console.error("Error generating ASCII art:", error);
      displayError("Error generating ASCII art: " + error.message);
    } finally {
      hideLoadingIndicator();
      isProcessing = false;
    }
  }, 50); // Small delay to allow UI updates
}

// Convert grayscale data to ASCII characters
function convertGrayscaleToAscii(gray, grayOriginal, settings) {
  const { asciiWidth, gradient, nLevels, ignoreWhite } = settings;
  const asciiHeight = gray.length / asciiWidth;
  let result = "";
  
  for (let y = 0; y < asciiHeight; y++) {
    let line = "";
    for (let x = 0; x < asciiWidth; x++) {
      const idx = y * asciiWidth + x;
      
      // Skip pure white pixels if ignore white is enabled
      if (ignoreWhite && grayOriginal[idx] === 255) { 
        line += " ";
        continue;
      }
      
      // Map the grayscale value to a character in the gradient
      const computedLevel = Math.round((gray[idx] / 255) * (nLevels - 1));
      line += gradient.charAt(computedLevel);
    }
    result += line + "\n";
  }
  
  return result;
}

// Apply dithering algorithm to the grayscale image
function applyDithering(gray, grayOriginal, settings) {
  const { asciiWidth, ditherAlgorithm, gradient, nLevels, ignoreWhite } = settings;
  const asciiHeight = gray.length / asciiWidth;
  let result = "";
  
  // Create a copy of the gray array to manipulate
  let ditheredGray = [...gray];
  
  if (ditherAlgorithm === 'floyd') {
    // Apply Floyd-Steinberg dithering
    result = floydSteinbergDithering(ditheredGray, grayOriginal, settings);
  } else if (ditherAlgorithm === 'atkinson') {
    // Apply Atkinson dithering
    result = atkinsonDithering(ditheredGray, grayOriginal, settings);
  } else if (ditherAlgorithm === 'noise') {
    // Apply noise dithering
    result = noiseDithering(ditheredGray, grayOriginal, settings);
  } else if (ditherAlgorithm === 'ordered') {
    // Apply ordered dithering
    result = orderedDithering(ditheredGray, grayOriginal, settings);
  }
  
  return result;
}

// Floyd-Steinberg dithering implementation
function floydSteinbergDithering(gray, grayOriginal, settings) {
  const { asciiWidth, gradient, nLevels, ignoreWhite } = settings;
  const asciiHeight = gray.length / asciiWidth;
  let result = "";
  
  // Create a copy for manipulation
  let ditheredGray = [...gray];
  
  // Perform Floyd-Steinberg dithering
  for (let y = 0; y < asciiHeight; y++) {
    let line = "";
    for (let x = 0; x < asciiWidth; x++) {
      const idx = y * asciiWidth + x;
      const oldPixel = ditheredGray[idx];
      
      // Skip pure white pixels if ignore white is enabled
      if (ignoreWhite && grayOriginal[idx] === 255) { 
        line += " ";
        continue;
      }
      
      // Find closest character in the gradient
      const computedLevel = Math.round((oldPixel / 255) * (nLevels - 1));
      const char = gradient.charAt(computedLevel);
      line += char;
      
      // Calculate quantization error
      const newPixel = Math.round((computedLevel / (nLevels - 1)) * 255);
      const error = oldPixel - newPixel;
      
      // Distribute error to neighboring pixels using Floyd-Steinberg
      if (x + 1 < asciiWidth) {
        ditheredGray[idx + 1] += error * 7 / 16;
      }
      if (y + 1 < asciiHeight) {
        if (x > 0) {
          ditheredGray[idx + asciiWidth - 1] += error * 3 / 16;
        }
        ditheredGray[idx + asciiWidth] += error * 5 / 16;
        if (x + 1 < asciiWidth) {
          ditheredGray[idx + asciiWidth + 1] += error * 1 / 16;
        }
      }
    }
    result += line + "\n";
  }
  
  return result;
}

// Atkinson dithering implementation
function atkinsonDithering(gray, grayOriginal, settings) {
  const { asciiWidth, gradient, nLevels, ignoreWhite } = settings;
  const asciiHeight = gray.length / asciiWidth;
  let result = "";
  
  // Create a copy for manipulation
  let ditheredGray = [...gray];
  
  // Perform Atkinson dithering
  for (let y = 0; y < asciiHeight; y++) {
    let line = "";
    for (let x = 0; x < asciiWidth; x++) {
      const idx = y * asciiWidth + x;
      const oldPixel = ditheredGray[idx];
      
      // Skip pure white pixels if ignore white is enabled
      if (ignoreWhite && grayOriginal[idx] === 255) { 
        line += " ";
        continue;
      }
      
      // Find closest character in the gradient
      const computedLevel = Math.round((oldPixel / 255) * (nLevels - 1));
      const char = gradient.charAt(computedLevel);
      line += char;
      
      // Calculate quantization error
      const newPixel = Math.round((computedLevel / (nLevels - 1)) * 255);
      const error = Math.floor((oldPixel - newPixel) / 8); // Divide by 8 for Atkinson
      
      // Distribute error to neighboring pixels using Atkinson pattern
      // Right pixel
      if (x + 1 < asciiWidth) {
        ditheredGray[idx + 1] += error;
      }
      // Right-right pixel
      if (x + 2 < asciiWidth) {
        ditheredGray[idx + 2] += error;
      }
      // Next row pixels
      if (y + 1 < asciiHeight) {
        // Left pixel
        if (x - 1 >= 0) {
          ditheredGray[idx + asciiWidth - 1] += error;
        }
        // Center pixel
        ditheredGray[idx + asciiWidth] += error;
        // Right pixel
        if (x + 1 < asciiWidth) {
          ditheredGray[idx + asciiWidth + 1] += error;
        }
      }
      // Two rows down center pixel
      if (y + 2 < asciiHeight) {
        ditheredGray[idx + (2 * asciiWidth)] += error;
      }
    }
    result += line + "\n";
  }
  
  return result;
}

// Ordered dithering implementation using a Bayer matrix
function orderedDithering(gray, grayOriginal, settings) {
  const { asciiWidth, gradient, nLevels, ignoreWhite } = settings;
  const asciiHeight = gray.length / asciiWidth;
  let result = "";
  
  // 4x4 Bayer matrix
  const bayerMatrix = [
    [ 0, 8, 2, 10],
    [12, 4, 14, 6],
    [ 3, 11, 1, 9],
    [15, 7, 13, 5]
  ];
  
  // Threshold scale factor
  const thresholdScale = 16;
  
  // Perform ordered dithering
  for (let y = 0; y < asciiHeight; y++) {
    let line = "";
    for (let x = 0; x < asciiWidth; x++) {
      const idx = y * asciiWidth + x;
      const oldPixel = gray[idx];
      
      // Skip pure white pixels if ignore white is enabled
      if (ignoreWhite && grayOriginal[idx] === 255) { 
        line += " ";
        continue;
      }
      
      // Get threshold from Bayer matrix
      const thresholdValue = bayerMatrix[y % 4][x % 4];
      const threshold = (thresholdValue / thresholdScale) * 255;
      
      // Apply threshold
      const thresholdedValue = oldPixel + threshold - 128;
      const limitedValue = clamp(thresholdedValue, 0, 255);
      
      // Map to character
      const computedLevel = Math.round((limitedValue / 255) * (nLevels - 1));
      line += gradient.charAt(computedLevel);
    }
    result += line + "\n";
  }
  
  return result;
}

// Noise dithering implementation
function noiseDithering(gray, grayOriginal, settings) {
  const { asciiWidth, gradient, nLevels, ignoreWhite } = settings;
  const asciiHeight = gray.length / asciiWidth;
  let result = "";
  
  // Noise intensity
  const noiseRange = 40;
  
  // Perform noise dithering
  for (let y = 0; y < asciiHeight; y++) {
    let line = "";
    for (let x = 0; x < asciiWidth; x++) {
      const idx = y * asciiWidth + x;
      let pixelValue = gray[idx];
      
      // Skip pure white pixels if ignore white is enabled
      if (ignoreWhite && grayOriginal[idx] === 255) { 
        line += " ";
        continue;
      }
      
      // Apply random noise
      const noise = (Math.random() - 0.5) * noiseRange;
      pixelValue = clamp(pixelValue + noise, 0, 255);
      
      // Map to character
      const computedLevel = Math.round((pixelValue / 255) * (nLevels - 1));
      line += gradient.charAt(computedLevel);
    }
    result += line + "\n";
  }
  
  return result;
}

// Helper function to display errors to the user
function displayError(message) {
  const asciiArt = document.getElementById('ascii-art');
  asciiArt.textContent = `Error: ${message}\nPlease try again with a different image or settings.`;
  
  // Optionally, show a more prominent error message
  console.error(message);
}

// Show a loading indicator while processing
function showLoadingIndicator() {
  const container = document.querySelector('.main-content');
  
  // Create loading element if it doesn't exist
  let loading = document.querySelector('.loading');
  if (!loading) {
    loading = document.createElement('div');
    loading.className = 'loading';
    loading.textContent = 'Processing image...';
    container.appendChild(loading);
  } else {
    loading.style.display = 'block';
  }
  
  // Disable controls during processing
  document.querySelectorAll('.control input, .control select, .control button').forEach(el => {
    el.disabled = true;
  });
}

// Hide the loading indicator
function hideLoadingIndicator() {
  const loading = document.querySelector('.loading');
  if (loading) {
    loading.style.display = 'none';
  }
  
  // Re-enable controls
  document.querySelectorAll('.control input, .control select, .control button').forEach(el => {
    el.disabled = false;
  });
}

// Get all settings from the UI elements
function getSettingsFromUI() {
  const asciiWidth = parseInt(document.getElementById('asciiWidth').value, 10);
  const brightness = parseFloat(document.getElementById('brightness').value);
  const contrastValue = parseFloat(document.getElementById('contrast').value);
  const blurValue = parseFloat(document.getElementById('blur').value);
  const ditheringEnabled = document.getElementById('dithering').checked;
  const ditherAlgorithm = document.getElementById('ditherAlgorithm').value;
  const invertEnabled = document.getElementById('invert').checked;
  const ignoreWhite = document.getElementById('ignoreWhite').checked;
  const charset = document.getElementById('charset').value;
  const edgeThreshold = parseInt(document.getElementById('edgeThreshold').value, 10);
  
  // Get the appropriate character gradient
  let gradient;
  if (charset === 'manual') {
    const manualChar = document.getElementById('manualCharInput').value || "0";
    gradient = manualChar + " ";
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

// Apply simple Sobel edge detection on a 1D grayscale array.
function applyEdgeDetection(gray, width, height, threshold) {
  let edges = new Array(width * height).fill(255);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let idx = y * width + x;
      let a = gray[(y - 1) * width + (x - 1)];
      let b = gray[(y - 1) * width + x];
      let c = gray[(y - 1) * width + (x + 1)];
      let d = gray[y * width + (x - 1)];
      let e = gray[y * width + x];
      let f = gray[y * width + (x + 1)];
      let g = gray[(y + 1) * width + (x - 1)];
      let h = gray[(y + 1) * width + x];
      let i = gray[(y + 1) * width + (x + 1)];
      let Gx = (-1 * a) + (0 * b) + (1 * c) +
               (-2 * d) + (0 * e) + (2 * f) +
               (-1 * g) + (0 * h) + (1 * i);
      let Gy = (-1 * a) + (-2 * b) + (-1 * c) +
               (0 * d) + (0 * e) + (0 * f) +
               (1 * g) + (2 * h) + (1 * i);
      let magVal = Math.sqrt(Gx * Gx + Gy * Gy);
      let normalized = (magVal / 1442) * 255;
      edges[idx] = normalized > threshold ? 0 : 255;
    }
  }
  return edges;
}

// Generate contour-based ASCII art using DoG and Sobel with non-maximum suppression.
function generateContourASCII(img, dogThreshold) {
  if (!img) {
    console.error("No image provided for contour ASCII generation");
    displayError("No image available to process");
    return;
  }
  
  if (isProcessing) return; // Prevent multiple simultaneous processing
  isProcessing = true;
  
  // Show loading indicator
  showLoadingIndicator();
  
  // Use setTimeout to allow the UI to update before the heavy processing
  setTimeout(() => {
    try {
      // Get settings from the UI
      const settings = getSettingsFromUI();
      // Use provided threshold or get it from the UI if not provided
      const threshold = dogThreshold || parseInt(document.getElementById('dogEdgeThreshold').value, 10);
      
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      const fontAspectRatio = 0.55;
      const asciiHeight = Math.round((img.height / img.width) * settings.asciiWidth * fontAspectRatio);
      
      // Setup canvas dimensions
      canvas.width = settings.asciiWidth;
      canvas.height = asciiHeight;
      
      // Apply blur if specified
      ctx.filter = settings.blurValue > 0 ? `blur(${settings.blurValue}px)` : "none";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, settings.asciiWidth, asciiHeight);
      
      const imageData = ctx.getImageData(0, 0, settings.asciiWidth, asciiHeight);
      const data = imageData.data;
      
      // Calculate contrast factor
      const contrastFactor = (259 * (settings.contrastValue + 255)) / (255 * (259 - settings.contrastValue));
      
      // Convert to 2D grayscale with adjustments
      let gray2d = [];
      for (let y = 0; y < asciiHeight; y++) {
        gray2d[y] = [];
        for (let x = 0; x < settings.asciiWidth; x++) {
          const idx = (y * settings.asciiWidth + x) * 4;
          // Calculate luminance with standard formula
          let lum = 0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2];
          
          // Apply invert if enabled
          if (settings.invertEnabled) lum = 255 - lum;
          
          // Apply brightness and contrast
          lum = clamp(contrastFactor * (lum - 128) + 128 + settings.brightness, 0, 255);
          gray2d[y][x] = lum;
        }
      }
      
      // Apply Difference of Gaussians to detect edges
      const sigma1 = 0.5, sigma2 = 1.0, kernelSize = 3;
      const dog = differenceOfGaussians2D(gray2d, sigma1, sigma2, kernelSize);
      
      // Apply Sobel edge detection and non-maximum suppression
      const { mag, angle } = applySobel2D(dog, settings.asciiWidth, asciiHeight);
      const suppressedMag = nonMaxSuppression(mag, angle, settings.asciiWidth, asciiHeight);
      
      // Generate ASCII art
      let ascii = "";
      for (let y = 0; y < asciiHeight; y++) {
        let line = "";
        for (let x = 0; x < settings.asciiWidth; x++) {
          if (suppressedMag[y][x] > threshold) {
            // Choose an appropriate character based on edge direction
            let adjustedAngle = (angle[y][x] + 90) % 180;
            let edgeChar = (adjustedAngle < 22.5 || adjustedAngle >= 157.5) ? "-" :
                         (adjustedAngle < 67.5) ? "/" :
                         (adjustedAngle < 112.5) ? "|" : "\\";
            line += edgeChar;
          } else {
            line += " ";
          }
        }
        ascii += line + "\n";
      }
      
      // Update the UI
      document.getElementById('ascii-art').textContent = ascii;
      return ascii;
    } catch (error) {
      console.error("Error generating contour ASCII:", error);
      displayError("Error generating contour ASCII: " + error.message);
      return "";
    } finally {
      hideLoadingIndicator();
      isProcessing = false;
    }
  }, 50);
  
  // Return an empty string as a fallback
  return "";
}

// Generate colored ASCII art from an image
function generateColorizedAscii(img, settings) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas dimensions based on settings
  const fontAspectRatio = 0.55;
  const asciiHeight = Math.round((img.height / img.width) * settings.asciiWidth * fontAspectRatio);
  canvas.width = settings.asciiWidth;
  canvas.height = asciiHeight;
  
  // Apply blur if specified
  ctx.filter = settings.blurValue > 0 ? `blur(${settings.blurValue}px)` : "none";
  
  // Draw image on canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Calculate contrast factor
  const contrastFactor = (259 * (settings.contrastValue + 255)) / (255 * (259 - settings.contrastValue));
  
  // Create arrays for grayscale and color data
  const grayscale = [];
  const colors = [];
  
  // Process pixel data
  for (let i = 0; i < data.length; i += 4) {
    // Get RGB values
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    
    // Apply brightness and contrast adjustments
    r = clamp(contrastFactor * (r - 128) + 128 + settings.brightness, 0, 255);
    g = clamp(contrastFactor * (g - 128) + 128 + settings.brightness, 0, 255);
    b = clamp(contrastFactor * (b - 128) + 128 + settings.brightness, 0, 255);
    
    // Calculate grayscale value
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Store grayscale and color values
    grayscale.push(settings.invertEnabled ? 255 - lum : lum);
    colors.push(`rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`);
  }
  
  // Generate ASCII art with colors
  let result = '';
  const { asciiWidth, gradient, nLevels, ignoreWhite } = settings;
  
  // Generate HTML for colored ASCII art
  for (let y = 0; y < asciiHeight; y++) {
    let line = '';
    for (let x = 0; x < asciiWidth; x++) {
      const idx = y * asciiWidth + x;
      const grayValue = grayscale[idx];
      
      // Skip pure white pixels if ignore white is enabled
      if (ignoreWhite && grayValue >= 250) {
        line += ' ';
        continue;
      }
      
      // Map grayscale value to character
      const computedLevel = Math.round((grayValue / 255) * (nLevels - 1));
      const char = gradient.charAt(computedLevel);
      
      // Add the character with its color
      if (settings.ditheringEnabled) {
        // Apply dithering to the grayscale values for character selection
        // but keep the original colors
        line += `<span style="color:${colors[idx]};">${char}</span>`;
      } else {
        line += `<span style="color:${colors[idx]};">${char}</span>`;
      }
    }
    result += line + '\n';
  }
  
  return result;
}

// Apply the specified image processing operations and generate ASCII art
function generateAscii(img, settings) {
  if (!img) {
    throw new Error("No image provided");
  }
  
  // Check if colorized mode is enabled
  const colorized = document.getElementById('colorized')?.checked || false;
  
  if (colorized) {
    return generateColorizedAscii(img, settings);
  }
  
  // Get the edge detection method
  const edgeMethod = document.querySelector('input[name="edgeMethod"]:checked').value;
  
  // Handle different processing methods
  if (edgeMethod === 'dog') {
    const dogThreshold = parseInt(document.getElementById('dogEdgeThreshold').value, 10);
    return generateContourASCII(img, dogThreshold);
  } else if (edgeMethod === 'sobel') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const fontAspectRatio = 0.55;
    const asciiHeight = Math.round((img.height / img.width) * settings.asciiWidth * fontAspectRatio);
    
    canvas.width = settings.asciiWidth;
    canvas.height = asciiHeight;
    
    // Apply blur if specified
    ctx.filter = settings.blurValue > 0 ? `blur(${settings.blurValue}px)` : "none";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Calculate contrast factor
    const contrastFactor = (259 * (settings.contrastValue + 255)) / (255 * (259 - settings.contrastValue));
    
    // Convert to grayscale with adjustments
    let gray = new Array(data.length / 4);
    let grayOriginal = new Array(data.length / 4);
    
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      let lum = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
      if (settings.invertEnabled) lum = 255 - lum;
      const adjusted = clamp(contrastFactor * (lum - 128) + 128 + settings.brightness, 0, 255);
      gray[j] = adjusted;
      grayOriginal[j] = adjusted;
    }
    
    // Apply edge detection
    gray = applyEdgeDetection(gray, settings.asciiWidth, asciiHeight, settings.edgeThreshold);
    return convertGrayscaleToAscii(gray, grayOriginal, settings);
  } else if (settings.ditheringEnabled) {
    // Apply dithering
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const fontAspectRatio = 0.55;
    const asciiHeight = Math.round((img.height / img.width) * settings.asciiWidth * fontAspectRatio);
    
    canvas.width = settings.asciiWidth;
    canvas.height = asciiHeight;
    
    // Apply blur if specified
    ctx.filter = settings.blurValue > 0 ? `blur(${settings.blurValue}px)` : "none";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Calculate contrast factor
    const contrastFactor = (259 * (settings.contrastValue + 255)) / (255 * (259 - settings.contrastValue));
    
    // Convert to grayscale with adjustments
    let gray = new Array(data.length / 4);
    let grayOriginal = new Array(data.length / 4);
    
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      let lum = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
      if (settings.invertEnabled) lum = 255 - lum;
      const adjusted = clamp(contrastFactor * (lum - 128) + 128 + settings.brightness, 0, 255);
      gray[j] = adjusted;
      grayOriginal[j] = adjusted;
    }
    
    return applyDithering(gray, grayOriginal, settings);
  } else {
    // Standard grayscale conversion
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const fontAspectRatio = 0.55;
    const asciiHeight = Math.round((img.height / img.width) * settings.asciiWidth * fontAspectRatio);
    
    canvas.width = settings.asciiWidth;
    canvas.height = asciiHeight;
    
    // Apply blur if specified
    ctx.filter = settings.blurValue > 0 ? `blur(${settings.blurValue}px)` : "none";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Calculate contrast factor
    const contrastFactor = (259 * (settings.contrastValue + 255)) / (255 * (259 - settings.contrastValue));
    
    // Convert to grayscale with adjustments
    let gray = new Array(data.length / 4);
    let grayOriginal = new Array(data.length / 4);
    
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      let lum = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
      if (settings.invertEnabled) lum = 255 - lum;
      const adjusted = clamp(contrastFactor * (lum - 128) + 128 + settings.brightness, 0, 255);
      gray[j] = adjusted;
      grayOriginal[j] = adjusted;
    }
    
    return convertGrayscaleToAscii(gray, grayOriginal, settings);
  }
}

// ---------------- Download Function ----------------

function downloadPNG() {
  try {
    const preElement = document.getElementById('ascii-art');
    const asciiText = preElement.textContent;
    
    if (!asciiText.trim()) {
      alert("No ASCII art to download.");
      return;
    }
    
    // Split the ASCII art into lines
    const lines = asciiText.split("\n");
    
    // Configuration for the PNG output
    const scaleFactor = 2;           // 2x resolution for better quality
    const borderMargin = 20 * scaleFactor; // Border margin in pixels
    
    // Get styles from the pre element
    const computedStyle = window.getComputedStyle(preElement);
    const baseFontSize = parseInt(computedStyle.fontSize, 10);
    const fontSize = baseFontSize * scaleFactor;
    
    // Create a temporary canvas to measure text dimensions
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.font = `${fontSize}px Consolas, Monaco, "Liberation Mono", monospace`;
    
    // Determine the maximum line width
    let maxLineWidth = 0;
    for (const line of lines) {
      const lineWidth = tempCtx.measureText(line).width;
      maxLineWidth = Math.max(maxLineWidth, lineWidth);
    }
    
    // Calculate the required text dimensions
    const lineHeight = fontSize; // Basic line height
    const textWidth = Math.ceil(maxLineWidth);
    const textHeight = Math.ceil(lines.length * lineHeight);
    
    // Create an offscreen canvas with extra space for the border margin
    const canvasWidth = textWidth + 2 * borderMargin;
    const canvasHeight = textHeight + 2 * borderMargin;
    
    const offCanvas = document.createElement('canvas');
    offCanvas.width = canvasWidth;
    offCanvas.height = canvasHeight;
    
    const offCtx = offCanvas.getContext('2d');
    
    // Determine background and text colors based on the current theme
    const isDarkMode = !document.body.classList.contains('light-mode');
    const bgColor = isDarkMode ? "#000" : "#fff";
    const textColor = isDarkMode ? "#eee" : "#000";
    
    // Fill the background
    offCtx.fillStyle = bgColor;
    offCtx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Set text style
    offCtx.font = `${fontSize}px Consolas, Monaco, "Liberation Mono", monospace`;
    offCtx.textBaseline = 'top';
    offCtx.fillStyle = textColor;
    
    // Draw each line of the ASCII art
    for (let i = 0; i < lines.length; i++) {
      offCtx.fillText(lines[i], borderMargin, borderMargin + i * lineHeight);
    }
    
    // Convert to PNG and trigger download
    offCanvas.toBlob(function(blob) {
      if (!blob) {
        console.error("Failed to create PNG blob");
        alert("Failed to generate PNG. Please try again.");
        return;
      }
      
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = 'ascii_art.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadLink.href); // Clean up
    }, 'image/png');
  } catch (error) {
    console.error("Error downloading PNG:", error);
    alert("Failed to download: " + error.message);
  }
}

// ---------------- Event Listeners ----------------

// Main initialization function
document.addEventListener('DOMContentLoaded', function() {
    // Initialize keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Check if modifiers match the current OS
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modifierKey = isMac ? e.metaKey : e.ctrlKey;
        
        // Common shortcuts
        if (modifierKey) {
            // Handle keyboard shortcuts
            switch (e.key.toLowerCase()) {
                case 'o': // Open file
                    if (e.preventDefault) e.preventDefault();
                    document.getElementById('upload').click();
                    break;
                case 's': // Save as PNG
                    if (e.preventDefault) e.preventDefault();
                    downloadPNG();
                    break;
                case 'c': // Copy to clipboard
                    if (!e.shiftKey) break; // Use Ctrl+Shift+C to avoid conflict with browser's copy
                    if (e.preventDefault) e.preventDefault();
                    copyToClipboard();
                    break;
                case '+': // Zoom in
                case '=':
                    if (e.preventDefault) e.preventDefault();
                    incrementZoom(10);
                    break;
                case '-': // Zoom out
                    if (e.preventDefault) e.preventDefault();
                    incrementZoom(-10);
                    break;
            }
        }

        // Escape to close modals
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => {
                bootstrap.Modal.getInstance(modal).hide();
            });
        }
    });

    // Initialize sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebarCollapse);
    }
    
    // Mobile sidebar toggle
    const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
    if (mobileSidebarToggle) {
        mobileSidebarToggle.addEventListener('click', toggleSidebar);
    }

    // Initialize drag and drop
    setupDragAndDrop();
    
    // Set up sample images gallery
    setupSampleImages();
    
    // Initialize preset dropdown
    updatePresetDropdown();
    
    // Initialize values from URL if present
    applySettingsFromURL();
    
    // Initialize presets dropdown
    const presetsDropdown = document.getElementById('presets');
    if (presetsDropdown) {
        presetsDropdown.addEventListener('change', function() {
            if (this.value !== 'default') {
                applyPreset(this.value);
            }
        });
    }
    
    // Save preset button
    const savePresetBtn = document.getElementById('savePreset');
    if (savePresetBtn) {
        savePresetBtn.addEventListener('click', function() {
            const name = prompt('Enter a name for this preset:');
            if (name) {
                saveCurrentSettingsAsPreset(name);
                // Select the newly created preset
                const presetDropdown = document.getElementById('presets');
                presetDropdown.value = name;
            }
        });
    }
    
    // Share button
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            const url = generateShareableURL();
            const shareUrlInput = document.getElementById('shareUrl');
            if (shareUrlInput) {
                shareUrlInput.value = url;
                shareUrlInput.select();
            }
            
            // Show share modal
            const shareModal = document.getElementById('shareModal');
            if (shareModal) {
                const modal = new bootstrap.Modal(shareModal);
                modal.show();
            }
        });
    }
    
    // Copy share URL button
    const copyShareUrlBtn = document.getElementById('copyShareUrl');
    if (copyShareUrlBtn) {
        copyShareUrlBtn.addEventListener('click', function() {
            const shareUrlInput = document.getElementById('shareUrl');
            if (shareUrlInput) {
                shareUrlInput.select();
                document.execCommand('copy');
                
                // Show success feedback
                this.textContent = 'Copied!';
                setTimeout(() => {
                    this.textContent = 'Copy';
                }, 2000);
            }
        });
    }
    
    // Theme toggle
    const themeToggle = document.getElementById('toggleTheme');
    if (themeToggle) {
        // Set initial state based on saved preference or system preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
        } else if (savedTheme === 'dark') {
            document.body.classList.remove('light-mode');
        } else {
            // Use system preference
            const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.body.classList.toggle('light-mode', !prefersDarkMode);
        }
        
        // Update icon based on current theme
        updateThemeIcon();
        
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('light-mode');
            localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
            updateThemeIcon();
        });
    }

    // Update theme icon based on current theme
    function updateThemeIcon() {
        const themeIcon = themeToggle.querySelector('i');
        if (themeIcon) {
            // If light mode, show moon (for switching to dark), otherwise show sun
            if (document.body.classList.contains('light-mode')) {
                themeIcon.className = 'fas fa-moon';
            } else {
                themeIcon.className = 'fas fa-sun';
            }
        }
    }
    
    // Font family dropdown
    const fontFamilyDropdown = document.getElementById('fontFamily');
    if (fontFamilyDropdown) {
        fontFamilyDropdown.addEventListener('change', updateAsciiZoom);
    }
    
    // Zoom slider
    const zoomSlider = document.getElementById('zoom');
    if (zoomSlider) {
        zoomSlider.addEventListener('input', updateAsciiZoom);
    }
    
    // Initialize value labels
    updateUIValues();
    
    // Load default image if no URL parameters exist
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.toString() === '') {
        loadDefaultImage();
    }
    
    // Connect export buttons
    const mainDownloadBtn = document.getElementById('downloadBtn');
    if (mainDownloadBtn) {
        mainDownloadBtn.addEventListener('click', downloadPNG);
    }
    
    const pngExportBtn = document.getElementById('downloadPngBtn');
    if (pngExportBtn) {
        pngExportBtn.addEventListener('click', downloadPNG);
    }
    
    const svgExportBtn = document.getElementById('downloadSvgBtn');
    if (svgExportBtn) {
        svgExportBtn.addEventListener('click', downloadSvg);
    }
    
    const txtExportBtn = document.getElementById('downloadTxtBtn');
    if (txtExportBtn) {
        txtExportBtn.addEventListener('click', downloadTxt);
    }
    
    const htmlExportBtn = document.getElementById('downloadHtmlBtn');
    if (htmlExportBtn) {
        htmlExportBtn.addEventListener('click', downloadHtml);
    }
    
    // Connect file upload
    const fileInput = document.getElementById('upload');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
    
    // Connect settings sliders to their update functions
    const settingInputs = document.querySelectorAll('input[type="range"], input[type="number"], input[type="checkbox"], select:not(#presets):not(#fontFamily)');
    settingInputs.forEach(input => {
        if (input.type === 'range' || input.type === 'number') {
            input.addEventListener('input', updateValueLabel.bind(null, input));
        }
        
        // Use debounce for sliders and checkboxes to avoid too frequent updates
        const updateEvent = input.type === 'range' ? 'input' : 'change';
        input.addEventListener(updateEvent, debounce(function() {
            if (currentImage) {
                generateWithCurrentSettings();
            }
        }, 300));
    });
    
    // Connect radio buttons for edge detection method
    const edgeMethodRadios = document.querySelectorAll('input[name="edgeMethod"]');
    edgeMethodRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            // Show/hide appropriate threshold controls
            const method = this.value;
            document.getElementById('sobelThresholdControl').style.display = (method === 'sobel') ? 'flex' : 'none';
            document.getElementById('dogThresholdControl').style.display = (method === 'dog') ? 'flex' : 'none';
            
            // Generate new ASCII art with the selected method
            if (currentImage) {
                generateWithCurrentSettings();
            }
        });
    });
    
    // Connect color control checkboxes
    const colorizeCheckbox = document.getElementById('colorized');
    if (colorizeCheckbox) {
        colorizeCheckbox.addEventListener('change', function() {
            document.getElementById('colorControls').style.display = this.checked ? 'block' : 'none';
            
            if (currentImage) {
                generateWithCurrentSettings();
            }
        });
    }
    
    // Initialize color picker for text/background
    const textColorPicker = document.getElementById('textColor');
    const bgColorPicker = document.getElementById('bgColor');
    
    if (textColorPicker && bgColorPicker) {
        textColorPicker.addEventListener('input', debounce(function() {
            if (currentImage) {
                generateWithCurrentSettings();
            }
        }, 300));
        
        bgColorPicker.addEventListener('input', debounce(function() {
            if (currentImage) {
                generateWithCurrentSettings();
            }
        }, 300));
    }
    
    // Initialize bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// Function to update all value labels
function updateUIValues() {
    const rangeInputs = document.querySelectorAll('input[type="range"]');
    rangeInputs.forEach(input => {
        updateValueLabel(input);
    });
}

// Handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    showLoadingIndicator();
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            currentImage = img;
            originalImageDataUrl = e.target.result;
            
            document.getElementById('originalImage').src = e.target.result;
            document.getElementById('sideBySideOriginal').src = e.target.result;
            
            // Update file name in UI
            const fileNameElement = document.getElementById('currentFileName');
            if (fileNameElement) {
                fileNameElement.textContent = file.name;
            }
            
            generateWithCurrentSettings();
            hideLoadingIndicator();
        };
        
        img.onerror = function() {
            displayError("The selected file is not a valid image.");
            hideLoadingIndicator();
        };
        
        img.src = e.target.result;
    };
    
    reader.onerror = function() {
        displayError("Failed to read the selected file.");
        hideLoadingIndicator();
    };
    
    reader.readAsDataURL(file);
}

// Setup sample images gallery
function setupSampleImages() {
    const container = document.querySelector('.sample-thumbnails');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Add each sample image as a thumbnail
    SAMPLE_IMAGES.forEach((sample, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = sample.url;
        thumbnail.alt = sample.name;
        thumbnail.title = sample.name;
        thumbnail.className = 'sample-thumbnail';
        
        thumbnail.addEventListener('click', () => {
            loadSampleImage(index);
        });
        
        container.appendChild(thumbnail);
    });
}

// Load a sample image by index
function loadSampleImage(index) {
    if (!SAMPLE_IMAGES || index >= SAMPLE_IMAGES.length) {
        console.error("Sample image not available");
        return;
    }
    
    showLoadingIndicator();
    
    const sample = SAMPLE_IMAGES[index];
    const img = new Image();
    
    img.crossOrigin = "Anonymous"; // Allow loading images from different domains
    
    img.onload = function() {
        currentImage = img;
        
        // Set the original data URL for sharing
        originalImageDataUrl = sample.url;
        
        // Update original image displays
        document.getElementById('originalImage').src = sample.url;
        document.getElementById('sideBySideOriginal').src = sample.url;
        
        // Update file name in UI
        const fileNameElement = document.getElementById('currentFileName');
        if (fileNameElement) {
            fileNameElement.textContent = sample.name;
        }
        
        generateWithCurrentSettings();
        hideLoadingIndicator();
    };
    
    img.onerror = function() {
        console.error("Failed to load sample image:", sample.url);
        displayError("Failed to load the sample image. Please try another one or upload your own.");
        hideLoadingIndicator();
    };
    
    img.src = sample.url;
}

// Generate ASCII with current settings
function generateWithCurrentSettings() {
    if (!currentImage) {
        displayError("Please upload an image first.");
        return;
    }
    
    showLoadingIndicator();
    
    // Get settings from UI
    const settings = getSettingsFromUI();
    
    // Process image with a small delay to allow UI updates
    setTimeout(() => {
        try {
            // Check if colorized mode is enabled
            const colorized = document.getElementById('colorized')?.checked || false;
            
            // Generate ASCII art using the provided settings
            const result = generateAscii(currentImage, settings);
            
            // Get output elements
            const asciiArt = document.getElementById('ascii-art');
            const sideBySideAscii = document.getElementById('sideBySideAscii');
            
            // Update the ASCII art displays
            if (colorized) {
                // For colorized output, we need to use innerHTML as it contains HTML spans with colors
                asciiArt.innerHTML = result;
                sideBySideAscii.innerHTML = result;
                
                // Add the color-ascii class to use special styling
                asciiArt.classList.add('color-ascii');
                sideBySideAscii.classList.add('color-ascii');
                
                // Apply background color
                const bgColor = document.getElementById('bgColor').value;
                asciiArt.style.backgroundColor = bgColor;
                sideBySideAscii.style.backgroundColor = bgColor;
            } else {
                // For standard output, use textContent for security
                asciiArt.textContent = result;
                sideBySideAscii.textContent = result;
                
                // Remove the color-ascii class
                asciiArt.classList.remove('color-ascii');
                sideBySideAscii.classList.remove('color-ascii');
                
                // Apply text and background colors if manually set
                const textColor = document.getElementById('textColor')?.value;
                const bgColor = document.getElementById('bgColor')?.value;
                
                if (textColor && bgColor) {
                    document.querySelectorAll('.ascii-output').forEach(el => {
                        el.style.color = textColor;
                        el.style.backgroundColor = bgColor;
                    });
                } else {
                    // Reset to theme colors
                    document.querySelectorAll('.ascii-output').forEach(el => {
                        el.style.color = '';
                        el.style.backgroundColor = '';
                    });
                }
            }
            
            // Add to history
            addToHistory(result, settings);
            
            hideLoadingIndicator();
        } catch (error) {
            console.error("Error generating ASCII art:", error);
            displayError("Error generating ASCII art: " + error.message);
            hideLoadingIndicator();
        }
    }, 50);
}

// Copy ASCII art to clipboard
function copyToClipboard() {
  const asciiArt = document.getElementById('ascii-art');
  const selection = window.getSelection();
  const range = document.createRange();
  
  // Check if there's content to copy
  if (!asciiArt.textContent.trim()) {
    alert("No ASCII art to copy to clipboard.");
    return;
  }
  
  // Select the content
  range.selectNodeContents(asciiArt);
  selection.removeAllRanges();
  selection.addRange(range);
  
  try {
    // Execute copy command
    const successful = document.execCommand('copy');
    
    if (successful) {
      // Show success feedback
      const copyBtn = document.getElementById('copyBtn');
      if (copyBtn) {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 2000);
      }
    } else {
      alert("Failed to copy text. Please try again or copy manually.");
    }
  } catch (err) {
    console.error('Failed to copy text: ', err);
    alert("Failed to copy text: " + err.message);
  } finally {
    // Deselect the text
    selection.removeAllRanges();
  }
}

// Load a default image
function loadDefaultImage() {
  if (SAMPLE_IMAGES && SAMPLE_IMAGES.length > 0) {
    loadSampleImage(0); // Load the first sample image
  } else {
    // Fallback to a placeholder image if no samples available
    const placeholderUrl = 'https://via.placeholder.com/500x300/333/fff?text=Upload+an+image';
    const img = new Image();
    
    img.onload = function() {
      currentImage = img;
      
      // Convert to data URL for sharing and display
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      originalImageDataUrl = canvas.toDataURL('image/jpeg');
      
      // Update original image displays
      document.getElementById('originalImage').src = originalImageDataUrl;
      document.getElementById('sideBySideOriginal').src = originalImageDataUrl;
      
      // Generate ASCII with default settings
      generateWithCurrentSettings();
    };
    
    img.onerror = function() {
      console.error("Failed to load placeholder image");
      displayError("Failed to load a default image. Please upload your own image.");
    };
    
    img.src = placeholderUrl;
  }
}

// Helper function to update value labels for range inputs
function updateValueLabel(input) {
  if (!input) return;
  
  const valueDisplay = document.querySelector(`label[for="${input.id}"] .value-display`);
  if (valueDisplay) {
    valueDisplay.textContent = input.value;
  }
}
