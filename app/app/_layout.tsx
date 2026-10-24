import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
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
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="dashboard" 
          options={{ 
            title: '',
            headerShown: true,
            headerBackButtonDisplayMode: 'minimal',
          }} 
        />
        <Stack.Screen 
          name="consent" 
          options={{ 
            title: 'Autorización',
            presentation: 'transparentModal',
            headerShown: false,
            animation: 'fade'
          }} 
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
