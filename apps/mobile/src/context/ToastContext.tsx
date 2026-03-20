import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { Typography } from '../components/ui/Typography';
import { GlassCard } from '../components/ui/GlassCard';
import { useTheme } from '../context/ThemeContext';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react-native';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;
  const { theme, isDark } = useTheme();

  const showToast = useCallback((msg: string, t: ToastType = 'info') => {
    setMessage(msg);
    setType(t);
    setVisible(true);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      hideToast();
    }, 4000);
  }, []);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  }, []);

  const getIcon = () => {
    const size = 18;
    const SuccessIcon = CheckCircle2 as any;
    const ErrorIcon = AlertCircle as any;
    const InfoIcon = Info as any;

    switch (type) {
      case 'success': return <SuccessIcon size={size} color="#10B981" />;
      case 'error': return <ErrorIcon size={size} color="#EF4444" />;
      default: return <InfoIcon size={size} color={theme.primary} />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success': return '#10B98144';
      case 'error': return '#EF444444';
      default: return theme.primary + '44';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Animated.View 
          style={[
            styles.toastContainer, 
            { opacity, transform: [{ translateY }] }
          ]}
        >
          <GlassCard style={[styles.toast, { borderColor: getBorderColor() }]}>
            <View style={styles.iconWrapper}>
              {getIcon()}
            </View>
            <View style={styles.textWrapper}>
              <Typography variant="monoBold" style={[styles.typeText, { color: type === 'error' ? '#EF4444' : type === 'success' ? '#10B981' : theme.primary }]}>
                {type.toUpperCase()}
              </Typography>
              <Typography variant="caption" style={[styles.message, { color: theme.textPrimary }]}>
                {message.toUpperCase()}
              </Typography>
            </View>
          </GlassCard>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: '100%',
  },
  iconWrapper: {
    marginRight: 12,
  },
  textWrapper: {
    flex: 1,
  },
  typeText: {
    fontSize: 8,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  message: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
