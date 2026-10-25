import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import InboxWatcher from '../components/InboxWatcher';
import { fonts, useTheme } from '../constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colors, scheme } = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    [fonts.bold]: require('../assets/fonts/Geist-Bold.ttf'),
    [fonts.semibold]: require('../assets/fonts/Geist-SemiBold.ttf'),
    [fonts.regular]: require('../assets/fonts/Geist-Regular.ttf'),
    [fonts.mono]: require('../assets/fonts/GeistMono-Regular.ttf'),
  });

  useEffect(() => {
    if (fontError) {
      console.warn('No se pudieron cargar las fuentes Geist:', fontError.message);
    }
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontFamily: fonts.semibold,
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'ZeroID',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(menu)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="consent"
          options={{
            title: 'Autorización',
            presentation: 'transparentModal',
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="trust/[id]"
          options={{
            title: 'Dossier',
            headerBackTitle: 'Trust',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            title: 'Perfil',
            headerBackTitle: 'Atrás',
          }}
        />
      </Stack>
      <InboxWatcher />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
