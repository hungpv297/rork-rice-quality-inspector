import { GrainCounts, KernelShape, ColorProfile, RiceType } from '@/types';
import * as ort from 'onnxruntime-react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { Asset } from 'expo-asset';
import jpeg from 'jpeg-js';

export const MODEL_VERSION = 'ultimate_tiled_multitask_v1.0_onnx_int8';

// ── Grid / tile config (must match training) ────────────────────────────────
const GRID_COLS = 8;
const GRID_ROWS = 6;
const N_TILES   = GRID_COLS * GRID_ROWS;   // 48
const TILE_SIZE = 224;                      // pixels per tile side (MOBILE_TILE)
const FULL_W    = TILE_SIZE * GRID_COLS;   // 1792
const FULL_H    = TILE_SIZE * GRID_ROWS;   // 1344

// Training-time scale factor applied to raw count outputs
const SCALE = 100.0;

// ImageNet normalization (Albumentations A.Normalize defaults)
const MEAN = [0.485, 0.456, 0.406];
const STD  = [0.229, 0.224, 0.225];

// Measure de-normalization stats extracted from training checkpoint (m_stats)
// Column order: [WK_Length_Average, WK_Width_Average, WK_LW_Ratio_Average,
//                Average_L, Average_a, Average_b]
const M_MEAN = [7.648381, 2.564115, 3.064693, 64.199936,  2.807240, 15.470088];
const M_STD  = [1.224848, 0.378145, 0.346573,  6.393577,  5.450570, 14.535635];

// Count column order (must match model output order)
const COUNT_COLS = [
  'Count', 'Broken_Count', 'Long_Count', 'Medium_Count', 'Black_Count',
  'Chalky_Count', 'Red_Count', 'Yellow_Count', 'Green_Count',
];

// Columns zeroed out per rice type (post-processing constraints from training)
const PADDY_ZERO = ['Chalky_Count', 'Medium_Count', 'Yellow_Count', 'Green_Count'];
const BROWN_ZERO = ['Green_Count'];

const RICE_MAP: Record<RiceType, number> = { Paddy: 0, White: 1, Brown: 2 };

export interface InferenceResult {
  grainCounts: GrainCounts;
  kernelShape: KernelShape;
  colorProfile: ColorProfile;
  processingTimeMs: number;
}

// ── Session singleton ────────────────────────────────────────────────────────

let _session: ort.InferenceSession | null = null;

async function loadSession(): Promise<ort.InferenceSession> {
  if (_session) return _session;

  console.log('[Inference] Loading ONNX model…');

  // Resolve the bundled .onnx asset to a local file URI.
  // require() MUST be called with a static string literal so Metro can
  // resolve and bundle the asset at build time.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const asset = Asset.fromModule(require('../assets/models/model_mobile_int8.onnx'));
  await asset.downloadAsync();

  // Strip the file:// scheme – ONNX Runtime native module needs a raw path
  const uri = asset.localUri ?? asset.uri;
  const modelPath = uri.startsWith('file://') ? uri.slice(7) : uri;

  console.log('[Inference] Model path:', modelPath);

  _session = await ort.InferenceSession.create(modelPath, {
    executionProviders: ['cpu'],
  });

  console.log('[Inference] ONNX session ready ✓');
  return _session;
}

// ── Image pre-processing ────────────────────────────────────────────────────

/**
 * Resize the image to exactly FULL_W × FULL_H, decode JPEG bytes, and return
 * a Float32Array shaped (N_TILES, 3, TILE_SIZE, TILE_SIZE) in CHW format
 * with ImageNet normalisation applied.
 */
