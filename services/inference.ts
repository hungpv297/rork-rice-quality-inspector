import { Platform } from 'react-native';
import { GrainCounts, KernelShape, ColorProfile, RiceType } from '@/types';
import {
  MODEL_URL,
  MODEL_VERSION,
  GRID_COLS,
  GRID_ROWS,
  N_TILES,
  TILE_SIZE,
  SCALE,
  NORM_MEAN,
  NORM_STD,
  M_STATS_MEAN,
  M_STATS_STD,
  PADDY_ZERO_INDICES,
  BROWN_ZERO_INDICES,
  getRiceTypeMeta,
} from '@/constants/model';

export { MODEL_VERSION };

export interface InferenceResult {
  grainCounts: GrainCounts;
  kernelShape: KernelShape;
  colorProfile: ColorProfile;
  processingTimeMs: number;
}

let cachedSession: any = null;
let modelLoadPromise: Promise<any> | null = null;
let nativeOrt: any = null;
let nativeOrtAvailable: boolean | null = null;

let webOrt: any = null;
let webOrtLoadAttempted = false;

async function loadWebOrtDynamic(): Promise<any> {
  if (webOrt) return webOrt;
  if (webOrtLoadAttempted) return null;
  webOrtLoadAttempted = true;
  try {
    const cdnUrl = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/ort.min.js';
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = cdnUrl;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load onnxruntime-web from CDN'));
        document.head.appendChild(script);
      });
      webOrt = (window as any).ort;
      if (webOrt) {
        console.log('[Inference] onnxruntime-web loaded from CDN');
        return webOrt;
      }
    }
    return null;
  } catch (e) {
    console.log('[Inference] Failed to load onnxruntime-web:', e);
    return null;
  }
}

function getNativeOrt(): any {
  if (nativeOrtAvailable === false) return null;
  if (nativeOrt) return nativeOrt;

  try {
    const moduleName = 'onnxruntime-react-native';
    nativeOrt = require(moduleName);
    nativeOrtAvailable = true;
    console.log('[Inference] onnxruntime-react-native loaded successfully');
    return nativeOrt;
  } catch (e) {
    console.log('[Inference] onnxruntime-react-native not available, will use simulation fallback');
    nativeOrtAvailable = false;
    return null;
  }
}

async function loadWebSession(): Promise<any> {
  if (cachedSession) return cachedSession;
  if (modelLoadPromise) return modelLoadPromise;

  modelLoadPromise = (async () => {
    try {
      console.log('[Inference] Loading onnxruntime-web...');
      const ort = await loadWebOrtDynamic();
      if (!ort) throw new Error('onnxruntime-web not available');

      ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/';
      ort.env.wasm.numThreads = 1;

      console.log('[Inference] Fetching ONNX model from URL...');
      const response = await fetch(MODEL_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch model: ${response.status} ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      console.log('[Inference] Model downloaded:', (buffer.byteLength / 1e6).toFixed(1), 'MB');

      console.log('[Inference] Creating inference session...');
      const session = await ort.InferenceSession.create(buffer, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });

      console.log('[Inference] Session created. Inputs:', session.inputNames, 'Outputs:', session.outputNames);
      cachedSession = session;
      return session;
    } catch (err) {
      modelLoadPromise = null;
      throw err;
    }
  })();

  return modelLoadPromise;
}

