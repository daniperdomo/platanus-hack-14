import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import ThemeSwitcher from './ThemeSwitcher';
import { fonts, useTheme } from '../constants/theme';

export default function HeaderActions() {
  const router = useRouter();
  const { colors, hairline } = useTheme();

  return (
    <View style={styles.row}>
      <ThemeSwitcher />
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
