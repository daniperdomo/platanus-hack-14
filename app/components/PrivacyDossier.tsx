import { useMemo, type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { fonts, type ThemeColors, useTheme } from '../constants/theme';
import {
  POLICY_STATUS_LABEL,
  formatRetention,
  type Company,
  type PolicyCategory,
  type PolicyPoint,
  type PolicyStatus,
} from '../constants/trustData';

type FeatherIconName = ComponentProps<typeof Feather>['name'];

const CATEGORY_ICON: Record<PolicyCategory, FeatherIconName> = {
  identity: 'user',
  location: 'map-pin',
  device: 'smartphone',
  payments: 'credit-card',
  biometrics: 'eye',
  telemetry: 'activity',
};

type PrivacyDossierProps = {
  company: Company;
};

export default function PrivacyDossier({ company }: PrivacyDossierProps) {
  const { colors, hairline } = useTheme();
  const styles = useMemo(() => createStyles(colors, hairline), [colors, hairline]);
  const isCritical = company.grade === 'D';
  const scoreTint =
    company.grade === 'D' ? colors.destructive : company.grade === 'C' ? colors.textMuted : colors.text;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.overline}>Dossier de Privacidad</Text>
          <Text style={styles.companyName} numberOfLines={1}>
            {company.name}
          </Text>
          <Text style={styles.domain}>{company.domain}</Text>
        </View>

        <View style={[styles.scoreBox, isCritical && styles.scoreBoxCritical]}>
          <Text style={[styles.scoreValue, { color: scoreTint }]}>{company.grade}</Text>
          <Text style={styles.scoreLabel}>{company.score}/100</Text>
        </View>
      </View>

      <View style={styles.label}>
        <View style={styles.labelHeader}>
          <Text style={styles.labelHeaderText}>Datos que pide</Text>
          <Text style={styles.labelHeaderText}>Estado</Text>
        </View>

        {company.policies.map((point, index) => (
          <PolicyRow
            key={point.id}
            point={point}
            isLast={index === company.policies.length - 1}
            styles={styles}
            colors={colors}
          />
        ))}
      </View>

      <Text style={styles.footer}>
        {`Firma criptográfica: ${company.crypto.algorithm}. `}
        {company.crypto.ephemeralProcessing
          ? 'Procesamiento efímero en RAM: tus datos no se escriben en disco.'
          : 'Sin procesamiento efímero: los datos se almacenan en sus servidores.'}
      </Text>
    </View>
  );
}

function PolicyRow({
  point,
  isLast,
  styles,
  colors,
}: {
  point: PolicyPoint;
  isLast: boolean;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  return (
    <View style={[styles.row, isLast && styles.rowLast]}>
      <View style={styles.rowTop}>
        <View style={styles.rowLeft}>
          <Feather name={CATEGORY_ICON[point.category]} size={16} color={colors.textMuted} />
          <Text style={styles.rowLabel}>{point.label}</Text>
        </View>
        <StatusChip status={point.status} styles={styles} />
      </View>
      <Text style={styles.reason}>{point.reason}</Text>
      <Text style={styles.meta}>
        {`Retención: ${formatRetention(point.retentionDays)}`}
        {point.sharedWith.length > 0 ? ` · Comparte con: ${point.sharedWith.join(', ')}` : ''}
      </Text>
    </View>
  );
}

function StatusChip({
  status,
  styles,
}: {
  status: PolicyStatus;
  styles: ReturnType<typeof createStyles>;
}) {
  const chip = {
    required: [styles.chip, styles.chipRequired],
    optional: [styles.chip, styles.chipOptional],
    zkp: [styles.chip, styles.chipZkp],
    ignored: [styles.chip, styles.chipIgnored],
  }[status];
  const text = {
    required: [styles.chipText, styles.chipTextRequired],
    optional: [styles.chipText, styles.chipTextOptional],
    zkp: [styles.chipText, styles.chipTextZkp],
    ignored: [styles.chipText, styles.chipTextIgnored],
  }[status];

  return (
    <View style={chip}>
      <Text style={text}>{POLICY_STATUS_LABEL[status]}</Text>
    </View>
  );
}

const REQUIRED_RED = '#B42318';

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
    domain: {
      fontFamily: fonts.mono,
      fontSize: 12,
      color: colors.textSubtle,
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
      borderColor: colors.destructive,
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
      letterSpacing: 0.6,
      fontVariant: ['tabular-nums'],
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
      gap: 6,
      borderBottomWidth: hairline,
      borderColor: colors.border,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    rowTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flexShrink: 1,
    },
    rowLabel: {
      flexShrink: 1,
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors.text,
    },
    reason: {
      marginLeft: 28,
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textMuted,
    },
    meta: {
      marginLeft: 28,
      fontFamily: fonts.mono,
      fontSize: 11,
      lineHeight: 16,
      color: colors.textSubtle,
    },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 9999,
      borderWidth: hairline,
    },
    chipRequired: {
      backgroundColor: REQUIRED_RED,
      borderColor: REQUIRED_RED,
    },
    chipOptional: {
      backgroundColor: '#FFFFFF',
      borderColor: colors.border,
    },
    chipZkp: {
      backgroundColor: 'transparent',
      borderColor: colors.text,
    },
    chipIgnored: {
      backgroundColor: colors.border,
      borderColor: colors.border,
    },
    chipText: {
      fontFamily: fonts.mono,
      fontSize: 11,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    chipTextRequired: {
      color: '#FFFFFF',
    },
    chipTextOptional: {
      color: '#111111',
    },
    chipTextZkp: {
      color: colors.text,
    },
    chipTextIgnored: {
      color: colors.textMuted,
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