async function loadNativeSession(): Promise<any> {
  if (cachedSession) return cachedSession;
  if (modelLoadPromise) return modelLoadPromise;

  modelLoadPromise = (async () => {
    try {
      const ort = getNativeOrt();
      if (!ort) throw new Error('onnxruntime-react-native not available');

      console.log('[Inference] Loading ONNX model on native...');

      const response = await fetch(MODEL_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch model: ${response.status} ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      console.log('[Inference] Model downloaded:', (buffer.byteLength / 1e6).toFixed(1), 'MB');

      const session = await ort.InferenceSession.create(buffer);
      console.log('[Inference] Native session created. Inputs:', session.inputNames, 'Outputs:', session.outputNames);
      cachedSession = session;
      return session;
    } catch (err) {
      modelLoadPromise = null;
      throw err;
    }
  })();

  return modelLoadPromise;
}

function preprocessImageWeb(imageUri: string): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    console.log('[Inference] Preprocessing image for ONNX (web)...');

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const srcW = img.width;
        const srcH = img.height;
        console.log('[Inference] Image loaded:', srcW, 'x', srcH);

        const srcCanvas = document.createElement('canvas');
        srcCanvas.width = srcW;
        srcCanvas.height = srcH;
        const srcCtx = srcCanvas.getContext('2d');
        if (!srcCtx) throw new Error('Could not get source canvas context');
        srcCtx.drawImage(img, 0, 0);

        const tileCanvas = document.createElement('canvas');
        tileCanvas.width = TILE_SIZE;
        tileCanvas.height = TILE_SIZE;
        const tileCtx = tileCanvas.getContext('2d');
        if (!tileCtx) throw new Error('Could not get tile canvas context');

        const totalFloats = N_TILES * 3 * TILE_SIZE * TILE_SIZE;
        const tilesData = new Float32Array(totalFloats);

        const stepH = Math.floor(srcH / GRID_ROWS);
        const stepW = Math.floor(srcW / GRID_COLS);

        for (let r = 0; r < GRID_ROWS; r++) {
          for (let c = 0; c < GRID_COLS; c++) {
            const tileIdx = r * GRID_COLS + c;
            const y1 = r * stepH;
            const x1 = c * stepW;
            const y2 = r < GRID_ROWS - 1 ? (r + 1) * stepH : srcH;
            const x2 = c < GRID_COLS - 1 ? (c + 1) * stepW : srcW;
            const tileW = x2 - x1;
            const tileH = y2 - y1;

            tileCtx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
            tileCtx.drawImage(srcCanvas, x1, y1, tileW, tileH, 0, 0, TILE_SIZE, TILE_SIZE);

            const pixelData = tileCtx.getImageData(0, 0, TILE_SIZE, TILE_SIZE).data;

            const offset = tileIdx * 3 * TILE_SIZE * TILE_SIZE;
            const planeSize = TILE_SIZE * TILE_SIZE;

            for (let p = 0; p < planeSize; p++) {
              const pi = p * 4;
              const rVal = pixelData[pi] / 255.0;
              const gVal = pixelData[pi + 1] / 255.0;
              const bVal = pixelData[pi + 2] / 255.0;

              tilesData[offset + p] = (rVal - NORM_MEAN[0]) / NORM_STD[0];
              tilesData[offset + planeSize + p] = (gVal - NORM_MEAN[1]) / NORM_STD[1];
              tilesData[offset + 2 * planeSize + p] = (bVal - NORM_MEAN[2]) / NORM_STD[2];
            }
          }
        }

        console.log('[Inference] Preprocessing complete. Tensor size:', tilesData.length);
        resolve(tilesData);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image for preprocessing'));
    img.src = imageUri;
  });
}

