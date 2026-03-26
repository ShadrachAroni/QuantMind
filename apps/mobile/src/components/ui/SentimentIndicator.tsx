import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { supabase } from '../../services/supabase';
import { useTheme } from '../../context/ThemeContext';
import { sharedTheme } from '../../constants/theme';
import { Activity } from 'lucide-react-native';
import { GlassCard } from './GlassCard';
import { GlowEffect } from './GlowEffect';

export function SentimentIndicator() {
  const [sentiment, setSentiment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  const fetchSentiment = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('market_sentiment')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) setSentiment(data);
    } catch (err) {
      console.error('SENTIMENT_FETCH_ERROR:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSentiment();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('market-sentiment-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'market_sentiment' },
        () => fetchSentiment()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSentiment]);

  if (loading || !sentiment) return null;

  const score = sentiment.sentiment_score;
  const isPositive = score > 0.3;
  const isNegative = score < -0.3;
  const accentColor = isPositive ? '#32D74B' : isNegative ? '#FF453A' : theme.textSecondary;

  return (
    <GlassCard intensity="low" style={[styles.container, { borderColor: theme.primary + '22' }]}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <Activity size={10} color={theme.primary} />
          <Typography variant="mono" style={[styles.label, { color: theme.primary }]}>AI_SENTIMENT_ORACLE</Typography>
        </View>
        <GlowEffect color={accentColor} size={6} glowRadius={6} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.row}>
           <Typography variant="mono" style={[styles.moodLabel, { color: theme.textTertiary }]}>Aggregated_Mood</Typography>
           <View style={[styles.badge, { backgroundColor: accentColor + '20' }]}>
              <Typography variant="monoBold" style={[styles.badgeText, { color: accentColor }]}>
                {(score * 100).toFixed(0)}%
              </Typography>
           </View>
        </View>
        <Typography variant="caption" style={[styles.summary, { color: theme.textSecondary }]} numberOfLines={2}>
          "{sentiment.summary}"
        </Typography>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 8,
    letterSpacing: 1.5,
    fontWeight: 'bold',
  },
  content: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodLabel: {
    fontSize: 9,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 9,
  },
  summary: {
    fontSize: 10,
    fontStyle: 'italic',
    lineHeight: 14,
  }
});
