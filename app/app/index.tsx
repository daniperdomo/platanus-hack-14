import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, hairline, radius, type, ui } from '../constants/theme';

const { width, height } = Dimensions.get('window');
const FRAME_SIZE = width * 0.72;

const FEATURES: { icon: keyof typeof Feather.glyphMap; title: string; description: string }[] = [
  {
    icon: 'log-in',
    title: 'Un solo login',
    description: 'Accede a múltiples servicios con una credencial.',
  },
  {
    icon: 'shield',
    title: 'Control de tus datos',
    description: 'Decide qué compartes y con quién.',
  },
  {
    icon: 'slash',
    title: 'Revocación inmediata',
    description: 'Corta cualquier acceso en un toque.',
  },
];

export default function OnboardingScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleCapture = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Aquí iría la lógica de captura del QR
    // Por ahora simulamos éxito y navegamos al dashboard
    setTimeout(() => {
      router.push('/dashboard');
    }, 500);
  };

  const startCamera = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
    setIsCameraActive(true);
  };

  if (!isCameraActive) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <StatusBar style="light" />

        <View style={styles.brand}>
          <View style={styles.logoMark} />
          <Text style={styles.brandText}>ZeroID</Text>
        </View>

        <View style={styles.hero}>
          <Text style={type.overline}>Smart SSO · Gestor de privacidad</Text>
          <Text style={[type.display, styles.heroTitle]}>
            Demuestra que eres real.{' '}
            <Text style={styles.heroTitleMuted}>Sin revelar quién eres.</Text>
          </Text>

          <View style={styles.featureList}>
            {FEATURES.map((feature, index) => (
              <View
                key={feature.title}
                style={[styles.featureRow, index > 0 && styles.featureRowDivider]}
              >
                <View style={styles.featureIcon}>
                  <Feather name={feature.icon} size={16} color={colors.text} />
                </View>
                <View style={styles.featureCopy}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.cta}>
          <TouchableOpacity style={ui.primaryButton} onPress={startCamera} activeOpacity={0.85}>
            <Feather name="maximize" size={18} color={colors.inverse} />
            <Text style={ui.primaryButtonText}>Escanear QR de login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/dashboard')}
            activeOpacity={0.6}
          >
            <Text style={styles.linkButtonText}>Ver mis accesos activos</Text>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <StatusBar style="light" />

      {permission?.granted ? (
        <CameraView style={StyleSheet.absoluteFill} facing="back">
          <View style={styles.cameraOverlay}>
            <View style={[styles.cameraHeader, { paddingTop: insets.top + 12 }]}>
              <Text style={type.overline}>Escáner seguro</Text>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setIsCameraActive(false)}
                activeOpacity={0.7}
              >
                <Feather name="x" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>

            <View style={styles.instructions}>
              <Text style={styles.instructionsTitle}>Apunta al QR de login</Text>
              <Text style={styles.instructionsSubtitle}>
                Detectaremos el código automáticamente
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.captureButton, { bottom: insets.bottom + 40 }]}
              onPress={handleCapture}
              activeOpacity={0.85}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      ) : (
        <View style={[styles.permission, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.permissionIcon}>
            <Feather name="camera" size={22} color={colors.text} />
          </View>
          <Text style={[type.title, styles.permissionTitle]}>Acceso a la cámara</Text>
          <Text style={[type.body, styles.permissionText]}>
            Necesitamos la cámara para escanear códigos QR de login. Las imágenes nunca salen de tu
            dispositivo.
          </Text>
          <TouchableOpacity
            style={[ui.primaryButton, styles.permissionButton]}
            onPress={requestPermission}
            activeOpacity={0.85}
          >
            <Text style={ui.primaryButtonText}>Permitir cámara</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => setIsCameraActive(false)}
            activeOpacity={0.6}
          >
            <Text style={styles.linkButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const CORNER = 28;
const CORNER_WIDTH = 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: colors.text,
  },
  brandText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.text,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
  },
  heroTitle: {
    marginTop: 16,
    marginBottom: 40,
  },
  heroTitleMuted: {
    color: colors.textSubtle,
  },
  featureList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 20,
  },
  featureRowDivider: {
    borderTopWidth: hairline,
    borderTopColor: colors.border,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCopy: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  cta: {
    gap: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 14,
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 14, 17, 0.45)',
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    position: 'absolute',
    top: height * 0.24,
    left: (width - FRAME_SIZE) / 2,
    width: FRAME_SIZE,
    height: FRAME_SIZE,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: colors.text,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderTopLeftRadius: radius.md,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopRightRadius: radius.md,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomLeftRadius: radius.md,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: radius.md,
  },
  instructions: {
    position: 'absolute',
    top: height * 0.24 + FRAME_SIZE + 32,
    left: 24,
    right: 24,
    alignItems: 'center',
    gap: 6,
  },
  instructionsTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: colors.text,
  },
  instructionsSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  captureButton: {
    position: 'absolute',
    left: width / 2 - 36,
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.text,
  },
  permission: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    marginBottom: 10,
  },
  permissionText: {
    marginBottom: 32,
  },
  permissionButton: {
    marginBottom: 4,
  },
});
