import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User,
  Building2,
  Briefcase,
  Info,
  Shield,
  ChevronRight,
  LogOut,
  Save,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { UserProfile, ROLE_LABELS } from '@/types';
import { MODEL_VERSION } from '@/services/inference';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, saveUser, clearUser } = useUser();

  const [name, setName] = useState(user?.name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [role, setRole] = useState<UserProfile['role']>(user?.role ?? 'buyer_milled');
  const [organisation, setOrganisation] = useState(user?.organisation ?? '');
  const [showRoles, setShowRoles] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleFieldChange = useCallback(
    (setter: (val: string) => void) => (val: string) => {
      setter(val);
      setHasChanges(true);
    },
    []
  );

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    if (!username.trim()) {
      Alert.alert('Required', 'Please enter a username.');
      return;
    }

    const profile: UserProfile = {
      id: user?.id ?? Date.now().toString(36),
      name: name.trim(),
      username: username.trim(),
      role,
      organisation: organisation.trim() || undefined,
      disclaimerAccepted: user?.disclaimerAccepted ?? false,
      disclaimerAcceptedAt: user?.disclaimerAcceptedAt,
      createdAt: user?.createdAt ?? new Date().toISOString(),
    };

    saveUser(profile);
    setHasChanges(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Saved', 'Your profile has been updated.');
  }, [name, username, role, organisation, user, saveUser]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Reset Profile',
      'This will clear your profile data. Scan history will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            clearUser();
            router.replace('/onboarding');
          },
        },
      ]
    );
  }, [clearUser, router]);

  const roles = Object.entries(ROLE_LABELS) as [UserProfile['role'], string][];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        {hasChanges && (
          <Pressable style={styles.saveBtn} onPress={handleSave} testID="save-profile">
            <Save size={16} color={Colors.textInverse} />
            <Text style={styles.saveBtnText}>Save</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.fieldGroup}>
            <View style={styles.field}>
              <View style={styles.fieldLabel}>
                <User size={14} color={Colors.textSecondary} />
                <Text style={styles.fieldLabelText}>Full Name *</Text>
              </View>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={handleFieldChange(setName)}
                placeholder="Enter your name"
                placeholderTextColor={Colors.textTertiary}
                testID="name-input"
              />
            </View>
            <View style={styles.fieldDivider} />
            <View style={styles.field}>
              <View style={styles.fieldLabel}>
                <User size={14} color={Colors.textSecondary} />
                <Text style={styles.fieldLabelText}>Username *</Text>
              </View>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={handleFieldChange(setUsername)}
                placeholder="Enter a username"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="none"
                testID="username-input"
              />
            </View>
            <View style={styles.fieldDivider} />
            <View style={styles.field}>
              <View style={styles.fieldLabel}>
                <Briefcase size={14} color={Colors.textSecondary} />
                <Text style={styles.fieldLabelText}>Role</Text>
              </View>
              <Pressable
                style={styles.roleSelector}
                onPress={() => setShowRoles(!showRoles)}
              >
                <Text style={styles.roleSelectorText}>{ROLE_LABELS[role]}</Text>
                <ChevronRight
                  size={16}
                  color={Colors.textTertiary}
                  style={{ transform: [{ rotate: showRoles ? '90deg' : '0deg' }] }}
                />
              </Pressable>
              {showRoles && (
                <View style={styles.roleOptions}>
                  {roles.map(([key, label]) => (
                    <Pressable
                      key={key}
                      style={[styles.roleOption, role === key && styles.roleOptionActive]}
                      onPress={() => {
                        setRole(key);
                        setShowRoles(false);
                        setHasChanges(true);
                        Haptics.selectionAsync();
                      }}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          role === key && styles.roleOptionTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.fieldDivider} />
            <View style={styles.field}>
              <View style={styles.fieldLabel}>
                <Building2 size={14} color={Colors.textSecondary} />
                <Text style={styles.fieldLabelText}>Organisation (optional)</Text>
              </View>
              <TextInput
                style={styles.input}
                value={organisation}
                onChangeText={handleFieldChange(setOrganisation)}
                placeholder="Your organisation"
                placeholderTextColor={Colors.textTertiary}
                testID="org-input"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <View style={styles.fieldGroup}>
            <Pressable
              style={styles.menuItem}
              onPress={() => router.push('/about')}
            >
              <View style={styles.menuItemLeft}>
                <Info size={18} color={Colors.primary} />
                <Text style={styles.menuItemText}>About & Model Info</Text>
              </View>
              <ChevronRight size={16} color={Colors.textTertiary} />
            </Pressable>
            <View style={styles.fieldDivider} />
            <Pressable
              style={styles.menuItem}
              onPress={() => router.push('/disclaimer')}
            >
              <View style={styles.menuItemLeft}>
                <Shield size={18} color={Colors.primary} />
                <Text style={styles.menuItemText}>Disclaimer</Text>
              </View>
              <ChevronRight size={16} color={Colors.textTertiary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.fieldGroup}>
            <Pressable style={styles.logoutBtn} onPress={handleLogout}>
              <LogOut size={18} color={Colors.danger} />
              <Text style={styles.logoutText}>Reset Profile</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.versionText}>Model: {MODEL_VERSION}</Text>
      </ScrollView>
    </View>
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
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40,
    gap: 24,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  fieldGroup: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  field: {
    padding: 14,
    gap: 8,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 14,
  },
  fieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabelText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  input: {
    fontSize: 15,
    color: Colors.text,
    padding: 0,
  },
  roleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleSelectorText: {
    fontSize: 15,
    color: Colors.text,
  },
  roleOptions: {
    marginTop: 8,
    gap: 2,
  },
  roleOption: {
    padding: 10,
    borderRadius: 8,
  },
  roleOptionActive: {
    backgroundColor: Colors.primary + '10',
  },
  roleOptionText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  roleOptionTextActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuItemText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    color: Colors.danger,
    fontWeight: '600' as const,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
