import { useMemo, type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  POLICY_STATUS_LABEL,
  type PolicyPoint,
  type PolicyStatus,
  type TrustGrade,
} from '../constants/trustData';
import { fonts, type ThemeColors, useTheme } from '../constants/theme';

export type TrustScore = TrustGrade;
export type DataStatus = PolicyStatus;
export type FeatherIconName = ComponentProps<typeof Feather>['name'];

export type CompanyData = {
  name: string;
  trustScore: TrustGrade;
  policies?: PolicyPoint[];
  signatureAlgorithm?: string;
};

type PrivacyDossierProps = {
  companyData: CompanyData;
};

const REQUIRED_COLOR = '#B42318';

const ICON_FOR_CATEGORY: Record<string, FeatherIconName> = {
  Identidad: 'user',
  Contacto: 'mail',
  Finanzas: 'credit-card',
  Ubicación: 'map-pin',
  Biometría: 'eye',
  Comportamiento: 'activity',
  Dispositivo: 'smartphone',
};

const DEFAULT_POLICIES: PolicyPoint[] = [
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
    status: 'ignored',
    reason: 'No se solicita para este servicio.',
    retentionDays: 0,
  },
  {
    category: 'Dispositivo',
    label: 'Device Data',
    status: 'required',
    reason: 'Ata el acceso a este dispositivo.',
    retentionDays: 30,
  },
];

function iconFor(point: PolicyPoint): FeatherIconName {
  return ICON_FOR_CATEGORY[point.category] ?? 'circle';
}

export default function PrivacyDossier({ companyData }: PrivacyDossierProps) {
  const { colors, hairline } = useTheme();
  const styles = useMemo(() => createStyles(colors, hairline), [colors, hairline]);
  const {
    name,
    trustScore,
    policies = DEFAULT_POLICIES,
    signatureAlgorithm = 'RS256',
  } = companyData;

  const isCritical = trustScore === 'D';
  const scoreTint =
    trustScore === 'D' ? REQUIRED_COLOR : trustScore === 'C' ? colors.textMuted : colors.text;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.overline}>Dossier de Privacidad</Text>
          <Text style={styles.companyName} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.crypto}>{`Firma ${signatureAlgorithm}`}</Text>
        </View>

        <View style={[styles.scoreBox, isCritical && styles.scoreBoxCritical]}>
          <Text style={[styles.scoreValue, { color: scoreTint }]}>{trustScore}</Text>
          <Text style={styles.scoreLabel}>TRUST</Text>
        </View>
      </View>

      <View style={styles.label}>
        <View style={styles.labelHeader}>
          <Text style={styles.labelHeaderText}>Política de datos</Text>
          <Text style={styles.labelHeaderText}>Estado</Text>
        </View>

        {policies.map((point, index) => (
          <View
            key={`${point.category}-${point.label}-${index}`}
            style={[styles.row, index === policies.length - 1 && styles.rowLast]}
          >
            <View style={styles.rowBody}>
              <View style={styles.rowTop}>
                <View style={styles.rowLeft}>
                  <Feather name={iconFor(point)} size={16} color={colors.textMuted} />
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowCategory}>{point.category}</Text>
                    <Text style={styles.rowLabel}>{point.label}</Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.rowStatus,
                    { color: point.status === 'required' ? REQUIRED_COLOR : colors.text },
                  ]}
                >
                  {`[ ${POLICY_STATUS_LABEL[point.status]} ]`}
                </Text>
              </View>
              <Text style={styles.rowReason}>{point.reason}</Text>
              <Text style={styles.rowRetention}>
                {point.retentionDays === 0
                  ? 'Retención: efímera · 0 días'
                  : `Retención: ${point.retentionDays} días`}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.footer}>
        {`Procesamiento efímero en RAM. Firma criptográfica: ${signatureAlgorithm}.`}
      </Text>
    </View>
  );
}

function createStyles(colors: ThemeColors, hairline: number) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderWidth: hairline,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 20,
    },
    headerText: {
      flex: 1,
      gap: 4,
    },
    overline: {
      fontFamily: fonts.mono,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.textMuted,
    },
    companyName: {
      fontFamily: fonts.bold,
      fontSize: 24,
      letterSpacing: -0.8,
      color: colors.text,
    },
    crypto: {
      fontFamily: fonts.mono,
      fontSize: 11,
      letterSpacing: 0.8,
      color: colors.textMuted,
    },
    scoreBox: {
      width: 64,
      height: 64,
      borderWidth: hairline,
      borderColor: colors.border,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scoreBoxCritical: {
      borderColor: REQUIRED_COLOR,
    },
    scoreValue: {
      fontFamily: fonts.bold,
      fontSize: 32,
      lineHeight: 36,
      letterSpacing: -1,
    },
    scoreLabel: {
      fontFamily: fonts.mono,
      fontSize: 9,
      letterSpacing: 1.2,
      color: colors.textMuted,
    },
    label: {
      borderTopWidth: 2,
      borderBottomWidth: 2,
      borderColor: colors.border,
    },
    labelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: hairline,
      borderColor: colors.border,
    },
    labelHeaderText: {
      fontFamily: fonts.semibold,
      fontSize: 12,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.textMuted,
    },
    row: {
      paddingVertical: 14,
      borderBottomWidth: hairline,
      borderColor: colors.border,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    rowBody: {
      gap: 6,
    },
    rowTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      flexShrink: 1,
    },
    rowCopy: {
      gap: 2,
      flexShrink: 1,
    },
    rowCategory: {
      fontFamily: fonts.mono,
      fontSize: 10,
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: colors.textMuted,
    },
    rowLabel: {
      fontFamily: fonts.regular,
      fontSize: 15,
      color: colors.text,
    },
    rowStatus: {
      fontFamily: fonts.mono,
      fontSize: 12,
      letterSpacing: 1.2,
      fontVariant: ['tabular-nums'],
    },
    rowReason: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textMuted,
      paddingLeft: 28,
    },
    rowRetention: {
      fontFamily: fonts.mono,
      fontSize: 11,
      letterSpacing: 0.4,
      color: colors.textSubtle,
      paddingLeft: 28,
    },
    footer: {
      marginTop: 16,
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSubtle,
    },
  });
}