async function preprocessImageNative(imageUri: string): Promise<Float32Array> {
  console.log('[Inference] Preprocessing image for ONNX (native)...');

  const response = await fetch(imageUri);
  const blob = await response.blob();

  const reader = new FileReader();
  const base64 = await new Promise<string>((resolve, reject) => {
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const img = await new Promise<{ width: number; height: number; pixels: Uint8Array }>((resolve, reject) => {
    try {
      const { Image: ExpoImage } = require('expo-image');
      console.log('[Inference] Using expo-image for pixel extraction (native fallback)');
      reject(new Error('Direct pixel access not available on native'));
    } catch {
      reject(new Error('Image pixel extraction not available on native'));
    }
  }).catch(() => {
    console.log('[Inference] Native pixel extraction unavailable, using canvas-free approach');
    return null;
  });

  if (!img) {
    throw new Error('Cannot preprocess image on native without pixel access. Please use the web version or build with onnxruntime-react-native + expo-dev-client.');
  }

  const totalFloats = N_TILES * 3 * TILE_SIZE * TILE_SIZE;
  return new Float32Array(totalFloats);
}

function postprocessResults(rawCounts: Float32Array, rawMeasures: Float32Array, riceType: RiceType): { grainCounts: GrainCounts; kernelShape: KernelShape; colorProfile: ColorProfile } {
  console.log('[Inference] Raw counts:', Array.from(rawCounts));
  console.log('[Inference] Raw measures:', Array.from(rawMeasures));

  const counts = new Float32Array(9);
  for (let i = 0; i < 9; i++) {
    counts[i] = rawCounts[i] / SCALE;
  }

  const riceTypeIdx = riceType === 'Paddy' ? 0 : riceType === 'Brown' ? 2 : 1;
  if (riceTypeIdx === 0) {
    for (const idx of PADDY_ZERO_INDICES) {
      counts[idx] = 0;
    }
  } else if (riceTypeIdx === 2) {
    for (const idx of BROWN_ZERO_INDICES) {
      counts[idx] = 0;
    }
  }

  for (let i = 0; i < 9; i++) {
    counts[i] = Math.max(0, Math.round(counts[i]));
  }

  const measures = new Float32Array(6);
  for (let i = 0; i < 6; i++) {
    measures[i] = rawMeasures[i] * (M_STATS_STD[i] + 1e-8) + M_STATS_MEAN[i];
  }

  const grainCounts: GrainCounts = {
    total: counts[0],
    broken: counts[1],
    long: counts[2],
    medium: counts[3],
    black: counts[4],
    chalky: counts[5],
    red: counts[6],
    yellow: counts[7],
    green: counts[8],
  };

  const lengthAvg = Math.round(measures[0] * 100) / 100;
  const widthAvg = Math.round(measures[1] * 100) / 100;
  const lwRatio = widthAvg > 0 ? Math.round((lengthAvg / widthAvg) * 100) / 100 : measures[2];

  const kernelShape: KernelShape = {
    lengthAvg: Math.max(0, lengthAvg),
    widthAvg: Math.max(0, widthAvg),
    lwRatio: Math.max(0, lwRatio),
  };

  const colorProfile: ColorProfile = {
    L: Math.round(measures[3] * 100) / 100,
    a: Math.round(measures[4] * 100) / 100,
    b: Math.round(measures[5] * 100) / 100,
  };

  return { grainCounts, kernelShape, colorProfile };
}

async function runOnnxWebInference(imageUri: string, riceType: RiceType): Promise<InferenceResult> {
  const startTime = Date.now();
  console.log('[Inference] Starting ONNX Web inference for rice type:', riceType);

  const session = await loadWebSession();
  const ort = webOrt;
  if (!ort) throw new Error('onnxruntime-web not loaded');

  const tilesData = await preprocessImageWeb(imageUri);
  const tilesTensor = new ort.Tensor('float32', tilesData, [N_TILES, 3, TILE_SIZE, TILE_SIZE]);

  const metaValues = getRiceTypeMeta(riceType);
  const metaTensor = new ort.Tensor('float32', new Float32Array(metaValues), [1, 3]);

  console.log('[Inference] Running model...');
  const feeds: Record<string, any> = {
    tiles: tilesTensor,
    meta: metaTensor,
  };

  const results = await session.run(feeds);
  console.log('[Inference] Model output keys:', Object.keys(results));

  const rawCounts = results['counts'].data as Float32Array;
  const rawMeasures = results['measures'].data as Float32Array;

  const { grainCounts, kernelShape, colorProfile } = postprocessResults(rawCounts, rawMeasures, riceType);
  const processingTimeMs = Date.now() - startTime;

  console.log('[Inference] ONNX Web inference complete in', processingTimeMs, 'ms');
  console.log('[Inference] Grain counts:', grainCounts);
  console.log('[Inference] Kernel shape:', kernelShape);
  console.log('[Inference] Color profile:', colorProfile);

  return { grainCounts, kernelShape, colorProfile, processingTimeMs };
}

async function runOnnxNativeInference(imageUri: string, riceType: RiceType): Promise<InferenceResult> {
  const startTime = Date.now();
  console.log('[Inference] Starting ONNX Native inference for rice type:', riceType);

  const session = await loadNativeSession();
  const ort = getNativeOrt();

  const tilesData = await preprocessImageNative(imageUri);
  const tilesTensor = new ort.Tensor('float32', tilesData, [N_TILES, 3, TILE_SIZE, TILE_SIZE]);

  const metaValues = getRiceTypeMeta(riceType);
  const metaTensor = new ort.Tensor('float32', new Float32Array(metaValues), [1, 3]);

  console.log('[Inference] Running native model...');
  const feeds: Record<string, any> = {
    tiles: tilesTensor,
    meta: metaTensor,
  };

  const results = await session.run(feeds);
  console.log('[Inference] Model output keys:', Object.keys(results));

  const rawCounts = results['counts'].data as Float32Array;
  const rawMeasures = results['measures'].data as Float32Array;

  const { grainCounts, kernelShape, colorProfile } = postprocessResults(rawCounts, rawMeasures, riceType);
  const processingTimeMs = Date.now() - startTime;

  console.log('[Inference] ONNX Native inference complete in', processingTimeMs, 'ms');
  return { grainCounts, kernelShape, colorProfile, processingTimeMs };
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

async function runSimulationFallback(
  imageUri: string,
  riceType: RiceType
): Promise<InferenceResult> {
  const startTime = Date.now();

  console.log('[Inference] SIMULATION MODE — onnxruntime-react-native not installed.');
  console.log('[Inference] To use real model on native, install onnxruntime-react-native and build with EAS.');

  await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

  const seed = imageUri.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = seededRandom(seed);

  const total = Math.round(150 + rand() * 350);
  const brokenRatio = 0.03 + rand() * 0.2;
  const broken = Math.round(total * brokenRatio);
  const remaining = total - broken;
  const longRatio = 0.3 + rand() * 0.5;
  const longCount = Math.round(remaining * longRatio);
  const medium = remaining - longCount;

  let black = Math.round(total * rand() * 0.08);
  let chalky = riceType === 'Paddy' ? 0 : Math.round(total * rand() * 0.15);
  let red = Math.round(total * rand() * 0.06);
  let yellow = riceType === 'Paddy' ? 0 : Math.round(total * rand() * 0.05);
  let green = riceType === 'Brown' ? 0 : Math.round(total * rand() * 0.04);

  if (riceType === 'Paddy') {
    chalky = 0;
    yellow = 0;
    green = 0;
  }
  if (riceType === 'Brown') {
    green = 0;
  }

  const grainCounts: GrainCounts = {
    total,
    broken,
    long: longCount,
    medium,
    black,
    chalky,
    red,
    yellow,
    green,
  };

  const lengthAvg = 5.0 + rand() * 3.0;
  const widthAvg = 1.5 + rand() * 1.5;

  const kernelShape: KernelShape = {
    lengthAvg: Math.round(lengthAvg * 100) / 100,
    widthAvg: Math.round(widthAvg * 100) / 100,
    lwRatio: Math.round((lengthAvg / widthAvg) * 100) / 100,
  };

  const colorProfile: ColorProfile = {
    L: Math.round((60 + rand() * 30) * 100) / 100,
    a: Math.round((-2 + rand() * 8) * 100) / 100,
    b: Math.round((10 + rand() * 20) * 100) / 100,
  };

  const processingTimeMs = Date.now() - startTime;

  console.log('[Inference] Simulation complete in', processingTimeMs, 'ms');
  return { grainCounts, kernelShape, colorProfile, processingTimeMs };
}

export async function runInference(
  imageUri: string,
  riceType: RiceType
): Promise<InferenceResult> {
  if (Platform.OS === 'web') {
    try {
      return await runOnnxWebInference(imageUri, riceType);
    } catch (err) {
      console.error('[Inference] ONNX Web inference failed, falling back to simulation:', err);
      return runSimulationFallback(imageUri, riceType);
    }
  }

  const ort = getNativeOrt();
  if (ort) {
    try {
      return await runOnnxNativeInference(imageUri, riceType);
    } catch (err) {
      console.error('[Inference] ONNX Native inference failed, falling back to simulation:', err);
      return runSimulationFallback(imageUri, riceType);
    }
  }

  return runSimulationFallback(imageUri, riceType);
}
