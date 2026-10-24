import { Appearance, StyleSheet, useColorScheme } from 'react-native';

export type ColorSchemeName = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  surface: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  inverse: string;
  destructive: string;
  overlay: string;
};

export const palettes: Record<ColorSchemeName, ThemeColors> = {
  dark: {
    background: '#0D0E11',
    surface: '#16181D',
    border: '#2A2D35',
    borderStrong: '#2A2D35',
    text: '#FFFFFF',
    textMuted: '#8A8F9C',
    textSubtle: '#8A8F9C',
    inverse: '#0D0E11',
    destructive: '#B42318',
    overlay: 'rgba(13, 14, 17, 0.6)',
  },
  light: {
    background: '#FAFAFA',
    surface: '#FFFFFF',
    border: '#EAEAEA',
    borderStrong: '#E2E2E2',
    text: '#111111',
    textMuted: '#666666',
    textSubtle: '#666666',
    inverse: '#FAFAFA',
    destructive: '#B42318',
    overlay: 'rgba(17, 17, 17, 0.4)',
  },
};

export const fonts = {
  regular: 'Geist-Regular',
  semibold: 'Geist-SemiBold',
  bold: 'Geist-Bold',
  mono: 'GeistMono',
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 24,
  pill: 9999,
} as const;

export const hairline = StyleSheet.hairlineWidth;

function makeType(colors: ThemeColors) {
  return StyleSheet.create({
    display: {
      fontFamily: fonts.bold,
      fontSize: 32,
      letterSpacing: -0.5,
      lineHeight: 38,
      color: colors.text,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 28,
      letterSpacing: -0.5,
      color: colors.text,
    },
    heading: {
      fontFamily: fonts.semibold,
      fontSize: 17,
      letterSpacing: -0.2,
      color: colors.text,
    },
    body: {
      fontFamily: fonts.regular,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textMuted,
    },
    caption: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textSubtle,
    },
    overline: {
      fontFamily: fonts.semibold,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.textSubtle,
    },
    mono: {
      fontFamily: fonts.mono,
      fontSize: 12,
      fontVariant: ['tabular-nums'],
      color: colors.textMuted,
    },
  });
}

function makeUi(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: hairline,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: 24,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 52,
      paddingHorizontal: 24,
      borderRadius: radius.pill,
      backgroundColor: colors.text,
    },
    primaryButtonText: {
      fontFamily: fonts.semibold,
      fontSize: 16,
      color: colors.inverse,
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 44,
      paddingHorizontal: 18,
      borderRadius: radius.pill,
      borderWidth: hairline,
      borderColor: colors.border,
      backgroundColor: 'transparent',
    },
    secondaryButtonText: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: colors.text,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.pill,
      borderWidth: hairline,
      borderColor: colors.border,
      backgroundColor: 'transparent',
    },
    badgeText: {
      fontFamily: fonts.semibold,
      fontSize: 12,
      color: colors.text,
    },
  });
}

const typeByScheme = {
  dark: makeType(palettes.dark),
  light: makeType(palettes.light),
} as const;

const uiByScheme = {
  dark: makeUi(palettes.dark),
  light: makeUi(palettes.light),
} as const;

export function resolveScheme(scheme: string | null | undefined): ColorSchemeName {
  return scheme === 'light' ? 'light' : 'dark';
}

export function useTheme() {
  const scheme = resolveScheme(useColorScheme());
  const colors = palettes[scheme];

  return {
    scheme,
    colors,
    fonts,
    radius,
    hairline,
    type: typeByScheme[scheme],
    ui: uiByScheme[scheme],
    setScheme: (next: ColorSchemeName) => Appearance.setColorScheme(next),
  };
}

/** @deprecated Prefer `useTheme().colors` so the palette follows the active scheme. */
export const colors = palettes.dark;
export const type = typeByScheme.dark;
export const ui = uiByScheme.dark;
