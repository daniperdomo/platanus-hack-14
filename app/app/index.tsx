import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { claimPairing, fetchInbox, fetchRequest, markPaired } from '../lib/api';
import { confirmIdentity } from '../lib/confirm';
import { decryptJson, fromBase64Url } from '../lib/crypto';
import { setPending } from '../lib/pending';
import { loadWallet, saveWallet, type PrivateJwk, type Wallet } from '../lib/wallet';
import { colors, hairline, radius, type, ui } from '../constants/theme';

const { width, height } = Dimensions.get('window');
const FRAME_SIZE = width * 0.72;

const FEATURES: { icon: keyof typeof Feather.glyphMap; title: string; description: string }[] = [
  {
    icon: 'lock',
    title: 'Bóveda cifrada',
    description: 'Tus datos se descifran solo en este teléfono.',
  },
  {
    icon: 'shield',
    title: 'Tú apruebas',
    description: 'Cada inicio de sesión te pide confirmación.',
  },
  {
    icon: 'check-square',
    title: 'Datos justos',
    description: 'Ves qué pide el sitio, para qué y por cuánto tiempo.',
  },
];

type PairingPayload = {
  token: string;
  privateJwk: PrivateJwk;
  vaultKey: string;
  vaultCiphertext: string;
};

export default function OnboardingScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraMode, setCameraMode] = useState<null | 'pair' | 'approve'>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const scanning = useRef(false);
  const prompted = useRef<string | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ scan?: string }>();

  useEffect(() => {
    loadWallet()
      .then(setWallet)
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (params.scan === 'approve' && wallet) setCameraMode('approve');
  }, [params.scan, wallet]);

  useFocusEffect(
    useCallback(() => {
      if (!wallet) return undefined;
      let stop = false;
      prompted.current = null;
      const look = async () => {
        try {
          const inbox = await fetchInbox(wallet.token);
          const prompt = inbox.requests.find((item) => item.kind === 'login');
          if (!prompt || stop || prompted.current === prompt.request_id) return;
          prompted.current = prompt.request_id;
          setPending(prompt);
          router.push('/consent');
        } catch {
          // The next poll retries. A closed app simply waits until it opens.
        }
      };
      look();
      const timer = setInterval(look, 4000);
      return () => {
        stop = true;
        clearInterval(timer);
      };
    }, [router, wallet])
  );

  const startCamera = async (mode: 'pair' | 'approve') => {
    if (!permission?.granted) {
      const next = await requestPermission();
      if (!next.granted) return;
    }
    scanning.current = false;
    setError('');
    setCameraMode(mode);
  };

  const onBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanning.current) return;
    scanning.current = true;
    setError('');
    try {
      const url = new URL(data);
      if (url.protocol !== 'zeroid:') throw new Error('Ese código no es de ZeroID.');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (url.hostname === 'pair') {
        await pairPhone(url);
        return;
      }
      if (url.hostname === 'approve') {
        const requestId = url.searchParams.get('request');
        if (!requestId) throw new Error('El código no trae una solicitud.');
        setPending(await fetchRequest(requestId));
        setCameraMode(null);
        router.push('/consent');
        return;
      }
      throw new Error('Ese código no es de ZeroID.');
    } catch (err) {
      scanning.current = false;
      setError(err instanceof Error ? err.message : 'No pudimos leer el código.');
    }
  };

  const pairPhone = async (url: URL) => {
    const id = url.searchParams.get('id');
    const key = url.searchParams.get('key');
    if (!id || !key) throw new Error('El código de vinculación está incompleto.');
    const confirmed = await confirmIdentity();
    if (!confirmed) throw new Error('Hace falta confirmar tu identidad para vincular.');
    const claimed = await claimPairing(id);
    const decoded = decryptJson<PairingPayload>(fromBase64Url(key), claimed.payload);
    const vault = decryptJson<Record<string, string>>(
      fromBase64Url(decoded.vaultKey),
      decoded.vaultCiphertext
    );
    const next = {
      token: decoded.token,
      privateJwk: decoded.privateJwk,
      vaultKey: decoded.vaultKey,
      vault,
    };
    await saveWallet(next);
    await markPaired(decoded.token).catch(() => undefined);
    setWallet(next);
    setCameraMode(null);
    router.replace('/dashboard');
  };

  if (!cameraMode) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <StatusBar style="light" />

        <View style={styles.brand}>
          <View style={styles.logoMark} />
          <Text style={styles.brandText}>ZeroID</Text>
        </View>

        <View style={styles.hero}>
          <Text style={type.overline}>
            {wallet ? 'Teléfono vinculado' : 'Vincula tu ZeroID'}
          </Text>
          <Text style={[type.display, styles.heroTitle]}>
            {wallet ? 'Listo para confirmar.' : 'Escanea el código del registro.'}{' '}
            <Text style={styles.heroTitleMuted}>
              {wallet ? 'Las solicitudes llegan aquí.' : 'La credencial queda cifrada en el teléfono.'}
            </Text>
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
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity
            style={ui.primaryButton}
            onPress={() => startCamera(wallet ? 'approve' : 'pair')}
            activeOpacity={0.85}
            disabled={!ready}
          >
            <Feather name="maximize" size={18} color={colors.inverse} />
            <Text style={ui.primaryButtonText}>
              {wallet ? 'Escanear QR de un sitio' : 'Escanear QR de vinculación'}
            </Text>
          </TouchableOpacity>

          {wallet ? (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.push('/dashboard')}
              activeOpacity={0.6}
            >
              <Text style={styles.linkButtonText}>Ver mis accesos activos</Text>
              <Feather name="chevron-right" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <StatusBar style="light" />

      {permission?.granted ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onBarcodeScanned}
        >
          <View style={styles.cameraOverlay}>
            <View style={[styles.cameraHeader, { paddingTop: insets.top + 12 }]}>
              <Text style={type.overline}>
                {cameraMode === 'pair' ? 'Vincular teléfono' : 'Aprobar un sitio'}
              </Text>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setCameraMode(null)}
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
              <Text style={styles.instructionsTitle}>
                {cameraMode === 'pair' ? 'Apunta al QR del registro' : 'Apunta al QR del sitio'}
              </Text>
              <Text style={styles.instructionsSubtitle}>
                {error || 'Lo leemos en cuanto esté dentro del marco'}
              </Text>
            </View>
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
            onPress={() => setCameraMode(null)}
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
  errorText: {
    color: colors.destructive,
    fontSize: 14,
    textAlign: 'center',
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
