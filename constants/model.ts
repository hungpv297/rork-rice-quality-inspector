import { RiceType } from '@/types';

export const MODEL_URL =
  'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/o0ilianr225mlvpkpvl4l';

export const MODEL_VERSION = 'ultimate_tiled_multitask_v1.0_int8';

export const GRID_COLS = 8;
export const GRID_ROWS = 6;
export const N_TILES = GRID_COLS * GRID_ROWS;
export const TILE_SIZE = 224;
export const SCALE = 100.0;

export const NORM_MEAN = [0.485, 0.456, 0.406];
export const NORM_STD = [0.229, 0.224, 0.225];

export const M_STATS_MEAN = [7.648381, 2.564115, 3.064693, 64.199936, 2.807240, 15.470088];
export const M_STATS_STD = [1.224848, 0.378145, 0.346573, 6.393577, 5.450570, 14.535635];

export const COUNT_COLS = [
  'Count',
  'Broken_Count',
  'Long_Count',
  'Medium_Count',
  'Black_Count',
  'Chalky_Count',
  'Red_Count',
  'Yellow_Count',
  'Green_Count',
] as const;

export const MEASURE_COLS = [
  'WK_Length_Average',
  'WK_Width_Average',
  'WK_LW_Ratio_Average',
  'Average_L',
  'Average_a',
  'Average_b',
] as const;

export const PADDY_ZERO_INDICES = [5, 3, 7, 8];
export const BROWN_ZERO_INDICES = [8];

export function getRiceTypeMeta(riceType: RiceType): [number, number, number] {
  switch (riceType) {
    case 'Paddy':
      return [1, 0, 0];
    case 'White':
      return [0, 1, 0];
    case 'Brown':
      return [0, 0, 1];
  }
}
