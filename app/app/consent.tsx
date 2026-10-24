import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { approveRequest, rejectRequest, type AuthField } from '../lib/api';
import { confirmIdentity } from '../lib/confirm';
import { signChallenge } from '../lib/crypto';
import { getPending } from '../lib/pending';
import { loadWallet } from '../lib/wallet';
import { colors, hairline, radius, type, ui } from '../constants/theme';

const LABELS: Record<string, string> = {
  nombre: 'Nombre completo',
  email: 'Correo electrónico',
  telefono: 'Teléfono',
  fecha_nacimiento: 'Fecha de nacimiento',
  mayor_de_edad: 'Mayor de edad',
  nacionalidad: 'Nacionalidad',
  documento: 'Número de documento',
  direccion: 'Dirección',
  persona_real_unica: 'Persona real y única',
};

const ORACLE = new Set(['persona_real_unica', 'mayor_de_edad', 'nacionalidad']);

export default function ConsentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const request = getPending();
  const [step, setStep] = useState<'identity' | 'data'>('identity');
  const [optional, setOptional] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!request) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 24 }]}>
        <Text style={type.body}>No hay una solicitud pendiente.</Text>
      </View>
    );
  }

  const fields = request.fields ?? [];
  const required = fields.filter((item) => item.required);
  const choices = fields.filter((item) => !item.required);

  async function approve(selected: AuthField[]) {
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
        if (!value) throw new Error(`Tu bóveda no tiene ${LABELS[item.field] ?? item.field}.`);
        disclosures[item.field] = value;
      }
      await approveRequest(request!.request_id, {
        token: wallet.token,
        signature: signChallenge(wallet.privateJwk.d, request!.challenge),
        disclosures,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos aprobar la solicitud.');
    } finally {
      setBusy(false);
    }
  }

  async function decline() {
    setBusy(true);
    setError('');
    try {
      const wallet = await loadWallet();
      if (!wallet || !request) {
        router.back();
        return;
      }
      await rejectRequest(request.request_id, {
        token: wallet.token,
        signature: signChallenge(wallet.privateJwk.d, request.challenge),
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos rechazar la solicitud.');
    } finally {
      setBusy(false);
    }
  }

  function continueFromIdentity() {
    if (request!.kind === 'login' || fields.length === 0) {
      approve([]);
      return;
    }
    setStep('data');
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
      <StatusBar style="light" />
      <TouchableOpacity onPress={() => router.back()} style={styles.close} activeOpacity={0.7}>
        <Feather name="x" size={20} color={colors.text} />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={type.overline}>
          {request.kind === 'login' ? 'Inicio de sesión' : 'Solicitud de acceso'}
        </Text>
        <Text style={[type.title, styles.title]}>{request.client_name}</Text>
        {request.client_domain ? <Text style={type.body}>{request.client_domain}</Text> : null}

        {step === 'identity' ? (
          <>
            <Text style={[type.body, styles.lead]}>¿Eres tú quien intenta iniciar sesión?</Text>
            <TouchableOpacity style={ui.primaryButton} onPress={continueFromIdentity} disabled={busy}>
              <Text style={ui.primaryButtonText}>{busy ? 'Confirmando…' : 'Sí, soy yo'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ui.secondaryButton} onPress={decline} disabled={busy}>
              <Text style={ui.secondaryButtonText}>No soy yo</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[type.body, styles.lead]}>
              Revisa qué datos pide, para qué los usará y cuánto tiempo los guardará.
            </Text>
            {required.length > 0 && <Text style={type.overline}>Obligatorios</Text>}
            {required.map((item) => (
              <FieldRow key={item.field} item={item} checked locked />
            ))}
            {choices.length > 0 && <Text style={[type.overline, styles.group]}>Opcionales</Text>}
            {choices.map((item) => (
              <FieldRow
                key={item.field}
                item={item}
                checked={Boolean(optional[item.field])}
                onToggle={() =>
                  setOptional((current) => ({ ...current, [item.field]: !current[item.field] }))
                }
              />
            ))}
            <TouchableOpacity
              style={ui.primaryButton}
              disabled={busy}
              onPress={() =>
                approve([...required, ...choices.filter((item) => optional[item.field])])
              }
            >
              <Text style={ui.primaryButtonText}>{busy ? 'Firmando…' : 'Autorizar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ui.secondaryButton} onPress={decline} disabled={busy}>
              <Text style={ui.secondaryButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </View>
  );
}

function FieldRow({
  item,
  checked,
  locked = false,
  onToggle,
}: {
  item: AuthField;
  checked: boolean;
  locked?: boolean;
  onToggle?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.field}
      onPress={locked ? undefined : onToggle}
      activeOpacity={locked ? 1 : 0.7}
    >
      <Feather name={checked || locked ? 'check-square' : 'square'} size={18} color={colors.text} />
      <View style={styles.fieldCopy}>
        <Text style={styles.fieldTitle}>{LABELS[item.field] ?? item.field}</Text>
        {item.purpose ? <Text style={styles.fieldMeta}>Para qué: {item.purpose}</Text> : null}
        {item.retention ? <Text style={styles.fieldMeta}>Tiempo: {item.retention}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: 12,
    paddingBottom: 24,
  },
  title: {
    marginTop: 8,
  },
  lead: {
    marginVertical: 8,
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
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  fieldMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  error: {
    color: colors.destructive,
    fontSize: 14,
  },
});
