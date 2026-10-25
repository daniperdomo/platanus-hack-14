import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { fonts, type ThemeColors, useTheme } from '../constants/theme';

const PROFILE = {
  name: 'Daniel Perdomo',
  email: 'daniel@correo.com',
  zeroId: 'zid_7f3a9c21',
  verifiedAt: '2026-10-20',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, type, ui, scheme, hairline } = useTheme();
  const styles = useMemo(() => createStyles(colors, hairline), [colors, hairline]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Perfil' }} />
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>D</Text>
          </View>
          <Text style={type.title}>{PROFILE.name}</Text>
          <Text style={type.body}>{PROFILE.email}</Text>
        </View>

        <View style={[ui.card, styles.card]}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>ZeroID</Text>
            <Text style={styles.rowValue}>{PROFILE.zeroId}</Text>
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>Verificado</Text>
            <Text style={styles.rowValue}>{PROFILE.verifiedAt}</Text>
          </View>
        </View>

        <View style={[ui.card, styles.card, styles.themeRow]}>
          <View style={styles.themeCopy}>
            <Text style={styles.rowLabel}>Apariencia</Text>
            <Text style={styles.rowValue}>Claro / oscuro</Text>
          </View>
          <ThemeSwitcher />
        </View>

        <TouchableOpacity
          style={[ui.secondaryButton, styles.signOut]}
          onPress={() => router.replace('/')}
          activeOpacity={0.7}
        >
          <Feather name="log-out" size={16} color={colors.text} />
          <Text style={ui.secondaryButtonText}>Cerrar sesión</Text>
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
      paddingTop: 24,
      paddingBottom: 40,
      gap: 16,
    },
    identity: {
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 9999,
      borderWidth: hairline,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    avatarText: {
      fontFamily: fonts.mono,
      fontSize: 22,
      color: colors.text,
    },
    card: {
      paddingVertical: 4,
      paddingHorizontal: 20,
    },
    row: {
      paddingVertical: 16,
      borderBottomWidth: hairline,
      borderBottomColor: colors.border,
      gap: 4,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    rowLabel: {
      fontFamily: fonts.mono,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: colors.textMuted,
    },
    rowValue: {
      fontFamily: fonts.regular,
      fontSize: 15,
      color: colors.text,
    },
    themeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
    },
    themeCopy: {
      gap: 4,
    },
    signOut: {
      marginTop: 8,
    },
  });
}
