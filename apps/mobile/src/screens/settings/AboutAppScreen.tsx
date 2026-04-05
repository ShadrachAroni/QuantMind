import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { useTheme } from '../../context/ThemeContext';
import { Info, ShieldCheck, Cpu, ChevronLeft, Globe } from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';

const { width } = Dimensions.get('window');

export function AboutAppScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();

  const InfoIcon = Info as any;
  const ShieldIcon = ShieldCheck as any;
  const CpuIcon = Cpu as any;
  const BackIcon = ChevronLeft as any;
  const GlobeIcon = Globe as any;

  const dynamicStyles = getStyles(theme, isDark);

  return (
    <View style={[dynamicStyles.container, { backgroundColor: theme.background }]}>
      <View style={[dynamicStyles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[dynamicStyles.backBtn, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)' }]}>
          <BackIcon size={20} color={theme.textSecondary} />
        </TouchableOpacity>
        <Typography variant="mono" style={[dynamicStyles.subHeader, { color: theme.textTertiary }]}>PROTOCOL_INFORMATION</Typography>
        <Typography variant="h2" style={[dynamicStyles.title, { color: theme.textPrimary }]}>ABOUT_QUANTMIND</Typography>
      </View>

      <ScrollView contentContainerStyle={dynamicStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <GlassCard style={dynamicStyles.mainCard} intensity="low">
          <View style={dynamicStyles.versionRow}>
            <View style={dynamicStyles.iconWrapper}>
              <InfoIcon size={24} color={theme.primary} />
            </View>
            <View>
              <Typography variant="h3" style={{ color: theme.textPrimary }}>QUANTMIND_MOBILE_OS</Typography>
              <Typography variant="mono" style={{ color: theme.textTertiary, fontSize: 10 }}>v1.2.8 // STABLE_BUILD</Typography>
            </View>
          </View>

          <View style={dynamicStyles.separator} />

          <Typography variant="body" style={[dynamicStyles.description, { color: theme.textSecondary }]}>
            QuantMind is a high-fidelity portfolio risk analysis and simulation platform. We provide institutional-grade tools to every investor through advanced data orchestration and AI.
          </Typography>

          <Typography variant="body" style={[dynamicStyles.description, { color: theme.textTertiary, marginTop: 12 }]}>
            By merging probability with modern investing, we empower users to navigate complex market environments with clarity and confidence.
          </Typography>
        </GlassCard>

        <View style={dynamicStyles.statsGrid}>
          <GlassCard style={dynamicStyles.statCard}>
            <CpuIcon size={20} color={theme.primary} />
            <Typography variant="mono" style={dynamicStyles.statLabel}>ENGINE</Typography>
            <Typography variant="monoBold" style={dynamicStyles.statValue}>RUST_K1</Typography>
          </GlassCard>
          
          <GlassCard style={dynamicStyles.statCard}>
            <ShieldIcon size={20} color={theme.success} />
            <Typography variant="mono" style={dynamicStyles.statLabel}>SECURITY</Typography>
            <Typography variant="monoBold" style={dynamicStyles.statValue}>AES_256</Typography>
          </GlassCard>

          <GlassCard style={dynamicStyles.statCard}>
            <GlobeIcon size={20} color={theme.textTertiary} />
            <Typography variant="mono" style={dynamicStyles.statLabel}>REGION</Typography>
            <Typography variant="monoBold" style={dynamicStyles.statValue}>GLOBAL</Typography>
          </GlassCard>
        </View>

        <View style={dynamicStyles.footer}>
          <Typography variant="caption" style={[dynamicStyles.footerText, { color: theme.textTertiary }]}>
            © 2026 QUANTMIND COE. ALL RIGHTS RESERVED.
          </Typography>
          <Typography variant="mono" style={[dynamicStyles.footerSubtext, { color: theme.textTertiary }]}>
            ENCRYPTED_TERMINAL_CONNECTION: ACTIVE
          </Typography>
        </View>
      </ScrollView>

      <GlowEffect color={theme.primary} size={300} glowRadius={150} style={dynamicStyles.bgGlow} />
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
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  mainCard: {
    padding: 24,
    borderRadius: 32,
    marginBottom: 16,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 24,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'SpaceMono-Regular',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 8,
    letterSpacing: 1,
    opacity: 0.5,
  },
  statValue: {
    fontSize: 10,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  footerText: {
    fontSize: 10,
    letterSpacing: 1,
  },
  footerSubtext: {
    fontSize: 8,
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  bgGlow: {
    position: 'absolute',
    bottom: -150,
    right: -150,
    opacity: 0.15,
  }
});
