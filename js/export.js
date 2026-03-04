// ============================================================
// export.js — Download and clipboard functions
// ============================================================

// ---- Shared download helper -------------------------------------

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getAsciiText() {
  return document.getElementById('ascii-art').textContent;
}

// ---- PNG --------------------------------------------------------

export function downloadPNG() {
  try {
    const asciiText = getAsciiText();
    if (!asciiText.trim()) { alert('No ASCII art to download.'); return; }

    const preElement    = document.getElementById('ascii-art');
    const scaleFactor   = 2;
    const borderMargin  = 20 * scaleFactor;
    const baseFontSize  = parseInt(window.getComputedStyle(preElement).fontSize, 10);
    const fontSize      = baseFontSize * scaleFactor;

    const tempCanvas = document.createElement('canvas');
    const tempCtx    = tempCanvas.getContext('2d');
    tempCtx.font = `${fontSize}px Consolas, Monaco, "Liberation Mono", monospace`;

    const lines = asciiText.split('\n');
    let maxLineWidth = 0;
    for (const line of lines) {
      maxLineWidth = Math.max(maxLineWidth, tempCtx.measureText(line).width);
    }

    const lineHeight   = fontSize;
    const canvasWidth  = Math.ceil(maxLineWidth) + 2 * borderMargin;
    const canvasHeight = Math.ceil(lines.length * lineHeight) + 2 * borderMargin;

    const offCanvas = document.createElement('canvas');
    offCanvas.width  = canvasWidth;
    offCanvas.height = canvasHeight;
    const offCtx = offCanvas.getContext('2d');

    const isDark   = !document.body.classList.contains('light-mode');
    offCtx.fillStyle = isDark ? '#000' : '#fff';
    offCtx.fillRect(0, 0, canvasWidth, canvasHeight);
    offCtx.font          = `${fontSize}px Consolas, Monaco, "Liberation Mono", monospace`;
    offCtx.textBaseline  = 'top';
    offCtx.fillStyle     = isDark ? '#eee' : '#000';

    for (let i = 0; i < lines.length; i++) {
      offCtx.fillText(lines[i], borderMargin, borderMargin + i * lineHeight);
    }

    offCanvas.toBlob(blob => {
      if (!blob) { alert('Failed to generate PNG. Please try again.'); return; }
      triggerDownload(blob, 'ascii_art.png');
    }, 'image/png');
  } catch (err) {
    console.error('Error downloading PNG:', err);
    alert('Failed to download: ' + err.message);
  }
}

// ---- SVG --------------------------------------------------------

export function downloadSvg() {
  try {
    const asciiText = getAsciiText();
    if (!asciiText.trim()) { alert('No ASCII art to download.'); return; }

    const lines      = asciiText.split('\n');
    const fontSize   = 8;
    const lineHeight = fontSize * 1.2;
    const charWidth  = fontSize * 0.6;

    let maxLen = 0;
    lines.forEach(l => { maxLen = Math.max(maxLen, l.length); });

    const width  = maxLen * charWidth + 40;
    const height = lines.length * lineHeight + 40;
    const isDark = !document.body.classList.contains('light-mode');
    const bg     = isDark ? '#000000' : '#ffffff';
    const fg     = isDark ? '#ffffff' : '#000000';

    let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bg}"/>
  <text x="20" y="20" font-family="monospace" font-size="${fontSize}px" fill="${fg}">`;

    lines.forEach((line, i) => {
      const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      svg += `\n    <tspan x="20" dy="${i === 0 ? 0 : lineHeight}">${escaped || ' '}</tspan>`;
    });
    svg += '\n  </text>\n</svg>';

    triggerDownload(new Blob([svg], { type: 'image/svg+xml' }), 'ascii_art.svg');
  } catch (err) {
    console.error('Error downloading SVG:', err);
    alert('Failed to download: ' + err.message);
  }
}

// ---- TXT --------------------------------------------------------

export function downloadTxt() {
  try {
    const asciiText = getAsciiText();
    if (!asciiText.trim()) { alert('No ASCII art to download.'); return; }
    triggerDownload(new Blob([asciiText], { type: 'text/plain' }), 'ascii_art.txt');
  } catch (err) {
    console.error('Error downloading TXT:', err);
    alert('Failed to download: ' + err.message);
  }
}

// ---- HTML -------------------------------------------------------

export function downloadHtml() {
  try {
    const preElement = document.getElementById('ascii-art');
    const asciiText  = preElement.textContent;
    if (!asciiText.trim()) { alert('No ASCII art to download.'); return; }

    const colorized = document.getElementById('colorized')?.checked || false;
    const isDark    = !document.body.classList.contains('light-mode');
    const bg        = isDark ? '#000000' : '#ffffff';
    const fg        = isDark ? '#ffffff' : '#000000';

    const body = colorized
      ? preElement.innerHTML
      : asciiText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ASCII Art</title>
  <style>
    body { font-family: monospace; background-color: ${bg}; color: ${fg}; margin: 20px; }
    pre  { white-space: pre; font-size: 10px; line-height: 1; }
  </style>
</head>
<body>
  <pre>${body}</pre>
</body>
</html>`;

    triggerDownload(new Blob([html], { type: 'text/html' }), 'ascii_art.html');
  } catch (err) {
    console.error('Error downloading HTML:', err);
    alert('Failed to download: ' + err.message);
  }
}

// ---- Clipboard --------------------------------------------------

export function copyToClipboard() {
  const asciiArt  = document.getElementById('ascii-art');
  const selection = window.getSelection();

  if (!asciiArt.textContent.trim()) {
    alert('No ASCII art to copy to clipboard.');
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(asciiArt);
  selection.removeAllRanges();
  selection.addRange(range);

  try {
    const ok = document.execCommand('copy');
    if (ok) {
      const btn = document.getElementById('copyBtn');
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = orig; }, 2000);
      }
    } else {
      alert('Failed to copy text. Please try again or copy manually.');
    }
  } catch (err) {
    console.error('Failed to copy text:', err);
    alert('Failed to copy text: ' + err.message);
  } finally {
    selection.removeAllRanges();
  }
}
