import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack, useLocalSearchParams } from 'expo-router';
import PrivacyDossier from '../../components/PrivacyDossier';
import { companyById } from '../../constants/trustData';
import { fonts, type ThemeColors, useTheme } from '../../constants/theme';

export default function TrustDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const company = companyById(Array.isArray(id) ? id[0] : id);
  const { colors, type, scheme, hairline } = useTheme();
  const styles = useMemo(() => createStyles(colors, hairline), [colors, hairline]);

  if (!company) {
    return (
      <View style={styles.missing}>
        <Stack.Screen options={{ title: 'Dossier' }} />
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Text style={type.heading}>Empresa no encontrada</Text>
        <Text style={type.body}>El identificador no coincide con el catálogo mock.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: company.name }} />
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <PrivacyDossier
          companyData={{
            name: company.name,
            logoUrl: company.logoUrl,
            trustScore: company.grade,
            scores: company.scores,
            justifications: company.justifications,
            scoreTotal: company.scoreTotal,
            policies: company.policies,
            signatureAlgorithm: company.signatureAlgorithm,
          }}
        />
        <Text style={styles.meta}>
          {company.domain} · {company.category} · score {company.score}
        </Text>
      </ScrollView>
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
      paddingTop: 12,
      paddingBottom: 40,
      gap: 16,
    },
    missing: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 24,
      gap: 8,
      justifyContent: 'center',
    },
    meta: {
      fontFamily: fonts.mono,
      fontSize: 12,
      letterSpacing: 0.4,
      color: colors.textSubtle,
      borderTopWidth: hairline,
      borderTopColor: colors.border,
      paddingTop: 16,
    },
  });
}
