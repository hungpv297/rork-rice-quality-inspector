import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Shield, AlertTriangle } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

export default function DisclaimerScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Disclaimer',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconWrap}>
          <Shield size={40} color={Colors.warning} />
        </View>

        <Text style={styles.title}>Important Notice</Text>

        <View style={styles.card}>
          <Text style={styles.text}>
            This tool is intended for indicative, field-level quality assessment and does
            not replace laboratory analysis or provide food safety certification.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Limitations</Text>
          <Text style={styles.text}>
            • Results are based on image analysis and may vary with image quality, lighting
            conditions, and sample preparation.
          </Text>
          <Text style={styles.text}>
            • The AI model provides estimates and should not be used as the sole basis for
            commercial transactions without additional verification.
          </Text>
          <Text style={styles.text}>
            • CIELAB colour values are approximate and derived from image data, not
            spectrophotometric measurement.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Best Practices</Text>
          <Text style={styles.text}>
            • Use a clean blue background when photographing rice samples.
          </Text>
          <Text style={styles.text}>
            • Spread grains in a single layer to avoid overlapping.
          </Text>
          <Text style={styles.text}>
            • Ensure adequate, even lighting without harsh shadows.
          </Text>
          <Text style={styles.text}>
            • Keep the camera steady and in focus.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Intellectual Property</Text>
          <Text style={styles.text}>
            This solution is co-owned by UNIDO and AfricaRice. The AI model is based
            on solutions from the UNIDO AfricaRice Quality Assessment Challenge.
          </Text>
        </View>

        <View style={styles.warningBox}>
          <AlertTriangle size={16} color={Colors.danger} />
          <Text style={styles.warningText}>
            For official grading, trade decisions, or food safety assessments,
            always use accredited laboratory analysis.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

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
    gap: 16,
    alignItems: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    width: '100%',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.dangerLight,
    borderRadius: 12,
    padding: 14,
    width: '100%',
  },
  warningText: {
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 20,
    flex: 1,
  },
});
