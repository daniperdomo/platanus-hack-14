import { useSyncExternalStore } from 'react';

export type NotificationType = 'login' | 'policy_update';

export type Notification = {
  id: string;
  companyId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  scoreDelta?: number;
};

export const NOTIFICATIONS: Notification[] = [
  {
    id: 'n-yummy-login',
    companyId: 'yummy',
    type: 'login',
    title: 'Nuevo inicio de sesión',
    message: 'Yummy quiere acceder a tu identidad ZeroID.',
    timestamp: '2026-10-24T20:18:00-04:00',
    read: false,
  },
  {
    id: 'n-meta-policy',
    companyId: 'meta',
    type: 'policy_update',
    title: 'Políticas de privacidad actualizadas',
    message: 'Meta (Facebook) cambió retención y uso publicitario de tus datos.',
    timestamp: '2026-10-24T18:40:00-04:00',
    read: false,
    scoreDelta: -3,
  },
  {
    id: 'n-apple-policy',
    companyId: 'apple',
    type: 'policy_update',
    title: 'Políticas de privacidad actualizadas',
    message: 'Apple redujo la retención de datos de dispositivo.',
    timestamp: '2026-10-24T16:05:00-04:00',
    read: false,
    scoreDelta: 2,
  },
  {
    id: 'n-uber-login',
    companyId: 'uber',
    type: 'login',
    title: 'Nuevo inicio de sesión',
    message: 'Uber solicita prueba de persona real para un viaje.',
    timestamp: '2026-10-24T12:11:00-04:00',
    read: true,
  },
  {
    id: 'n-mercadolibre-policy',
    companyId: 'mercadolibre',
    type: 'policy_update',
    title: 'Políticas de privacidad actualizadas',
    message: 'Mercado Libre amplió el historial de compras compartido con anunciantes.',
    timestamp: '2026-10-23T21:30:00-04:00',
    read: false,
    scoreDelta: -2,
  },
  {
    id: 'n-airbnb-policy',
    companyId: 'airbnb',
    type: 'policy_update',
    title: 'Políticas de privacidad actualizadas',
    message: 'Airbnb limitó la biometría a la verificación inicial.',
    timestamp: '2026-10-23T09:14:00-04:00',
    read: true,
    scoreDelta: 3,
  },
  {
    id: 'n-tiktok-policy',
    companyId: 'tiktok',
    type: 'policy_update',
    title: 'Políticas de privacidad actualizadas',
    message: 'TikTok ahora exige biometría facial para efectos y moderación.',
    timestamp: '2026-10-22T19:02:00-04:00',
    read: false,
    scoreDelta: -2,
  },
  {
    id: 'n-spotify-login',
    companyId: 'spotify',
    type: 'login',
    title: 'Nuevo inicio de sesión',
    message: 'Spotify quiere confirmar que eres una persona real y única.',
    timestamp: '2026-10-22T08:47:00-04:00',
    read: true,
  },
];

let notificationsState: Notification[] = NOTIFICATIONS.map((item) => ({ ...item }));
let hasUnread = notificationsState.some((item) => !item.read);
const listeners = new Set<() => void>();

function publish() {
  hasUnread = notificationsState.some((item) => !item.read);
  listeners.forEach((listener) => listener());
}

export function getNotifications() {
  return notificationsState;
}

export function getHasUnreadNotifications() {
  return hasUnread;
}

export function subscribeNotifications(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function markNotificationRead(id: string) {
  const target = notificationsState.find((item) => item.id === id);
  if (!target || target.read) return notificationsState;

  notificationsState = notificationsState.map((item) =>
    item.id === id ? { ...item, read: true } : item
  );
  publish();
  return notificationsState;
}

export function useHasUnreadNotifications() {
  return useSyncExternalStore(
    subscribeNotifications,
    getHasUnreadNotifications,
    getHasUnreadNotifications
  );
}
