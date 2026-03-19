import React, { useState, useRef } from 'react';
import { View, StyleSheet, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { theme } from '../../constants/theme';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Send, Cpu, User, AlertTriangle } from 'lucide-react-native';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatScreen({ route }: any) {
  const { portfolioId, workflow } = route.params || {};
  const { tier } = useAuthStore();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'I am the QuantMind Oracle. How can I assist with your risk modeling today?\n\n*Note: I provide mathematical analysis, not financial advice.*'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // In a real streaming scenario this would connect via WebSockets or handle fetch streaming.
      // For this implementation, we use the standard API call.
      const response = await api.aiChat(userMessage.content, { portfolioId }, workflow);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (e: any) {
      if (e.message?.includes('limit')) {
         Alert.alert('Usage Limit Reached', 'You have reached your daily limit for Oracle queries on your current tier. Upgrade to Plus or Pro for more access.');
      } else {
         Alert.alert('Oracle Error', e.message || 'Failed to communicate with AI model.');
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <View style={styles.messageHeader}>
          {isUser ? (User as any)({ size: 14, color: theme.colors.background }) : (Cpu as any)({ size: 14, color: theme.colors.secondary })}
          <Typography variant="caption" style={[styles.messageName, isUser && {color: theme.colors.background}]}>
            {isUser ? 'OPERATOR' : 'ORACLE'}
          </Typography>
        </View>
        <Typography variant="body" style={isUser && {color: theme.colors.background}}>
          {item.content}
        </Typography>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <View style={styles.headerInner}>
          {(Cpu as any)({ size: 24, color: theme.colors.secondary })}
          <View style={{marginLeft: 12}}>
            <Typography variant="h2" style={styles.title}>Oracle Terminal</Typography>
            <Typography variant="caption" style={styles.subtitle}>Powered by Anthropic Claude</Typography>
          </View>
        </View>
        {tier === 'free' && (
           <View style={styles.tierWarning}>
             {(AlertTriangle as any)({ size: 12, color: "#F59E0B" })}
             <Typography variant="caption" style={{fontSize: 9, color: '#F59E0B', marginLeft: 4}}>5 QUERIES/DAY</Typography>
           </View>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Query the Oracle..."
          placeholderTextColor={theme.colors.textTertiary}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity 
          style={[styles.sendButton, (!input.trim() || isLoading) && {opacity: 0.5}]} 
          onPress={handleSend}
          disabled={!input.trim() || isLoading}
        >
          {(Send as any)({ size: 20, color: theme.colors.background })}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceLight,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#FFF',
    marginBottom: 2,
  },
  subtitle: {
    color: theme.colors.textTertiary,
  },
  tierWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  chatList: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  messageBubble: {
    padding: theme.spacing.lg,
    borderRadius: theme.roundness.lg,
    marginBottom: theme.spacing.lg,
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  aiBubble: {
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageName: {
    marginLeft: 6,
    fontFamily: theme.typography.fonts.mono,
    letterSpacing: 1,
    color: theme.colors.secondary,
  },
  inputArea: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.md,
    paddingHorizontal: theme.spacing.md,
    paddingTop: 12,
    paddingBottom: 12,
    color: theme.colors.textPrimary,
    minHeight: 48,
    maxHeight: 120,
    marginRight: theme.spacing.sm,
  },
  sendButton: {
    width: 48,
    height: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness.md,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
});
