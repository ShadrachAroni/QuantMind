import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Dimensions } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { GlassCard } from '../../components/ui/GlassCard';
import { useTheme } from '../../context/ThemeContext';
import { Network, ChevronLeft, Brain, Cpu, MessageSquare, Send, Save, Layers, ShoppingBag } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { SocialGraphVisualizer } from '../../components/ui/SocialGraphVisualizer';

const { width } = Dimensions.get('window');

export function MiroFishScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();
  const [seed, setSeed] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [simulationData, setSimulationData] = useState<any[]>([]);
  const [shock, setShock] = useState(0);
  const [isRebalancing, setIsRebalancing] = useState(false);

  const handleRun = async () => {
    if (!seed.trim()) return;
    setIsLoading(true);
    
    try {
      const { api } = await import('../../services/api');
      const data = await api.runMiroFish(seed);
      
      if (data.interactions_log) {
        setSimulationData(data.interactions_log);
        setShock(data.sentiment_shock || (Math.random() * 2 - 1)); // Fallback for demo
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSnapshot = async () => {
    if (simulationData.length === 0) return;
    
    try {
      await api.saveSnapshot(`Snapshot ${new Date().toLocaleTimeString()}`, seed, simulationData, shock);
      showToast('SNAPSHOT_SAVED', 'success');
    } catch (e) {
      showToast('SAVE_FAILURE', 'error');
    }
  };

  const handleRebalance = async () => {
    setIsRebalancing(true);
    try {
      // For demo, we'll try to find the first portfolio
      const portfolios = await api.getPortfolios();
      if (portfolios.length === 0) {
        showToast('NO_PORTFOLIO_FOUND', 'error');
        return;
      }
      
      const result = await api.rebalancePortfolio(portfolios[0].id, shock);
      showToast('PORTFOLIO_REBALANCED', 'success');
    } catch (e) {
      showToast('REBALANCE_FAILED', 'error');
    } finally {
      setIsRebalancing(false);
    }
  };

  const dynamicStyles = getStyles(theme, isDark);

  return (
    <View style={[dynamicStyles.container, { backgroundColor: theme.background }]}>
      <View style={dynamicStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={dynamicStyles.backBtn}>
          <ChevronLeft size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Typography variant="h3" style={{ color: theme.textPrimary }}>MIROFISH_ENGINE</Typography>
        <TouchableOpacity onPress={() => navigation.navigate('Marketplace')} style={{ marginLeft: 'auto', marginRight: 12 }}>
           <ShoppingBag size={20} color={theme.primary} />
        </TouchableOpacity>
        <Brain size={20} color={theme.primary} />
      </View>

      <ScrollView contentContainerStyle={dynamicStyles.scroll}>
        <GlassCard style={dynamicStyles.injectorCard}>
          <Typography variant="mono" style={dynamicStyles.label}>VARIABLE_INJECTION</Typography>
          <TextInput 
            style={[dynamicStyles.input, { color: theme.textPrimary, borderColor: theme.border }]}
            placeholder="Inject market event (e.g. 'Fed Pivot')..."
            placeholderTextColor={theme.textTertiary}
            multiline
            value={seed}
            onChangeText={setSeed}
          />
          <TouchableOpacity 
            style={[dynamicStyles.runBtn, { backgroundColor: theme.primary }, isLoading && { opacity: 0.5 }]}
            onPress={handleRun}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.background} />
            ) : (
              <>
                <Typography variant="monoBold" style={{ color: theme.background }}>COMMIT_INJECTION</Typography>
                <Send size={16} color={theme.background} />
              </>
            )}
          </TouchableOpacity>
        </GlassCard>

        {simulationData.length > 0 && (
          <GlassCard style={dynamicStyles.visualizerCard}>
            <View style={dynamicStyles.visHeader}>
               <Brain size={18} color={theme.primary} />
               <Typography variant="mono" style={{ color: theme.textSecondary }}>NEURAL_LINK_SOCIAL_GRAPH</Typography>
               <TouchableOpacity onPress={handleSaveSnapshot} style={{ marginLeft: 'auto' }}>
                  <Save size={16} color={theme.primary} />
               </TouchableOpacity>
            </View>
            
            <View style={dynamicStyles.canvas}>
               <SocialGraphVisualizer data={simulationData[simulationData.length - 1].social_graph} />
            </View>
            
            <View style={dynamicStyles.statsRow}>
               <View style={dynamicStyles.stat}>
                  <Cpu size={12} color={theme.secondary} />
                  <Typography variant="mono" style={{ fontSize: 9, color: theme.textTertiary }}>AGENTS: {simulationData[0]?.agent_actions.length || 0}</Typography>
               </View>
               <View style={dynamicStyles.stat}>
                  <MessageSquare size={12} color={theme.success} />
                  <Typography variant="mono" style={{ fontSize: 9, color: theme.textTertiary }}>TICKS: {simulationData.length}</Typography>
               </View>
            </View>

            <View style={dynamicStyles.log}>
               {simulationData.slice(-3).reverse().map((step, idx) => (
                 <View key={idx} style={dynamicStyles.logItem}>
                   <View>
                     <Typography variant="mono" style={{ fontSize: 10, color: theme.primary }}>TICK_{step.tick}</Typography>
                     <Typography variant="caption" style={{ color: theme.textTertiary, maxWidth: width * 0.6 }}>{step.signal.substring(0, 40)}...</Typography>
                   </View>
                   <Typography variant="monoBold" style={{ color: theme.success, fontSize: 10 }}>SYNCED</Typography>
                 </View>
               ))}
            </View>
          </GlassCard>
        )}

        {simulationData.length > 0 && (
          <GlassCard style={dynamicStyles.doctorCard}>
            <View style={dynamicStyles.doctorHeader}>
               <Layers size={18} color={theme.secondary} />
               <Typography variant="mono" style={{ color: theme.textSecondary }}>PORTFOLIO_DOCTOR_ADVISORY</Typography>
            </View>
            
            <View style={dynamicStyles.advisoryRow}>
               <View style={dynamicStyles.advisoryStat}>
                  <Typography variant="caption" style={{ color: theme.textTertiary }}>SENTIMENT_SHOCK</Typography>
                  <Typography variant="h2" style={{ color: shock > 0 ? theme.success : theme.error }}>
                    {(shock * 100).toFixed(1)}%
                  </Typography>
               </View>
               <View style={dynamicStyles.advisoryAction}>
                  <Typography variant="caption" style={{ color: theme.textSecondary, marginBottom: 8 }}>
                    {Math.abs(shock) > 0.2 
                      ? 'CRITICAL_IMBALANCE_DETECTED' 
                      : 'NORMAL_MARKET_FLUCTUATION'}
                  </Typography>
                  <TouchableOpacity 
                    style={[dynamicStyles.rebalanceBtn, { borderColor: theme.secondary }]}
                    onPress={handleRebalance}
                    disabled={isRebalancing}
                  >
                    {isRebalancing ? (
                      <ActivityIndicator size="small" color={theme.secondary} />
                    ) : (
                      <Typography variant="monoBold" style={{ color: theme.secondary, fontSize: 10 }}>
                        AUTO_REBALANCE
                      </Typography>
                    )}
                  </TouchableOpacity>
               </View>
            </View>
          </GlassCard>
        )}
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 60,
    paddingBottom: 20
  },
  backBtn: { padding: 8 },
  scroll: { padding: 20 },
  injectorCard: { padding: 20, borderRadius: 24, marginBottom: 20 },
  label: { fontSize: 10, letterSpacing: 1, color: '#848D97', marginBottom: 12 },
  input: { 
    height: 100, 
    borderWidth: 1, 
    borderRadius: 16, 
    padding: 16, 
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
  runBtn: { 
    height: 56, 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 12 
  },
  visualizerCard: { padding: 20, borderRadius: 24 },
  visHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  canvas: { 
    height: 320, 
    backgroundColor: 'rgba(0,0,0,0.1)', 
    borderRadius: 24, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden'
  },
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 20, 
    marginTop: 12,
    marginBottom: 20 
  },
  stat: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  log: { marginTop: 20 },
  logItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 8, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.05)' 
  },
  doctorCard: { marginTop: 20, padding: 20, borderRadius: 24, borderLeftWidth: 4, borderLeftColor: '#34D399' },
  doctorHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  advisoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  advisoryStat: { flex: 1 },
  advisoryAction: { flex: 1.2, alignItems: 'flex-end' },
  rebalanceBtn: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12, 
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)'
  }
});
