import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { useTheme } from '../../context/ThemeContext';
import { ChevronLeft, Info, Cpu, BarChart3, Binary, ShieldAlert } from 'lucide-react-native';

export function ModelMethodologyScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();

  const BackIcon = ChevronLeft as any;
  const InfoIcon = Info as any;
  const CpuIcon = Cpu as any;
  const ChartIcon = BarChart3 as any;
  const BinaryIcon = Binary as any;
  const WarningIcon = ShieldAlert as any;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { borderColor: theme.border }]}>
            <BackIcon size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Typography variant="mono" style={{ color: theme.textTertiary, fontSize: 10, letterSpacing: 2 }}>KERNEL_LOGICS // WHITE_PAPER</Typography>
          <Typography variant="h2" style={{ color: theme.textPrimary, marginTop: 4 }}>SIMULATION_MODELS</Typography>
        </View>

        <View style={styles.section}>
          <View style={[styles.introCard, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
            <InfoIcon size={20} color={theme.primary} />
            <Typography variant="body" style={{ color: theme.textSecondary, flex: 1, lineHeight: 20 }}>
              QuantMind utilizes advanced stochastic calculus to simulate asset price trajectories over thousands of parallel universes.
            </Typography>
          </View>
        </View>

        <View style={styles.section}>
          <Typography variant="mono" style={styles.label}>CORE_ALGORITHMS</Typography>
          
          <View style={styles.modelGrid}>
            <View style={[styles.modelItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}>
               <CpuIcon size={24} color={theme.primary} />
               <Typography variant="monoBold" style={{ color: theme.textPrimary, marginTop: 12 }}>GBM</Typography>
               <Typography variant="caption" style={{ color: theme.textTertiary, marginTop: 4 }}>Geometric Brownian Motion for base volatility modeling.</Typography>
            </View>

            <View style={[styles.modelItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}>
               <ChartIcon size={24} color={theme.primary} />
               <Typography variant="monoBold" style={{ color: theme.textPrimary, marginTop: 12 }}>FAT_TAILS</Typography>
               <Typography variant="caption" style={{ color: theme.textTertiary, marginTop: 4 }}>Student-t distributions to capture extreme market events.</Typography>
            </View>

            <View style={[styles.modelItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}>
               <BinaryIcon size={24} color={theme.primary} />
               <Typography variant="monoBold" style={{ color: theme.textPrimary, marginTop: 12 }}>JUMP_DIFF</Typography>
               <Typography variant="caption" style={{ color: theme.textTertiary, marginTop: 4 }}>Poisson processes for sudden price gapping and news shocks.</Typography>
            </View>

            <View style={[styles.modelItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}>
               <WarningIcon size={24} color={theme.primary} />
               <Typography variant="monoBold" style={{ color: theme.textPrimary, marginTop: 12 }}>REGIME_S</Typography>
               <Typography variant="caption" style={{ color: theme.textTertiary, marginTop: 4 }}>Markov switching for bull/bear trend transitions.</Typography>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Typography variant="mono" style={styles.label}>DATA_INTEGRITY</Typography>
          <View style={[styles.disclosureBox, { borderLeftColor: theme.primary }]}>
            <Typography variant="body" style={{ color: theme.textSecondary }}>
              All market data is sourced via decentralized oracles and institutional feeds. Historical backtesting uses 10+ years of tick-level data where available.
            </Typography>
          </View>
        </View>

        <View style={styles.section}>
           <View style={[styles.warningBox, { backgroundColor: theme.error + '05', borderColor: theme.error + '20' }]}>
             <Typography variant="monoBold" style={{ color: theme.error, fontSize: 12 }}>RISK_WARNING</Typography>
             <Typography variant="caption" style={{ color: theme.textTertiary, marginTop: 8 }}>
               Simulations are strictly hypothetical. Past performance, even stochastically modeled, is not a guarantee of future outcomes. QuantMind is a decision-support system, not a financial advisor.
             </Typography>
           </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 24,
    paddingTop: 64,
  },
  header: {
    marginBottom: 32,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  introCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  label: {
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 16,
    marginLeft: 4,
  },
  modelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modelItem: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 140,
  },
  disclosureBox: {
    paddingLeft: 20,
    borderLeftWidth: 2,
  },
  warningBox: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
});
