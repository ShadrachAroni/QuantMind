import React from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Dimensions } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { ChevronLeft, Shield, Lock, Eye } from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { sharedTheme } from '../../constants/theme';

const { width } = Dimensions.get('window');

export function PrivacyPolicyScreen() {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  
  const BackIcon = ChevronLeft as any;
  const ShieldIcon = Shield as any;
  const dynamicStyles = getStyles(theme, isDark);

  return (
    <View style={[dynamicStyles.container, { backgroundColor: theme.background }]}>
      <View style={[dynamicStyles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[dynamicStyles.backBtn, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)' }]}>
          <BackIcon size={20} color={theme.textSecondary} />
        </TouchableOpacity>
        <Typography variant="mono" style={[dynamicStyles.subHeader, { color: theme.textTertiary }]}>LEGAL_PROTOCOL_V1.0</Typography>
        <Typography variant="h2" style={[dynamicStyles.title, { color: theme.textPrimary }]}>PRIVACY_POLICY</Typography>
      </View>

      <ScrollView contentContainerStyle={dynamicStyles.content} showsVerticalScrollIndicator={false}>
        <GlassCard style={dynamicStyles.card}>
          <View style={dynamicStyles.infoRow}>
            <ShieldIcon size={16} color={theme.primary} />
            <Typography variant="mono" style={[dynamicStyles.lastUpdated, { color: theme.textTertiary }]}>LAST_COMMITTED: MARCH_2026</Typography>
          </View>

          <Typography variant="body" style={[dynamicStyles.text, { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }]}>
            QuantMind ("we", "our", or "us") is committed to protecting your financial data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our institutional risk terminal.
          </Typography>

          <View style={dynamicStyles.section}>
            <Typography variant="monoBold" style={[dynamicStyles.sectionTitle, { color: theme.primary }]}>01_DATA_COLLECTION</Typography>
            <Typography variant="body" style={[dynamicStyles.text, { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }]}>
              We collect account information, portfolio metadata, and simulation parameters to provide our services. We do NOT sell your financial data to third parties.
            </Typography>
          </View>

          <View style={dynamicStyles.section}>
            <Typography variant="monoBold" style={[dynamicStyles.sectionTitle, { color: theme.primary }]}>02_ENCRYPTION</Typography>
            <Typography variant="body" style={[dynamicStyles.text, { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }]}>
              All portfolio data is encrypted at rest using AES-256 and in transit via TLS 1.3. Your private kernels are logically isolated.
            </Typography>
          </View>

          <View style={dynamicStyles.section}>
            <Typography variant="monoBold" style={[dynamicStyles.sectionTitle, { color: theme.primary }]}>03_AI_PROCESSING</Typography>
            <Typography variant="body" style={[dynamicStyles.text, { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }]}>
              Simulation queries processed by our AI Assistant are anonymized before being transmitted to our model providers. No personally identifiable information (PII) is shared with third-party LLM kernels.
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
