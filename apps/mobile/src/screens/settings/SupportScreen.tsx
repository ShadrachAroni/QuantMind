import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, FlatList } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { theme } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { Plus, MessageSquare, Clock, CheckCircle, ChevronLeft, Send } from 'lucide-react-native';
import { supabase } from '../../services/supabase';

export function SupportScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [showNewTicket, setShowNewTicket] = useState(false);
  
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchTickets();
    
    // Real-time subscription for updates
    const channel = supabase
      .channel('support-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets', filter: `user_id=eq.${user?.id}` }, fetchTickets)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, fetchTickets)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*, support_messages(*)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTicket = async () => {
    if (!subject.trim() || !content.trim()) {
      Alert.alert('Incomplete Data', 'Please provide both a subject and a description of your issue.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create Ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user?.id,
          subject: subject.trim(),
          status: 'open',
          priority: 'normal'
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // 2. Create Initial Message
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticket.id,
          user_id: user?.id,
          content: content.trim(),
          is_staff: false
        });

      if (messageError) throw messageError;

      Alert.alert('Success', 'Your ticket has been submitted. An AI assistant will provide a first-pass reply shortly.');
      setShowNewTicket(false);
      setSubject('');
      setContent('');
      fetchTickets();
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const TicketCard = ({ ticket }: { ticket: any }) => {
    const statusColor = 
      ticket.status === 'open' ? theme.colors.primary :
      ticket.status === 'resolved' ? theme.colors.success :
      theme.colors.textTertiary;

    const StatusIcon = (ticket.status === 'resolved' ? CheckCircle : Clock) as any;

    return (
      <TouchableOpacity 
        style={styles.ticketCard}
        onPress={() => Alert.alert('Ticket Detail', 'Feature coming soon: viewing full conversation history.')}
      >
        <View style={styles.ticketHeader}>
          <Typography variant="h3" style={styles.ticketSubject}>{ticket.subject}</Typography>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            {StatusIcon({ size: 12, color: statusColor })}
            <Typography variant="caption" style={[styles.statusText, { color: statusColor }]}>
              {ticket.status.toUpperCase()}
            </Typography>
          </View>
        </View>
        
        <Typography variant="caption" style={styles.ticketMeta}>
           Created {new Date(ticket.created_at).toLocaleDateString()} • {ticket.support_messages?.length || 0} messages
        </Typography>

        {ticket.status === 'open' && (
          <View style={styles.aiIndicator}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Typography variant="caption" style={styles.aiText}>AI is reviewing your request...</Typography>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          {(ChevronLeft as any)({ size: 24, color: '#FFF' })}
        </TouchableOpacity>
        <Typography variant="h2" style={styles.headerTitle}>Support Center</Typography>
      </View>

      {showNewTicket ? (
        <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
          <Typography variant="h3" style={styles.formTitle}>New Support Request</Typography>
          
          <Typography variant="caption" style={styles.inputLabel}>SUBJECT</Typography>
          <TextInput
            style={styles.input}
            placeholder="e.g., Simulation error on BTC group"
            placeholderTextColor={theme.colors.textTertiary}
            value={subject}
            onChangeText={setSubject}
          />

          <Typography variant="caption" style={styles.inputLabel}>DESCRIPTION</Typography>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your issue in detail..."
            placeholderTextColor={theme.colors.textTertiary}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
          />

          <TouchableOpacity 
            style={[styles.submitButton, submitting && styles.disabledButton]} 
            onPress={handleSubmitTicket}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Typography variant="button" style={styles.submitButtonText}>SUBMIT TICKET</Typography>
                {(Send as any)({ size: 20, color: '#000' })}
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => setShowNewTicket(false)}>
            <Typography variant="button" style={styles.cancelButtonText}>CANCEL</Typography>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <>
          <FlatList
            data={tickets}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TicketCard ticket={item} />}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                {(MessageSquare as any)({ size: 48, color: theme.colors.border })}
                <Typography variant="body" style={styles.emptyText}>No active support tickets.</Typography>
              </View>
            }
          />

          <TouchableOpacity style={styles.fab} onPress={() => setShowNewTicket(true)}>
            {(Plus as any)({ size: 24, color: '#000' })}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.xl,
    paddingTop: 60,
    backgroundColor: theme.colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    color: '#FFF',
  },
  listContent: {
    padding: theme.spacing.xl,
    paddingBottom: 100,
  },
  ticketCard: {
    backgroundColor: theme.colors.surfaceLight,
    padding: theme.spacing.lg,
    borderRadius: theme.roundness.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  ticketSubject: {
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: theme.typography.fonts.mono,
  },
  ticketMeta: {
    color: theme.colors.textTertiary,
  },
  aiIndicator: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: 'rgba(0, 217, 255, 0.05)',
    padding: 8,
    borderRadius: 4,
  },
  aiText: {
    color: theme.colors.primary,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.lg,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 40,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  formContainer: {
    padding: theme.spacing.xl,
  },
  formTitle: {
    color: '#FFF',
    marginBottom: theme.spacing.xl,
  },
  inputLabel: {
    color: theme.colors.textTertiary,
    fontFamily: theme.typography.fonts.mono,
    marginBottom: theme.spacing.sm,
    marginLeft: 4,
  },
  input: {
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.md,
    padding: theme.spacing.lg,
    color: '#FFF',
    fontFamily: theme.typography.fonts.regular,
    fontSize: 16,
    marginBottom: theme.spacing.xl,
  },
  textArea: {
    textAlignVertical: 'top',
    height: 150,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.roundness.md,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#000',
    fontWeight: '800',
  },
  cancelButton: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  cancelButtonText: {
    color: theme.colors.textTertiary,
  },
});
