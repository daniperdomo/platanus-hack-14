import { useMemo, useState, type ComponentProps } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  DIMENSIONS,
  POLICY_STATUS_LABEL,
  type DimensionScores,
  type PolicyPoint,
  type PolicyStatus,
  type TrustGrade,
  type TrustJustifications,
} from '../constants/trustData';
import { fonts, type ThemeColors, useTheme } from '../constants/theme';

export type TrustScore = TrustGrade;
export type DataStatus = PolicyStatus;
export type FeatherIconName = ComponentProps<typeof Feather>['name'];

export type CompanyData = {
  name: string;
  trustScore: TrustGrade;
  logoUrl?: string;
  scores?: DimensionScores;
  justifications?: TrustJustifications;
  scoreTotal?: number;
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

function barColor(value: number): string {
  if (value >= 70) return '#10B981';
  if (value >= 50) return '#F59E0B';
  return '#EF4444';
}

function CompanyAvatar({ uri, name, colors }: { uri?: string; name: string; colors: ThemeColors }) {
  const [failed, setFailed] = useState(!uri);
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={[avatarStyles.box, { borderColor: colors.border, backgroundColor: colors.background }]}>
      {failed || !uri ? (
        <Text style={[avatarStyles.initial, { color: colors.textMuted }]}>{initial}</Text>
      ) : (
        <Image source={{ uri }} style={avatarStyles.image} onError={() => setFailed(true)} />
      )}
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  box: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: 64,
    height: 64,
  },
  initial: {
    fontFamily: fonts.bold,
    fontSize: 22,
    letterSpacing: -0.5,
  },
});

export default function PrivacyDossier({ companyData }: PrivacyDossierProps) {
  const { colors, hairline } = useTheme();
  const styles = useMemo(() => createStyles(colors, hairline), [colors, hairline]);
  const {
    name,
    trustScore,
    logoUrl,
    scores,
    justifications,
    policies = DEFAULT_POLICIES,
    signatureAlgorithm = 'RS256',
  } = companyData;

  const isCritical = trustScore === 'D';
  const scoreTint =
    trustScore === 'D' ? REQUIRED_COLOR : trustScore === 'C' ? colors.textMuted : colors.text;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CompanyAvatar uri={logoUrl} name={name} colors={colors} />
        <View style={styles.headerText}>
          <Text style={styles.overline}>Dossier de Privacidad</Text>
          <View style={styles.titleRow}>
            <Text style={styles.companyName} numberOfLines={1}>
              {name}
            </Text>
            <View style={[styles.scoreBox, isCritical && styles.scoreBoxCritical]}>
              <Text style={[styles.scoreValue, { color: scoreTint }]}>{trustScore}</Text>
              <Text style={styles.scoreLabel}>TRUST</Text>
            </View>
          </View>
          <Text style={styles.crypto}>{`Firma ${signatureAlgorithm}`}</Text>
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

      {scores ? (
        <View style={styles.legal}>
          <Text style={styles.legalTitle}>Desglose Legal</Text>
          {DIMENSIONS.map((dimension) => {
            const value = scores[dimension.key];
            return (
              <View key={dimension.key} style={styles.metric}>
                <View style={styles.metricHead}>
                  <Text style={styles.metricLabel}>{dimension.label}</Text>
                  <Text style={styles.metricValue}>{value}</Text>
                </View>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: barColor(value) },
                    ]}
                  />
                </View>
                {justifications?.[dimension.key] ? (
                  <Text style={styles.metricNote} numberOfLines={2}>
                    {justifications[dimension.key]}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}

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
      justifyContent: 'flex-start',
      gap: 20,
      marginBottom: 20,
    },
    headerText: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minWidth: 0,
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
      flexShrink: 1,
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
    legal: {
      marginTop: 20,
      paddingTop: 16,
      borderTopWidth: 2,
      borderTopColor: colors.border,
      gap: 14,
    },
    legalTitle: {
      fontFamily: fonts.semibold,
      fontSize: 12,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.textMuted,
    },
    metric: {
      gap: 6,
    },
    metricHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    metricLabel: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: colors.text,
      flexShrink: 1,
    },
    metricValue: {
      fontFamily: fonts.mono,
      fontSize: 12,
      fontVariant: ['tabular-nums'],
      color: colors.textMuted,
    },
    track: {
      height: 8,
      borderRadius: 4,
      backgroundColor: '#2A2D35',
      overflow: 'hidden',
    },
    fill: {
      height: 8,
      borderRadius: 4,
    },
    metricNote: {
      fontFamily: fonts.mono,
      fontSize: 13,
      lineHeight: 18,
      color: '#A1A1AA',
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
