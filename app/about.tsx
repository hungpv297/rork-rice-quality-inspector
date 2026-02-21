import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Info, Cpu, Database, Shield, Globe } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { MODEL_VERSION } from '@/services/inference';
import { useScans } from '@/contexts/ScanContext';

export default function AboutScreen() {
  const { stats } = useScans();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'About',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <View style={styles.logoWrap}>
            <Cpu size={32} color={Colors.accent} />
          </View>
          <Text style={styles.appName}>Rice Quality Inspector</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Info size={16} color={Colors.primary} />
            <Text style={styles.sectionTitle}>About</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              Rice Quality Inspector is a field-level tool for rapid rice quality assessment.
              It uses AI to analyse images of rice samples and provide quality metrics including
              grain counts, kernel shape, colour composition, and milling grade classifications.
            </Text>
            <Text style={styles.cardText}>
              Designed for commercial rice value-chain actors in Ghana, including buyers of paddy
              and milled rice at farm gate, mill, and market levels.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Cpu size={16} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Model Information</Text>
          </View>
          <View style={styles.card}>
            <InfoRow label="Model Version" value={MODEL_VERSION} />
            <InfoRow label="Architecture" value="ConvNeXt Small (Tiled Multi-task)" />
            <InfoRow label="Input" value="8x6 grid of 512x512 tiles" />
            <InfoRow label="Source" value="UNIDO AfricaRice Quality Assessment Challenge (3rd Place)" />
            <InfoRow label="Inference" value="On-device (offline capable)" />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={16} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Data & Storage</Text>
          </View>
          <View style={styles.card}>
            <InfoRow label="Total Scans" value={stats.totalScans.toString()} />
            <InfoRow label="Max History" value="100 scans" />
            <InfoRow label="Storage" value="Local device only" />
            <InfoRow label="Export" value="CSV via email/share" />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe size={16} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Credits</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              Developed as part of the UNIDO AfricaRice initiative.
              AI model based on the winning solutions from the UNIDO AfricaRice
              Quality Assessment Challenge.
            </Text>
            <Text style={styles.cardTextSmall}>
              Intellectual property co-owned by UNIDO and AfricaRice.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={16} color={Colors.warning} />
            <Text style={styles.sectionTitle}>Disclaimer</Text>
          </View>
          <View style={[styles.card, styles.disclaimerCard]}>
            <Text style={styles.disclaimerText}>
              This tool is intended for indicative, field-level quality assessment and does not
              replace laboratory analysis or provide food safety certification. Results should
              be used as guidance only and verified through standard laboratory procedures for
              official grading or trade decisions.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoRowStyles.row}>
      <Text style={infoRowStyles.label}>{label}</Text>
      <Text style={infoRowStyles.value}>{value}</Text>
    </View>
  );
}

const infoRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  value: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500' as const,
    flex: 1,
    textAlign: 'right' as const,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 24,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  appVersion: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  cardText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  cardTextSmall: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 6,
  },
  disclaimerCard: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warning + '30',
  },
  disclaimerText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 20,
  },
});
