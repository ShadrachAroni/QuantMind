import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { useTheme } from '../../context/ThemeContext';
import { HelpCircle, ChevronLeft, CheckCircle2, ArrowRight } from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';

const { width } = Dimensions.get('window');

export function HowToUseScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();

  const HelpIcon = HelpCircle as any;
  const BackIcon = ChevronLeft as any;
  const CheckIcon = CheckCircle2 as any;
  const ArrowIcon = ArrowRight as any;

  const dynamicStyles = getStyles(theme, isDark);

  const steps = [
    { title: 'INITIALIZE_PROFILE', desc: 'Configure your identity and preferences (Language, Region) to optimize the terminal experience.' },
    { title: 'CALIBRATE_AI', desc: 'Select your Cognitive Persona and tune the AI engine to match your investment style.' },
    { title: 'CONSTRUCT_PORTFOLIO', desc: 'Use the Portfolio Builder to input or sync your assets for analysis.' },
    { title: 'RUN_SIMULATIONS', desc: 'Trigger Monte Carlo kernels to project 10,000+ paths and identify tail risks.' },
    { title: 'CONSULT_DOCTOR', desc: 'Engage with the Portfolio Doctor for deep-dive analysis and optimization strategies.' }
  ];

  return (
    <View style={[dynamicStyles.container, { backgroundColor: theme.background }]}>
      <View style={[dynamicStyles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[dynamicStyles.backBtn, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)' }]}>
          <BackIcon size={20} color={theme.textSecondary} />
        </TouchableOpacity>
        <Typography variant="mono" style={[dynamicStyles.subHeader, { color: theme.textTertiary }]}>OPERATIONAL_MANUAL</Typography>
        <Typography variant="h2" style={[dynamicStyles.title, { color: theme.textPrimary }]}>USER_GUIDE</Typography>
      </View>

      <ScrollView contentContainerStyle={dynamicStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={dynamicStyles.stepsContainer}>
          {steps.map((step, index) => (
            <View key={step.title} style={dynamicStyles.stepWrapper}>
              <View style={dynamicStyles.stepLineContainer}>
                <View style={[dynamicStyles.stepNode, { borderColor: theme.primary, backgroundColor: theme.background }]}>
                  <Typography variant="monoBold" style={{ color: theme.primary, fontSize: 10 }}>0{index + 1}</Typography>
                </View>
                {index < steps.length - 1 && <View style={[dynamicStyles.stepLine, { backgroundColor: theme.border }]} />}
              </View>
              
              <GlassCard style={dynamicStyles.stepCard} intensity="low">
                <Typography variant="h3" style={[dynamicStyles.stepTitle, { color: theme.textPrimary }]}>{step.title}</Typography>
                <Typography variant="body" style={[dynamicStyles.stepDesc, { color: theme.textSecondary }]}>{step.desc.toUpperCase()}</Typography>
              </GlassCard>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={[dynamicStyles.docBtn, { borderColor: theme.primary }]}
          onPress={() => navigation.navigate('ModelMethodology')}
        >
          <Typography variant="mono" style={{ color: theme.primary, fontSize: 10 }}>READ_FULL_DOCUMENTATION</Typography>
          <ArrowIcon size={14} color={theme.primary} />
        </TouchableOpacity>
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
  stepsContainer: {
    marginVertical: 16,
  },
  stepWrapper: {
    flexDirection: 'row',
    gap: 16,
  },
  stepLineContainer: {
    alignItems: 'center',
    width: 24,
  },
  stepNode: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  stepLine: {
    width: 1,
    flex: 1,
    marginVertical: 4,
  },
  stepCard: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 14,
    letterSpacing: 1,
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 10,
    lineHeight: 16,
    fontFamily: 'SpaceMono-Regular',
  },
  docBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 20,
    borderStyle: 'dashed',
  },
  bgGlow: {
    position: 'absolute',
    top: 200,
    left: -150,
    opacity: 0.1,
  }
});
