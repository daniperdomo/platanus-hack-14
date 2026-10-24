import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { DATA_FIELDS, VAULT_CONNECTIONS, type VaultConnection } from '../../constants/vaultData';
import { type ThemeColors, fonts, radius, useTheme } from '../../constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const { colors, type, ui, scheme, hairline } = useTheme();
  const styles = useMemo(() => createStyles(colors, hairline), [colors, hairline]);
  const [connections, setConnections] = useState<VaultConnection[]>(VAULT_CONNECTIONS);

  const activeCount = connections.filter((site) => site.status === 'activa').length;

  const handleRevokeAccess = async (id: string) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setConnections((current) =>
      current.map((site) =>
        site.id === id
          ? { ...site, status: 'revocada', retention: 'Eliminado tras revocar el acceso.' }
          : site
      )
    );
  };

  const handleNewLogin = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/consent');
  };

  return (
    <View style={styles.container}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={type.overline}>Trazabilidad</Text>
          <Text style={[type.title, styles.headerTitle]}>Sitios conectados</Text>
          <Text style={type.body}>
            Cada sitio donde usaste ZeroID, qué datos recibe y para qué los usa.
          </Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>Accesos activos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{connections.length}</Text>
            <Text style={styles.statLabel}>Sitios en bóveda</Text>
          </View>
        </View>

        {connections.map((site) => {
          const isActive = site.status === 'activa';
          return (
            <View key={site.id} style={[ui.card, styles.siteCard]}>
              <View style={styles.siteHeader}>
                <View style={styles.monogram}>
                  <Text style={styles.monogramText}>{site.name.charAt(0)}</Text>
                </View>
                <View style={styles.siteInfo}>
                  <Text style={type.heading}>{site.name}</Text>
                  <Text style={type.caption}>{site.domain}</Text>
                </View>
                <View style={[ui.badge, !isActive && styles.badgeMuted]}>
                  <Text style={[ui.badgeText, !isActive && styles.badgeMutedText]}>
                    {isActive ? 'Activa' : 'Revocada'}
                  </Text>
                </View>
              </View>

              <Text style={[type.overline, styles.pillsLabel]}>Datos compartidos</Text>
              <View style={styles.pills}>
                {site.fields.map((field) => (
                  <View key={field} style={styles.pill}>
                    <Text style={styles.pillText}>{DATA_FIELDS[field] ?? field}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.purpose}>{site.purpose}</Text>
              <Text style={styles.meta}>
                {site.connectedAt} · último acceso {site.lastAccess}
              </Text>

              {isActive ? (
                <TouchableOpacity
                  style={[ui.secondaryButton, styles.revokeButton]}
                  onPress={() => handleRevokeAccess(site.id)}
                  activeOpacity={0.7}
                >
                  <Feather name="slash" size={14} color={colors.destructive} />
                  <Text style={[ui.secondaryButtonText, styles.revokeButtonText]}>Revocar</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}

        <TouchableOpacity
          style={[ui.secondaryButton, styles.simulateButton]}
          onPress={handleNewLogin}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={16} color={colors.text} />
          <Text style={ui.secondaryButtonText}>Simular nuevo login</Text>
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
    badgeMuted: {
      opacity: 0.7,
    },
    badgeMutedText: {
      color: colors.textMuted,
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
    purpose: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 20,
      color: colors.textMuted,
    },
    meta: {
      fontFamily: fonts.mono,
      fontSize: 12,
      fontVariant: ['tabular-nums'],
      color: colors.textSubtle,
    },
    revokeButton: {
      borderColor: colors.destructive,
      alignSelf: 'flex-start',
    },
    revokeButtonText: {
      color: colors.destructive,
    },
    simulateButton: {
      height: 52,
      marginTop: 8,
      borderStyle: 'dashed',
    },
  });
}
