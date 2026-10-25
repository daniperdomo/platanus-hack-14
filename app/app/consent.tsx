import { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import BottomSheet, { BottomSheetView, type BottomSheetBackgroundProps } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import PrivacyDossier, { type CompanyData } from '../components/PrivacyDossier';
import { type ThemeColors, fonts, radius, useTheme } from '../constants/theme';

const MOCK_APP = {
  description: 'Plataforma de delivery de comida',
  clientId: 'client_id: yummy_prod_7f2c91',
};

const MOCK_COMPANY: CompanyData = {
  name: 'Yummy',
  trustScore: 'B',
  signatureAlgorithm: 'RS256',
  policies: [
    {
      category: 'Identidad',
      label: 'Identity',
      status: 'zkp',
      reason: 'Prueba de persona real sin revelar el documento.',
      retentionDays: 0,
    },
    {
      category: 'Ubicación',
      label: 'Location',
      status: 'required',
      reason: 'Asigna el pedido al rider más cercano.',
      retentionDays: 30,
    },
    {
      category: 'Dispositivo',
      label: 'Device Data',
      status: 'ignored',
      reason: 'No se solicita para completar el pedido.',
      retentionDays: 0,
    },
  ],
};

export default function ConsentScreen() {
  const router = useRouter();
  const { app } = useLocalSearchParams<{ app?: string }>();
  const company = app ? { ...MOCK_COMPANY, name: app } : MOCK_COMPANY;
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const { colors, type, ui, scheme, hairline } = useTheme();
  const styles = useMemo(() => createStyles(colors, hairline), [colors, hairline]);

  const handleAuthorize = async () => {
    setIsAuthorizing(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

      <BlurView intensity={40} tint={scheme} style={StyleSheet.absoluteFill}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleDecline} />
      </BlurView>

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        enableDynamicSizing
        topInset={insets.top}
        enablePanDownToClose
        onClose={() => router.back()}
        backgroundComponent={(props) => <SheetBackground {...props} scheme={scheme} colors={colors} hairline={hairline} />}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetView style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={type.overline}>Solicitud de acceso</Text>
          <Text style={[type.body, styles.description]}>{MOCK_APP.description}</Text>

          <PrivacyDossier companyData={company} />

          <View style={styles.requestRow}>
            <Feather name="lock" size={14} color={colors.textMuted} />
            <Text style={styles.requestText}>Quiere acceder a tu identidad ZeroID</Text>
          </View>
          <Text style={[type.mono, styles.clientId]}>{MOCK_APP.clientId}</Text>

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

function SheetBackground({
  style,
  scheme,
  colors,
  hairline,
}: BottomSheetBackgroundProps & {
  scheme: 'light' | 'dark';
  colors: ThemeColors;
  hairline: number;
}) {
  return (
    <View
      style={[
        style,
        {
          overflow: 'hidden',
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          borderWidth: hairline,
          borderBottomWidth: 0,
          borderColor: colors.border,
        },
      ]}
    >
      <BlurView intensity={60} tint={scheme} style={StyleSheet.absoluteFill} />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: scheme === 'dark' ? 'rgba(22, 24, 29, 0.72)' : 'rgba(255, 255, 255, 0.78)',
          },
        ]}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors, hairline: number) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
    },
    handleIndicator: {
      backgroundColor: colors.border,
      width: 36,
      height: 4,
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 12,
    },
    description: {
      marginTop: 4,
      marginBottom: 20,
    },
    requestRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 20,
    },
    requestText: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors.text,
    },
    clientId: {
      marginTop: 6,
      marginLeft: 22,
    },
    actions: {
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
      fontFamily: fonts.semibold,
      fontSize: 15,
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
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.textSubtle,
    },
  });
}
