import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fonts, hairline, radius, type, ui } from '../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
const INGEST_URL = `${API_URL}/ingest`;

const DEFAULT_ERROR = 'No pudimos validar tu identidad. Intenta de nuevo.';
const NETWORK_ERROR = 'No hay conexión con el servidor. Revisa tu red e intenta de nuevo.';

type Step = 'SCAN_PASSPORT' | 'SCAN_FACE' | 'PROCESSING';

const { width } = Dimensions.get('window');
const PASSPORT_FRAME_WIDTH = width * 0.86;
const PASSPORT_FRAME_HEIGHT = PASSPORT_FRAME_WIDTH / 1.42;
const FACE_FRAME_SIZE = width * 0.68;
const FRAME_BORDER = 'rgba(255, 255, 255, 0.2)';

const SCAN_COPY: Record<Exclude<Step, 'PROCESSING'>, { overline: string; title: string; subtitle: string }> = {
  SCAN_PASSPORT: {
    overline: 'Paso 1 de 2 · Pasaporte',
    title: 'Encuadra la página de datos',
    subtitle: 'Las dos líneas inferiores (MRZ) deben verse nítidas',
  },
  SCAN_FACE: {
    overline: 'Paso 2 de 2 · Rostro',
    title: 'Centra tu rostro en el círculo',
    subtitle: 'Buena luz, sin lentes ni gorra',
  },
};

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

function toUploadFile(uri: string) {
  return { uri, name: 'image.jpg', type: 'image/jpeg' } as unknown as Blob;
}

async function submitVerification(passportUri: string, faceUri: string, signal: AbortSignal) {
  const body = new FormData();
  body.append('document', toUploadFile(passportUri));
  body.append('selfie', toUploadFile(faceUri));

  let response: Response;
  try {
    response = await fetch(INGEST_URL, { method: 'POST', body, signal });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error(NETWORK_ERROR);
  }

  if (response.status !== 200) {
    const payload = await response.json().catch(() => null);
    throw new Error(typeof payload?.detail === 'string' ? payload.detail : DEFAULT_ERROR);
  }
}

export default function OnboardingScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [step, setStep] = useState<Step>('SCAN_PASSPORT');
  const [passportUri, setPassportUri] = useState<string | null>(null);
  const [faceUri, setFaceUri] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const resetScan = useCallback(() => {
    setPassportUri(null);
    setFaceUri(null);
    setIsCameraReady(false);
    setStep('SCAN_PASSPORT');
  }, []);

  useEffect(() => {
    if (step !== 'PROCESSING' || !passportUri || !faceUri) return;

    const controller = new AbortController();
    submitVerification(passportUri, faceUri, controller.signal)
      .then(async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/dashboard');
      })
      .catch(async (error: unknown) => {
        if (controller.signal.aborted) return;
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Verificación fallida', error instanceof Error ? error.message : DEFAULT_ERROR);
        resetScan();
      });

    return () => controller.abort();
  }, [step, passportUri, faceUri, router, resetScan]);

  const handleCapture = async () => {
    if (!cameraRef.current || !isCameraReady || isCapturing) return;

    setIsCapturing(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const photo = await cameraRef.current.takePictureAsync({ base64: false, quality: 0.7 });
      if (!photo?.uri) throw new Error('Sin imagen');

      if (step === 'SCAN_PASSPORT') {
        setPassportUri(photo.uri);
        setIsCameraReady(false);
        setStep('SCAN_FACE');
      } else if (step === 'SCAN_FACE') {
        setFaceUri(photo.uri);
        setStep('PROCESSING');
      }
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Captura fallida', 'No pudimos tomar la foto. Intenta de nuevo.');
    } finally {
      setIsCapturing(false);
    }
  };

  const startCamera = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
    resetScan();
    setIsCameraActive(true);
  };

  const closeCamera = () => {
    resetScan();
    setIsCameraActive(false);
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
            <Feather name="camera" size={18} color={colors.inverse} />
            <Text style={ui.primaryButtonText}>Verificar identidad</Text>
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

  if (step === 'PROCESSING') {
    return (
      <View style={styles.processing}>
        <StatusBar style="light" />
        <Text style={styles.processingText}>[ ENCRIPTANDO PAYLOAD... ]</Text>
      </View>
    );
  }

  const facing = step === 'SCAN_FACE' ? 'front' : 'back';
  const copy = SCAN_COPY[step];

  return (
    <View style={styles.cameraContainer}>
      <StatusBar style="light" />

      {permission?.granted ? (
        <CameraView
          key={facing}
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          onCameraReady={() => setIsCameraReady(true)}
        >
          <View style={[styles.cameraOverlay, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }]}>
            <View style={styles.cameraHeader}>
              <Text style={type.overline}>{copy.overline}</Text>
              <TouchableOpacity style={styles.iconButton} onPress={closeCamera} activeOpacity={0.7}>
                <Feather name="x" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.scanArea}>
              <View style={step === 'SCAN_FACE' ? styles.faceFrame : styles.passportFrame} />
              <View style={styles.instructions}>
                <Text style={styles.instructionsTitle}>{copy.title}</Text>
                <Text style={styles.instructionsSubtitle}>{copy.subtitle}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.captureButton, (!isCameraReady || isCapturing) && styles.captureButtonDisabled]}
              onPress={handleCapture}
              disabled={!isCameraReady || isCapturing}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={step === 'SCAN_FACE' ? 'Tomar selfie' : 'Fotografiar pasaporte'}
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
            Necesitamos la cámara para fotografiar tu pasaporte y tomar una selfie. Las fotos solo se
            usan para validar tu identidad.
          </Text>
          <TouchableOpacity
            style={[ui.primaryButton, styles.permissionButton]}
            onPress={requestPermission}
            activeOpacity={0.85}
          >
            <Text style={ui.primaryButtonText}>Permitir cámara</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} onPress={closeCamera} activeOpacity={0.6}>
            <Text style={styles.linkButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

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
    alignItems: 'center',
    backgroundColor: 'rgba(13, 14, 17, 0.45)',
  },
  cameraHeader: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: hairline,
    borderColor: colors.border,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  passportFrame: {
    width: PASSPORT_FRAME_WIDTH,
    height: PASSPORT_FRAME_HEIGHT,
    borderRadius: radius.md,
    borderWidth: hairline,
    borderColor: FRAME_BORDER,
  },
  faceFrame: {
    width: FACE_FRAME_SIZE,
    height: FACE_FRAME_SIZE,
    borderRadius: FACE_FRAME_SIZE / 2,
    borderWidth: hairline,
    borderColor: FRAME_BORDER,
  },
  instructions: {
    paddingHorizontal: 24,
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
    textAlign: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 0,
    shadowOpacity: 0,
  },
  captureButtonDisabled: {
    opacity: 0.4,
  },
  captureButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.text,
  },
  processing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  processingText: {
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.textMuted,
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
