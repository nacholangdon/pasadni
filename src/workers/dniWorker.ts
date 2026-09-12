/// <reference lib="webworker" />

declare const self: DedicatedWorkerGlobalScope;
declare const cv: any;

import type { CensorBox, DetectionResult } from '../types/dni';

// Keep track of OpenCV initialization state
let isOpenCvReady = false;

// We load OpenCV.js via importScripts
const OPENCV_CDN_URL = 'https://docs.opencv.org/4.8.0/opencv.js';
// Fallback CDN if primary fails
const OPENCV_FALLBACK_URL = 'https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.9.0-release.2/dist/opencv.js';

function initOpenCV() {
  if (isOpenCvReady) {
    self.postMessage({ type: 'INIT_SUCCESS' });
    return;
  }

  // Define Module configuration before loading script
  (self as any).Module = {
    onRuntimeInitialized() {
      isOpenCvReady = true;
      self.postMessage({
        type: 'INIT_SUCCESS',
        payload: { message: 'OpenCV.js inicializado correctamente en Web Worker.' }
      });
    }
  };

  try {
    try {
      (self as any).importScripts(OPENCV_CDN_URL);
    } catch {
      (self as any).importScripts(OPENCV_FALLBACK_URL);
    }

    if (typeof cv !== 'undefined' && cv.Mat) {
      isOpenCvReady = true;
      self.postMessage({
        type: 'INIT_SUCCESS',
        payload: { message: 'OpenCV.js listo.' }
      });
    }
  } catch (err: any) {
    self.postMessage({
      type: 'INIT_ERROR',
      payload: { message: `No se pudo descargar OpenCV.js: ${err?.message || err}. Modo heurístico nativo activo.` }
    });
  }
}

/**
 * Standard relative coordinates for Argentine DNI (ISO 7810 ID-1)
 */
function getStandardFrontBoxes(): CensorBox[] {
  return [
    {
      id: `box-tramite-${Date.now()}`,
      label: 'N° de Trámite',
      type: 'tramite',
      x: 0.32,
      y: 0.77,
      width: 0.35,
      height: 0.12,
      isAutoDetected: true
    },
    {
      id: `box-firma-${Date.now() + 1}`,
      label: 'Firma Digitalizada',
      type: 'firma',
      x: 0.58,
      y: 0.62,
      width: 0.36,
      height: 0.15,
      isAutoDetected: true
    }
  ];
}

function getStandardBackBoxes(): CensorBox[] {
  return [
    {
      id: `box-huella-${Date.now()}`,
      label: 'Huella Dactilar',
      type: 'huella',
      x: 0.72,
      y: 0.28,
      width: 0.24,
      height: 0.38,
      isAutoDetected: true
    },
    {
      id: `box-mrz-${Date.now() + 1}`,
      label: 'Código de Barras / MRZ',
      type: 'mrz',
      x: 0.05,
      y: 0.72,
      width: 0.90,
      height: 0.24,
      isAutoDetected: true
    }
  ];
}

/**
 * Heuristic analysis to detect whether the image resembles Front or Back of Argentine DNI
 */
function analyzeImageFeatures(imageData: ImageData): { isFront: boolean; confidence: number } {
  const { data, width, height } = imageData;
  
  let leftVariance = 0;
  let rightVariance = 0;
  
  const step = 8; // fast sampling
  const midX = Math.floor(width / 2);

  let sumLeft = 0;
  let sumRight = 0;
  let countL = 0;
  let countR = 0;

  for (let y = Math.floor(height * 0.2); y < Math.floor(height * 0.8); y += step) {
    for (let x = Math.floor(width * 0.05); x < width * 0.95; x += step) {
      const idx = (y * width + x) * 4;
      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      if (x < midX) {
        sumLeft += lum;
        countL++;
      } else {
        sumRight += lum;
        countR++;
      }
    }
  }

  const avgLeft = sumLeft / (countL || 1);
  const avgRight = sumRight / (countR || 1);

  for (let y = Math.floor(height * 0.2); y < Math.floor(height * 0.8); y += step) {
    for (let x = Math.floor(width * 0.05); x < width * 0.95; x += step) {
      const idx = (y * width + x) * 4;
      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      if (x < midX) {
        leftVariance += Math.abs(lum - avgLeft);
      } else {
        rightVariance += Math.abs(lum - avgRight);
      }
    }
  }

  const isFront = leftVariance >= rightVariance * 0.85;
  const confidence = Math.min(0.95, 0.70 + Math.abs(leftVariance - rightVariance) / (leftVariance + rightVariance + 1) * 0.25);

  return {
    isFront,
    confidence
  };
}

