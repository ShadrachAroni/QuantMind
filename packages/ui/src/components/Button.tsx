import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../theme/tokens';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled }: ButtonProps) {
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        styles[variant], 
        disabled && styles.disabled
      ]} 
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={isOutline || isGhost ? theme.colors.primary : '#FFF'} />
      ) : (
        <Text style={[
          styles.text, 
          isOutline && { color: theme.colors.primary },
          isGhost && { color: theme.colors.text.secondary }
        ]}>
          {title.toUpperCase()}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#000',
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    letterSpacing: 1.25,
  }
});
