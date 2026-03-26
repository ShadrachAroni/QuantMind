import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react-native';
import { useSyncStore } from '../store/syncStore';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { supabase } from '../services/supabase';

const { width, height } = Dimensions.get('window');

export const OfflineScene = () => {
  const { lastOnline, setOnline } = useSyncStore();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    
    // Institutional connectivity check via dedicated health endpoint
    try {
      const { data, error } = await supabase.functions.invoke('health');
      
      if (!error && data?.status === 'ok') {
        setOnline(true);
      } else {
        throw new Error('Service unreachable');
      }
    } catch (e) {
      // Still offline or service unavailable
      setTimeout(() => setRetrying(false), 1500);
    }
  };

  const lastOnlineFormatted = lastOnline 
    ? format(new Date(lastOnline), 'MMM d, HH:mm')
    : 'Never';

  return (
    <LinearGradient colors={['#080810', '#101020']} style={styles.container}>
      <View style={styles.content}>
        {/* Branding */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>QUANTMIND</Text>
        </View>

        {/* Offline Indicator */}
        <View style={styles.visualContainer}>
          <View style={styles.iconCircle}>
            <WifiOff size={64} color="#00F0FF" />
          </View>
          <View style={styles.glow} />
        </View>

        <Text style={styles.title}>Connectivity Interrupted</Text>
        <Text style={styles.subtitle}>
          The institutional neural link has been disrupted. QuantMind will attempt to resync your data once a stable connection is established.
        </Text>

        <View style={styles.infoBox}>
          <AlertCircle size={16} color="#9090B8" />
          <Text style={styles.infoText}>Last synchronized: {lastOnlineFormatted}</Text>
        </View>

        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={handleRetry}
          disabled={retrying}
        >
          {retrying ? (
            <ActivityIndicator color="#080810" />
          ) : (
            <>
              <RefreshCw size={20} color="#080810" />
              <Text style={styles.retryText}>Retry Connection</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Some features may be limited while offline.
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 60,
  },
  logo: {
    width: 32,
    height: 32,
  },
  brandName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    marginLeft: 10,
  },
  visualContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    zIndex: 1,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    color: '#9090B8',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 40,
  },
  infoText: {
    color: '#9090B8',
    fontSize: 13,
    marginLeft: 8,
  },
  retryButton: {
    backgroundColor: '#00F0FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  retryText: {
    color: '#080810',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  footerText: {
    color: '#404060',
    fontSize: 12,
    marginTop: 20,
    position: 'absolute',
    bottom: 40,
  },
});
