import { GrainCounts, QualityClassifications, RiceType } from '@/types';

export function computeClassifications(
  counts: GrainCounts,
  lwRatio: number,
  riceType: RiceType
): QualityClassifications {
  const total = counts.total || 1;
  const brokenPct = (counts.broken / total) * 100;
  const longPct = (counts.long / total) * 100;
  const mediumPct = (counts.medium / total) * 100;
  const shortPct = 100 - longPct - mediumPct;
  const chalkyPct = (counts.chalky / total) * 100;
  const blackPct = (counts.black / total) * 100;
  const greenPct = (counts.green / total) * 100;
  const redPct = (counts.red / total) * 100;
  const yellowPct = (counts.yellow / total) * 100;

  let millingGrade: QualityClassifications['millingGrade'];
  if (brokenPct < 5) millingGrade = 'Premium';
  else if (brokenPct <= 10) millingGrade = 'Grade 1';
  else if (brokenPct <= 15) millingGrade = 'Grade 2';
  else if (brokenPct <= 20) millingGrade = 'Grade 3';
  else millingGrade = 'Below Grade';

  let grainShape: QualityClassifications['grainShape'];
  if (lwRatio < 2.1) grainShape = 'Bold';
  else if (lwRatio <= 2.9) grainShape = 'Medium';
  else grainShape = 'Slender';

  let grainLengthClass: QualityClassifications['grainLengthClass'];
  if (longPct > 90) grainLengthClass = 'Long';
  else if (mediumPct > 90) grainLengthClass = 'Medium';
  else if (shortPct > 90) grainLengthClass = 'Short';
  else grainLengthClass = 'Mixed';

  const chalkinessStatus: QualityClassifications['chalkinessStatus'] =
    chalkyPct >= 20 ? 'Chalky' : 'Not Chalky';

  const blackStatus: QualityClassifications['blackStatus'] =
    blackPct > 10 ? 'Damaged/Defective' : 'Normal';

  const greenStatus: QualityClassifications['greenStatus'] =
    greenPct > 10 ? 'Immature' : 'Normal';

  const redStatus: QualityClassifications['redStatus'] =
    redPct > 10 ? 'Red Strips' : 'Normal';

  const yellowStatus: QualityClassifications['yellowStatus'] =
    riceType !== 'Paddy' && yellowPct > 10 ? 'Fermented' : 'Normal';

  return {
    millingGrade,
    grainShape,
    grainLengthClass,
    chalkinessStatus,
    blackStatus,
    greenStatus,
    redStatus,
    yellowStatus,
  };
}

export function getGradeColor(grade: QualityClassifications['millingGrade']): string {
  switch (grade) {
    case 'Premium': return '#16A34A';
    case 'Grade 1': return '#22C55E';
    case 'Grade 2': return '#F59E0B';
    case 'Grade 3': return '#F97316';
    case 'Below Grade': return '#DC2626';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'Normal':
    case 'Not Chalky':
      return '#16A34A';
    case 'Premium':
      return '#16A34A';
    case 'Grade 1':
      return '#22C55E';
    case 'Grade 2':
    case 'Medium':
      return '#F59E0B';
    case 'Grade 3':
    case 'Bold':
      return '#F97316';
    case 'Below Grade':
    case 'Damaged/Defective':
    case 'Immature':
    case 'Red Strips':
    case 'Fermented':
    case 'Chalky':
      return '#DC2626';
    case 'Slender':
    case 'Long':
      return '#16A34A';
    case 'Short':
    case 'Mixed':
      return '#F59E0B';
    default:
      return '#6B7280';
  }
}
