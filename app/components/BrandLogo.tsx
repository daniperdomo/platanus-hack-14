import { Image, StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native';
import { useTheme } from '../constants/theme';

const MARK = require('../assets/logo-mark.png');
const WORDMARK = require('../assets/logo-wordmark.png');

const MARK_RATIO = 640 / 765;
const WORDMARK_RATIO = 960 / 224;

type BrandLogoProps = {
  variant?: 'mark' | 'wordmark' | 'lockup';
  height?: number;
  style?: StyleProp<ImageStyle>;
};

export default function BrandLogo({ variant = 'wordmark', height = 22, style }: BrandLogoProps) {
  const { colors } = useTheme();
  const tint = { tintColor: colors.text };

  if (variant === 'lockup') {
    return (
      <View style={styles.lockup}>
        <Image
          source={MARK}
          resizeMode="contain"
          style={[styles.image, { height, width: height * MARK_RATIO }, tint, style]}
        />
        <Image
          source={WORDMARK}
          resizeMode="contain"
          style={[styles.image, { height, width: height * WORDMARK_RATIO }, tint]}
        />
      </View>
    );
  }

  const source = variant === 'mark' ? MARK : WORDMARK;
  const width = height * (variant === 'mark' ? MARK_RATIO : WORDMARK_RATIO);

  return (
    <Image
      source={source}
      resizeMode="contain"
      accessibilityLabel={variant === 'wordmark' ? 'ZeroID' : undefined}
      style={[styles.image, { height, width }, tint, style]}
    />
  );
}

const styles = StyleSheet.create({
  lockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  image: {
    backgroundColor: 'transparent',
  },
});
