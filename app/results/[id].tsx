import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Share2,
  FileDown,
  Wheat,
  Ruler,
  Palette,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { Colors } from '@/constants/colors';
import { useScans } from '@/contexts/ScanContext';
import { getGradeColor, getStatusColor } from '@/services/classifications';
import QualityBadge from '@/components/QualityBadge';
import MetricCard from '@/components/MetricCard';

export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getScanById } = useScans();
  const scan = getScanById(id ?? '');

  const summaryText = useMemo(() => {
    if (!scan) return '';
    const grade = scan.classifications.millingGrade;
    const broken = scan.brokenPercent;
    const shape = scan.classifications.grainShape;
    const lengthClass = scan.classifications.grainLengthClass;

    let verdict = '';
    if (grade === 'Premium' || grade === 'Grade 1') {
      verdict = 'This sample shows good quality rice.';
    } else if (grade === 'Grade 2') {
      verdict = 'This sample has acceptable quality with some broken grains.';
    } else {
      verdict = 'This sample has quality concerns that may affect pricing.';
    }

    return `${verdict} The rice is classified as ${grade} with ${broken.toFixed(1)}% broken grains. Grains are ${shape.toLowerCase()} shaped and predominantly ${lengthClass.toLowerCase()}.`;
  }, [scan]);

  const generateSingleCSV = useCallback(() => {
    if (!scan) return '';
    const headers = [
      'ID', 'Date', 'Time', 'Rice Type', 'Milling Grade', 'Grain Shape', 'Length Class',
      'Total Count', 'Broken Count', 'Long Count', 'Medium Count',
      'Black Count', 'Chalky Count', 'Red Count', 'Yellow Count', 'Green Count',
      'Broken %', 'Chalky %', 'Black %', 'Red %', 'Yellow %', 'Green %',
      'Avg Length (mm)', 'Avg Width (mm)', 'LW Ratio',
      'CIELAB L*', 'CIELAB a*', 'CIELAB b*',
      'Chalkiness Status', 'Black Status', 'Green Status', 'Red Status', 'Yellow Status',
      'Model Version', 'Processing Time (ms)',
      'Latitude', 'Longitude',
    ].join(',');
    const d = new Date(scan.timestamp);
    const row = [
      scan.id,
      d.toISOString().split('T')[0],
      d.toISOString().split('T')[1]?.split('.')[0],
      scan.riceType,
      scan.classifications.millingGrade,
      scan.classifications.grainShape,
      scan.classifications.grainLengthClass,
      scan.grainCounts.total,
      scan.grainCounts.broken,
      scan.grainCounts.long,
      scan.grainCounts.medium,
      scan.grainCounts.black,
      scan.grainCounts.chalky,
      scan.grainCounts.red,
      scan.grainCounts.yellow,
      scan.grainCounts.green,
      scan.brokenPercent.toFixed(2),
      scan.chalkyPercent.toFixed(2),
      scan.blackPercent.toFixed(2),
      scan.redPercent.toFixed(2),
      scan.yellowPercent.toFixed(2),
      scan.greenPercent.toFixed(2),
      scan.kernelShape.lengthAvg.toFixed(2),
      scan.kernelShape.widthAvg.toFixed(2),
      scan.kernelShape.lwRatio.toFixed(2),
      scan.colorProfile.L.toFixed(2),
      scan.colorProfile.a.toFixed(2),
      scan.colorProfile.b.toFixed(2),
      scan.classifications.chalkinessStatus,
      scan.classifications.blackStatus,
      scan.classifications.greenStatus,
      scan.classifications.redStatus,
      scan.classifications.yellowStatus,
      scan.modelVersion,
      scan.processingTimeMs,
      scan.latitude ?? '',
      scan.longitude ?? '',
    ].join(',');
    return [headers, row].join('\n');
  }, [scan]);

  const handleExportCSV = async () => {
    if (!scan) return;
    try {
      const csv = generateSingleCSV();
      const fileName = `rice_scan_${scan.id.slice(0, 8)}_${new Date(scan.timestamp).toISOString().split('T')[0]}.csv`;

      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const file = new File(Paths.cache, fileName);
        file.create({ overwrite: true });
        file.write(csv);
        console.log('[Results] CSV file created:', file.uri);
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Rice Quality Report',
          UTI: 'public.comma-separated-values-text',
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('[Results] CSV export failed:', err);
      Alert.alert('Export Failed', 'Could not export the CSV file.');
    }
  };

  const handleShare = async () => {
    if (!scan) return;
    try {
      const csv = generateSingleCSV();
      const fileName = `rice_scan_${scan.id.slice(0, 8)}_${new Date(scan.timestamp).toISOString().split('T')[0]}.csv`;

      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        Alert.alert('Downloaded', 'CSV file has been downloaded.');
      } else {
        const file = new File(Paths.cache, fileName);
        file.create({ overwrite: true });
        file.write(csv);
        console.log('[Results] CSV file created for sharing:', file.uri);
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Share Rice Quality Report',
          UTI: 'public.comma-separated-values-text',
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('[Results] Share failed:', err);
      Alert.alert('Share Failed', 'Could not share the CSV file.');
    }
  };

  if (!scan) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorState}>
          <AlertTriangle size={40} color={Colors.warning} />
          <Text style={styles.errorTitle}>Scan Not Found</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const gradeColor = getGradeColor(scan.classifications.millingGrade);
  const date = new Date(scan.timestamp);

  const alerts: { label: string; color: string }[] = [];
  if (scan.classifications.blackStatus !== 'Normal')
    alerts.push({ label: 'Damaged/Defective grains detected (>10% black)', color: Colors.danger });
  if (scan.classifications.greenStatus !== 'Normal')
    alerts.push({ label: 'Immature grains detected (>10% green)', color: Colors.warning });
  if (scan.classifications.redStatus !== 'Normal')
    alerts.push({ label: 'Red-striped grains detected (>10% red)', color: Colors.warning });
  if (scan.classifications.yellowStatus !== 'Normal')
    alerts.push({ label: 'Fermented grains detected (>10% yellow)', color: Colors.danger });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageSection}>
          <Image source={{ uri: scan.imageUri }} style={styles.image} contentFit="cover" />
          <View style={styles.imageOverlay}>
            <Pressable style={styles.navBtn} onPress={() => router.back()} testID="back-button">
              <ArrowLeft size={20} color={Colors.textInverse} />
            </Pressable>
            <View style={styles.navBtnGroup}>
              <Pressable style={styles.navBtn} onPress={handleExportCSV} testID="export-csv-button">
                <FileDown size={20} color={Colors.textInverse} />
              </Pressable>
              <Pressable style={styles.navBtn} onPress={handleShare} testID="share-button">
                <Share2 size={20} color={Colors.textInverse} />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.summaryCard}>
            <View style={styles.gradeRow}>
              <View style={[styles.gradePill, { backgroundColor: gradeColor + '18' }]}>
                <Text style={[styles.gradeText, { color: gradeColor }]}>
                  {scan.classifications.millingGrade}
                </Text>
              </View>
              <View style={styles.metaInfo}>
                <View style={styles.metaRow}>
                  <Clock size={12} color={Colors.textTertiary} />
                  <Text style={styles.metaText}>
                    {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}
                    {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                {scan.latitude && (
                  <View style={styles.metaRow}>
                    <MapPin size={12} color={Colors.textTertiary} />
                    <Text style={styles.metaText}>
                      {scan.latitude.toFixed(4)}, {scan.longitude?.toFixed(4)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.summaryText}>{summaryText}</Text>
            <View style={styles.badgeRow}>
              <QualityBadge
                label="Shape"
                value={scan.classifications.grainShape}
                color={getStatusColor(scan.classifications.grainShape)}
              />
              <QualityBadge
                label="Length"
                value={scan.classifications.grainLengthClass}
                color={getStatusColor(scan.classifications.grainLengthClass)}
              />
              <QualityBadge
                label="Chalky"
                value={scan.classifications.chalkinessStatus}
                color={getStatusColor(scan.classifications.chalkinessStatus)}
              />
            </View>
          </View>

          {alerts.length > 0 && (
            <View style={styles.alertsSection}>
              {alerts.map((alert, i) => (
                <View key={i} style={[styles.alertItem, { backgroundColor: alert.color + '10' }]}>
                  <AlertTriangle size={14} color={alert.color} />
                  <Text style={[styles.alertText, { color: alert.color }]}>{alert.label}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Wheat size={16} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Grain Counts</Text>
            </View>
            <View style={styles.metricsGrid}>
              <MetricCard title="Total" value={scan.grainCounts.total} color={Colors.primary} />
              <MetricCard
                title="Broken"
                value={scan.grainCounts.broken}
                subtitle={`${scan.brokenPercent.toFixed(1)}%`}
                color={scan.brokenPercent > 15 ? Colors.danger : Colors.text}
              />
              <MetricCard title="Long" value={scan.grainCounts.long} subtitle={`${scan.longPercent.toFixed(1)}%`} />
              <MetricCard title="Medium" value={scan.grainCounts.medium} subtitle={`${scan.mediumPercent.toFixed(1)}%`} />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Palette size={16} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Colour Composition</Text>
            </View>
            <View style={styles.colorGrid}>
              <ColorBar label="Black" count={scan.grainCounts.black} percent={scan.blackPercent} color="#374151" threshold={10} />
              <ColorBar label="Chalky" count={scan.grainCounts.chalky} percent={scan.chalkyPercent} color="#FCD34D" threshold={20} />
              <ColorBar label="Red" count={scan.grainCounts.red} percent={scan.redPercent} color="#EF4444" threshold={10} />
              <ColorBar label="Yellow" count={scan.grainCounts.yellow} percent={scan.yellowPercent} color="#EAB308" threshold={10} />
              <ColorBar label="Green" count={scan.grainCounts.green} percent={scan.greenPercent} color="#22C55E" threshold={10} />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ruler size={16} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Kernel Shape</Text>
            </View>
            <View style={styles.metricsGrid}>
              <MetricCard title="Avg Length" value={scan.kernelShape.lengthAvg.toFixed(2)} unit="mm" />
              <MetricCard title="Avg Width" value={scan.kernelShape.widthAvg.toFixed(2)} unit="mm" />
              <MetricCard title="L/W Ratio" value={scan.kernelShape.lwRatio.toFixed(2)} />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Palette size={16} color={Colors.primary} />
              <Text style={styles.sectionTitle}>CIELAB Colour Profile</Text>
            </View>
            <View style={styles.metricsGrid}>
              <MetricCard title="L* (Lightness)" value={scan.colorProfile.L.toFixed(2)} />
              <MetricCard title="a* (Green-Red)" value={scan.colorProfile.a.toFixed(2)} />
              <MetricCard title="b* (Blue-Yellow)" value={scan.colorProfile.b.toFixed(2)} />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shield size={16} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Quality Summary</Text>
            </View>
            <View style={styles.summaryGrid}>
              <SummaryRow label="Milling Grade" value={scan.classifications.millingGrade} status={scan.classifications.millingGrade === 'Premium' || scan.classifications.millingGrade === 'Grade 1' ? 'good' : scan.classifications.millingGrade === 'Grade 2' ? 'warn' : 'bad'} />
              <SummaryRow label="Grain Shape" value={scan.classifications.grainShape} status="info" />
              <SummaryRow label="Length Class" value={scan.classifications.grainLengthClass} status="info" />
              <SummaryRow label="Chalkiness" value={scan.classifications.chalkinessStatus} status={scan.classifications.chalkinessStatus === 'Not Chalky' ? 'good' : 'bad'} />
              <SummaryRow label="Black Grains" value={scan.classifications.blackStatus} status={scan.classifications.blackStatus === 'Normal' ? 'good' : 'bad'} />
              <SummaryRow label="Green Grains" value={scan.classifications.greenStatus} status={scan.classifications.greenStatus === 'Normal' ? 'good' : 'bad'} />
              <SummaryRow label="Red Grains" value={scan.classifications.redStatus} status={scan.classifications.redStatus === 'Normal' ? 'good' : 'warn'} />
              <SummaryRow label="Yellow Grains" value={scan.classifications.yellowStatus} status={scan.classifications.yellowStatus === 'Normal' ? 'good' : 'bad'} />
            </View>
          </View>

          <View style={styles.footerInfo}>
            <Text style={styles.footerText}>Model: {scan.modelVersion}</Text>
            <Text style={styles.footerText}>Processing: {scan.processingTimeMs}ms</Text>
            <Text style={styles.footerText}>Rice Type: {scan.riceType}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ColorBar({
  label,
  count,
  percent,
  color,
  threshold,
}: {
  label: string;
  count: number;
  percent: number;
  color: string;
  threshold: number;
}) {
  const overThreshold = percent > threshold;
  return (
    <View style={colorBarStyles.row}>
      <View style={colorBarStyles.labelCol}>
        <View style={[colorBarStyles.dot, { backgroundColor: color }]} />
        <Text style={colorBarStyles.label}>{label}</Text>
      </View>
      <View style={colorBarStyles.barCol}>
        <View style={colorBarStyles.barBg}>
          <View
            style={[
              colorBarStyles.barFill,
              {
                backgroundColor: overThreshold ? Colors.danger : color,
                width: `${Math.min(percent, 100)}%`,
              },
            ]}
          />
        </View>
      </View>
      <View style={colorBarStyles.valueCol}>
        <Text style={[colorBarStyles.value, overThreshold && { color: Colors.danger }]}>
          {count} ({percent.toFixed(1)}%)
        </Text>
      </View>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: 'good' | 'warn' | 'bad' | 'info';
}) {
  const icon =
    status === 'good' ? (
      <CheckCircle size={16} color={Colors.success} />
    ) : status === 'warn' ? (
      <AlertTriangle size={16} color={Colors.warning} />
    ) : status === 'bad' ? (
      <XCircle size={16} color={Colors.danger} />
    ) : null;

  return (
    <View style={summaryRowStyles.row}>
      <Text style={summaryRowStyles.label}>{label}</Text>
      <View style={summaryRowStyles.valueWrap}>
        {icon}
        <Text
          style={[
            summaryRowStyles.value,
            status === 'good' && { color: Colors.success },
            status === 'warn' && { color: Colors.warning },
            status === 'bad' && { color: Colors.danger },
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const colorBarStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  labelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 70,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  barCol: {
    flex: 1,
  },
  barBg: {
    height: 8,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 2,
  },
  valueCol: {
    width: 85,
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
});

const summaryRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  value: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageSection: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 240,
    backgroundColor: Colors.surfaceAlt,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 52,
  },
  navBtnGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    gap: 20,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  gradePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gradeText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  metaInfo: {
    alignItems: 'flex-end',
    gap: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 4,
  },
  alertsSection: {
    gap: 6,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  alertText: {
    fontSize: 13,
    fontWeight: '500' as const,
    flex: 1,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorGrid: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryGrid: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  footerInfo: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backButtonText: {
    color: Colors.textInverse,
    fontWeight: '600' as const,
  },
});
