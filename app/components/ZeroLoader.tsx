import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import BrandLogo from './BrandLogo';
import { fonts } from '../constants/theme';

const CYCLE_MS = 800;
const HALF_CYCLE_MS = CYCLE_MS / 2;

export default function ZeroLoader() {
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.2,
          duration: HALF_CYCLE_MS,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: HALF_CYCLE_MS,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logo, { opacity }]}>
        <BrandLogo variant="mark" height={72} />
      </Animated.View>
      <Text style={styles.label}>PROCESANDO...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    backgroundColor: '#0D0E11',
    elevation: 0,
    shadowOpacity: 0,
  },
  logo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.5,
    color: '#8A8F9C',
  },
});
