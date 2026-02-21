import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { ChevronRight, Clock } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { ScanResult, RICE_TYPE_LABELS } from '@/types';
import { getGradeColor } from '@/services/classifications';

interface ScanCardProps {
  scan: ScanResult;
  onPress: () => void;
}

export default React.memo(function ScanCard({ scan, onPress }: ScanCardProps) {
  const gradeColor = getGradeColor(scan.classifications.millingGrade);
  const date = new Date(scan.timestamp);
  const dateStr = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      testID={`scan-card-${scan.id}`}
    >
      <Image source={{ uri: scan.imageUri }} style={styles.image} contentFit="cover" />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={[styles.gradeBadge, { backgroundColor: gradeColor + '18' }]}>
            <Text style={[styles.gradeText, { color: gradeColor }]}>
              {scan.classifications.millingGrade}
            </Text>
          </View>
          <Text style={styles.riceType}>{RICE_TYPE_LABELS[scan.riceType]}</Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statText}>
            {scan.grainCounts.total} grains · {scan.brokenPercent.toFixed(1)}% broken
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Clock size={12} color={Colors.textTertiary} />
          <Text style={styles.dateText}>
            {dateStr} · {timeStr}
          </Text>
        </View>
      </View>
      <ChevronRight size={18} color={Colors.textTertiary} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  cardPressed: {
    backgroundColor: Colors.surfaceAlt,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  gradeText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  riceType: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
});
