import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Trash2, Download, Search, Filter } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { Colors } from '@/constants/colors';
import { useScans } from '@/contexts/ScanContext';
import { ScanResult } from '@/types';
import ScanCard from '@/components/ScanCard';

function generateCSV(scans: ScanResult[]): string {
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

  const rows = scans.map((s) => {
    const d = new Date(s.timestamp);
    return [
      s.id,
      d.toISOString().split('T')[0],
      d.toISOString().split('T')[1]?.split('.')[0],
      s.riceType,
      s.classifications.millingGrade,
      s.classifications.grainShape,
      s.classifications.grainLengthClass,
      s.grainCounts.total,
      s.grainCounts.broken,
      s.grainCounts.long,
      s.grainCounts.medium,
      s.grainCounts.black,
      s.grainCounts.chalky,
      s.grainCounts.red,
      s.grainCounts.yellow,
      s.grainCounts.green,
      s.brokenPercent,
      s.chalkyPercent,
      s.blackPercent,
      s.redPercent,
      s.yellowPercent,
      s.greenPercent,
      s.kernelShape.lengthAvg,
      s.kernelShape.widthAvg,
      s.kernelShape.lwRatio,
      s.colorProfile.L,
      s.colorProfile.a,
      s.colorProfile.b,
      s.classifications.chalkinessStatus,
      s.classifications.blackStatus,
      s.classifications.greenStatus,
      s.classifications.redStatus,
      s.classifications.yellowStatus,
      s.modelVersion,
      s.processingTimeMs,
      s.latitude ?? '',
      s.longitude ?? '',
    ].join(',');
  });

  return [headers, ...rows].join('\n');
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { scans, clearAllScans } = useScans();
  const [filterGrade, setFilterGrade] = useState<string | null>(null);

  const filteredScans = useMemo(() => {
    if (!filterGrade) return scans;
    return scans.filter((s) => s.classifications.millingGrade === filterGrade);
  }, [scans, filterGrade]);

  const handleExport = useCallback(async () => {
    if (scans.length === 0) {
      Alert.alert('No Data', 'No scans available to export.');
      return;
    }
    try {
      const csv = generateCSV(scans);
      const fileName = `rice_quality_report_${new Date().toISOString().split('T')[0]}.csv`;

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
        console.log('[History] CSV file created:', file.uri);
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Rice Quality Report',
          UTI: 'public.comma-separated-values-text',
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('[History] Export failed:', err);
      Alert.alert('Export Failed', 'Could not export the data. Please try again.');
    }
  }, [scans]);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear All History',
      'This will delete all scan records. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearAllScans();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  }, [clearAllScans]);

  const grades = ['Premium', 'Grade 1', 'Grade 2', 'Grade 3', 'Below Grade'];

  const renderItem = useCallback(
    ({ item }: { item: ScanResult }) => (
      <ScanCard scan={item} onPress={() => router.push(`/results/${item.id}`)} />
    ),
    [router]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan History</Text>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.headerBtn}
            onPress={handleExport}
            testID="export-button"
          >
            <Download size={18} color={Colors.primary} />
          </Pressable>
          {scans.length > 0 && (
            <Pressable
              style={styles.headerBtn}
              onPress={handleClearAll}
              testID="clear-all-button"
            >
              <Trash2 size={18} color={Colors.danger} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.filterRow}>
        <ScrollableFilter
          options={['All', ...grades]}
          selected={filterGrade ?? 'All'}
          onSelect={(val) => {
            setFilterGrade(val === 'All' ? null : val);
            Haptics.selectionAsync();
          }}
        />
      </View>

      <FlatList
        data={filteredScans}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Search size={36} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>
              {filterGrade ? 'No matching scans' : 'No scan history'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filterGrade
                ? 'Try a different filter'
                : 'Complete an inspection to see it here'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

function ScrollableFilter({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (val: string) => void;
}) {
  return (
    <FlatList
      horizontal
      data={options}
      keyExtractor={(item) => item}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterContent}
      renderItem={({ item }) => (
        <Pressable
          style={[styles.filterChip, selected === item && styles.filterChipActive]}
          onPress={() => onSelect(item)}
        >
          <Text
            style={[
              styles.filterChipText,
              selected === item && styles.filterChipTextActive,
            ]}
          >
            {item}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterRow: {
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.textInverse,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
