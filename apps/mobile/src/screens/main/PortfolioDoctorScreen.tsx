import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { GlassCard } from '../../components/ui/GlassCard';
import { useTheme } from '../../context/ThemeContext';
import { Activity, ShieldAlert, Zap, TrendingUp, ChevronRight, Info } from 'lucide-react-native';
import { api } from '../../services/api';

const { width } = Dimensions.get('window');

export function PortfolioDoctorScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const [pulse] = useState(new Animated.Value(1));
  const [healthScore, setHealthScore] = useState(84);
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const diagnostics = [
    { id: 1, type: 'CRITICAL', title: 'SENTIMENT_OVERSHOOT', desc: 'MiroFish detected high social contagion in tech sector.', impact: '-4.2%', icon: ShieldAlert, color: '#F87171' },
    { id: 2, type: 'ADVISORY', title: 'LIQUIDITY_GAP', desc: 'Cash reserves below 5% threshold.', impact: 'Neutral', icon: Zap, color: '#FBBF24' },
    { id: 3, type: 'OPTIMIZATION', title: 'TAX_HARVEST_OPPORTUNITY', desc: 'Unrealized losses in $TSLA can offset $NVDA gains.', impact: '+1.5%', icon: TrendingUp, color: '#34D399' },
  ];

  const dynamicStyles = getStyles(theme, isDark);

  return (
    <View style={[dynamicStyles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={dynamicStyles.scroll}>
        <View style={dynamicStyles.hero}>
          <Animated.View style={[dynamicStyles.pulseContainer, { transform: [{ scale: pulse }] }]}>
            <View style={[dynamicStyles.pulseCircle, { borderColor: theme.success }]}>
               <Activity size={48} color={theme.success} />
            </View>
          </Animated.View>
          <Typography variant="h1" style={{ color: theme.textPrimary, marginTop: 24 }}>{healthScore}%</Typography>
          <Typography variant="mono" style={{ color: theme.success, letterSpacing: 2 }}>PORTFOLIO_STABLE</Typography>
        </View>

        <View style={dynamicStyles.section}>
          <Typography variant="mono" style={dynamicStyles.sectionLabel}>DIAGNOSTIC_FINDINGS</Typography>
          {diagnostics.map((item) => (
            <GlassCard key={item.id} style={dynamicStyles.findingCard}>
              <View style={[dynamicStyles.iconBox, { backgroundColor: item.color + '20' }]}>
                <item.icon size={20} color={item.color} />
              </View>
              <View style={dynamicStyles.findingInfo}>
                <Typography variant="monoBold" style={{ fontSize: 12, color: theme.textPrimary }}>{item.title}</Typography>
                <Typography variant="caption" style={{ color: theme.textTertiary }}>{item.desc}</Typography>
              </View>
              <View style={dynamicStyles.findingAction}>
                <Typography variant="mono" style={{ fontSize: 10, color: item.color }}>{item.impact}</Typography>
                <ChevronRight size={16} color={theme.textTertiary} />
              </View>
            </GlassCard>
          ))}
        </View>

        <GlassCard style={dynamicStyles.aiCard}>
          <View style={dynamicStyles.aiHeader}>
            <Zap size={18} color={theme.primary} />
            <Typography variant="mono" style={{ color: theme.primary }}>QUANT_ADVISOR_V3</Typography>
          </View>
          <Typography variant="body" style={{ color: theme.textSecondary, lineHeight: 20 }}>
            "Based on the latest 'Fed Pivot' simulation, your correlation to interest rate swaps has increased. Recommend shifting 5% to Gold-backed ETFs to maintain delta-neutrality."
          </Typography>
          <TouchableOpacity 
            style={[dynamicStyles.applyBtn, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('MiroFish')}
          >
            <Typography variant="monoBold" style={{ color: theme.background }}>RUN_REVALIDATION</Typography>
          </TouchableOpacity>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingTop: 60 },
  hero: { alignItems: 'center', marginBottom: 40 },
  pulseContainer: { 
    width: 140, 
    height: 140, 
    borderRadius: 70, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.05)'
  },
  pulseCircle: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    borderWidth: 2, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderStyle: 'dashed'
  },
  section: { marginBottom: 32 },
  sectionLabel: { fontSize: 10, letterSpacing: 1, color: '#848D97', marginBottom: 16 },
  findingCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 12 
  },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  findingInfo: { flex: 1, marginLeft: 16 },
  findingAction: { alignItems: 'flex-end', gap: 4 },
  aiCard: { padding: 20, borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.primary },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  applyBtn: { 
    marginTop: 20, 
    height: 48, 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center' 
  }
});
