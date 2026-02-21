import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Wheat,
  User,
  Briefcase,
  Building2,
  Shield,
  ArrowRight,
  CheckCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { UserProfile, ROLE_LABELS } from '@/types';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { saveUser } = useUser();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserProfile['role']>('buyer_milled');
  const [organisation, setOrganisation] = useState('');
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  const animateStep = useCallback(
    (next: number) => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        setStep(next);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    },
    [fadeAnim]
  );

  const handleNext = useCallback(() => {
    if (step === 0) {
      if (!name.trim()) {
        Alert.alert('Required', 'Please enter your name.');
        return;
      }
      if (!username.trim()) {
        Alert.alert('Required', 'Please enter a username.');
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      animateStep(1);
    } else if (step === 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      animateStep(2);
    } else if (step === 2) {
      if (!disclaimerAccepted) {
        Alert.alert('Required', 'Please accept the disclaimer to continue.');
        return;
      }

      const profile: UserProfile = {
        id: Date.now().toString(36),
        name: name.trim(),
        username: username.trim(),
        role,
        organisation: organisation.trim() || undefined,
        disclaimerAccepted: true,
        disclaimerAcceptedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      saveUser(profile);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/(home)');
    }
  }, [step, name, username, role, organisation, disclaimerAccepted, saveUser, router, animateStep]);

  const roles = Object.entries(ROLE_LABELS) as [UserProfile['role'], string][];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight]}
        style={[styles.topSection, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.logoRow}>
          <View style={styles.logoWrap}>
            <Wheat size={28} color={Colors.accent} />
          </View>
        </View>
        <Text style={styles.welcomeTitle}>Rice Quality Inspector</Text>
        <Text style={styles.welcomeSubtitle}>
          Rapid field-level rice quality assessment
        </Text>
        <View style={styles.progressRow}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.progressDot, i === step && styles.progressDotActive, i < step && styles.progressDotDone]}
            />
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
          {step === 0 && (
            <>
              <Text style={styles.stepTitle}>Create Your Profile</Text>
              <Text style={styles.stepSubtitle}>
                Tell us about yourself so we can personalise your experience
              </Text>
              <View style={styles.fields}>
                <View style={styles.field}>
                  <View style={styles.fieldIcon}>
                    <User size={16} color={Colors.primary} />
                  </View>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Full Name *"
                    placeholderTextColor={Colors.textTertiary}
                    testID="onboard-name"
                  />
                </View>
                <View style={styles.field}>
                  <View style={styles.fieldIcon}>
                    <User size={16} color={Colors.primary} />
                  </View>
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Username *"
                    placeholderTextColor={Colors.textTertiary}
                    autoCapitalize="none"
                    testID="onboard-username"
                  />
                </View>
                <View style={styles.field}>
                  <View style={styles.fieldIcon}>
                    <Building2 size={16} color={Colors.primary} />
                  </View>
                  <TextInput
                    style={styles.input}
                    value={organisation}
                    onChangeText={setOrganisation}
                    placeholder="Organisation (optional)"
                    placeholderTextColor={Colors.textTertiary}
                    testID="onboard-org"
                  />
                </View>
              </View>
            </>
          )}

          {step === 1 && (
            <>
              <Text style={styles.stepTitle}>Select Your Role</Text>
              <Text style={styles.stepSubtitle}>
                This helps us show relevant information for your work
              </Text>
              <View style={styles.roleList}>
                {roles.map(([key, label]) => (
                  <Pressable
                    key={key}
                    style={[styles.roleCard, role === key && styles.roleCardActive]}
                    onPress={() => {
                      setRole(key);
                      Haptics.selectionAsync();
                    }}
                  >
                    <View style={styles.roleCardLeft}>
                      <Briefcase size={18} color={role === key ? Colors.primary : Colors.textSecondary} />
                      <Text style={[styles.roleCardText, role === key && styles.roleCardTextActive]}>
                        {label}
                      </Text>
                    </View>
                    {role === key && <CheckCircle size={18} color={Colors.primary} />}
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.stepTitle}>Disclaimer</Text>
              <Text style={styles.stepSubtitle}>
                Please read and accept before using the app
              </Text>
              <View style={styles.disclaimerBox}>
                <Shield size={20} color={Colors.warning} />
                <Text style={styles.disclaimerText}>
                  This tool is intended for indicative, field-level quality assessment and
                  does not replace laboratory analysis or provide food safety certification.
                  Results should be used as guidance only and verified through standard
                  laboratory procedures for official grading or trade decisions.
                </Text>
              </View>
              <Pressable
                style={styles.checkRow}
                onPress={() => {
                  setDisclaimerAccepted(!disclaimerAccepted);
                  Haptics.selectionAsync();
                }}
                testID="accept-disclaimer"
              >
                <View
                  style={[styles.checkbox, disclaimerAccepted && styles.checkboxActive]}
                >
                  {disclaimerAccepted && <CheckCircle size={16} color={Colors.textInverse} />}
                </View>
                <Text style={styles.checkLabel}>
                  I understand and accept this disclaimer
                </Text>
              </Pressable>
            </>
          )}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[
            styles.nextBtn,
            step === 2 && !disclaimerAccepted && styles.nextBtnDisabled,
          ]}
          onPress={handleNext}
          disabled={step === 2 && !disclaimerAccepted}
          testID="next-button"
        >
          <Text style={styles.nextBtnText}>
            {step === 2 ? 'Get Started' : 'Continue'}
          </Text>
          <ArrowRight size={18} color={Colors.textInverse} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topSection: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: 'center',
  },
  logoRow: {
    marginBottom: 12,
  },
  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.textInverse,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 4,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  progressDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  progressDotActive: {
    backgroundColor: Colors.accent,
    width: 48,
  },
  progressDotDone: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    padding: 24,
    paddingBottom: 20,
  },
  stepContent: {
    gap: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  stepSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: -8,
  },
  fields: {
    gap: 12,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    gap: 10,
  },
  fieldIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 14,
  },
  roleList: {
    gap: 8,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  roleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  roleCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleCardText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  roleCardTextActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.warningLight,
    borderRadius: 12,
    padding: 16,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 21,
    flex: 1,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  nextBtnDisabled: {
    opacity: 0.4,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
});
