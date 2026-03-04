// ============================================================
// history.js — In-memory history panel (max 10 items)
// ============================================================

import { getHistoryItems, pushHistoryItem, shiftHistoryItem } from './state.js';

export function addToHistory(asciiArt, settings) {
  const items = getHistoryItems();
  if (items.length >= 10) shiftHistoryItem();

  pushHistoryItem({ asciiArt, settings: { ...settings }, timestamp: new Date() });
  updateHistoryPanel();
}

export function updateHistoryPanel() {
  const container = document.getElementById('historyItems');
  if (!container) return;

  const items = getHistoryItems();
  container.innerHTML = '';

  if (items.length === 0) {
    container.innerHTML = '<div class="col-12 text-center text-muted">No history items yet</div>';
    return;
  }

  items.forEach((item, index) => {
    const el = document.createElement('div');
    el.className = 'col-md-4 col-sm-6 history-item';
    el.innerHTML = `
      <div class="history-thumbnail">
        <pre>${item.asciiArt.split('\n').slice(0, 30).join('\n')}</pre>
      </div>
      <div class="history-timestamp">${item.timestamp.toLocaleTimeString()}</div>`;
    el.addEventListener('click', () => restoreFromHistory(index));
    container.appendChild(el);
  });
}

export function restoreFromHistory(index) {
  const items = getHistoryItems();
  if (index < 0 || index >= items.length) return;

  const item = items[index];

  // Apply settings without triggering a full regeneration
  import('./presets.js').then(({ applySettings }) => applySettings(item.settings));

  document.getElementById('ascii-art').textContent     = item.asciiArt;
  document.getElementById('sideBySideAscii').textContent = item.asciiArt;
}
