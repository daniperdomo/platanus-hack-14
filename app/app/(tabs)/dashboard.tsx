import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { listConnections } from '../../lib/api';
import { loadWallet } from '../../lib/wallet';
import { DATA_FIELDS } from '../../constants/vaultData';
import { type ThemeColors, fonts, radius, useTheme } from '../../constants/theme';

type Connection = {
  id: string;
  client_name: string;
  client_domain: string;
  rules: string[];
  created_at: string;
};

export default function DashboardScreen() {
  const router = useRouter();
  const { colors, type, ui, scheme, hairline } = useTheme();
  const styles = useMemo(() => createStyles(colors, hairline), [colors, hairline]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [paired, setPaired] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      let stop = false;
      loadWallet().then(async (wallet) => {
        if (stop) return;
        setPaired(Boolean(wallet));
        if (!wallet) return;
        try {
          const body = await listConnections(wallet.token);
          if (!stop) {
            setConnections(body.connections);
            setError('');
          }
        } catch (err) {
          if (!stop) setError(err instanceof Error ? err.message : 'No pudimos leer tus accesos.');
        }
      });
      return () => {
        stop = true;
      };
    }, [])
  );

  const handleScan = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(paired ? { pathname: '/', params: { scan: String(Date.now()) } } : '/');
  };

  const sites = new Set(connections.map((site) => site.client_domain || site.client_name)).size;

  return (
    <View style={styles.container}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={type.overline}>Trazabilidad</Text>
          <Text style={[type.title, styles.headerTitle]}>Sitios conectados</Text>
          <Text style={type.body}>
            Cada sitio donde usaste ZeroID y qué datos recibió.
          </Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{connections.length}</Text>
            <Text style={styles.statLabel}>Accesos aprobados</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{sites}</Text>
            <Text style={styles.statLabel}>Sitios en bóveda</Text>
          </View>
        </View>

        {!paired ? (
          <Text style={styles.empty}>Este teléfono aún no está vinculado a tu ZeroID.</Text>
        ) : null}
        {error ? <Text style={styles.empty}>{error}</Text> : null}
        {paired && !error && connections.length === 0 ? (
          <Text style={styles.empty}>Todavía no autorizas ningún sitio.</Text>
        ) : null}

        {connections.map((site) => (
          <View key={site.id} style={[ui.card, styles.siteCard]}>
            <View style={styles.siteHeader}>
              <View style={styles.monogram}>
                <Text style={styles.monogramText}>{site.client_name.charAt(0)}</Text>
              </View>
              <View style={styles.siteInfo}>
                <Text style={type.heading}>{site.client_name}</Text>
                <Text style={type.caption}>{site.client_domain || 'Sin dominio declarado'}</Text>
              </View>
              <View style={ui.badge}>
                <Feather name="check" size={12} color={colors.text} />
                <Text style={ui.badgeText}>Activa</Text>
              </View>
            </View>

            <Text style={[type.overline, styles.pillsLabel]}>Datos compartidos</Text>
            <View style={styles.pills}>
              {site.rules.map((field) => (
                <View key={field} style={styles.pill}>
                  <Text style={styles.pillText}>{DATA_FIELDS[field] ?? field}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.meta}>{site.created_at.slice(0, 16).replace('T', ' ')}</Text>
          </View>
        ))}

        <TouchableOpacity
          style={[ui.secondaryButton, styles.scanButton]}
          onPress={handleScan}
          activeOpacity={0.7}
        >
          <Feather name="maximize" size={16} color={colors.text} />
          <Text style={ui.secondaryButtonText}>
            {paired ? 'Escanear QR de un sitio' : 'Vincular este teléfono'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors, hairline: number) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 32,
    },
    header: {
      marginBottom: 24,
      gap: 6,
    },
    headerTitle: {
      marginTop: 2,
    },
    stats: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: hairline,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: 20,
      gap: 4,
    },
    statValue: {
      fontFamily: fonts.bold,
      fontSize: 32,
      letterSpacing: -0.5,
      fontVariant: ['tabular-nums'],
      color: colors.text,
    },
    statLabel: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
    },
    empty: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: 16,
    },
    siteCard: {
      marginBottom: 16,
      gap: 14,
    },
    siteHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    monogram: {
      width: 44,
      height: 44,
      borderRadius: 10,
      borderWidth: hairline,
      borderColor: colors.border,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monogramText: {
      fontFamily: fonts.semibold,
      fontSize: 17,
      color: colors.text,
    },
    siteInfo: {
      flex: 1,
      gap: 2,
    },
    pillsLabel: {
      marginTop: 4,
    },
    pills: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    pill: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.pill,
      borderWidth: hairline,
      borderColor: colors.borderStrong,
      backgroundColor: colors.background,
    },
    pillText: {
      fontFamily: fonts.semibold,
      fontSize: 12,
      color: colors.text,
    },
    meta: {
      fontFamily: fonts.mono,
      fontSize: 12,
      fontVariant: ['tabular-nums'],
      color: colors.textSubtle,
    },
    scanButton: {
      height: 52,
      marginTop: 8,
      borderStyle: 'dashed',
    },
  });
}
