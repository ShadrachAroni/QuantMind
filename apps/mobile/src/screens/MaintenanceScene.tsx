import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, StatusBar, Image } from 'react-native';
import { Clock, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export const MaintenanceScene = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0A0B10', '#15161C']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Decorative Ambience */}
          <View style={styles.ambience} />
          
          <View style={styles.content}>
            {/* Diamond Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.diamondOuter}>
                 <View style={styles.diamondInner}>
                    <Image 
                       source={require('../../assets/icon.png')} 
                       style={{ width: 48, height: 48 }} 
                       resizeMode="contain"
                    />
                 </View>
              </View>
              <View style={[styles.pulse, styles.pulse1]} />
              <View style={[styles.pulse, styles.pulse2]} />
            </View>

            <View style={styles.textGroup}>
               <Text style={styles.subtitle}>PROTOCOL // EMERGENCY_DOWNTIME</Text>
               <Text style={styles.title}>SYSTEM <Text style={styles.highlight}>OFFLINE</Text></Text>
            </View>

            <View style={styles.card}>
               <Text style={styles.description}>
                  QuantMind core systems are currently undergoing <Text style={styles.whiteBold}>critical infrastructure synchronization</Text>. 
                  All market-facing modules are temporarily restricted to ensure data integrity.
               </Text>

               <View style={styles.badges}>
                  <View style={styles.badge}>
                     <Clock color="#94A3B8" size={14} />
                     <Text style={styles.badgeText}>RESTORE: 45M</Text>
                  </View>
                  <View style={[styles.badge, styles.adminBadge]}>
                     <View style={styles.dot} />
                     <Text style={styles.adminBadgeText}>ADMIN_OVERRIDE</Text>
                  </View>
               </View>
            </View>

            <View style={styles.footer}>
               <Text style={styles.footerText}>SESSION_LOCK_ID: {Math.random().toString(36).substring(7).toUpperCase()}</Text>
               <View style={styles.footerLine} />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  ambience: {
    position: 'absolute',
    top: height * 0.2,
    left: width * 0.1,
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: 200,
    transform: [{ scale: 2 }],
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  diamondOuter: {
    width: 80,
    height: 80,
    backgroundColor: '#15161C',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 24,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  diamondInner: {
    transform: [{ rotate: '-45deg' }],
  },
  pulse: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 100,
  },
  pulse1: {
    width: 120,
    height: 120,
  },
  pulse2: {
    width: 160,
    height: 160,
  },
  textGroup: {
    alignItems: 'center',
    marginBottom: 32,
  },
  subtitle: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1,
  },
  highlight: {
    color: '#EF4444',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 32,
    padding: 24,
    width: '100%',
  },
  description: {
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  whiteBold: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  badges: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  badgeText: {
    color: '#CBD5E1',
    fontSize: 9,
    fontWeight: '800',
  },
  adminBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
  },
  adminBadgeText: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '900',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  footer: {
    marginTop: 48,
    alignItems: 'center',
  },
  footerText: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  footerLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 1,
  },
});
