import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import BrandLogo from '../components/BrandLogo';
import ThemeSwitcher from '../components/ThemeSwitcher';
import ZeroLoader from '../components/ZeroLoader';
import { type ThemeColors, fonts, radius, useTheme } from '../constants/theme';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [step, setStep] = useState<Step>('SCAN_PASSPORT');
  const [passportUri, setPassportUri] = useState<string | null>(null);
  const [faceUri, setFaceUri] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, type, ui, scheme, hairline } = useTheme();
  const styles = useMemo(() => createStyles(colors, hairline), [colors, hairline]);

  const resetScan = useCallback(() => {
    setPassportUri(null);
    setFaceUri(null);
    setIsCameraReady(false);
    setStep('SCAN_PASSPORT');
  }, []);

  useEffect(() => {
    if (!isLoading) return;

    const timer = setTimeout(async () => {
      if (!permission?.granted) {
        await requestPermission();
      }
      resetScan();
      setIsCameraActive(true);
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLoading, permission?.granted, requestPermission, resetScan]);

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

  const handleStart = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLoading(true);
  };

  const closeCamera = () => {
    resetScan();
    setIsCameraActive(false);
  };

  if (isLoading || step === 'PROCESSING') {
    return (
      <>
        <StatusBar style="light" />
        <ZeroLoader />
      </>
    );
  }

  if (!isCameraActive) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

        <View style={styles.topBar}>
          <ThemeSwitcher />
        </View>

        <View style={styles.hero}>
          <BrandLogo variant="lockup" height={36} />
          <Text style={styles.headline}>Zero-Retention Identity</Text>
          <Text style={styles.subhead}>Demuestra que eres real. Sin revelar quién eres.</Text>
        </View>

        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleStart}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Escanear pasaporte"
        >
          <Text style={styles.scanButtonText}>Escanear Pasaporte</Text>
        </TouchableOpacity>
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

function createStyles(colors: ThemeColors, hairline: number) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0D0E11',
      paddingHorizontal: 24,
    },
    topBar: {
      alignItems: 'flex-end',
    },
    hero: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    headline: {
      fontFamily: fonts.bold,
      fontSize: 28,
      letterSpacing: -0.6,
      color: '#FFFFFF',
      textAlign: 'center',
    },
    subhead: {
      fontFamily: fonts.regular,
      fontSize: 15,
      lineHeight: 22,
      color: '#8A8F9C',
      textAlign: 'center',
    },
    scanButton: {
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 6,
      elevation: 0,
      shadowOpacity: 0,
    },
    scanButtonText: {
      fontFamily: fonts.semibold,
      fontSize: 16,
      color: '#111111',
    },
    linkButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 14,
    },
    linkButtonText: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: colors.textMuted,
    },
    cameraContainer: {
      flex: 1,
      backgroundColor: '#0D0E11',
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
      fontFamily: fonts.semibold,
      fontSize: 17,
      letterSpacing: -0.2,
      color: colors.text,
    },
    instructionsSubtitle: {
      fontFamily: fonts.regular,
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
}
