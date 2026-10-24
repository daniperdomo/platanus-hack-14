import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { listConnections } from '../lib/api';
import { loadWallet } from '../lib/wallet';
import { colors, hairline, radius, type, ui } from '../constants/theme';

const LABELS: Record<string, string> = {
  nombre: 'Nombre',
  email: 'Correo',
  telefono: 'Teléfono',
  fecha_nacimiento: 'Nacimiento',
  mayor_de_edad: 'Mayor de edad',
  nacionalidad: 'Nacionalidad',
  documento: 'Documento',
  direccion: 'Dirección',
  persona_real_unica: 'Persona real',
};

type Connection = {
  id: string;
  client_name: string;
  client_domain: string;
  rules: string[];
  created_at: string;
};

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      let stop = false;
      loadWallet().then(async (wallet) => {
        if (!wallet || stop) return;
        try {
          const body = await listConnections(wallet.token);
          if (!stop) setConnections(body.connections);
        } catch (err) {
          if (!stop) setError(err instanceof Error ? err.message : 'No pudimos leer tus accesos.');
        }
      });
      return () => {
        stop = true;
      };
    }, [])
  );

  const handleScanQR = () => {
    router.push({ pathname: '/', params: { scan: 'approve' } });
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
            <Text style={styles.statValue}>{connections.length}</Text>
            <Text style={styles.statLabel}>Accesos activos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{connections.length}</Text>
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

        {error ? <Text style={styles.detailText}>{error}</Text> : null}
        {connections.length === 0 && !error ? (
          <Text style={styles.detailText}>Todavía no autorizas ningún sitio.</Text>
        ) : null}
        {connections.map((session) => (
          <View key={session.id} style={[ui.card, styles.sessionCard]}>
            <View style={styles.sessionHeader}>
              <View style={styles.monogram}>
                <Text style={styles.monogramText}>{session.client_name.charAt(0)}</Text>
              </View>
              <View style={styles.appInfo}>
                <Text style={type.heading}>{session.client_name}</Text>
                <Text style={type.caption}>{session.created_at.slice(0, 16).replace('T', ' ')}</Text>
              </View>
              <View style={ui.badge}>
                <Feather name="check" size={12} color={colors.text} />
                <Text style={ui.badgeText}>Activo</Text>
              </View>
            </View>

            <View style={styles.permissions}>
              <Text style={[type.overline, styles.permissionsLabel]}>Datos compartidos</Text>
              <View style={styles.permissionTags}>
                {session.rules.map((permission) => (
                  <View key={permission} style={styles.permissionTag}>
                    <Text style={styles.permissionText}>{LABELS[permission] ?? permission}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
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
