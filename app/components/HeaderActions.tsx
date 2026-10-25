import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import ThemeSwitcher from './ThemeSwitcher';
import { useHasUnreadNotifications } from '../constants/notificationData';
import { fonts, useTheme } from '../constants/theme';

export default function HeaderActions() {
  const router = useRouter();
  const { colors, hairline } = useTheme();
  const hasUnreadNotifications = useHasUnreadNotifications();

  return (
    <View style={styles.row}>
      <ThemeSwitcher />
      <TouchableOpacity
        onPress={() => router.push('/notifications')}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={
          hasUnreadNotifications ? 'Abrir notificaciones, hay sin leer' : 'Abrir notificaciones'
        }
        style={[
          styles.iconButton,
          {
            borderColor: colors.border,
            borderWidth: hairline,
          },
        ]}
      >
        <Feather name="bell" size={16} color={colors.text} />
        {hasUnreadNotifications ? (
          <View style={[styles.badge, { backgroundColor: colors.destructive }]} />
        ) : null}
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push('/profile')}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Abrir perfil"
        style={[
          styles.avatar,
          {
            borderColor: colors.border,
            borderWidth: hairline,
          },
        ]}
      >
        <Text style={[styles.initial, { color: colors.text }]}>D</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  badge: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  initial: {
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 0.4,
  },
});
