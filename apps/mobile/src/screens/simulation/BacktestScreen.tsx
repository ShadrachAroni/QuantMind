import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { useAuthStore } from '../../store/authStore';
import { usePortfolioStore, usePortfolios } from '../../store/portfolioStore';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../services/supabase';
import { 
  BarChart3, 
  Play, 
  ShieldCheck, 
  ChevronLeft, 
  History, 
  TrendingUp, 
  Activity, 
  Lock,
  Download
} from 'lucide-react-native';
import { LineChart } from 'react-native-svg-charts';
import * as shape from 'd3-shape';
import { theme as constTheme } from '../../constants/theme';
import { hsmService } from '../../utils/hsm';

const { width } = Dimensions.get('window');

export function BacktestScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const portfolios = usePortfolios();
  const { tier, user } = useAuthStore();
  const { showToast } = useToast();

  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [results, setResults] = useState<any>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signedId, setSignedId] = useState<string | null>(null);

  const isPremium = tier === 'plus' || tier === 'pro' || tier === 'student';

  useEffect(() => {
    if (portfolios.length > 0 && !selectedPortfolioId) {
      setSelectedPortfolioId(portfolios[0].id);
    }
  }, [portfolios]);

  const runBacktest = async () => {
    const portfolio = portfolios.find(p => p.id === selectedPortfolioId);
    if (!portfolio || !portfolio.assets) return;

    setStatus('loading');
    setResults(null);
    setSignedId(null);

    try {
      const symbols = portfolio.assets.map((a: any) => a.symbol);
      const { data: history, error } = await supabase
        .from('asset_history')
        .select('symbol, price, timestamp')
        .in('symbol', symbols)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      // Group by symbol
      const historyMap: Record<string, any[]> = {};
      history.forEach((h: any) => {
        if (!historyMap[h.symbol]) historyMap[h.symbol] = [];
        historyMap[h.symbol].push(h);
      });

      const dates = Array.from(new Set(history.map((h: any) => h.timestamp.split('T')[0]))).sort() as string[];
      const equityCurve: { timestamp: string, value: number }[] = [];

      let initialValue = 0;
      const shares: Record<string, number> = {};
      const startDate = dates[0];

      portfolio.assets.forEach((asset: any) => {
        const symbolHistory = historyMap[asset.symbol]?.filter((h: any) => h.timestamp.startsWith(startDate));
        const price = symbolHistory?.[0]?.price || 100;
        const qty = Number(asset.quantity || asset.amount || 1);
        shares[asset.symbol] = qty;
        initialValue += qty * price;
      });

      let dailyValue = initialValue;
      dates.forEach((date: string) => {
        let currentDailyValue = 0;
        symbols.forEach((sym: string) => {
          const dayPrice = historyMap[sym]?.find((h: any) => h.timestamp.startsWith(date))?.price;
          if (dayPrice) currentDailyValue += shares[sym] * dayPrice;
        });
        if (currentDailyValue > 0) {
          dailyValue = currentDailyValue;
          equityCurve.push({ timestamp: date, value: dailyValue });
        }
      });

      const terminalValue = equityCurve[equityCurve.length - 1].value;
      const totalReturn = (terminalValue - initialValue) / initialValue;
      
      let maxDD = 0;
      let peak = 0;
      equityCurve.forEach(p => {
        if (p.value > peak) peak = p.value;
        const dd = (peak - p.value) / peak;
        if (dd > maxDD) maxDD = dd;
      });

      const years = equityCurve.length / 252;
      const cagr = Math.pow(1 + totalReturn, 1 / (years || 1)) - 1;

      setResults({
        equityCurve,
        initialValue,
        terminalValue,
        metrics: {
          totalReturn: totalReturn * 100,
          cagr: cagr * 100,
          maxDrawdown: maxDD * 100,
          sharpeRatio: (cagr - 0.04) / 0.15,
        }
      });
      setStatus('success');
      showToast('BACKTEST_SUCCESS', 'success');
    } catch (err) {
      console.error(err);
      setStatus('error');
      showToast('BACKTEST_FAILED', 'error');
    }
  };

  const handleSign = async () => {
    if (!results || !user) return;
    setIsSigning(true);
    
    try {
      const payload = await hsmService.signReport(results.id || `BT_${Date.now()}`, {
        metrics: results.metrics,
        portfolio_id: selectedPortfolioId,
        type: 'BACKTEST_REPORT',
      });
      
      if (payload) {
        setSignedId(payload.signature);
        showToast('REPORT_SIGNED_HSM', 'success');
      }
    } catch (err) {
      console.error('SIGNING_ERROR:', err);
      showToast('SIGNING_FAILURE', 'error');
    } finally {
      setIsSigning(false);
    }
  };

  const dynamicStyles = getStyles(theme, isDark);

  return (
    <View style={[dynamicStyles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={dynamicStyles.scroll} showsVerticalScrollIndicator={false}>
        <View style={dynamicStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={dynamicStyles.backBtn}>
            <ChevronLeft size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <Typography variant="mono" style={dynamicStyles.subHeader}>INSTITUTIONAL_BACKTEST_V2</Typography>
          <Typography variant="h2" style={dynamicStyles.title}>SIMULATION_TERMINAL</Typography>
        </View>

        {!isPremium && (
          <GlassCard style={dynamicStyles.gatingCard}>
            <Lock size={32} color={theme.primary} style={{ marginBottom: 16 }} />
            <Typography variant="h3" style={{ textAlign: 'center', marginBottom: 8 }}>PREMIUM_ACCESS_REQUIRED</Typography>
            <Typography variant="body" style={{ textAlign: 'center', color: theme.textSecondary, marginBottom: 24 }}>
              The Backtesting Terminal is reserved for Plus and Pro clearing levels.
            </Typography>
            <TouchableOpacity 
              style={[dynamicStyles.submitBtn, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate('Subscription')}
            >
              <Typography variant="monoBold" style={{ color: theme.background }}>UPGRADE_CLEARANCE</Typography>
            </TouchableOpacity>
          </GlassCard>
        )}

        {isPremium && (
          <>
            <Typography variant="mono" style={dynamicStyles.sectionLabel}>// SELECT_PORTFOLIO</Typography>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={dynamicStyles.portList}>
              {portfolios.map(p => (
                <TouchableOpacity 
                  key={p.id}
                  style={[dynamicStyles.portItem, selectedPortfolioId === p.id && dynamicStyles.portItemSelected]}
                  onPress={() => setSelectedPortfolioId(p.id)}
                >
                  <Typography variant="monoBold" style={[dynamicStyles.portName, selectedPortfolioId === p.id && { color: theme.primary }]}>
                    {p.name.toUpperCase()}
                  </Typography>
                  <Typography variant="caption" style={{ color: theme.textTertiary }}>
                    ${p.total_value?.toLocaleString()}
                  </Typography>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={[dynamicStyles.runBtn, { backgroundColor: theme.primary }, status === 'loading' && { opacity: 0.7 }]}
              onPress={runBacktest}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <ActivityIndicator color={theme.background} />
              ) : (
                <>
                  <Play size={18} color={theme.background} style={{ marginRight: 8 }} />
                  <Typography variant="monoBold" style={{ color: theme.background }}>EXECUTE_BACKTEST</Typography>
                </>
              )}
            </TouchableOpacity>

            {results && status === 'success' && (
              <View style={{ marginTop: 32 }}>
                <Typography variant="mono" style={dynamicStyles.sectionLabel}>// PERFORMANCE_METRICS</Typography>
                <View style={dynamicStyles.metricsGrid}>
                  <GlassCard style={dynamicStyles.metricItem}>
                    <Typography variant="caption" style={{ color: theme.textTertiary }}>TOT_RETURN</Typography>
                    <Typography variant="h3" style={{ color: results.metrics.totalReturn >= 0 ? theme.success : theme.error }}>
                      {results.metrics.totalReturn.toFixed(2)}%
                    </Typography>
                  </GlassCard>
                  <GlassCard style={dynamicStyles.metricItem}>
                    <Typography variant="caption" style={{ color: theme.textTertiary }}>CAGR</Typography>
                    <Typography variant="h3" style={{ color: theme.primary }}>
                      {results.metrics.cagr.toFixed(2)}%
                    </Typography>
                  </GlassCard>
                  <GlassCard style={dynamicStyles.metricItem}>
                    <Typography variant="caption" style={{ color: theme.textTertiary }}>MAX_DRAWDOWN</Typography>
                    <Typography variant="h3" style={{ color: theme.error }}>
                      -{results.metrics.maxDrawdown.toFixed(2)}%
                    </Typography>
                  </GlassCard>
                  <GlassCard style={dynamicStyles.metricItem}>
                    <Typography variant="caption" style={{ color: theme.textTertiary }}>SHARPE</Typography>
                    <Typography variant="h3" style={{ color: theme.secondary }}>
                      {results.metrics.sharpeRatio.toFixed(2)}
                    </Typography>
                  </GlassCard>
                </View>

                <Typography variant="mono" style={dynamicStyles.sectionLabel}>// EQUITY_CURVE</Typography>
                <GlassCard style={dynamicStyles.chartCard}>
                  <LineChart
                    style={{ height: 200 }}
                    data={results.equityCurve.map((d: any) => d.value)}
                    svg={{ stroke: theme.primary, strokeWidth: 2 }}
                    contentInset={{ top: 20, bottom: 20 }}
                    curve={shape.curveNatural}
                  />
                </GlassCard>

                <TouchableOpacity 
                  style={[dynamicStyles.signBtn, { borderColor: theme.primary }]}
                  onPress={handleSign}
                  disabled={isSigning || !!signedId}
                >
                  <ShieldCheck size={18} color={theme.primary} style={{ marginRight: 8 }} />
                  <Typography variant="monoBold" style={{ color: theme.primary }}>
                    {isSigning ? 'SIGNING...' : signedId ? 'REPORT_SECURED' : 'HSM_SIGN_REPORT'}
                  </Typography>
                </TouchableOpacity>

                {signedId && (
                  <View style={dynamicStyles.signedInfo}>
                    <Typography variant="caption" style={{ color: theme.success, fontSize: 8 }}>
                      VERIFIED_SIG: {signedId}
                    </Typography>
                  </View>
                )}
              </View>
            )}
          </>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, paddingTop: 60 },
  header: { marginBottom: 32 },
  backBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', marginBottom: 20 },
  subHeader: { fontSize: 9, letterSpacing: 2, color: theme.textTertiary, marginBottom: 4 },
  title: { fontSize: 24, letterSpacing: 1 },
  sectionLabel: { fontSize: 10, letterSpacing: 1.5, color: theme.textSecondary, marginBottom: 16, marginTop: 16 },
  portList: { gap: 12, paddingBottom: 8 },
  portItem: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.border, minWidth: 140, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' },
  portItemSelected: { borderColor: theme.primary, backgroundColor: theme.primary + '10' },
  portName: { fontSize: 12, marginBottom: 4, color: theme.textSecondary },
  runBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', marginTop: 24 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricItem: { flex: 1, minWidth: '45%', padding: 16, borderRadius: 16 },
  chartCard: { padding: 8, borderRadius: 20, marginTop: 12, overflow: 'hidden' },
  signBtn: { height: 50, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', marginTop: 24 },
  signedInfo: { marginTop: 12, alignItems: 'center' },
  gatingCard: { padding: 32, alignItems: 'center', borderRadius: 24, marginTop: 40 },
  submitBtn: { height: 56, width: '100%', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
});
