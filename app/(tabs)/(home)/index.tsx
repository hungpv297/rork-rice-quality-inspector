import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera, TrendingUp, Award, BarChart3, Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { useScans } from '@/contexts/ScanContext';
import ScanCard from '@/components/ScanCard';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useUser();
  const { scans, stats } = useScans();
  const recentScans = scans.slice(0, 3);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handleCapturePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(() => {
      router.push('/(tabs)/capture');
    });
  };

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight]}
        style={[styles.headerGradient, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>{user?.name || 'Inspector'}</Text>
          </View>
          <Pressable
            style={styles.infoBtn}
            onPress={() => router.push('/about')}
            testID="about-button"
          >
            <Info size={20} color={Colors.textInverse} />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <BarChart3 size={16} color={Colors.accent} />
            </View>
            <Text style={styles.statValue}>{stats.totalScans}</Text>
            <Text style={styles.statLabel}>Total Scans</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <TrendingUp size={16} color={Colors.accent} />
            </View>
            <Text style={styles.statValue}>{stats.avgBroken}%</Text>
            <Text style={styles.statLabel}>Avg Broken</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Award size={16} color={Colors.accent} />
            </View>
            <Text style={styles.statValue}>{stats.premiumCount}</Text>
            <Text style={styles.statLabel}>Premium</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Pressable
            style={styles.captureCard}
            onPress={handleCapturePress}
            testID="capture-button"
          >
            <LinearGradient
              colors={[Colors.accent, Colors.accentDark]}
              style={styles.captureGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.captureIconWrap}>
                <Camera size={28} color={Colors.primaryDark} />
              </View>
              <View style={styles.captureTextWrap}>
                <Text style={styles.captureTitle}>New Inspection</Text>
                <Text style={styles.captureSubtitle}>
                  Take a photo of rice sample to analyse quality
                </Text>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        <View style={styles.disclaimerBanner}>
          <Info size={14} color={Colors.warning} />
          <Text style={styles.disclaimerText}>
            Indicative field-level assessment only. Does not replace laboratory analysis.
          </Text>
        </View>

        {recentScans.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Inspections</Text>
              <Pressable onPress={() => router.push('/(tabs)/history')}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            <View style={styles.scansList}>
              {recentScans.map((scan) => (
                <ScanCard
                  key={scan.id}
                  scan={scan}
                  onPress={() => router.push(`/results/${scan.id}`)}
                />
              ))}
            </View>
          </View>
        )}

        {recentScans.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Camera size={40} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No inspections yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap "New Inspection" above to analyse your first rice sample
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500' as const,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.textInverse,
    marginTop: 2,
  },
  infoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500' as const,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  captureCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  captureGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  captureIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureTextWrap: {
    flex: 1,
  },
  captureTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primaryDark,
  },
  captureSubtitle: {
    fontSize: 13,
    color: 'rgba(15,34,24,0.7)',
    marginTop: 2,
  },
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warningLight,
    borderRadius: 10,
    padding: 10,
    paddingHorizontal: 12,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#92400E',
    flex: 1,
    lineHeight: 16,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  scansList: {
    gap: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
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
    lineHeight: 20,
    maxWidth: 260,
  },
});
