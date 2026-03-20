import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Gift, Check, Zap, X } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { useAuthStore } from '../../store/authStore';

const { width, height } = Dimensions.get('window');

interface TrialRewardModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export const TrialRewardModal: React.FC<TrialRewardModalProps> = ({ isVisible, onClose }) => {
  const { grantTrialReward, isLoading } = useAuthStore();
  const GiftIcon = Gift as any;
  const CheckIcon = Check as any;
  const ZapIcon = Zap as any;
  const XIcon = X as any;

  const handleActivate = async () => {
    try {
      await grantTrialReward();
      onClose();
    } catch (error) {
      console.error('Trial activation failed', error);
    }
  };

  const benefits = [
    { title: 'AI Oracle Access', description: 'Institutional-grade investment insights' },
    { title: '500 Daily Paths', description: 'Extensive portfolio simulation capacity' },
    { title: 'Advanced Risk Alerts', description: 'Real-time volatility & liquidations detection' },
    { title: 'Premium Hardware Sync', description: 'Connect external trading terminals' },
  ];

  if (!isVisible) return null;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        
        <Animated.View 
          entering={ZoomIn} 
          exiting={FadeOut}
          style={styles.container}
        >
          {/* Header Decor */}
          <View style={styles.headerGlow} />
          
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
            disabled={isLoading}
          >
            <XIcon size={20} color="#666" />
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <View style={styles.iconBackground}>
                <GiftIcon size={32} color="#D4AF37" />
              </View>
            </View>

            <Text style={styles.title}>Exclusive Reward</Text>
            <Text style={styles.subtitle}>
              You've unlocked a 14-day Plus subscription trial. Experience the full power of QuantMind.
            </Text>

            <View style={styles.benefitsContainer}>
              {benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <View style={styles.checkCircle}>
                    <CheckIcon size={12} color="#000" strokeWidth={3} />
                  </View>
                  <View>
                    <Text style={styles.benefitTitle}>{benefit.title}</Text>
                    <Text style={styles.benefitDescription}>{benefit.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.activateButton}
              onPress={handleActivate}
              disabled={isLoading}
            >
              <View style={styles.buttonContent}>
                <ZapIcon size={18} color="#000" fill="#000" />
                <Text style={styles.activateButtonText}>
                  {isLoading ? 'Activating...' : 'Claim 14-Day Free Access'}
                </Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              No credit card required. Trial expires automatically after 14 days.
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.85,
    backgroundColor: '#121212',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    overflow: 'hidden',
    position: 'relative',
  },
  headerGlow: {
    position: 'absolute',
    top: -50,
    left: '25%',
    width: '50%',
    height: 100,
    backgroundColor: '#D4AF37',
    opacity: 0.1,
    borderRadius: 50,
    filter: Platform.OS === 'ios' ? 'blur(40px)' : undefined,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
    marginTop: 8,
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  title: {
    fontSize: 24,
    fontFamily: 'InstrumentSans-Bold',
    color: '#D4AF37',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  benefitsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  benefitTitle: {
    fontSize: 14,
    fontFamily: 'InstrumentSans-SemiBold',
    color: '#E0E0E0',
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: 12,
    color: '#777',
  },
  activateButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activateButtonText: {
    fontSize: 16,
    fontFamily: 'InstrumentSans-Bold',
    color: '#000',
    marginLeft: 8,
  },
  disclaimer: {
    fontSize: 11,
    color: '#555',
    marginTop: 16,
    textAlign: 'center',
  },
});
