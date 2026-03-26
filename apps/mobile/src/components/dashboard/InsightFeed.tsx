import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../ui/Typography';
import { useTheme } from '../../context/ThemeContext';
import { 
  CheckCircle2, 
  AlertCircle, 
  Info 
} from 'lucide-react-native';

export interface Insight {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  category: string;
  message: string;
  time: string;
  metadata?: { label: string; value: string };
}

interface InsightFeedProps {
  insights: Insight[];
}

export function InsightFeed({ insights }: InsightFeedProps) {
  const { theme } = useTheme();

  if (insights.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Typography variant="mono" style={styles.emptyText}>AGGREGATING_DATA_STREAM...</Typography>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {insights.map((insight) => (
        <InsightItem key={insight.id} insight={insight} />
      ))}
    </View>
  );
}

function InsightItem({ insight }: { insight: Insight }) {
  const { theme } = useTheme();
  
  const getIcon = () => {
    switch (insight.type) {
      case 'success': return <CheckCircle2 size={12} color="#10B981" />;
      case 'error': return <AlertCircle size={12} color="#FF453A" />;
      case 'warning': return <AlertCircle size={12} color="#FFD60A" />;
      default: return <Info size={12} color={theme.primary} />;
    }
  };

  const getBackgroundColor = () => {
    switch (insight.type) {
      case 'success': return 'rgba(16, 185, 129, 0.1)';
      case 'error': return 'rgba(255, 69, 58, 0.1)';
      case 'warning': return 'rgba(255, 214, 10, 0.1)';
      default: return 'rgba(0, 217, 255, 0.1)';
    }
  };

  return (
    <View style={styles.itemContainer}>
      <View style={[styles.iconContainer, { backgroundColor: getBackgroundColor() }]}>
        {getIcon()}
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Typography variant="mono" style={[styles.category, { color: theme.textTertiary }]}>{insight.category}</Typography>
          <Typography variant="caption" style={styles.time}>{new Date(insight.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
        </View>
        <Typography variant="body" style={[styles.message, { color: theme.textPrimary }]}>{insight.message}</Typography>
        {insight.metadata && (
          <View style={styles.metadata}>
            <Typography variant="mono" style={styles.metaLabel}>{insight.metadata.label}: </Typography>
            <Typography variant="monoBold" style={[styles.metaValue, { color: theme.primary }]}>{insight.metadata.value}</Typography>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  emptyContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 10,
    color: '#848D97',
    letterSpacing: 2,
  },
  itemContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  content: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  category: {
    fontSize: 9,
    letterSpacing: 1,
  },
  time: {
    fontSize: 9,
    color: '#848D97',
  },
  message: {
    fontSize: 12,
    lineHeight: 18,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaLabel: {
    fontSize: 9,
    color: '#848D97',
  },
  metaValue: {
    fontSize: 10,
  },
});
