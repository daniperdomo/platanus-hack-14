import { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PrivacyDossier from '../../components/PrivacyDossier';
import SheetBackground from '../../components/SheetBackground';
import { TRUST_COMPANIES, type Company } from '../../constants/trustData';
import { type ThemeColors, fonts, radius, useTheme } from '../../constants/theme';

const RANKED = [...TRUST_COMPANIES].sort((a, b) => b.score - a.score);
const SNAP_POINTS = ['85%'];

export default function TrustScreen() {
  const { colors, type, ui, scheme, hairline } = useTheme();
  const styles = useMemo(() => createStyles(colors, hairline), [colors, hairline]);
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);
  const [selected, setSelected] = useState<Company | null>(null);

  const average = Math.round(
    TRUST_COMPANIES.reduce((total, company) => total + company.score, 0) / TRUST_COMPANIES.length
  );
  const highRisk = TRUST_COMPANIES.filter((company) => company.grade === 'D').length;

  const openCompany = async (company: Company) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(company);
    sheetRef.current?.snapToIndex(0);
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    []
  );

  return (
    <View style={styles.container}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={type.overline}>Analytics</Text>
          <Text style={[type.title, styles.headerTitle]}>Trust Score</Text>
          <Text style={type.body}>
            Qué tan bien tratan tus datos las empresas más conocidas.
          </Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{TRUST_COMPANIES.length}</Text>
            <Text style={styles.statLabel}>Empresas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{average}</Text>
            <Text style={styles.statLabel}>Promedio</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, highRisk > 0 && { color: colors.destructive }]}>
              {highRisk}
            </Text>
            <Text style={styles.statLabel}>Alto riesgo</Text>
          </View>
        </View>

        {RANKED.map((company, index) => {
          const isCritical = company.grade === 'D';
          return (
            <TouchableOpacity
              key={company.id}
              style={[ui.card, styles.row]}
              onPress={() => openCompany(company)}
              activeOpacity={0.7}
            >
              <Text style={styles.rank}>{String(index + 1).padStart(2, '0')}</Text>
              <View style={styles.rowCopy}>
                <Text style={type.heading}>{company.name}</Text>
                <Text style={type.caption}>{company.category}</Text>
              </View>
              <View style={styles.scoreBlock}>
                <Text style={[styles.score, isCritical && { color: colors.destructive }]}>
                  {company.score}
                </Text>
                <View style={[styles.grade, isCritical && { borderColor: colors.destructive }]}>
                  <Text style={[styles.gradeText, isCritical && { color: colors.destructive }]}>
                    {company.grade}
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={SNAP_POINTS}
        enableDynamicSizing={false}
        enablePanDownToClose
        onClose={() => setSelected(null)}
        backdropComponent={renderBackdrop}
        backgroundComponent={SheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetScrollView
          contentContainerStyle={[styles.sheetContent, { paddingBottom: insets.bottom + 24 }]}
        >
          {selected ? <PrivacyDossier company={selected} /> : null}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

function createStyles(colors: ThemeColors, hairline: number) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 32,
    },
    header: {
      marginBottom: 24,
      gap: 6,
    },
    headerTitle: {
      marginTop: 2,
    },
    stats: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: hairline,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: 14,
      gap: 4,
    },
    statValue: {
      fontFamily: fonts.bold,
      fontSize: 24,
      letterSpacing: -0.5,
      fontVariant: ['tabular-nums'],
      color: colors.text,
    },
    statLabel: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: colors.textMuted,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 18,
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    rank: {
      fontFamily: fonts.mono,
      fontSize: 12,
      fontVariant: ['tabular-nums'],
      color: colors.textSubtle,
      width: 24,
    },
    rowCopy: {
      flex: 1,
      gap: 2,
    },
    scoreBlock: {
      alignItems: 'flex-end',
      gap: 4,
    },
    score: {
      fontFamily: fonts.bold,
      fontSize: 20,
      letterSpacing: -0.4,
      fontVariant: ['tabular-nums'],
      color: colors.text,
    },
    grade: {
      minWidth: 24,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.pill,
      borderWidth: hairline,
      borderColor: colors.border,
      alignItems: 'center',
    },
    gradeText: {
      fontFamily: fonts.mono,
      fontSize: 10,
      letterSpacing: 0.8,
      color: colors.textMuted,
    },
    handleIndicator: {
      backgroundColor: colors.border,
      width: 36,
      height: 4,
    },
    sheetContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
    },
  });
}
