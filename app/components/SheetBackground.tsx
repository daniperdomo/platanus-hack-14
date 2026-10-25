import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import type { BottomSheetBackgroundProps } from '@gorhom/bottom-sheet';
import { radius, useTheme } from '../constants/theme';

export default function SheetBackground({ style }: BottomSheetBackgroundProps) {
  const { colors, scheme, hairline } = useTheme();

  return (
    <View
      style={[
        style,
        {
          overflow: 'hidden',
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          borderWidth: hairline,
          borderBottomWidth: 0,
          borderColor: colors.border,
        },
      ]}
    >
      <BlurView intensity={60} tint={scheme} style={StyleSheet.absoluteFill} />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: scheme === 'dark' ? 'rgba(22, 24, 29, 0.72)' : 'rgba(255, 255, 255, 0.78)',
          },
        ]}
      />
    </View>
  );
}
