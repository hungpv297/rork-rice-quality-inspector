import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  subtitle?: string;
  color?: string;
}

export default React.memo(function MetricCard({
  title,
  value,
  unit,
  icon,
  subtitle,
  color,
}: MetricCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {icon && <View style={[styles.iconWrap, color ? { backgroundColor: color + '18' } : null]}>{icon}</View>}
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, color ? { color } : null]}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
  },
  title: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    flex: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  value: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  unit: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
});
