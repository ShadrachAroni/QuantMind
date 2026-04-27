import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Typography } from './Typography';
import { GlassCard } from './GlassCard';
import { GlowEffect } from './GlowEffect';
import { useTheme } from '../../context/ThemeContext';
import { Activity, ShieldAlert, ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react-native';

interface RebalanceSuggestion {
  ticker: string;
  weight: number;
}

interface DoctorDiagnosticsProps {
  sentimentShock: number;
  suggestions?: RebalanceSuggestion[];
}

export function DoctorDiagnostics({ sentimentShock, suggestions }: DoctorDiagnosticsProps) {
  const { theme } = useTheme();
  
  const isNegative = sentimentShock < 0;
  const statusColor = isNegative ? theme.error : theme.success;
  const statusLabel = isNegative ? 'BEARISH_SHOCK_DETECTED' : (sentimentShock > 0 ? 'BULLISH_SURGE_DETECTED' : 'NEUTRAL_SENTIMENT');

  return (
    <GlassCard intensity="high" style={[styles.container, { borderColor: statusColor + '33' }]}>
      <View style={styles.header}>
        <View style={styles.statusRow}>
          <GlowEffect color={statusColor} size={8} glowRadius={8} />
          <Typography variant="monoBold" style={[styles.statusText, { color: statusColor }]}>
            {statusLabel}
          </Typography>
        </View>
        <Typography variant="caption" style={{ color: theme.textTertiary }}>PORTFOLIO_HEALTH_SCORE: {Math.max(0, 100 - Math.abs(sentimentShock * 1000)).toFixed(0)}/100</Typography>
      </View>

      <View style={styles.shockContainer}>
        <View style={styles.statBox}>
          <Typography variant="caption" style={styles.statLabel}>MIROFISH_SHOCK_BIAS</Typography>
          <Typography variant="h3" style={{ color: statusColor }}>
            {(sentimentShock * 100).toFixed(2)}%
          </Typography>
        </View>
        <View style={styles.divider} />
        <View style={styles.statBox}>
          <Typography variant="caption" style={styles.statLabel}>SYSTEM_RECOMMENDATION</Typography>
          <Typography variant="monoBold" style={{ color: theme.textPrimary, fontSize: 10 }}>
            {isNegative ? 'DE-RISKING_PROTOCOL' : (sentimentShock > 0 ? 'ALPHA_ACCELERATION' : 'HOLD_POSITION')}
          </Typography>
        </View>
      </View>

      {suggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsList}>
          <View style={styles.suggestionHeader}>
            <RefreshCcw size={12} color={theme.secondary} />
            <Typography variant="mono" style={styles.suggestionTitle}>AUTO_REBALANCE_SUGGESTIONS</Typography>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
            {suggestions.map((s, i) => (
              <View key={i} style={[styles.suggestionChip, { backgroundColor: theme.background + '80', borderColor: theme.border }]}>
                <Typography variant="monoBold" style={{ color: theme.textPrimary, fontSize: 10 }}>{s.ticker}</Typography>
                <Typography variant="mono" style={{ color: theme.secondary, fontSize: 9 }}>{(s.weight * 100).toFixed(1)}%</Typography>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, marginHorizontal: 20, marginBottom: 20, borderRadius: 20, borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { fontSize: 10, letterSpacing: 1 },
  shockContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 12, marginBottom: 12 },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 8, color: 'rgba(255,255,255,0.4)', marginBottom: 4 },
  divider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)' },
  suggestionsList: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 },
  suggestionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  suggestionTitle: { fontSize: 8, color: 'rgba(255,255,255,0.5)' },
  scroll: { flexDirection: 'row' },
  suggestionChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, marginRight: 8, alignItems: 'center', minWidth: 60 },
});