/**
 * Computer Vision Pipeline using OpenCV.js if loaded
 */
function processWithOpenCV(imageData: ImageData): DetectionResult {
  try {
    if (!isOpenCvReady || typeof cv === 'undefined') {
      const heuristic = analyzeImageFeatures(imageData);
      return {
        orientation: heuristic.isFront ? 'front' : 'back',
        confidence: heuristic.confidence,
        boxes: heuristic.isFront ? getStandardFrontBoxes() : getStandardBackBoxes(),
        documentContourFound: false
      };
    }

    const mat = cv.matFromImageData(imageData);
    const gray = new cv.Mat();
    const blurred = new cv.Mat();
    const edges = new cv.Mat();

    const scale = Math.min(1, 800 / Math.max(mat.cols, mat.rows));
    const smallSize = new cv.Size(Math.round(mat.cols * scale), Math.round(mat.rows * scale));
    const smallMat = new cv.Mat();
    cv.resize(mat, smallMat, smallSize, 0, 0, cv.INTER_AREA);

    cv.cvtColor(smallMat, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    cv.Canny(blurred, edges, 50, 150);

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let maxArea = 0;
    let bestRect = null;
    const minCardArea = smallMat.cols * smallMat.rows * 0.25;

    for (let i = 0; i < contours.size(); ++i) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      if (area > minCardArea && area > maxArea) {
        const perimeter = cv.arcLength(contour, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(contour, approx, 0.02 * perimeter, true);
        
        if (approx.rows === 4) {
          const rect = cv.boundingRect(approx);
          const aspect = rect.width / rect.height;
          if (aspect >= 1.2 && aspect <= 2.1) {
            maxArea = area;
            bestRect = rect;
          }
        }
        approx.delete();
      }
      contour.delete();
    }

    contours.delete();
    hierarchy.delete();
    mat.delete();
    gray.delete();
    blurred.delete();
    edges.delete();
    smallMat.delete();

    const heuristic = analyzeImageFeatures(imageData);
    const isFront = heuristic.isFront;
    let baseBoxes = isFront ? getStandardFrontBoxes() : getStandardBackBoxes();

    if (bestRect) {
      const docNormX = bestRect.x / smallSize.width;
      const docNormY = bestRect.y / smallSize.height;
      const docNormW = bestRect.width / smallSize.width;
      const docNormH = bestRect.height / smallSize.height;

      baseBoxes = baseBoxes.map(b => ({
        ...b,
        x: Number((docNormX + b.x * docNormW).toFixed(4)),
        y: Number((docNormY + b.y * docNormH).toFixed(4)),
        width: Number((b.width * docNormW).toFixed(4)),
        height: Number((b.height * docNormH).toFixed(4)),
      }));

      return {
        orientation: isFront ? 'front' : 'back',
        confidence: Math.min(0.98, heuristic.confidence + 0.1),
        boxes: baseBoxes,
        documentContourFound: true
      };
    }

    return {
      orientation: isFront ? 'front' : 'back',
      confidence: heuristic.confidence,
      boxes: baseBoxes,
      documentContourFound: false
    };
  } catch (_error) {
    const heuristic = analyzeImageFeatures(imageData);
    return {
      orientation: heuristic.isFront ? 'front' : 'back',
      confidence: heuristic.confidence,
      boxes: heuristic.isFront ? getStandardFrontBoxes() : getStandardBackBoxes(),
      documentContourFound: false
    };
  }
}

self.addEventListener('message', (event: MessageEvent) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'INIT': {
      initOpenCV();
      break;
    }

    case 'DETECT': {
      if (!payload?.imageData) {
        self.postMessage({
          type: 'DETECT_ERROR',
          payload: { message: 'No se recibieron datos de imagen para procesar.' }
        });
        return;
      }

      try {
        const result = processWithOpenCV(payload.imageData);
        self.postMessage({
          type: 'DETECT_SUCCESS',
          payload: { result }
        });
      } catch (err: any) {
        self.postMessage({
          type: 'DETECT_ERROR',
          payload: { message: err?.message || 'Error durante la detección' }
        });
      }
      break;
    }

    default:
      break;
  }
});
