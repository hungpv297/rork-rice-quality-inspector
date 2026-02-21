import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface QualityBadgeProps {
  label: string;
  value: string;
  color: string;
  size?: 'small' | 'medium' | 'large';
}

export default React.memo(function QualityBadge({ label, value, color, size = 'medium' }: QualityBadgeProps) {
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <View style={[styles.container, isLarge && styles.containerLarge]}>
      <Text style={[styles.label, isSmall && styles.labelSmall]} numberOfLines={1}>
        {label}
      </Text>
      <View style={[styles.badge, { backgroundColor: color + '18' }, isLarge && styles.badgeLarge]}>
        <Text
          style={[
            styles.value,
            { color },
            isSmall && styles.valueSmall,
            isLarge && styles.valueLarge,
          ]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  containerLarge: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeLarge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  value: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  valueSmall: {
    fontSize: 11,
  },
  valueLarge: {
    fontSize: 15,
  },
});
