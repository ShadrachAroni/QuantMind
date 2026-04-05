import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, FlatList, Linking, Dimensions } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { sharedTheme } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  ChevronLeft, 
  Send, 
  Phone, 
  Mail, 
  Shield, 
  Activity,
  Headphones,
  Cpu
} from 'lucide-react-native';
import { supabase } from '../../services/supabase';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';

const { width } = Dimensions.get('window');

const SUPPORT_EMAIL = 'support@quantmind.co.ke';

export function SupportScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [showNewTicket, setShowNewTicket] = useState(false);
  
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  const PlusIcon = Plus as any;
  const MessageIcon = MessageSquare as any;
  const BackIcon = ChevronLeft as any;
  const SendIcon = Send as any;
  const PhoneIcon = Phone as any;
  const MailIcon = Mail as any;
  const ShieldIcon = Shield as any;
  const ActivityIcon = Activity as any;
  const SupportIcon = Headphones as any;
  const CpuIcon = Cpu as any;

  const dynamicStyles = getStyles(theme, isDark);

  useEffect(() => {
    fetchTickets();
    
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
      showToast('DATA_INCOMPLETE: Subject and details required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
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

      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticket.id,
          user_id: user?.id,
          content: content.trim(),
          is_staff: false
        });

      if (messageError) throw messageError;

      showToast('TICKET_INITIALIZED: Support request queued.', 'success');
      setShowNewTicket(false);
      setSubject('');
      setContent('');
      fetchTickets();
    } catch (err: any) {
      showToast(err.message.toUpperCase(), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const ContactCard = () => (
    <GlassCard style={dynamicStyles.contactCard} intensity="low">
      <Typography variant="mono" style={[dynamicStyles.contactTitle, { color: theme.textTertiary }]}>// DIRECT_HQ_UPLINK</Typography>
      <View style={dynamicStyles.contactActions}>
        <TouchableOpacity 
          style={[dynamicStyles.contactBtn, { borderColor: theme.primary + '44', backgroundColor: theme.primary + '11' }]} 
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=QuantMind%20Support`)}
        >
          <MailIcon size={18} color={theme.primary} />
          <Typography variant="monoBold" style={[dynamicStyles.contactValue, { color: theme.primary }]}>{SUPPORT_EMAIL.toUpperCase()}</Typography>
        </TouchableOpacity>
        <Typography variant="caption" style={{ color: theme.textTertiary, textAlign: 'center', marginTop: 8, fontSize: 8 }}>
          ESTIMATED_RESPONSE_LATENCY: &lt; 4_HOURS
        </Typography>
      </View>
    </GlassCard>
  );

  const TicketCard = ({ ticket }: { ticket: any }) => {
    const statusColor = 
      ticket.status === 'open' ? theme.primary :
      ticket.status === 'resolved' ? theme.success :
      theme.textTertiary;

    const StatusIcon = (ticket.status === 'resolved' ? CheckCircle : Clock) as any;

    return (
      <TouchableOpacity 
        style={dynamicStyles.cardWrapper}
        onPress={() => showToast('TICKET_DETAIL: Feature coming in next OTA update.', 'info')}
        activeOpacity={0.8}
      >
        <GlassCard style={dynamicStyles.ticketCard}>
          <View style={dynamicStyles.ticketHeader}>
            <View style={dynamicStyles.ticketMain}>
              <Typography variant="h3" style={[dynamicStyles.ticketSubject, { color: theme.textPrimary }]}>{ticket.subject.toUpperCase()}</Typography>
              <View style={dynamicStyles.ticketMetaRow}>
                <Typography variant="caption" style={[dynamicStyles.metaText, { color: theme.textTertiary }]}>
                  ID: {ticket.id.slice(0, 8).toUpperCase()} // {new Date(ticket.created_at).toLocaleDateString()}
                </Typography>
              </View>
            </View>
            <View style={[dynamicStyles.statusBadge, { borderColor: statusColor + '44' }]}>
               <GlowEffect color={statusColor} size={6} glowRadius={6} />
               <Typography variant="mono" style={[dynamicStyles.statusText, { color: statusColor }]}>
                 {ticket.status.toUpperCase()}
               </Typography>
            </View>
          </View>
          
          {ticket.status === 'open' && (
            <View style={[dynamicStyles.aiWorking, { borderColor: theme.primary + '33', backgroundColor: theme.primary + '11' }]}>
               <ActivityIcon size={12} color={theme.primary} />
               <Typography variant="mono" style={[dynamicStyles.aiText, { color: theme.primary }]}>AI_KERNEL_REVIEWING_PARAMETERS...</Typography>
            </View>
          )}
        </GlassCard>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[dynamicStyles.container, dynamicStyles.center, { backgroundColor: theme.background }]}>
        <GlowEffect color={theme.primary} size={100} glowRadius={50} />
        <ActivityIndicator size="small" color={theme.primary} />
        <Typography variant="mono" style={[dynamicStyles.loadingText, { color: theme.primary }]}>CONNECTING_TO_SUPPORT_GATEWAY...</Typography>
      </View>
    );
  }

  return (
    <View style={[dynamicStyles.container, { backgroundColor: theme.background }]}>
      <View style={[dynamicStyles.header, { borderBottomColor: theme.border }]}>
        <View style={dynamicStyles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[dynamicStyles.backBtn, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)' }]}>
            <BackIcon size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <View style={[dynamicStyles.encryptionBadge, { borderColor: theme.success + '33', backgroundColor: theme.success + '11' }]}>
             <ShieldIcon size={12} color={theme.success} />
             <Typography variant="mono" style={[dynamicStyles.encryptionText, { color: theme.success }]}>E2E_ENCRYPTED</Typography>
          </View>
        </View>
        <View style={dynamicStyles.headerTitleRow}>
          <View>
            <Typography variant="mono" style={[dynamicStyles.subHeader, { color: theme.textTertiary }]}>INSTITUTIONAL_CARE</Typography>
            <Typography variant="h2" style={[dynamicStyles.title, { color: theme.textPrimary }]}>BRIDGE_CHANNEL</Typography>
          </View>
          <CpuIcon size={32} color={theme.textTertiary} style={{ opacity: 0.1 }} />
        </View>
      </View>

      {showNewTicket ? (
        <ScrollView contentContainerStyle={dynamicStyles.formScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Typography variant="mono" style={[dynamicStyles.formSectionTitle, { color: theme.textSecondary }]}>// INITIALIZE_TICKET</Typography>
          
          <GlassCard style={dynamicStyles.formCard}>
            <View style={dynamicStyles.inputGroup}>
              <Typography variant="mono" style={[dynamicStyles.label, { color: theme.textTertiary }]}>MISSION_SUBJECT</Typography>
              <View style={[dynamicStyles.inputWrapper, { borderColor: theme.border }]}>
                <TextInput
                  style={[dynamicStyles.input, { color: theme.textPrimary }]}
                  placeholder="E.G., SIMULATION_KERNEL_EXCEPTION"
                  placeholderTextColor={theme.textTertiary}
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Typography variant="mono" style={[dynamicStyles.label, { color: theme.textTertiary }]}>DETAILED_PARAMETERS</Typography>
              <View style={[dynamicStyles.inputWrapper, { height: 160, borderColor: theme.border }]}>
                <TextInput
                  style={[dynamicStyles.input, { height: '100%', textAlignVertical: 'top', color: theme.textPrimary }]}
                  placeholder="PROVIDE_REPRODUCTION_LOGS_OR_DESCRIPTION..."
                  placeholderTextColor={theme.textTertiary}
                  value={content}
                  onChangeText={setContent}
                  multiline
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[dynamicStyles.submitBtn, { backgroundColor: theme.primary }, submitting && { opacity: 0.5 }]} 
              onPress={handleSubmitTicket}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={theme.background} />
              ) : (
                <>
                  <Typography variant="monoBold" style={[dynamicStyles.submitText, { color: theme.background }]}>COMMIT_TICKET</Typography>
                  <SendIcon size={16} color={theme.background} />
                </>
              )}
            </TouchableOpacity>
          </GlassCard>

          <TouchableOpacity style={dynamicStyles.cancelBtn} onPress={() => setShowNewTicket(false)}>
            <Typography variant="mono" style={[dynamicStyles.cancelText, { color: theme.textTertiary }]}>ABORT_INITIALIZATION</Typography>
          </TouchableOpacity>

          <ContactCard />
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={tickets}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TicketCard ticket={item} />}
            contentContainerStyle={dynamicStyles.list}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={() => (
              <Typography variant="mono" style={[dynamicStyles.sectionHeader, { color: theme.textSecondary }]}>// ACTIVE_COMMUNICATION_LOGS</Typography>
            )}
            ListEmptyComponent={
              <View style={dynamicStyles.emptyState}>
                <MessageIcon size={32} color={theme.textTertiary} strokeWidth={1} style={{ opacity: 0.5, marginBottom: 16 }} />
                <Typography variant="mono" style={[dynamicStyles.emptyText, { color: theme.textSecondary }]}>NO_ACTIVE_CHANNELS</Typography>
                <Typography variant="caption" style={[dynamicStyles.emptySubtext, { color: theme.textTertiary }]}>SUPPORT_HISTORY_IS_CURRENTLY_VACANT</Typography>
              </View>
            }
          />

          <ContactCard />

          <TouchableOpacity 
            style={[dynamicStyles.fab, { backgroundColor: theme.primary, shadowColor: theme.primary }]} 
            onPress={() => setShowNewTicket(true)}
            activeOpacity={0.8}
          >
            <PlusIcon size={24} color={theme.background} strokeWidth={3} />
            <GlowEffect color={theme.primary} size={40} glowRadius={20} style={dynamicStyles.fabGlow} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 9,
    marginTop: 20,
    letterSpacing: 1,
  },
  header: {
    padding: 24,
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
  encryptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  encryptionText: {
    fontSize: 8,
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
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    letterSpacing: 2,
  },
  list: {
    padding: 24,
    paddingBottom: 120,
  },
  sectionHeader: {
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  ticketCard: {
    padding: 18,
    borderRadius: 20,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  ticketMain: {
    flex: 1,
  },
  ticketSubject: {
    fontSize: 14,
    marginBottom: 8,
  },
  ticketMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 9,
    fontFamily: sharedTheme.typography.fonts.mono,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 8,
    letterSpacing: 1,
  },
  aiWorking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  aiText: {
    fontSize: 8,
    letterSpacing: 0.5,
    fontStyle: 'italic',
  },
  contactCard: {
    margin: 24,
    marginTop: 8,
    padding: 20,
    borderRadius: 24,
  },
  contactTitle: {
    fontSize: 9,
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  contactActions: {
    gap: 12,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  contactValue: {
    fontSize: 11,
    letterSpacing: 1,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 120,
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  fabGlow: {
    position: 'absolute',
    opacity: 0.5,
  },
  formScroll: {
    padding: 24,
    paddingBottom: 60,
  },
  formSectionTitle: {
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 16,
    marginLeft: 4,
  },
  formCard: {
    padding: 24,
    borderRadius: 28,
    gap: 24,
  },
  inputGroup: {
    gap: 10,
  },
  label: {
    fontSize: 9,
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  inputWrapper: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    borderWidth: 1,
  },
  input: {
    padding: 16,
    fontFamily: sharedTheme.typography.fonts.mono,
    fontSize: 13,
  },
  submitBtn: {
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  submitText: {
    fontSize: 14,
    letterSpacing: 1,
  },
  cancelBtn: {
    alignItems: 'center',
    padding: 20,
    marginTop: 8,
  },
  cancelText: {
    fontSize: 10,
    letterSpacing: 1,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  emptyText: {
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
});
