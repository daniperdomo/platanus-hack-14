import { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DataSelector, { dataSelectionId } from '../components/DataSelector';
import PrivacyDossier from '../components/PrivacyDossier';
import SheetBackground from '../components/SheetBackground';
import { approveRequest, rejectRequest, type AuthField } from '../lib/api';
import { confirmIdentity } from '../lib/confirm';
import { signChallenge } from '../lib/crypto';
import { getPending } from '../lib/pending';
import { loadWallet } from '../lib/wallet';
import { DATA_FIELDS } from '../constants/vaultData';
import { companyForDomain, type PolicyPoint } from '../constants/trustData';
import { type ThemeColors, fonts, useTheme } from '../constants/theme';

const ORACLE = new Set(['persona_real_unica', 'mayor_de_edad', 'nacionalidad']);
const SNAP_POINTS = ['90%'];
const FIELD_FROM_LABEL: Record<string, string> = {
  teléfono: 'telefono',
  correo: 'email',
  nombre: 'nombre',
  documento: 'documento',
  dirección: 'direccion',
  'fecha de nacimiento': 'fecha_nacimiento',
  ubicación: 'ubicacion',
  location: 'ubicacion',
};

function vaultFieldFor(point: PolicyPoint) {
  return FIELD_FROM_LABEL[point.label.toLowerCase()] ?? null;
}

export default function ConsentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);
  const request = getPending();
  const company = companyForDomain(request?.client_domain);
  const [step, setStep] = useState<'identity' | 'data'>('identity');
  const [selectedOptionalIds, setSelectedOptionalIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { colors, type, ui, scheme, hairline } = useTheme();
  const styles = useMemo(() => createStyles(colors, hairline), [colors, hairline]);

  const fields = request?.fields ?? [];
  const proofs = fields.filter((item) => ORACLE.has(item.field));
  const asksPersonalData = proofs.length < fields.length;

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
      console.log('🛡️ [ZeroID Core] Payload filtrado criptográficamente:', disclosures);
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

  const isSignIn = request?.kind === 'sign_in';

  function authorizedFields(): AuthField[] {
    const allowed = new Set(selectedOptionalIds);
    const extra = new Set(
      (company?.policies ?? [])
        .filter((point) => point.status === 'optional' && allowed.has(dataSelectionId(point)))
        .map(vaultFieldFor)
        .filter((field): field is string => Boolean(field))
    );
    return fields.filter(
      (item) => item.required || ORACLE.has(item.field) || extra.has(item.field)
    );
  }

  async function handleAuthorize() {
    if (busy || !request) return;
    setBusy(true);
    setError('');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    if (request.kind === 'login' || fields.length === 0) {
      await approve([]);
      return;
    }
    if (isSignIn && !asksPersonalData) {
      await approve(fields);
      return;
    }
    await approve(authorizedFields());
  }

  function continueFromIdentity() {
    if (request?.kind === 'login' || fields.length === 0 || (isSignIn && !asksPersonalData)) {
      void handleAuthorize();
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
        <BottomSheetView style={styles.sheetBody}>
          <BottomSheetScrollView style={styles.sheetScroll} contentContainerStyle={styles.content}>
            {!request ? (
              <Text style={type.body}>No hay una solicitud pendiente.</Text>
            ) : (
              <>
                <Text style={type.overline}>
                  {request.kind === 'login'
                    ? 'Inicio de sesión'
                    : isSignIn
                      ? 'Iniciar sesión con ZeroID'
                      : 'Solicitud de acceso'}
                </Text>
                <Text style={[type.title, styles.title]}>{request.client_name}</Text>
                {request.client_domain ? <Text style={type.mono}>{request.client_domain}</Text> : null}

                {step === 'identity' ? (
                  <>
                    <Text style={[type.body, styles.lead]}>¿Eres tú quien intenta iniciar sesión?</Text>
                    {isSignIn ? (
                      <View style={styles.proofs}>
                        <Text style={type.caption}>
                          {asksPersonalData
                            ? `${request.client_name} recibirá un identificador anónimo exclusivo para este sitio. En el siguiente paso eliges qué datos compartir.`
                            : `${request.client_name} no recibirá tu nombre, documentos ni contacto. Solo un identificador anónimo exclusivo para este sitio${proofs.length > 0 ? ' y estas confirmaciones:' : '.'}`}
                        </Text>
                        {proofs.map((item) => (
                          <View key={item.field} style={styles.proofRow}>
                            <Feather name="check" size={14} color={colors.text} />
                            <Text style={type.body}>{DATA_FIELDS[item.field] ?? item.field}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                    {company ? (
                      <PrivacyDossier
                        companyData={{
                          name: company.name,
                          logoUrl: company.logoUrl,
                          trustScore: company.grade,
                          scores: company.scores,
                          justifications: company.justifications,
                          scoreTotal: company.scoreTotal,
                          policies: company.policies,
                          signatureAlgorithm: company.signatureAlgorithm,
                        }}
                      />
                    ) : null}
                  </>
                ) : (
                  <>
                    <Text style={[type.body, styles.lead]}>
                      Revisa qué datos pide, para qué los usará y cuánto tiempo los guardará.
                    </Text>
                    {company ? (
                      <PrivacyDossier
                        companyData={{
                          name: company.name,
                          logoUrl: company.logoUrl,
                          trustScore: company.grade,
                          scores: company.scores,
                          justifications: company.justifications,
                          scoreTotal: company.scoreTotal,
                          policies: company.policies,
                          signatureAlgorithm: company.signatureAlgorithm,
                        }}
                      />
                    ) : null}
                    {company ? (
                      <DataSelector
                        policies={company.policies}
                        onSelectionChange={setSelectedOptionalIds}
                      />
                    ) : null}
                  </>
                )}

                {error ? <Text style={styles.error}>{error}</Text> : null}
              </>
            )}
          </BottomSheetScrollView>

          {request ? (
            <View style={[styles.signFooter, { paddingBottom: insets.bottom + 12 }]}>
              {step === 'identity' ? (
                <>
                  <TouchableOpacity
                    style={[ui.primaryButton, busy && styles.buttonLoading]}
                    onPress={continueFromIdentity}
                    activeOpacity={0.85}
                    disabled={busy}
                  >
                    {busy ? <ActivityIndicator size="small" color={colors.inverse} /> : null}
                    <Text style={ui.primaryButtonText}>
                      {busy ? 'Generando firma (JWK)...' : 'Sí, soy yo'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.declineButton} onPress={decline} disabled={busy}>
                    <Text style={styles.declineButtonText}>No soy yo</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[ui.primaryButton, busy && styles.buttonLoading]}
                    disabled={busy}
                    activeOpacity={0.85}
                    onPress={() => void handleAuthorize()}
                  >
                    {busy ? <ActivityIndicator size="small" color={colors.inverse} /> : null}
                    <Text style={ui.primaryButtonText}>
                      {busy ? 'Generando firma (JWK)...' : 'Firmar y Autorizar'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.declineButton} onPress={decline} disabled={busy}>
                    <Text style={styles.declineButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </>
              )}
              <View style={styles.footer}>
                <Feather name="shield" size={12} color={colors.textSubtle} />
                <Text style={styles.footerText}>
                  Firmas con la llave de este teléfono. El sitio solo recibe lo que apruebes.
                </Text>
              </View>
            </View>
          ) : null}
        </BottomSheetView>
      </BottomSheet>
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
    sheetBody: {
      flex: 1,
    },
    sheetScroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 16,
      gap: 12,
    },
    signFooter: {
      borderTopWidth: hairline,
      borderTopColor: colors.border,
      paddingHorizontal: 24,
      paddingTop: 12,
      gap: 4,
    },
    title: {
      marginTop: 4,
    },
    lead: {
      marginVertical: 4,
    },
    proofs: {
      gap: 8,
      padding: 14,
      borderRadius: 12,
      borderWidth: hairline,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    proofRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
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
