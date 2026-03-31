import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, Alert } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { api } from '../../services/api';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { Send, Cpu, User, ChevronLeft, Activity, Lock, Trash2, History as HistoryIcon } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { sharedTheme } from '../../constants/theme';
import { SentimentIndicator } from '../../components/ui/SentimentIndicator';
import { useChatHistory, Message } from '../../hooks/queries/useChat';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Message interface moved to useChat.ts

export function AIChatScreen({ route, navigation }: any) {
  const { portfolioId, simulationResultId, workflow, initialMessage } = route.params || {};
  const { user, tier, aiPrefs } = useAuthStore();
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();
  
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const { data: history = [], isLoading: isHistLoading } = useChatHistory(user?.id);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const SendIcon = Send as any;
  const CpuIcon = Cpu as any;
  const UserIconAny = User as any;
  const BackIcon = ChevronLeft as any;
  const ActivityIcon = Activity as any;
  const LockIcon = Lock as any;
  const TrashIcon = Trash2 as any;

  // Messages are combined from history and local session state
  const messages = history.length > 0 ? history : [
    {
      id: 'welcome',
      role: 'assistant',
      content: workflow === 'portfolio_doctor' 
        ? 'PORTFOLIO_DOCTOR_V1.0 // DIAGNOSTIC_MODE_ACTIVE\n\nI have accessed your simulation parameters and risk metrics. Analyzing for structural vulnerabilities...'
        : 'QUANTMIND_ORACLE_V2.4 // SESSION_INITIALIZED\n\nI am ready to convolve your risk parameters. What modeling objectives should we prioritize for this session?'
    } as Message,
    ...localMessages
  ];

  useEffect(() => {
    if (!isHistLoading && initialMessage && messages.length <= 1) {
      handleSend(initialMessage);
    } else if (!isHistLoading && workflow === 'portfolio_doctor' && messages.length <= 1 && simulationResultId) {
      handleSend("Perform a full diagnostic analysis on my latest simulation results.");
    }
  }, [initialMessage, workflow, simulationResultId, isHistLoading]);

  const pulseScale = useSharedValue(1);
  useEffect(() => {
    if (isLoading) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
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
    if (!textToSend.trim() || !user) return;

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: textToSend.trim(),
      timestamp: new Date().toISOString()
    };
    
    setLocalMessages(prev => [...prev, userMsg]);
    if (!overrideInput) setInput('');
    setIsLoading(true);

    try {
      // 1. Persist user message
      await supabase.from('oracle_chat_messages').insert({
        user_id: user.id,
        role: 'user',
        content: userMsg.content
      });

      // 2. Call AI relay
      const response = await api.aiChat(userMsg.content, { 
        portfolioId, 
        simulation_result_id: simulationResultId,
        aiPrefs,
        history: messages.slice(-5).map(m => ({ role: m.role, content: m.content }))
      }, workflow);
      
      const aiContent = response.message || response.reply || "RESPONSE_UNDER_DETERMINED";
      
      // 3. Persist assistant message
      await supabase.from('oracle_chat_messages').insert({
        user_id: user.id,
        role: 'assistant',
        content: aiContent
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date().toISOString()
      };
      
      setLocalMessages(prev => [...prev, aiMsg]);
    } catch (e: any) {
      const errorMsg = e.message?.includes('limit') ? 'QUOTA_EXHAUSTED' : 'KERNEL_COMM_FAILURE';
      showToast(errorMsg, 'error');
      
      setLocalMessages(prev => [...prev, {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content: `ERROR: ${errorMsg}. Deep cognitive relay interrupted.`
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const clearHistory = async () => {
    Alert.alert(
      "CLEAR_NEURAL_BUFFER",
      "Are you sure you want to permanently delete current chat history?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "WIPE_BUFFER", 
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            setIsLoading(true);
            try {
              await supabase.from('oracle_chat_messages').delete().eq('user_id', user.id);
              setLocalMessages([]);
              showToast('BUFFER_CLEARED', 'success');
            } catch (err) {
              showToast('WIPE_FAILURE', 'error');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    const accentColor = isUser ? theme.primary : theme.secondary;
    const time = item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    
    return (
      <View style={[styles.messageRow, isUser ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
        {!isUser && (
          <View style={[styles.aiAvatar, { backgroundColor: theme.secondary + '10', borderColor: theme.secondary + '33' }]}>
             <CpuIcon size={12} color={theme.secondary} />
          </View>
        )}
        <GlassCard 
          intensity={isUser ? 'low' : 'medium'}
          style={[
            styles.messageCard, 
            isUser ? styles.userCard : styles.aiCard,
            { backgroundColor: isUser ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)') : (isDark ? 'rgba(0,217,255,0.05)' : 'rgba(0,0,0,0.02)') }
          ]}
        >
          <View style={styles.messageHeader}>
            <Typography variant="mono" style={[styles.messageLabel, { color: accentColor }]}>
              {isUser ? 'OPERATOR' : 'ORACLE'}
            </Typography>
            <Typography variant="caption" style={[styles.timestamp, { color: theme.textTertiary }]}>{time}</Typography>
          </View>
          <Typography variant="body" style={[styles.messageText, { color: isUser ? theme.textPrimary : theme.textSecondary }]}>
            {item.content}
          </Typography>
        </GlassCard>
        {isUser && (
          <View style={[styles.userAvatar, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '33' }]}>
             <UserIconAny size={12} color={theme.primary} />
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={[styles.backBtn, { borderColor: theme.border }]}>
             <BackIcon size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <View style={[styles.statusGroup, { backgroundColor: (workflow === 'portfolio_doctor' ? theme.secondary : theme.primary) + '10', borderColor: (workflow === 'portfolio_doctor' ? theme.secondary : theme.primary) + '33' }]}>
             <GlowEffect color={workflow === 'portfolio_doctor' ? theme.secondary : theme.primary} size={6} glowRadius={6} />
             <Typography variant="mono" style={[styles.statusText, { color: workflow === 'portfolio_doctor' ? theme.secondary : theme.primary }]}>
               {workflow === 'portfolio_doctor' ? 'DIAGNOSTIC_SYNCED' : 'KERNEL_SYNCED'}
             </Typography>
          </View>
          <TouchableOpacity onPress={clearHistory} style={[styles.backBtn, { borderColor: theme.border }]}>
             <TrashIcon size={16} color={theme.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerTitleRow}>
           <View>
             <Typography variant="mono" style={[styles.subHeader, { color: theme.textTertiary }]}>
               {workflow === 'portfolio_doctor' ? 'RISK_DIAGNOSTICS' : 'INSTITUTIONAL_AI'}
             </Typography>
             <Typography variant="h2" style={[styles.title, { color: theme.textPrimary }]}>
               {workflow === 'portfolio_doctor' ? 'DOCTOR' : 'ORACLE'}
             </Typography>
           </View>
        </View>
        <SentimentIndicator />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {isLoading && (
        <Animated.View style={[styles.loadingArea, loadingAnimatedStyle]}>
           <ActivityIcon size={14} color={theme.secondary} style={{ marginRight: 8 }} />
           <Typography variant="mono" style={[styles.computingText, { color: theme.secondary }]}>CONVOLVING_LOGIC_PATHS...</Typography>
        </Animated.View>
      )}

      <GlassCard intensity="high" style={[styles.inputArea, { borderColor: theme.border }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, { color: theme.textPrimary, fontFamily: sharedTheme.typography.fonts.mono }]}
            placeholder="TYPE_OBJECTIVE_SET..."
            placeholderTextColor={theme.textTertiary}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '33' }, (!input.trim() || isLoading) && {opacity: 0.3}]} 
            onPress={() => handleSend()}
            disabled={!input.trim() || isLoading}
          >
            <SendIcon size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </GlassCard>

      {tier === 'free' && (
        <View style={styles.gatingOverlay}>
          <GlassCard intensity="high" style={styles.gatingCard}>
            <LockIcon size={48} color={theme.primary} style={{ marginBottom: 16 }} />
            <Typography variant="h3" style={{ textAlign: 'center', marginBottom: 8, color: theme.textPrimary }}>RESTRICTED_PROTOCOL</Typography>
            <Typography variant="body" style={{ textAlign: 'center', color: theme.textSecondary, marginBottom: 24, fontSize: 12 }}>
              The Institutional AI Oracle requires a Plus or Pro subscription to establish a secure cognitive relay.
            </Typography>
            <TouchableOpacity 
              style={[styles.upgradeBtn, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate('Operator', { screen: 'Subscription' })}
            >
              <Typography variant="monoBold" style={{ color: theme.background, fontSize: 10 }}>UPGRADE_TO_PLUS_ACCESS</Typography>
            </TouchableOpacity>
          </GlassCard>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 60, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  statusGroup: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  statusText: { fontSize: 8, letterSpacing: 1 },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subHeader: { fontSize: 10, letterSpacing: 2, marginBottom: 2 },
  title: { fontSize: 24, fontWeight: 'bold' },
  chatList: { padding: 20, paddingBottom: 40 },
  messageRow: { flexDirection: 'row', marginBottom: 24, alignItems: 'flex-end', gap: 12 },
  aiAvatar: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  userAvatar: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  messageCard: { maxWidth: width * 0.72, padding: 16, borderRadius: 20 },
  userCard: { borderBottomRightRadius: 4 },
  aiCard: { borderBottomLeftRadius: 4 },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  messageLabel: { fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  timestamp: { fontSize: 8 },
  messageText: { fontSize: 13, lineHeight: 20 },
  loadingArea: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16 },
  computingText: { fontSize: 9, letterSpacing: 1 },
  inputArea: { margin: 16, marginBottom: Platform.OS === 'ios' ? 40 : 16, padding: 8, borderRadius: 20, borderWidth: 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, maxHeight: 120 },
  sendBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  gatingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5, 7, 10, 0.8)', zIndex: 100, justifyContent: 'center', alignItems: 'center', padding: 32 },
  gatingCard: { padding: 32, alignItems: 'center', borderRadius: 24, width: '100%' },
  upgradeBtn: { height: 50, width: '100%', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});
