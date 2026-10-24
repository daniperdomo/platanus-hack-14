import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, hairline, radius, type, ui } from '../constants/theme';

interface LoginSession {
  id: string;
  appName: string;
  sessionHash: string;
  lastActive: string;
  device: string;
  location: string;
  permissions: string[];
}

const MOCK_SESSIONS: LoginSession[] = [
  {
    id: '1',
    appName: 'Yummy',
    sessionHash: 'zk_8f3a91…c21e',
    lastActive: 'Hace 5 minutos',
    device: 'iPhone 15 Pro',
    location: 'Santiago, Chile',
    permissions: ['Email', 'Nombre', 'Teléfono'],
  },
  {
    id: '2',
    appName: 'FitTracker',
    sessionHash: 'zk_2b70de…94af',
    lastActive: 'Hace 2 horas',
    device: 'iPad Air',
    location: 'Santiago, Chile',
    permissions: ['Email', 'Nombre', 'Ubicación', 'Actividad física'],
  },
  {
    id: '3',
    appName: 'ShopNow',
    sessionHash: 'zk_c4e15a…07b3',
    lastActive: 'Hace 1 día',
    device: 'MacBook Pro',
    location: 'Valparaíso, Chile',
    permissions: ['Email', 'Nombre', 'Dirección'],
  },
];

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleRevokeAccess = async (sessionId: string, appName: string) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    // Aquí iría la lógica de revocación
    console.log(`Revoking access for ${appName}`);
  };

  const handleNewLogin = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/consent');
  };

  const handleScanQR = () => {
    router.push('/');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={type.overline}>Bóveda</Text>
          <Text style={[type.title, styles.headerTitle]}>Mis accesos</Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{MOCK_SESSIONS.length}</Text>
            <Text style={styles.statLabel}>Accesos activos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Apps autorizadas</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={type.overline}>Sesiones activas</Text>
          <TouchableOpacity style={styles.sectionAction} onPress={handleScanQR} activeOpacity={0.6}>
            <Feather name="maximize" size={14} color={colors.text} />
            <Text style={styles.sectionActionText}>Escanear QR</Text>
          </TouchableOpacity>
        </View>

        {MOCK_SESSIONS.map((session) => (
          <View key={session.id} style={[ui.card, styles.sessionCard]}>
            <View style={styles.sessionHeader}>
              <View style={styles.monogram}>
                <Text style={styles.monogramText}>{session.appName.charAt(0)}</Text>
              </View>
              <View style={styles.appInfo}>
                <Text style={type.heading}>{session.appName}</Text>
                <Text style={type.caption}>{session.lastActive}</Text>
              </View>
              <View style={ui.badge}>
                <Feather name="check" size={12} color={colors.text} />
                <Text style={ui.badgeText}>Activo</Text>
              </View>
            </View>

            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Feather name="smartphone" size={14} color={colors.textSubtle} />
                <Text style={styles.detailText}>{session.device}</Text>
              </View>
              <View style={styles.detailRow}>
                <Feather name="map-pin" size={14} color={colors.textSubtle} />
                <Text style={styles.detailText}>{session.location}</Text>
              </View>
              <View style={styles.detailRow}>
                <Feather name="hash" size={14} color={colors.textSubtle} />
                <Text style={type.mono}>{session.sessionHash}</Text>
              </View>
            </View>

            <View style={styles.permissions}>
              <Text style={[type.overline, styles.permissionsLabel]}>Datos compartidos</Text>
              <View style={styles.permissionTags}>
                {session.permissions.map((permission) => (
                  <View key={permission} style={styles.permissionTag}>
                    <Text style={styles.permissionText}>{permission}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[ui.secondaryButton, styles.actionButton, styles.revokeButton]}
                onPress={() => handleRevokeAccess(session.id, session.appName)}
                activeOpacity={0.7}
              >
                <Feather name="slash" size={14} color={colors.destructive} />
                <Text style={[ui.secondaryButtonText, styles.revokeButtonText]}>Revocar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[ui.secondaryButton, styles.actionButton]} activeOpacity={0.7}>
                <Text style={ui.secondaryButtonText}>Ver detalles</Text>
                <Feather name="chevron-right" size={14} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    marginTop: 6,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 20,
    gap: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  sessionCard: {
    marginBottom: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  monogram: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  appInfo: {
    flex: 1,
    gap: 2,
  },
  details: {
    gap: 10,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: hairline,
    borderTopColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  permissions: {
    marginTop: 20,
  },
  permissionsLabel: {
    marginBottom: 10,
  },
  permissionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  permissionTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  permissionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: hairline,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
  },
  revokeButton: {
    borderColor: colors.destructive,
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
