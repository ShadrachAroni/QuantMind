import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { Send, Cpu, User, ChevronLeft, Activity } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { sharedTheme } from '../../constants/theme';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: sharedTheme.spacing.xl,
    paddingTop: 64,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    letterSpacing: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subHeader: {
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 2,
  },
  title: {
    fontSize: 24,
    letterSpacing: 2,
  },
  computeStats: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statLabel: {
    fontSize: 7,
    marginBottom: 2,
  },
  statVal: {
    fontSize: 10,
  },
  statDivider: {
    width: 1,
  },
  chatList: {
    padding: sharedTheme.spacing.lg,
    paddingBottom: 40,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-end',
    gap: 12,
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  messageCard: {
    maxWidth: width * 0.72,
    padding: 16,
    borderRadius: 20,
  },
  userCard: {
    borderBottomRightRadius: 4,
  },
  aiCard: {
    borderBottomLeftRadius: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    opacity: 0.8,
  },
  messageLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
  },
  timestamp: {
    fontSize: 8,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 22,
  },
  loadingArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 12,
  },
  computeGlow: {
    position: 'absolute',
    opacity: 0.1,
  },
  computingText: {
    fontSize: 10,
    letterSpacing: 2,
  },
  inputArea: {
    margin: 16,
    marginBottom: Platform.OS === 'ios' ? 32 : 16,
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
});

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatScreen({ route, navigation }: any) {
  const { portfolioId, simulationResultId, workflow, initialMessage } = route.params || {};
  const { tier, aiPrefs } = useAuthStore();
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: workflow === 'portfolio_doctor' 
        ? 'PORTFOLIO_DOCTOR_V1.0 // DIAGNOSTIC_MODE_ACTIVE\n\nI have accessed your simulation parameters and risk metrics. Analyzing for structural vulnerabilities...'
        : 'QUANTMIND_ORACLE_V2.4 // SESSION_INITIALIZED\n\nI am ready to convolve your risk parameters. What modeling objectives should we prioritize for this session?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const SendIcon = Send as any;
  const CpuIcon = Cpu as any;
  const UserIconAny = User as any;
  const BackIcon = ChevronLeft as any;
  const ActivityIcon = Activity as any;

  useEffect(() => {
    if (initialMessage && messages.length === 1) {
      handleSend(initialMessage);
    } else if (workflow === 'portfolio_doctor' && messages.length === 1 && simulationResultId) {
      // Auto-initiate diagnostic
      handleSend("Perform a full diagnostic analysis on my latest simulation results.");
    }
  }, [initialMessage, workflow, simulationResultId]);

  const dynamicStyles = getStyles(theme, isDark);

  const pulseScale = useSharedValue(1);
  useEffect(() => {
    if (isLoading) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = 1;
    }
  }, [isLoading]);

  const loadingAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: withTiming(isLoading ? 1 : 0, { duration: 300 })
  }));

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: textToSend.trim() };
    setMessages(prev => [...prev, userMessage]);
    if (!overrideInput) setInput('');
    setIsLoading(true);

    try {
      const response = await api.aiChat(userMessage.content, { 
        portfolioId, 
        simulation_result_id: simulationResultId,
        aiPrefs 
      }, workflow);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message || response.reply,
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (e: any) {
      if (e.message?.includes('limit')) {
         showToast('QUOTA_EXHAUSTED: Upgrade for unbounded compute.', 'error');
      } else {
         showToast(e.message?.toUpperCase() || 'KERNEL_COMM_FAILURE', 'error');
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    const accentColor = isUser ? theme.primary : theme.secondary;
    
    return (
      <View style={[dynamicStyles.messageRow, isUser ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
        {!isUser && (
          <View style={[dynamicStyles.aiAvatar, { backgroundColor: theme.secondary + '10', borderColor: theme.secondary + '33' }]}>
             <CpuIcon size={12} color={theme.secondary} />
          </View>
        )}
        <GlassCard 
          intensity={isUser ? 'low' : 'medium'}
          style={[
            dynamicStyles.messageCard, 
            isUser ? dynamicStyles.userCard : dynamicStyles.aiCard
          ]}
        >
          <View style={dynamicStyles.messageHeader}>
            <Typography variant="mono" style={[dynamicStyles.messageLabel, { color: accentColor }]}>
              {isUser ? 'OPERATOR' : 'ORACLE'}
            </Typography>
            <Typography variant="caption" style={[dynamicStyles.timestamp, { color: theme.textTertiary }]}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Typography>
          </View>
          <Typography variant="body" style={[dynamicStyles.messageText, { color: theme.textSecondary }]}>
            {item.content}
          </Typography>
        </GlassCard>
        {isUser && (
          <View style={[dynamicStyles.userAvatar, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '33' }]}>
             <UserIconAny size={12} color={theme.primary} />
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[dynamicStyles.container, { backgroundColor: theme.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[dynamicStyles.header, { borderBottomColor: theme.border }]}>
        <View style={dynamicStyles.headerTop}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={[dynamicStyles.backBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)', borderColor: theme.border }]}>
             <BackIcon size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <View style={[dynamicStyles.statusGroup, { 
            backgroundColor: (workflow === 'portfolio_doctor' ? theme.secondary : theme.primary) + '10', 
            borderColor: (workflow === 'portfolio_doctor' ? theme.secondary : theme.primary) + '33' 
          }]}>
             <GlowEffect color={workflow === 'portfolio_doctor' ? theme.secondary : theme.primary} size={6} glowRadius={6} />
             <Typography variant="mono" style={[dynamicStyles.statusText, { color: workflow === 'portfolio_doctor' ? theme.secondary : theme.primary }]}>
               {workflow === 'portfolio_doctor' ? 'DIAGNOSTIC_SYNCED' : 'KERNEL_SYNCED'}
             </Typography>
          </View>
        </View>
        <View style={dynamicStyles.headerTitleRow}>
           <View>
             <Typography variant="mono" style={[dynamicStyles.subHeader, { color: theme.textTertiary }]}>
               {workflow === 'portfolio_doctor' ? 'RISK_DIAGNOSTICS' : 'INSTITUTIONAL_AI'}
             </Typography>
             <Typography variant="h2" style={[dynamicStyles.title, { color: theme.textPrimary }]}>
               {workflow === 'portfolio_doctor' ? 'DOCTOR' : 'ORACLE'}
             </Typography>
           </View>
           <View style={[dynamicStyles.computeStats, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}>
             <View style={dynamicStyles.statBox}>
               <Typography variant="mono" style={[dynamicStyles.statLabel, { color: theme.textTertiary }]}>LATENCY</Typography>
               <Typography variant="monoBold" style={[dynamicStyles.statVal, { color: theme.secondary }]}>42ms</Typography>
             </View>
             <View style={[dynamicStyles.statDivider, { backgroundColor: theme.border }]} />
             <View style={dynamicStyles.statBox}>
               <Typography variant="mono" style={[dynamicStyles.statLabel, { color: theme.textTertiary }]}>THROUGHPUT</Typography>
               <Typography variant="monoBold" style={[dynamicStyles.statVal, { color: theme.secondary }]}>10k/s</Typography>
             </View>
           </View>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={dynamicStyles.chatList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <Animated.View style={[dynamicStyles.loadingArea, loadingAnimatedStyle]}>
         <ActivityIcon size={14} color={theme.secondary} style={{ marginRight: 8 }} />
         <Typography variant="mono" style={[dynamicStyles.computingText, { color: theme.secondary }]}>CONVOLVING_LOGIC_PATHS...</Typography>
         <GlowEffect color={theme.secondary} size={80} glowRadius={30} style={dynamicStyles.computeGlow} />
      </Animated.View>

      <GlassCard intensity="high" style={[dynamicStyles.inputArea, { borderColor: theme.border }]}>
        <View style={dynamicStyles.inputWrapper}>
          <TextInput
            style={[dynamicStyles.input, { color: theme.textPrimary, fontFamily: sharedTheme.typography.fonts.mono }]}
            placeholder="TYPE_OBJECTIVE_SET..."
            placeholderTextColor={theme.textTertiary}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity 
            style={[dynamicStyles.sendBtn, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '33' }, (!input.trim() || isLoading) && {opacity: 0.3}]} 
            onPress={() => handleSend()}
            disabled={!input.trim() || isLoading}
          >
            <SendIcon size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </GlassCard>
    </KeyboardAvoidingView>
  );
}

