import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { type PolicyPoint } from '../constants/trustData';
import { fonts, type ThemeColors, useTheme } from '../constants/theme';

type DataSelectorProps = {
  policies: PolicyPoint[];
  onSelectionChange?: (selectedIds: string[]) => void;
};

export function dataSelectionId(point: Pick<PolicyPoint, 'category' | 'label'>) {
  return `${point.category}-${point.label}`;
}

function selectedIds(optional: PolicyPoint[], allowed: Record<string, boolean>) {
  return optional.filter((point) => allowed[dataSelectionId(point)] ?? false).map(dataSelectionId);
}

export default function DataSelector({ policies, onSelectionChange }: DataSelectorProps) {
  const optional = useMemo(
    () => policies.filter((point) => point.status === 'optional'),
    [policies]
  );
  const [allowed, setAllowed] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(optional.map((point) => [dataSelectionId(point), false]))
  );
  const onSelectionChangeRef = useRef(onSelectionChange);
  const { colors, hairline } = useTheme();
  const styles = useMemo(() => createStyles(colors, hairline), [colors, hairline]);

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  useEffect(() => {
    onSelectionChangeRef.current?.(selectedIds(optional, allowed));
  }, [allowed, optional]);

  if (optional.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.overline}>Datos opcionales</Text>
        <Text style={styles.caption}>Elige qué campos extra autorizas esta vez.</Text>
      </View>

      {optional.map((point, index) => {
        const key = dataSelectionId(point);
        const value = allowed[key] ?? false;
        const isLast = index === optional.length - 1;
        return (
          <View key={key} style={[styles.row, isLast && styles.rowLast]}>
            <View style={styles.copy}>
              <Text style={styles.label}>{point.label}</Text>
              <Text style={styles.reason} numberOfLines={2}>
                {point.reason}
              </Text>
            </View>
            <Switch
              value={value}
              onValueChange={(next) => setAllowed((current) => ({ ...current, [key]: next }))}
              trackColor={{ false: colors.border, true: colors.text }}
              thumbColor={colors.background}
              ios_backgroundColor={colors.border}
              accessibilityLabel={`Compartir ${point.label}`}
            />
          </View>
        );
      })}
    </View>
  );
}

function createStyles(colors: ThemeColors, hairline: number) {
  return StyleSheet.create({
    container: {
      marginTop: 16,
      borderWidth: hairline,
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 10,
      gap: 4,
      borderBottomWidth: hairline,
      borderBottomColor: colors.border,
    },
    overline: {
      fontFamily: fonts.mono,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.textMuted,
    },
    caption: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.textSubtle,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: hairline,
      borderBottomColor: colors.border,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    copy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    label: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: colors.text,
    },
    reason: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 16,
      color: colors.textMuted,
    },
  });
}
