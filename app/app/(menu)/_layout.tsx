import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import HeaderActions from '../../components/HeaderActions';
import { fonts, hairline, useTheme } from '../../constants/theme';

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.semibold },
        headerRight: () => <HeaderActions />,
        headerRightContainerStyle: { paddingRight: 16 },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: fonts.semibold,
          fontSize: 11,
          letterSpacing: 0.2,
        },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: hairline,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="sitios"
        options={{
          title: 'Bóveda',
          tabBarIcon: ({ focused, size }) => (
            <Feather name="lock" size={size} color={focused ? colors.text : colors.textMuted} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ focused, size }) => (
            <Feather name="bell" size={size} color={focused ? colors.text : colors.textMuted} />
          ),
        }}
      />
      <Tabs.Screen
        name="trust"
        options={{
          title: 'Trust',
          tabBarIcon: ({ focused, size }) => (
            <Feather name="shield" size={size} color={focused ? colors.text : colors.textMuted} />
          ),
        }}
      />
    </Tabs>
  );
}
