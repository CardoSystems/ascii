// ============================================================
// state.js — Mutable application state with getter/setter API
// ============================================================

let _currentImage = null;
let _isProcessing = false;
let _lastSettings = {};
let _historyItems = [];
let _originalImageDataUrl = null;

export function getCurrentImage()        { return _currentImage; }
export function setCurrentImage(img)     { _currentImage = img; }

export function getIsProcessing()        { return _isProcessing; }
export function setIsProcessing(val)     { _isProcessing = val; }

export function getLastSettings()        { return _lastSettings; }
export function setLastSettings(s)       { _lastSettings = { ...s }; }

export function getHistoryItems()        { return _historyItems; }
export function pushHistoryItem(item)    { _historyItems.push(item); }
export function shiftHistoryItem()       { _historyItems.shift(); }

export function getOriginalImageDataUrl()       { return _originalImageDataUrl; }
export function setOriginalImageDataUrl(url)    { _originalImageDataUrl = url; }
