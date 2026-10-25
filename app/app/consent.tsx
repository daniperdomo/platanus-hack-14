import { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import PrivacyDossier from '../components/PrivacyDossier';
import SheetBackground from '../components/SheetBackground';
import { approveRequest, rejectRequest, type AuthField } from '../lib/api';
import { confirmIdentity } from '../lib/confirm';
import { signChallenge } from '../lib/crypto';
import { getPending } from '../lib/pending';
import { loadWallet } from '../lib/wallet';
import { DATA_FIELDS } from '../constants/vaultData';
import { companyForDomain } from '../constants/trustData';
import { type ThemeColors, fonts, useTheme } from '../constants/theme';

const ORACLE = new Set(['persona_real_unica', 'mayor_de_edad', 'nacionalidad']);
const SNAP_POINTS = ['90%'];

export default function ConsentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);
  const request = getPending();
  const company = companyForDomain(request?.client_domain);
  const [step, setStep] = useState<'identity' | 'data'>('identity');
  const [optional, setOptional] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { colors, type, ui, scheme, hairline } = useTheme();
  const styles = useMemo(() => createStyles(colors, hairline), [colors, hairline]);

  const fields = request?.fields ?? [];
  const required = fields.filter((item) => item.required);
  const choices = fields.filter((item) => !item.required);

  const close = () => sheetRef.current?.close();

  async function approve(selected: AuthField[]) {
    if (!request) return;
    setBusy(true);
    setError('');
    try {
      const confirmed = await confirmIdentity();
      if (!confirmed) {
        setError('Hace falta confirmar tu identidad para aprobar.');
        return;
      }
      const wallet = await loadWallet();
      if (!wallet) throw new Error('Este teléfono no tiene una credencial vinculada.');
      const disclosures: Record<string, string | boolean> = {};
      for (const item of selected) {
        if (ORACLE.has(item.field)) {
          disclosures[item.field] = true;
          continue;
        }
        const value = wallet.vault[item.field];
        if (!value) throw new Error(`Tu bóveda no tiene ${DATA_FIELDS[item.field] ?? item.field}.`);
        disclosures[item.field] = value;
      }
      await approveRequest(request.request_id, {
        token: wallet.token,
        signature: signChallenge(wallet.privateJwk.d, request.challenge),
        disclosures,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      close();
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err instanceof Error ? err.message : 'No pudimos aprobar la solicitud.');
    } finally {
      setBusy(false);
    }
  }

  async function decline() {
    setBusy(true);
    setError('');
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      const wallet = await loadWallet();
      if (wallet && request) {
        await rejectRequest(request.request_id, {
          token: wallet.token,
          signature: signChallenge(wallet.privateJwk.d, request.challenge),
        });
      }
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos rechazar la solicitud.');
    } finally {
      setBusy(false);
    }
  }

  function continueFromIdentity() {
    if (request?.kind === 'login' || fields.length === 0) {
      approve([]);
      return;
    }
    setStep('data');
  }

  return (
    <View style={styles.container}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

      <BlurView intensity={40} tint={scheme} style={StyleSheet.absoluteFill}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={close} />
      </BlurView>

      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={SNAP_POINTS}
        enableDynamicSizing={false}
        topInset={insets.top}
        enablePanDownToClose
        onClose={() => router.back()}
        backgroundComponent={SheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
          {!request ? (
            <Text style={type.body}>No hay una solicitud pendiente.</Text>
          ) : (
            <>
              <Text style={type.overline}>
                {request.kind === 'login' ? 'Inicio de sesión' : 'Solicitud de acceso'}
              </Text>
              <Text style={[type.title, styles.title]}>{request.client_name}</Text>
              {request.client_domain ? <Text style={type.mono}>{request.client_domain}</Text> : null}

              {step === 'identity' ? (
                <>
                  <Text style={[type.body, styles.lead]}>¿Eres tú quien intenta iniciar sesión?</Text>
                  {company ? <PrivacyDossier company={company} /> : null}
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[ui.primaryButton, busy && styles.buttonLoading]}
                      onPress={continueFromIdentity}
                      activeOpacity={0.85}
                      disabled={busy}
                    >
                      {busy ? <ActivityIndicator size="small" color={colors.inverse} /> : null}
                      <Text style={ui.primaryButtonText}>{busy ? 'Confirmando' : 'Sí, soy yo'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.declineButton} onPress={decline} disabled={busy}>
                      <Text style={styles.declineButtonText}>No soy yo</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={[type.body, styles.lead]}>
                    Revisa qué datos pide, para qué los usará y cuánto tiempo los guardará.
                  </Text>
                  {required.length > 0 && <Text style={type.overline}>Obligatorios</Text>}
                  {required.map((item) => (
                    <FieldRow key={item.field} item={item} checked locked styles={styles} colors={colors} />
                  ))}
                  {choices.length > 0 && <Text style={[type.overline, styles.group]}>Opcionales</Text>}
                  {choices.map((item) => (
                    <FieldRow
                      key={item.field}
                      item={item}
                      checked={Boolean(optional[item.field])}
                      styles={styles}
                      colors={colors}
                      onToggle={() =>
                        setOptional((current) => ({ ...current, [item.field]: !current[item.field] }))
                      }
                    />
                  ))}
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[ui.primaryButton, busy && styles.buttonLoading]}
                      disabled={busy}
                      activeOpacity={0.85}
                      onPress={() =>
                        approve([...required, ...choices.filter((item) => optional[item.field])])
                      }
                    >
                      {busy ? <ActivityIndicator size="small" color={colors.inverse} /> : null}
                      <Text style={ui.primaryButtonText}>{busy ? 'Firmando' : 'Autorizar acceso'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.declineButton} onPress={decline} disabled={busy}>
                      <Text style={styles.declineButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.footer}>
                <Feather name="shield" size={12} color={colors.textSubtle} />
                <Text style={styles.footerText}>
                  Firmas con la llave de este teléfono. El sitio solo recibe lo que apruebes.
                </Text>
              </View>
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

function FieldRow({
  item,
  checked,
  locked = false,
  onToggle,
  styles,
  colors,
}: {
  item: AuthField;
  checked: boolean;
  locked?: boolean;
  onToggle?: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  return (
    <TouchableOpacity
      style={styles.field}
      onPress={locked ? undefined : onToggle}
      activeOpacity={locked ? 1 : 0.7}
    >
      <Feather name={checked || locked ? 'check-square' : 'square'} size={18} color={colors.text} />
      <View style={styles.fieldCopy}>
        <Text style={styles.fieldTitle}>{DATA_FIELDS[item.field] ?? item.field}</Text>
        {item.purpose ? <Text style={styles.fieldMeta}>Para qué: {item.purpose}</Text> : null}
        {item.retention ? <Text style={styles.fieldMeta}>Tiempo: {item.retention}</Text> : null}
      </View>
    </TouchableOpacity>
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
      gap: 12,
    },
    title: {
      marginTop: 4,
    },
    lead: {
      marginVertical: 4,
    },
    group: {
      marginTop: 8,
    },
    field: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 12,
      borderTopWidth: hairline,
      borderTopColor: colors.border,
    },
    fieldCopy: {
      flex: 1,
      gap: 4,
    },
    fieldTitle: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors.text,
    },
    fieldMeta: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textMuted,
    },
    actions: {
      paddingTop: 12,
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
    error: {
      fontFamily: fonts.regular,
      color: colors.destructive,
      fontSize: 14,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 8,
    },
    footerText: {
      flexShrink: 1,
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.textSubtle,
    },
  });
}
