import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import type * as NotificationsModule from 'expo-notifications';
import { registerPushToken, type AuthRequest } from './api';

const CHANNEL_ID = 'approvals';
const ORACLE_FIELDS = new Set(['persona_real_unica', 'mayor_de_edad', 'nacionalidad']);

// Expo Go on Android (SDK 53+) lacks native modules expo-notifications needs at import time.
function loadNotifications(): typeof NotificationsModule | null {
  if (Platform.OS === 'android' && isRunningInExpoGo()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications');
  } catch {
    return null;
  }
}

const Notifications = loadNotifications();

Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensurePermission(N: typeof NotificationsModule) {
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Confirmaciones de inicio de sesión',
      importance: N.AndroidImportance.MAX,
    });
  }
  const current = await N.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await N.requestPermissionsAsync();
  return asked.granted;
}

/** Returns false when remote push is unavailable; the inbox poll still works. */
export async function registerForPush(credentialToken: string) {
  if (!Notifications) return false;
  try {
    if (!(await ensurePermission(Notifications))) return false;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    await registerPushToken(credentialToken, data);
    return true;
  } catch {
    return false;
  }
}

export function promptTitle(prompt: AuthRequest) {
  if (prompt.kind === 'login') return 'Inicio de sesión en ZeroID';
  return `Iniciar sesión en ${prompt.client_name}`;
}

export async function notifyLocally(prompt: AuthRequest) {
  if (!Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: promptTitle(prompt),
        body: prompt.fields.some((item) => !ORACLE_FIELDS.has(item.field))
          ? 'Confirma que eres tú y revisa los datos que pide.'
          : 'Confirma que eres tú. No compartirás datos personales.',
        data: { request_id: prompt.request_id },
      },
      trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null,
    });
  } catch {
    // Without permission the prompt still opens the next time the app is in front.
  }
}

function requestIdFrom(response: NotificationsModule.NotificationResponse | null | undefined) {
  const value = response?.notification.request.content.data?.request_id;
  return typeof value === 'string' ? value : null;
}

/** Calls back with the request id of a tapped notification, including the one that launched the app. */
export function onNotificationTap(callback: (requestId: string) => void) {
  if (!Notifications) return () => undefined;
  Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      const requestId = requestIdFrom(response);
      if (requestId) callback(requestId);
    })
    .catch(() => undefined);
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const requestId = requestIdFrom(response);
    if (requestId) callback(requestId);
  });
  return () => subscription.remove();
}
