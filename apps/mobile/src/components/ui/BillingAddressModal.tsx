import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Modal, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { Typography } from '../ui/Typography';
import { GlassCard } from '../ui/GlassCard';
import { GlowEffect } from '../ui/GlowEffect';
import { useTheme } from '../../context/ThemeContext';
import { sharedTheme } from '../../constants/theme';
import { User, Mail, Phone, MapPin, ArrowRight, X } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BillingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  street: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (address: BillingAddress) => void;
  planName: string;
  amount: string;
}

export function BillingAddressModal({ visible, onClose, onSubmit, planName, amount }: Props) {
  const { theme, isDark } = useTheme();
  const [form, setForm] = useState<BillingAddress>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: 'Nairobi',
    street: '',
  });

  const handleSubmit = () => {
    // Basic validation
    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      return;
    }
    onSubmit(form);
  };

  const UserIcon = User as any;
  const MailIcon = Mail as any;
  const PhoneIcon = Phone as any;
  const MapPinIcon = MapPin as any;
  const ArrowIcon = ArrowRight as any;
  const CloseIcon = X as any;

  const InputField = ({ label, value, onChangeText, icon: Icon, placeholder, keyboardType = 'default' }: any) => (
    <View style={styles.inputGroup}>
      <Typography variant="caption" style={[styles.label, { color: theme.textTertiary }]}>{label}</Typography>
      <View style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}>
        <View style={styles.iconBox}>
          <Icon size={16} color={theme.primary} />
        </View>
        <TextInput
          style={[styles.input, { color: theme.textPrimary, fontFamily: sharedTheme.typography.fonts.mono }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textTertiary}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <GlassCard intensity="high" style={styles.container}>
          <View style={styles.header}>
            <View>
              <Typography variant="mono" style={{ color: theme.primary, fontSize: 10 }}>BILLING_CLEARANCE_PROTOCOL</Typography>
              <Typography variant="h3" style={{ color: theme.textPrimary }}>SUBSCRIPTION_CHECKOUT</Typography>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <CloseIcon size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.summaryBox, { backgroundColor: theme.primary + '11', borderColor: theme.primary + '33' }]}>
            <View>
              <Typography variant="caption" style={{ color: theme.textTertiary }}>SELECTED_PLAN</Typography>
              <Typography variant="monoBold" style={{ color: theme.textPrimary }}>{planName.toUpperCase()}_PROTOCOL</Typography>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Typography variant="caption" style={{ color: theme.textTertiary }}>TOTAL_AMOUNT</Typography>
              <Typography variant="h3" style={{ color: theme.primary }}>KES {amount}</Typography>
            </View>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <InputField 
                  label="FIRST_NAME" 
                  value={form.firstName} 
                  onChangeText={(t: string) => setForm({...form, firstName: t})}
                  icon={UserIcon}
                  placeholder="John"
                />
              </View>
              <View style={{ flex: 1 }}>
                <InputField 
                  label="LAST_NAME" 
                  value={form.lastName} 
                  onChangeText={(t: string) => setForm({...form, lastName: t})}
                  icon={UserIcon}
                  placeholder="Doe"
                />
              </View>
            </View>

            <InputField 
              label="SECURE_EMAIL" 
              value={form.email} 
              onChangeText={(t: string) => setForm({...form, email: t})}
              icon={MailIcon}
              placeholder="operator@quantmind.io"
              keyboardType="email-address"
            />

            <InputField 
              label="COMMS_CHANNEL_(PHONE)" 
              value={form.phone} 
              onChangeText={(t: string) => setForm({...form, phone: t})}
              icon={PhoneIcon}
              placeholder="254..."
              keyboardType="phone-pad"
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <InputField 
                  label="CITY_HUB" 
                  value={form.city} 
                  onChangeText={(t: string) => setForm({...form, city: t})}
                  icon={MapPinIcon}
                  placeholder="Nairobi"
                />
              </View>
              <View style={{ flex: 1 }}>
                <InputField 
                  label="STR_IDENTIFIER" 
                  value={form.street} 
                  onChangeText={(t: string) => setForm({...form, street: t})}
                  icon={MapPinIcon}
                  placeholder="Main St"
                />
              </View>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: theme.primary }]}
            onPress={handleSubmit}
          >
            <Typography variant="monoBold" style={{ color: theme.background, letterSpacing: 2 }}>INITIATE_PAYMENT</Typography>
            <ArrowIcon size={18} color={theme.background} style={{ marginLeft: 12 }} />
          </TouchableOpacity>
        </GlassCard>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  closeBtn: {
    padding: 4,
  },
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  form: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    marginBottom: 16,
    gap: 6,
  },
  label: {
    fontSize: 9,
    letterSpacing: 1,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  iconBox: {
    paddingLeft: 12,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 12,
  },
  submitBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
  }
});
