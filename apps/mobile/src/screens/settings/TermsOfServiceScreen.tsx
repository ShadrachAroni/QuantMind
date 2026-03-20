import React from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Dimensions } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { ChevronLeft, FileText, Scale, AlertTriangle } from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { sharedTheme } from '../../constants/theme';

const { width } = Dimensions.get('window');

export function TermsOfServiceScreen() {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  
  const BackIcon = ChevronLeft as any;
  const TermsIcon = FileText as any;
  const dynamicStyles = getStyles(theme, isDark);

  return (
    <View style={[dynamicStyles.container, { backgroundColor: theme.background }]}>
      <View style={[dynamicStyles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[dynamicStyles.backBtn, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)' }]}>
          <BackIcon size={20} color={theme.textSecondary} />
        </TouchableOpacity>
        <Typography variant="mono" style={[dynamicStyles.subHeader, { color: theme.textTertiary }]}>GOVERNANCE_PROTOCOL_V1.1</Typography>
        <Typography variant="h2" style={[dynamicStyles.title, { color: theme.textPrimary }]}>TERMS_OF_SERVICE</Typography>
      </View>

      <ScrollView contentContainerStyle={dynamicStyles.content} showsVerticalScrollIndicator={false}>
        <GlassCard style={dynamicStyles.card}>
          <View style={dynamicStyles.infoRow}>
            <TermsIcon size={16} color={theme.secondary} />
            <Typography variant="mono" style={[dynamicStyles.lastUpdated, { color: theme.textTertiary }]}>LAST_COMMITTED: MARCH_2026</Typography>
          </View>

          <Typography variant="body" style={[dynamicStyles.text, { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }]}>
            By accessing the QuantMind terminal, you agree to be bound by these institutional terms of service and our data governance protocols.
          </Typography>

          <View style={dynamicStyles.section}>
            <Typography variant="monoBold" style={[dynamicStyles.sectionTitle, { color: theme.secondary }]}>01_NO_FINANCIAL_ADVICE</Typography>
            <Typography variant="body" style={[dynamicStyles.text, { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }]}>
              QuantMind is a mathematical simulation tool. It does NOT provide financial, investment, or legal advice. All simulations are based on historical probability and do not guarantee future performance.
            </Typography>
          </View>

          <View style={dynamicStyles.section}>
            <Typography variant="monoBold" style={[dynamicStyles.sectionTitle, { color: theme.secondary }]}>02_MODEL_LIMITATIONS</Typography>
            <Typography variant="body" style={[dynamicStyles.text, { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }]}>
              Users acknowledge that Monte Carlo simulations (GBM, Fat-Tails) are approximations of reality. They may fail to predict "Black Swan" events or structural market regime shifts.
            </Typography>
          </View>

          <View style={dynamicStyles.section}>
            <Typography variant="monoBold" style={[dynamicStyles.sectionTitle, { color: theme.secondary }]}>03_USAGE_QUOTAS</Typography>
            <Typography variant="body" style={[dynamicStyles.text, { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }]}>
              Compute resources are allocated based on your tier (FREE/PRO). Attempting to bypass kernel rate limits or exploit simulation depth is a violation of these terms.
            </Typography>
          </View>
        </GlassCard>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 64,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 20,
  },
  subHeader: {
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    letterSpacing: 2,
  },
  content: {
    padding: 24,
  },
  card: {
    padding: 24,
    borderRadius: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    opacity: 0.6,
  },
  lastUpdated: {
    fontSize: 9,
    letterSpacing: 1,
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 12,
    marginBottom: 12,
    letterSpacing: 1,
  },
  text: {
    lineHeight: 22,
    fontSize: 14,
  },
});
