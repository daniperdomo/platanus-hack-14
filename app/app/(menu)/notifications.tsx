import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import NotificationRow from '../../components/NotificationRow';
import {
  getNotifications,
  markNotificationRead,
  type Notification,
} from '../../constants/notificationData';
import { type ThemeColors, useTheme } from '../../constants/theme';

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, type, scheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [notifications, setNotifications] = useState<Notification[]>(() => getNotifications());

  const openNotification = useCallback(
    async (notification: Notification) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setNotifications(markNotificationRead(notification.id));

      if (notification.type === 'login') {
        router.push(`/consent?companyId=${encodeURIComponent(notification.companyId)}`);
        return;
      }

      router.push(`/trust/${encodeURIComponent(notification.companyId)}`);
    },
    [router]
  );

  return (
    <View style={styles.container}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={type.overline}>Actividad</Text>
            <Text style={[type.title, styles.headerTitle]}>Inbox</Text>
            <Text style={type.body}>
              Inicios de sesión y cambios de política. Un acceso abre la autorización; un cambio de política abre el dossier.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <NotificationRow notification={item} onPress={() => openNotification(item)} />
        )}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    list: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 32,
    },
    header: {
      marginBottom: 8,
      gap: 6,
      paddingBottom: 16,
    },
    headerTitle: {
      marginTop: 2,
    },
  });
}
