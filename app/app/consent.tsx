import { useRef, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import BottomSheet, { BottomSheetView, type BottomSheetBackgroundProps } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, hairline, radius, type, ui } from '../constants/theme';

interface PermissionItem {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  required?: boolean;
}

const MOCK_APP = {
  name: 'Yummy',
  description: 'Plataforma de delivery de comida',
  clientId: 'client_id: yummy_prod_7f2c91',
};

const PERMISSIONS: PermissionItem[] = [
  {
    icon: 'check',
    title: 'Datos mínimos',
    description: 'Solo se comparten tu nombre y email. No se venden datos a terceros.',
  },
  {
    icon: 'bell',
    title: 'Notificaciones',
    description: 'La app podrá enviarte avisos sobre tus pedidos y promociones.',
  },
  {
    icon: 'map-pin',
    title: 'Ubicación',
    description: 'Se usa para calcular tiempos de entrega y encontrar restaurantes cercanos.',
    required: true,
  },
];

function SheetBackground({ style }: BottomSheetBackgroundProps) {
  return (
    <View style={[style, styles.sheetBackground]}>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.sheetTint} />
    </View>
  );
}

export default function ConsentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['75%'], []);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const handleAuthorize = async () => {
    setIsAuthorizing(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Simular autorización
    setTimeout(() => {
      bottomSheetRef.current?.close();
      setTimeout(() => {
        router.back();
      }, 300);
    }, 800);
  };

  const handleDecline = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    bottomSheetRef.current?.close();
    setTimeout(() => {
      router.back();
    }, 300);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleDecline} />
      </BlurView>

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={() => router.back()}
        backgroundComponent={SheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetView style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.header}>
            <View style={styles.monogram}>
              <Text style={styles.monogramText}>{MOCK_APP.name.charAt(0)}</Text>
            </View>
            <View style={styles.headerCopy}>
              <Text style={type.overline}>Solicitud de acceso</Text>
              <Text style={[type.title, styles.appTitle]}>{MOCK_APP.name}</Text>
              <Text style={type.body}>{MOCK_APP.description}</Text>
            </View>
          </View>

          <View style={styles.requestRow}>
            <Feather name="lock" size={14} color={colors.textMuted} />
            <Text style={styles.requestText}>Quiere acceder a tu identidad ZeroID</Text>
          </View>
          <Text style={[type.mono, styles.clientId]}>{MOCK_APP.clientId}</Text>

          <Text style={[type.overline, styles.sectionTitle]}>Resumen de privacidad</Text>
          <View style={styles.permissionList}>
            {PERMISSIONS.map((permission, index) => (
              <View
                key={permission.title}
                style={[styles.permissionRow, index > 0 && styles.permissionRowDivider]}
              >
                <View style={styles.permissionIcon}>
                  <Feather name={permission.icon} size={14} color={colors.text} />
                </View>
                <View style={styles.permissionCopy}>
                  <View style={styles.permissionTitleRow}>
                    <Text style={styles.permissionTitle}>{permission.title}</Text>
                    {permission.required ? (
                      <View style={styles.requiredBadge}>
                        <Text style={styles.requiredBadgeText}>Requerido</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.permissionDescription}>{permission.description}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[ui.primaryButton, isAuthorizing && styles.buttonLoading]}
              onPress={handleAuthorize}
              activeOpacity={0.85}
              disabled={isAuthorizing}
            >
              {isAuthorizing ? <ActivityIndicator size="small" color={colors.inverse} /> : null}
              <Text style={ui.primaryButtonText}>
                {isAuthorizing ? 'Autorizando' : 'Autorizar acceso'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.declineButton}
              onPress={handleDecline}
              activeOpacity={0.6}
              disabled={isAuthorizing}
            >
              <Text style={styles.declineButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Feather name="shield" size={12} color={colors.textSubtle} />
              <Text style={styles.footerText}>
                Puedes revocar este acceso en cualquier momento desde tu bóveda
              </Text>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(13, 14, 17, 0.4)',
  },
  sheetBackground: {
    overflow: 'hidden',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
  },
  sheetTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(22, 24, 29, 0.72)',
  },
  handleIndicator: {
    backgroundColor: colors.border,
    width: 36,
    height: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  monogram: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
  },
  headerCopy: {
    flex: 1,
  },
  appTitle: {
    marginTop: 4,
    marginBottom: 2,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  requestText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  clientId: {
    marginTop: 6,
    marginLeft: 22,
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 12,
  },
  permissionList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 20,
  },
  permissionRow: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 16,
  },
  permissionRowDivider: {
    borderTopWidth: hairline,
    borderTopColor: colors.border,
  },
  permissionIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionCopy: {
    flex: 1,
    gap: 4,
  },
  permissionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  requiredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  requiredBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
  },
  permissionDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
  actions: {
    marginTop: 'auto',
    paddingTop: 24,
    gap: 4,
  },
  buttonLoading: {
    opacity: 0.7,
  },
  declineButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  declineButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    flexShrink: 1,
    fontSize: 12,
    color: colors.textSubtle,
  },
});
