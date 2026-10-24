import { TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../constants/theme';

type ThemeSwitcherProps = {
  size?: number;
};

export default function ThemeSwitcher({ size = 18 }: ThemeSwitcherProps) {
  const { scheme, colors, hairline, setScheme } = useTheme();
  const isDark = scheme === 'dark';

  return (
    <TouchableOpacity
      onPress={() => setScheme(isDark ? 'light' : 'dark')}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      style={[
        styles.button,
        {
          borderColor: colors.border,
          borderWidth: hairline,
        },
      ]}
    >
      <Feather name={isDark ? 'sun' : 'moon'} size={size} color={colors.text} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
