import { Platform, StyleSheet } from 'react-native';

export const colors = {
  background: '#0D0E11',
  surface: '#16181D',
  border: '#2A2D35',
  text: '#FFFFFF',
  textMuted: '#8A8F9C',
  textSubtle: '#5E636E',
  inverse: '#0D0E11',
  destructive: '#B42318',
  overlay: 'rgba(13, 14, 17, 0.6)',
} as const;

export const fonts = {
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }),
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 24,
  pill: 9999,
} as const;

export const hairline = StyleSheet.hairlineWidth;

export const type = StyleSheet.create({
  display: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 38,
    color: colors.text,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.text,
  },
  heading: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: colors.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
  },
  caption: {
    fontSize: 13,
    color: colors.textSubtle,
  },
  overline: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textSubtle,
  },
  mono: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textMuted,
  },
});

export const ui = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
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
    fontSize: 16,
    fontWeight: '600',
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
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
});