async function buildTileTensor(imageUri: string): Promise<Float32Array> {
  // 1. Resize to the exact grid dimensions so each tile is TILE_SIZE × TILE_SIZE
  const resized = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: FULL_W, height: FULL_H } }],
    { compress: 1.0, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );

  if (!resized.base64) throw new Error('expo-image-manipulator did not return base64 data');

  // 2. Decode base64 → Uint8Array (raw JPEG bytes)
  const binaryStr = atob(resized.base64);
  const jpegBytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    jpegBytes[i] = binaryStr.charCodeAt(i);
  }

  // 3. Decode JPEG → raw RGBA pixels
  //    jpeg.decode returns { data: Uint8Array([R,G,B,A, ...]), width, height }
  const { data: rgba } = jpeg.decode(jpegBytes, { useTArray: true });

  // 4. Build float32 tensor in (N_TILES, 3, TILE_SIZE, TILE_SIZE) CHW layout
  const tilePixels = TILE_SIZE * TILE_SIZE;
  const tensorData = new Float32Array(N_TILES * 3 * tilePixels);

  for (let tileIdx = 0; tileIdx < N_TILES; tileIdx++) {
    const tileRow  = Math.floor(tileIdx / GRID_COLS);
    const tileCol  = tileIdx % GRID_COLS;
    const tileBase = tileIdx * 3 * tilePixels;

    for (let ty = 0; ty < TILE_SIZE; ty++) {
      const imgY = tileRow * TILE_SIZE + ty;
      for (let tx = 0; tx < TILE_SIZE; tx++) {
        const imgX   = tileCol * TILE_SIZE + tx;
        const srcIdx = (imgY * FULL_W + imgX) * 4;  // RGBA stride = 4
        const dstPx  = ty * TILE_SIZE + tx;

        for (let c = 0; c < 3; c++) {
          const pixel = rgba[srcIdx + c] / 255.0;
          tensorData[tileBase + c * tilePixels + dstPx] = (pixel - MEAN[c]) / STD[c];
        }
      }
    }
  }

  return tensorData;
}

// ── Public inference entry point ─────────────────────────────────────────────

export async function runInference(
  imageUri: string,
  riceType: RiceType
): Promise<InferenceResult> {
  const startTime   = Date.now();
  const riceTypeIdx = RICE_MAP[riceType];

  console.log('[Inference] Starting ONNX inference, rice type:', riceType);

  // Load the ONNX session and pre-process the image in parallel
  const [session, tilesData] = await Promise.all([
    loadSession(),
    buildTileTensor(imageUri),
  ]);

  // Build meta one-hot vector: shape (1, 3)
  const metaData = new Float32Array(3);
  metaData[riceTypeIdx] = 1.0;

  // Run ONNX inference
  const feeds = {
    tiles: new ort.Tensor('float32', tilesData, [N_TILES, 3, TILE_SIZE, TILE_SIZE]),
    meta:  new ort.Tensor('float32', metaData,  [1, 3]),
  };
  const results = await session.run(feeds);

  // ── Post-process counts ─────────────────────────────────────────────────
  // Model output shape: (1, 9) — undo SCALE factor, apply rice-type constraints
  const rawCounts = results['counts'].data as Float32Array;
  const countMap: Record<string, number> = {};

  for (let i = 0; i < COUNT_COLS.length; i++) {
    const col = COUNT_COLS[i];
    let val   = rawCounts[i] / SCALE;
    if (
      (riceTypeIdx === 0 && PADDY_ZERO.includes(col)) ||
      (riceTypeIdx === 2 && BROWN_ZERO.includes(col))
    ) {
      val = 0;
    }
    countMap[col] = Math.max(0, Math.round(val));
  }

  // ── Post-process measures ────────────────────────────────────────────────
  // Model output shape: (1, 6) — denormalise with m_stats from checkpoint
  const rawMeasures = results['measures'].data as Float32Array;
  const measures: number[] = [];
  for (let i = 0; i < M_MEAN.length; i++) {
    measures.push(rawMeasures[i] * (M_STD[i] + 1e-8) + M_MEAN[i]);
  }

  // ── Map to InferenceResult ───────────────────────────────────────────────
  const grainCounts: GrainCounts = {
    total:  countMap['Count'],
    broken: countMap['Broken_Count'],
    long:   countMap['Long_Count'],
    medium: countMap['Medium_Count'],
    black:  countMap['Black_Count'],
    chalky: countMap['Chalky_Count'],
    red:    countMap['Red_Count'],
    yellow: countMap['Yellow_Count'],
    green:  countMap['Green_Count'],
  };

  const kernelShape: KernelShape = {
    lengthAvg: Math.round(measures[0] * 100) / 100,
    widthAvg:  Math.round(measures[1] * 100) / 100,
    lwRatio:   Math.round(measures[2] * 100) / 100,
  };

  const colorProfile: ColorProfile = {
    L: Math.round(measures[3] * 100) / 100,
    a: Math.round(measures[4] * 100) / 100,
    b: Math.round(measures[5] * 100) / 100,
  };

  const processingTimeMs = Date.now() - startTime;

  console.log('[Inference] Complete in', processingTimeMs, 'ms');
  console.log('[Inference] Grain counts:', grainCounts);
  console.log('[Inference] Kernel shape:', kernelShape);
  console.log('[Inference] Color profile:', colorProfile);

  return { grainCounts, kernelShape, colorProfile, processingTimeMs };
}
