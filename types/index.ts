export interface UserProfile {
  id: string;
  name: string;
  username: string;
  role: 'buyer_paddy' | 'buyer_milled' | 'miller' | 'trader' | 'other';
  organisation?: string;
  disclaimerAccepted: boolean;
  disclaimerAcceptedAt?: string;
  createdAt: string;
}

export type RiceType = 'Paddy' | 'White' | 'Brown';

export interface GrainCounts {
  total: number;
  broken: number;
  long: number;
  medium: number;
  black: number;
  chalky: number;
  red: number;
  yellow: number;
  green: number;
}

export interface KernelShape {
  lengthAvg: number;
  widthAvg: number;
  lwRatio: number;
}

export interface ColorProfile {
  L: number;
  a: number;
  b: number;
}

export interface QualityClassifications {
  millingGrade: 'Premium' | 'Grade 1' | 'Grade 2' | 'Grade 3' | 'Below Grade';
  grainShape: 'Bold' | 'Medium' | 'Slender';
  grainLengthClass: 'Long' | 'Medium' | 'Short' | 'Mixed';
  chalkinessStatus: 'Not Chalky' | 'Chalky';
  blackStatus: 'Normal' | 'Damaged/Defective';
  greenStatus: 'Normal' | 'Immature';
  redStatus: 'Normal' | 'Red Strips';
  yellowStatus: 'Normal' | 'Fermented';
}

export interface ScanResult {
  id: string;
  imageUri: string;
  riceType: RiceType;
  grainCounts: GrainCounts;
  kernelShape: KernelShape;
  colorProfile: ColorProfile;
  classifications: QualityClassifications;
  brokenPercent: number;
  longPercent: number;
  mediumPercent: number;
  shortPercent: number;
  blackPercent: number;
  chalkyPercent: number;
  redPercent: number;
  yellowPercent: number;
  greenPercent: number;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  modelVersion: string;
  processingTimeMs: number;
}

export const ROLE_LABELS: Record<UserProfile['role'], string> = {
  buyer_paddy: 'Paddy Buyer',
  buyer_milled: 'Milled Rice Buyer',
  miller: 'Rice Miller',
  trader: 'Rice Trader',
  other: 'Other',
};

export const RICE_TYPE_LABELS: Record<RiceType, string> = {
  Paddy: 'Paddy Rice',
  White: 'White/Polished Rice',
  Brown: 'Brown Rice',
};
