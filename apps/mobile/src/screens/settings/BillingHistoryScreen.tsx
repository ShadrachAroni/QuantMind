import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
  Platform,
  Linking
} from 'react-native';
import { supabase } from '../../services/supabase';
import { Typography } from '../../components/ui/Typography';
import { GlassCard } from '../../components/ui/GlassCard';
import { useTheme } from '../../context/ThemeContext';
import { hexToRgba } from '../../utils/themeUtils';
import { 
  FileText, 
  Download, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronLeft,
  Share2
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';

interface Transaction {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  channel: string;
  created_at: string;
}

export function BillingHistoryScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('paystack_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setTransactions(data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async (tx: Transaction) => {
    setProcessingId(tx.id);
    try {
      if (!user?.email) throw new Error("Email not found");

      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: user.email,
          type: 'payment_receipt',
          details: {
            reference: tx.reference,
            amount: (tx.amount).toFixed(2),
            currency: tx.currency,
            tier: 'INSTITUTIONAL',
            date: new Date(tx.created_at).toLocaleDateString('en-GB', { 
              day: '2-digit', month: 'short', year: 'numeric' 
            }).toUpperCase(),
            method: tx.channel || 'Card'
          }
        }
      });

      if (error) throw error;
      alert("Institutional receipt dispatched to " + user.email);
    } catch (err) {
      alert("Failed to dispatch receipt.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleShare = async (tx: Transaction) => {
    const date = new Date(tx.created_at).toLocaleDateString('en-GB', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    });
    const message = `QuantMind Receipt\nRef: ${tx.reference}\nDate: ${date}\nAmount: ${tx.amount.toFixed(2)} ${tx.currency}\nStatus: ${tx.status.toUpperCase()}`;
    
    try {
      await Share.share({
        message,
        title: 'QuantMind Receipt'
      });
    } catch (error) {
      console.error(error);
    }
  };

  const dynamicStyles = getStyles(theme);

  return (
    <View style={[dynamicStyles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[hexToRgba(theme.primary, 0.05), theme.background]}
        style={StyleSheet.absoluteFill}
      />

      <View style={dynamicStyles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={[dynamicStyles.backButton, { backgroundColor: hexToRgba(theme.textPrimary, 0.05) }]}
        >
          <ChevronLeft color={theme.textPrimary} size={20} />
        </TouchableOpacity>
        <Typography variant="h3" style={{ color: theme.textPrimary }}>BILLING_LEDGER</Typography>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={dynamicStyles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={dynamicStyles.centerContent}>
            <ActivityIndicator color={theme.primary} />
            <Typography variant="caption" style={{ color: theme.textTertiary, marginTop: 12 }}>ACCESSING_ENCRYPTED_LEDGER...</Typography>
          </View>
        ) : transactions.length > 0 ? (
          transactions.map((tx) => (
            <GlassCard key={tx.id} intensity="low" style={dynamicStyles.txCard}>
              <View style={dynamicStyles.txHeader}>
                <View>
                  <Typography variant="monoBold" style={{ color: theme.textPrimary, fontSize: 12 }}>
                    {tx.reference.substring(0, 12)}...
                  </Typography>
                  <Typography variant="caption" style={{ color: theme.textTertiary }}>
                    {new Date(tx.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                  </Typography>
                </View>
                <View style={dynamicStyles.statusBadge}>
                   {tx.status === 'success' ? (
                     <CheckCircle2 size={12} color="#32D74B" />
                   ) : (
                     <XCircle size={12} color="#FF453A" />
                   )}
                   <Typography variant="caption" style={{ 
                     color: tx.status === 'success' ? "#32D74B" : "#FF453A",
                     marginLeft: 4,
                     fontSize: 10,
                     fontWeight: '800'
                   }}>
                     {tx.status.toUpperCase()}
                   </Typography>
                </View>
              </View>

              <View style={dynamicStyles.txBody}>
                <Typography variant="h3" style={{ color: theme.textPrimary }}>
                  {tx.amount.toFixed(2)} <Typography variant="caption" style={{ color: theme.textTertiary }}>{tx.currency}</Typography>
                </Typography>
                <Typography variant="caption" style={{ color: theme.textTertiary }}>{tx.channel || 'CREDIT_CARD'}</Typography>
              </View>

              <View style={dynamicStyles.actions}>
                <TouchableOpacity 
                  onPress={() => handleResendEmail(tx)}
                  disabled={processingId === tx.id || tx.status !== 'success'}
                  style={[dynamicStyles.actionButton, { backgroundColor: hexToRgba(theme.textPrimary, 0.05) }]}
                >
                  {processingId === tx.id ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <>
                      <Mail size={16} color={theme.textSecondary} />
                      <Typography variant="caption" style={{ color: theme.textSecondary, marginLeft: 8 }}>EMAIL</Typography>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => handleShare(tx)}
                  disabled={tx.status !== 'success'}
                  style={[dynamicStyles.actionButton, { backgroundColor: hexToRgba(theme.primary, 0.1) }]}
                >
                  <Share2 size={16} color={theme.primary} />
                  <Typography variant="caption" style={{ color: theme.primary, marginLeft: 8, fontWeight: '800' }}>SHARE</Typography>
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))
        ) : (
          <View style={dynamicStyles.centerContent}>
            <FileText size={48} color={hexToRgba(theme.textPrimary, 0.1)} />
            <Typography variant="caption" style={{ color: theme.textTertiary, marginTop: 16 }}>NO_HISTORICAL_RECORDS_FOUND</Typography>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: hexToRgba(theme.textPrimary, 0.05),
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  txBody: {
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
