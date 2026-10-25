import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { type Notification } from '../constants/notificationData';
import { fonts, type ThemeColors, useTheme } from '../constants/theme';

const SCORE_DOWN = '#B42318';
const SCORE_UP = '#10B981';

type NotificationRowProps = {
  notification: Notification;
  onPress: () => void;
};

function formatTimestamp(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  return date.toLocaleString('es-CL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function deltaLabel(delta: number) {
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta}`;
}

function deltaIcon(delta: number): 'trending-up' | 'trending-down' | 'arrow-right' {
  if (delta > 0) return 'trending-up';
  if (delta < 0) return 'trending-down';
  return 'arrow-right';
}

export default function NotificationRow({ notification, onPress }: NotificationRowProps) {
  const { colors, hairline } = useTheme();
  const styles = useMemo(() => createStyles(colors, hairline), [colors, hairline]);
  const isPolicy = notification.type === 'policy_update';
  const delta = notification.scoreDelta ?? 0;
  const deltaColor = delta > 0 ? SCORE_UP : delta < 0 ? SCORE_DOWN : colors.textMuted;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={
        notification.read ? notification.title : `Notificación sin leer. ${notification.title}`
      }
    >
      <View style={styles.unreadSlot}>
        {notification.read ? null : <View style={styles.unreadDot} />}
      </View>

      <View style={styles.icon}>
        <Feather
          name={isPolicy ? 'file-text' : 'log-in'}
          size={16}
          color={colors.textMuted}
        />
      </View>

      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={styles.timestamp}>{formatTimestamp(notification.timestamp)}</Text>
      </View>

      {isPolicy && notification.scoreDelta != null ? (
        <View style={styles.delta}>
          <Feather name={deltaIcon(delta)} size={14} color={deltaColor} />
          <Text style={[styles.deltaText, { color: deltaColor }]}>
            {deltaLabel(notification.scoreDelta)}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function createStyles(colors: ThemeColors, hairline: number) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 16,
      paddingRight: 4,
      borderBottomWidth: hairline,
      borderBottomColor: colors.border,
    },
    unreadSlot: {
      width: 8,
      paddingTop: 8,
      alignItems: 'center',
    },
    unreadDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.text,
    },
    icon: {
      width: 36,
      height: 36,
      borderRadius: 9999,
      borderWidth: hairline,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    copy: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    title: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      letterSpacing: -0.2,
      color: colors.text,
    },
    message: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textMuted,
    },
    timestamp: {
      fontFamily: fonts.mono,
      fontSize: 11,
      letterSpacing: 0.4,
      color: colors.textSubtle,
      marginTop: 2,
    },
    delta: {
      alignItems: 'flex-end',
      gap: 4,
      paddingTop: 4,
      minWidth: 36,
    },
    deltaText: {
      fontFamily: fonts.mono,
      fontSize: 12,
      letterSpacing: 0.4,
      fontVariant: ['tabular-nums'],
    },
  });
}
