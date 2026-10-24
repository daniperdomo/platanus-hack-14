import { useMemo, type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { fonts, type ThemeColors, useTheme } from '../constants/theme';

export type TrustScore = 'A' | 'B' | 'C' | 'F';

export type DataStatus = 'zkp' | 'ignored' | 'required';

export type FeatherIconName = ComponentProps<typeof Feather>['name'];

export type CollectedDataPoint = {
  id: string;
  label: string;
  icon: FeatherIconName;
  status: DataStatus;
};

export type CompanyData = {
  name: string;
  trustScore: TrustScore;
  dataPoints?: CollectedDataPoint[];
  retentionDays?: number;
  signatureAlgorithm?: string;
};

type PrivacyDossierProps = {
  companyData: CompanyData;
};

const STATUS_LABEL: Record<DataStatus, string> = {
  zkp: 'HASH ZKP',
  ignored: 'IGNORADO',
  required: 'REQUERIDO',
};

const DEFAULT_DATA_POINTS: CollectedDataPoint[] = [
  { id: 'identity', label: 'Identity', icon: 'user', status: 'zkp' },
  { id: 'location', label: 'Location', icon: 'map-pin', status: 'ignored' },
  { id: 'device', label: 'Device Data', icon: 'smartphone', status: 'required' },
];

export default function PrivacyDossier({ companyData }: PrivacyDossierProps) {
  const { colors, hairline } = useTheme();
  const styles = useMemo(() => createStyles(colors, hairline), [colors, hairline]);
  const {
    name,
    trustScore,
    dataPoints = DEFAULT_DATA_POINTS,
    retentionDays = 0,
    signatureAlgorithm = 'RS256',
  } = companyData;

  const isCritical = trustScore === 'F';
  const scoreTint =
    trustScore === 'F' ? colors.destructive : trustScore === 'C' ? colors.textMuted : colors.text;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.overline}>Dossier de Privacidad</Text>
          <Text style={styles.companyName} numberOfLines={1}>
            {name}
          </Text>
        </View>

        <View style={[styles.scoreBox, isCritical && styles.scoreBoxCritical]}>
          <Text style={[styles.scoreValue, { color: scoreTint }]}>{trustScore}</Text>
          <Text style={styles.scoreLabel}>TRUST</Text>
        </View>
      </View>

      <View style={styles.label}>
        <View style={styles.labelHeader}>
          <Text style={styles.labelHeaderText}>Datos recopilados</Text>
          <Text style={styles.labelHeaderText}>Estado</Text>
        </View>

        {dataPoints.map((point, index) => (
          <View
            key={point.id}
            style={[styles.row, index === dataPoints.length - 1 && styles.rowLast]}
          >
            <View style={styles.rowLeft}>
              <Feather name={point.icon} size={16} color={colors.textMuted} />
              <Text style={styles.rowLabel}>{point.label}</Text>
            </View>
            <Text
              style={[
                styles.rowStatus,
                { color: point.status === 'required' ? colors.destructive : colors.text },
              ]}
            >
              {`[ ${STATUS_LABEL[point.status]} ]`}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.footer}>
        {`Retención: ${retentionDays} días. Procesamiento efímero en RAM. Firma criptográfica: ${signatureAlgorithm}.`}
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderBottomWidth: hairline,
      borderColor: colors.border,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flexShrink: 1,
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
    footer: {
      marginTop: 16,
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSubtle,
    },
  });
}
