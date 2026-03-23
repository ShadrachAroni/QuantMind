import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform as RNPlatform
} from 'react-native';
import { useAuthStore, ChangelogEntry } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { Typography } from '../../components/ui/Typography';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { 
  ChevronLeft, 
  Rocket, 
  Bug, 
  Zap, 
  ShieldAlert, 
  Settings,
  History,
  AlertTriangle,
  Info
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { sharedTheme } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';

export function ChangelogScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const { changelog, fetchChangelog, isLoading } = useAuthStore();

  useEffect(() => {
    fetchChangelog();
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'feature': return Rocket;
      case 'fix': return Bug;
      case 'performance': return Zap;
      case 'security': return ShieldAlert;
      default: return Settings;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'feature': return theme.primary;
      case 'fix': return theme.warning || '#F59E0B';
      case 'performance': return theme.success;
      case 'security': return theme.error;
      default: return theme.textSecondary;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return theme.error;
      case 'high': return theme.warning || '#F59E0B';
      case 'medium': return theme.primary;
      default: return theme.textTertiary;
    }
  };

  // Group by version
  const groupedChangelog = changelog.reduce((acc: { [key: string]: ChangelogEntry[] }, entry) => {
    if (!acc[entry.version]) acc[entry.version] = [];
    acc[entry.version].push(entry);
    return acc;
  }, {});

  const versions = Object.keys(groupedChangelog).sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color={theme.textPrimary} size={24} />
        </TouchableOpacity>
        <Typography variant="h3" style={styles.headerTitle}>LOG_PROTOCOL:_UPTIME_HISTORY</Typography>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.introSection}>
          <History size={20} color={theme.primary} />
          <Typography variant="caption" style={{ marginLeft: 12, color: theme.textSecondary }}>
            SYSTEM_EVOLUTION_TRACKER // V{versions[0] || '1.0.4'}
          </Typography>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : versions.length === 0 ? (
          <View style={styles.emptyState}>
            <Typography color="textTertiary">NO_LOGS_AVAILABLE</Typography>
          </View>
        ) : (
          versions.map((version) => (
            <View key={version} style={styles.versionSection}>
              <View style={styles.versionLine}>
                <View style={[styles.versionBadge, { backgroundColor: theme.primary + '20', borderColor: theme.primary + '40' }]}>
                  <Typography variant="monoBold" style={{ color: theme.primary, fontSize: 14 }}>V{version}</Typography>
                </View>
                <View style={[styles.connectingLine, { backgroundColor: theme.border }]} />
              </View>

              <View style={styles.entriesContainer}>
                {groupedChangelog[version].map((entry) => {
                  const CategoryIcon = getCategoryIcon(entry.category) as any;
                  const catColor = getCategoryColor(entry.category);
                  
                  return (
                    <GlassCard key={entry.id} style={styles.entryCard} intensity="low">
                      <View style={styles.entryHeader}>
                        <View style={[styles.categoryBadge, { backgroundColor: catColor + '10', borderColor: catColor + '30' }]}>
                          <CategoryIcon size={12} color={catColor} />
                          <Typography style={[styles.categoryText, { color: catColor }]}>{entry.category.toUpperCase()}</Typography>
                        </View>
                        
                        <View style={styles.platformBadges}>
                           <Typography variant="caption" style={[styles.platformText, { color: theme.textTertiary }]}>
                             [{entry.platform.toUpperCase()}]
                           </Typography>
                        </View>
                      </View>

                      <Typography variant="h4" style={styles.entryTitle}>{entry.title}</Typography>
                      <Typography variant="body" style={[styles.entryDesc, { color: theme.textSecondary }]}>{entry.description}</Typography>

                      <View style={styles.entryFooter}>
                        <View style={styles.impactWrapper}>
                          <View style={[styles.dot, { backgroundColor: getImpactColor(entry.impact_level) }]} />
                          <Typography variant="caption" style={{ color: theme.textTertiary, fontSize: 10 }}>
                            IMPACT: {entry.impact_level.toUpperCase()}
                          </Typography>
                        </View>

                        {entry.is_breaking && (
                          <View style={styles.breakingBadge}>
                            <AlertTriangle size={12} color={theme.error} />
                            <Typography variant="caption" style={{ color: theme.error, fontSize: 10, marginLeft: 4 }}>BREAKING</Typography>
                          </View>
                        )}

                        <Typography variant="caption" style={{ color: theme.textTertiary, fontSize: 9 }}>
                          {new Date(entry.created_at).toLocaleDateString()}
                        </Typography>
                      </View>
                    </GlassCard>
                  );
                })}
              </View>
            </View>
          ))
        )}

        <View style={styles.disclaimer}>
          <Info size={14} color={theme.textTertiary} />
          <Typography variant="caption" style={{ color: theme.textTertiary, marginLeft: 8, textAlign: 'center' }}>
            Updates are rolled out incrementally. Your specific environment may receive deployments at different intervals.
          </Typography>
        </View>
      </ScrollView>

      {/* Background Decor */}
      <View style={styles.glowOverlay}>
        <GlowEffect color={theme.primary} size={400} glowRadius={200} opacity={0.02} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontFamily: sharedTheme.typography.fonts.mono,
    letterSpacing: 2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  introSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    opacity: 0.7,
  },
  versionSection: {
    marginBottom: 40,
  },
  versionLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  versionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  connectingLine: {
    flex: 1,
    height: 1,
    marginLeft: 12,
    opacity: 0.3,
  },
  entriesContainer: {
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.05)',
    marginLeft: 20,
  },
  entryCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 4,
    fontFamily: sharedTheme.typography.fonts.mono,
  },
  platformBadges: {
    flexDirection: 'row',
  },
  platformText: {
    fontSize: 10,
    fontFamily: sharedTheme.typography.fonts.mono,
  },
  entryTitle: {
    marginBottom: 6,
  },
  entryDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  entryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
  },
  impactWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  breakingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  disclaimer: {
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    opacity: 0.5,
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: -1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
