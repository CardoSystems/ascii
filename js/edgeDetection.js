// ============================================================
// edgeDetection.js — Pure math: convolution, DoG, Sobel, NMS
//                    plus the 1-D Sobel edge-detection helper
// ============================================================

// ---- Gaussian kernel --------------------------------------------

export function gaussianKernel2D(sigma, kernelSize) {
  const kernel = [];
  const half = Math.floor(kernelSize / 2);
  let sum = 0;

  for (let y = -half; y <= half; y++) {
    const row = [];
    for (let x = -half; x <= half; x++) {
      const value = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
      row.push(value);
      sum += value;
    }
    kernel.push(row);
  }

  for (let y = 0; y < kernelSize; y++) {
    for (let x = 0; x < kernelSize; x++) {
      kernel[y][x] /= sum;
    }
  }
  return kernel;
}

// ---- 2-D convolution --------------------------------------------

export function convolve2D(img, kernel) {
  const height = img.length;
  const width = img[0].length;
  const kernelSize = kernel.length;
  const half = Math.floor(kernelSize / 2);
  const output = [];

  for (let y = 0; y < height; y++) {
    output[y] = [];
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let ky = 0; ky < kernelSize; ky++) {
        for (let kx = 0; kx < kernelSize; kx++) {
          const yy = y + ky - half;
          const xx = x + kx - half;
          const pixel = (yy >= 0 && yy < height && xx >= 0 && xx < width) ? img[yy][xx] : 0;
          sum += pixel * kernel[ky][kx];
        }
      }
      output[y][x] = sum;
    }
  }
  return output;
}

// ---- Difference of Gaussians ------------------------------------

export function differenceOfGaussians2D(gray, sigma1, sigma2, kernelSize) {
  const kernel1 = gaussianKernel2D(sigma1, kernelSize);
  const kernel2 = gaussianKernel2D(sigma2, kernelSize);
  const blurred1 = convolve2D(gray, kernel1);
  const blurred2 = convolve2D(gray, kernel2);
  const height = gray.length;
  const width = gray[0].length;
  const dog = [];

  for (let y = 0; y < height; y++) {
    dog[y] = [];
    for (let x = 0; x < width; x++) {
      dog[y][x] = blurred1[y][x] - blurred2[y][x];
    }
  }
  return dog;
}

// ---- 2-D Sobel --------------------------------------------------

export function applySobel2D(img, width, height) {
  const mag = [];
  const angle = [];

  for (let y = 0; y < height; y++) {
    mag[y] = new Array(width).fill(0);
    angle[y] = new Array(width).fill(0);
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
      mag[y][x] = Math.sqrt(Gx * Gx + Gy * Gy);
      let theta = Math.atan2(Gy, Gx) * (180 / Math.PI);
      if (theta < 0) theta += 180;
      angle[y][x] = theta;
    }
  }
  return { mag, angle };
}

// ---- Non-maximum suppression ------------------------------------

export function nonMaxSuppression(mag, angle, width, height) {
  const suppressed = [];
  for (let y = 0; y < height; y++) {
    suppressed[y] = new Array(width).fill(0);
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const currentMag = mag[y][x];
      let n1 = 0, n2 = 0;
      const theta = angle[y][x];

      if ((theta >= 0 && theta < 22.5) || (theta >= 157.5 && theta <= 180)) {
        n1 = mag[y][x - 1]; n2 = mag[y][x + 1];
      } else if (theta >= 22.5 && theta < 67.5) {
        n1 = mag[y - 1][x + 1]; n2 = mag[y + 1][x - 1];
      } else if (theta >= 67.5 && theta < 112.5) {
        n1 = mag[y - 1][x]; n2 = mag[y + 1][x];
      } else if (theta >= 112.5 && theta < 157.5) {
        n1 = mag[y - 1][x - 1]; n2 = mag[y + 1][x + 1];
      }

      suppressed[y][x] = (currentMag >= n1 && currentMag >= n2) ? currentMag : 0;
    }
  }
  return suppressed;
}

// ---- 1-D Sobel edge map (used in standard mode) -----------------

export function applyEdgeDetection(gray, width, height, threshold) {
  const edges = new Array(width * height).fill(255);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const a = gray[(y - 1) * width + (x - 1)];
      const b = gray[(y - 1) * width + x];
      const c = gray[(y - 1) * width + (x + 1)];
      const d = gray[y * width + (x - 1)];
      const e = gray[y * width + x];
      const f = gray[y * width + (x + 1)];
      const g = gray[(y + 1) * width + (x - 1)];
      const h = gray[(y + 1) * width + x];
      const i = gray[(y + 1) * width + (x + 1)];

      const Gx = -a + c - 2 * d + 2 * f - g + i;
      const Gy = -a - 2 * b - c + g + 2 * h + i;
      const normalized = (Math.sqrt(Gx * Gx + Gy * Gy) / 1442) * 255;
      edges[idx] = normalized > threshold ? 0 : 255;
    }
  }
  return edges;
}
