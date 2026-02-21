import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import {
  Camera,
  ImageIcon,
  Scan,
  CircleAlert,
  CheckCircle,
  X,
  ChevronDown,
} from 'lucide-react-native';
import { useMutation } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { RiceType, ScanResult, RICE_TYPE_LABELS } from '@/types';
import { runInference, MODEL_VERSION } from '@/services/inference';
import { computeClassifications } from '@/services/classifications';
import { useScans } from '@/contexts/ScanContext';

export default function CaptureScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addScan } = useScans();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [riceType, setRiceType] = useState<RiceType>('White');
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const analysisMutation = useMutation({
    mutationFn: async (uri: string) => {
      console.log('[Capture] Starting analysis for image:', uri);
      const result = await runInference(uri, riceType);
      return result;
    },
    onSuccess: (result) => {
      if (!imageUri) return;
      const total = result.grainCounts.total || 1;
      const brokenPercent = Math.round((result.grainCounts.broken / total) * 1000) / 10;
      const longPercent = Math.round((result.grainCounts.long / total) * 1000) / 10;
      const mediumPercent = Math.round((result.grainCounts.medium / total) * 1000) / 10;
      const shortPercent = Math.round((100 - longPercent - mediumPercent) * 10) / 10;
      const blackPercent = Math.round((result.grainCounts.black / total) * 1000) / 10;
      const chalkyPercent = Math.round((result.grainCounts.chalky / total) * 1000) / 10;
      const redPercent = Math.round((result.grainCounts.red / total) * 1000) / 10;
      const yellowPercent = Math.round((result.grainCounts.yellow / total) * 1000) / 10;
      const greenPercent = Math.round((result.grainCounts.green / total) * 1000) / 10;

      const classifications = computeClassifications(
        result.grainCounts,
        result.kernelShape.lwRatio,
        riceType
      );

      const scan: ScanResult = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        imageUri,
        riceType,
        grainCounts: result.grainCounts,
        kernelShape: result.kernelShape,
        colorProfile: result.colorProfile,
        classifications,
        brokenPercent,
        longPercent,
        mediumPercent,
        shortPercent,
        blackPercent,
        chalkyPercent,
        redPercent,
        yellowPercent,
        greenPercent,
        timestamp: new Date().toISOString(),
        modelVersion: MODEL_VERSION,
        processingTimeMs: result.processingTimeMs,
      };

      addScan(scan);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push(`/results/${scan.id}`);
    },
    onError: (error) => {
      console.error('[Capture] Analysis failed:', error);
      Alert.alert(
        'Analysis Failed',
        'Could not complete the rice quality analysis. Please try again with a clearer image.',
        [{ text: 'OK' }]
      );
    },
  });

  const pickImage = useCallback(async (useCamera: boolean) => {
    try {
      let result: ImagePicker.ImagePickerResult;
      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Camera access is needed to capture rice samples.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          quality: 0.8,
          allowsEditing: false,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          quality: 0.8,
          allowsEditing: false,
          mediaTypes: ['images'],
        });
      }

      if (!result.canceled && result.assets[0]) {
        console.log('[Capture] Image selected:', result.assets[0].uri.slice(0, 60));
        setImageUri(result.assets[0].uri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (err) {
      console.error('[Capture] Image picker error:', err);
      Alert.alert('Error', 'Could not access camera or gallery. Please try again.');
    }
  }, []);

  const handleAnalyse = useCallback(() => {
    if (!imageUri) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.96, duration: 60, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
    ]).start();
    analysisMutation.mutate(imageUri);
  }, [imageUri, analysisMutation, pulseAnim]);

  const clearImage = useCallback(() => {
    setImageUri(null);
    analysisMutation.reset();
  }, [analysisMutation]);

  const isAnalysing = analysisMutation.isPending;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Capture Sample</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.guidanceCard}>
          <View style={styles.guidanceHeader}>
            <CircleAlert size={16} color={Colors.info} />
            <Text style={styles.guidanceTitle}>Photo Guidelines</Text>
          </View>
          <View style={styles.guidanceItems}>
            <Text style={styles.guidanceItem}>• Use a blue background for best results</Text>
            <Text style={styles.guidanceItem}>• Spread grains in a single layer</Text>
            <Text style={styles.guidanceItem}>• Avoid shadows and ensure good lighting</Text>
            <Text style={styles.guidanceItem}>• Keep the camera steady and in focus</Text>
          </View>
        </View>

        <View style={styles.riceTypeSection}>
          <Text style={styles.sectionLabel}>Rice Type</Text>
          <Pressable
            style={styles.typeSelector}
            onPress={() => setShowTypeSelector(!showTypeSelector)}
            testID="rice-type-selector"
          >
            <Text style={styles.typeSelectorText}>{RICE_TYPE_LABELS[riceType]}</Text>
            <ChevronDown size={18} color={Colors.textSecondary} />
          </Pressable>
          {showTypeSelector && (
            <View style={styles.typeOptions}>
              {(['White', 'Paddy', 'Brown'] as RiceType[]).map((type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.typeOption,
                    riceType === type && styles.typeOptionActive,
                  ]}
                  onPress={() => {
                    setRiceType(type);
                    setShowTypeSelector(false);
                    Haptics.selectionAsync();
                  }}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      riceType === type && styles.typeOptionTextActive,
                    ]}
                  >
                    {RICE_TYPE_LABELS[type]}
                  </Text>
                  {riceType === type && (
                    <CheckCircle size={16} color={Colors.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {!imageUri ? (
          <View style={styles.captureArea}>
            <View style={styles.captureButtons}>
              <Pressable
                style={({ pressed }) => [styles.captureBtn, pressed && styles.captureBtnPressed]}
                onPress={() => pickImage(true)}
                testID="camera-button"
              >
                <View style={styles.captureBtnIcon}>
                  <Camera size={28} color={Colors.primary} />
                </View>
                <Text style={styles.captureBtnTitle}>Take Photo</Text>
                <Text style={styles.captureBtnSub}>Use camera</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.captureBtn, pressed && styles.captureBtnPressed]}
                onPress={() => pickImage(false)}
                testID="gallery-button"
              >
                <View style={styles.captureBtnIcon}>
                  <ImageIcon size={28} color={Colors.primary} />
                </View>
                <Text style={styles.captureBtnTitle}>Gallery</Text>
                <Text style={styles.captureBtnSub}>Choose photo</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.previewArea}>
            <View style={styles.previewImageWrap}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
              <Pressable style={styles.clearBtn} onPress={clearImage} testID="clear-image">
                <X size={18} color={Colors.textInverse} />
              </Pressable>
            </View>

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Pressable
                style={[styles.analyseBtn, isAnalysing && styles.analyseBtnDisabled]}
                onPress={handleAnalyse}
                disabled={isAnalysing}
                testID="analyse-button"
              >
                {isAnalysing ? (
                  <View style={styles.analysingContent}>
                    <ActivityIndicator size="small" color={Colors.textInverse} />
                    <Text style={styles.analyseBtnText}>Analysing...</Text>
                  </View>
                ) : (
                  <View style={styles.analysingContent}>
                    <Scan size={20} color={Colors.textInverse} />
                    <Text style={styles.analyseBtnText}>Analyse Quality</Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>

            {isAnalysing && (
              <View style={styles.processingInfo}>
                <Text style={styles.processingText}>
                  Processing image with AI model...
                </Text>
                <Text style={styles.processingSubtext}>
                  This usually takes a few seconds
                </Text>
              </View>
            )}
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40,
    gap: 16,
  },
  guidanceCard: {
    backgroundColor: Colors.infoLight,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  guidanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guidanceTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E40AF',
  },
  guidanceItems: {
    gap: 3,
  },
  guidanceItem: {
    fontSize: 13,
    color: '#1E3A5F',
    lineHeight: 20,
  },
  riceTypeSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  typeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeSelectorText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  typeOptions: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  typeOptionActive: {
    backgroundColor: Colors.primaryLight + '10',
  },
  typeOptionText: {
    fontSize: 15,
    color: Colors.text,
  },
  typeOptionTextActive: {
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  captureArea: {
    marginTop: 8,
  },
  captureButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  captureBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  captureBtnPressed: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.primary,
  },
  captureBtnIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  captureBtnSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  previewArea: {
    gap: 16,
  },
  previewImageWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceAlt,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  clearBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyseBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyseBtnDisabled: {
    backgroundColor: Colors.primaryLight,
    opacity: 0.8,
  },
  analysingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  analyseBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  processingInfo: {
    alignItems: 'center',
    gap: 4,
  },
  processingText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  processingSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
