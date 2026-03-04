// ============================================================
// config.js — Application-wide constants and default data
// ============================================================

export const baseFontSize = 7;

export const CONFIG = {
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

export const CHARSETS = {
  standard: "@%#*+=-:.",
  blocks: "█▓▒░ ",
  binary: "01",
  hex: "0123456789ABCDEF",
  detailed: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'."
};

export const PRESETS = {
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

export const SAMPLE_IMAGES = [
  {
    name: 'Grace Hopper',
    url: 'https://storage.googleapis.com/download.tensorflow.org/example_images/grace_hopper.jpg'
  },
  {
    name: 'Sunflower',
    url: 'https://storage.googleapis.com/download.tensorflow.org/example_images/592px-Red_sunflower.jpg'
  },
  {
    name: 'Cat in Snow',
    url: 'https://storage.googleapis.com/download.tensorflow.org/example_images/320px-Felis_catus-cat_on_snow.jpg'
  }
];
