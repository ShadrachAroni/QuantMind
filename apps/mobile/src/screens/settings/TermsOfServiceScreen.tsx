import React from 'react';
import { ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { theme } from '../../constants/theme';

export function TermsOfServiceScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Typography variant="h1" style={styles.title}>Terms of Service</Typography>
        <Typography variant="body" style={styles.text}>
          Last Updated: March 2026
          {"\n\n"}
          By using QuantMind, you agree to these institutional terms.
          {"\n\n"}
          1. NO FINANCIAL ADVICE
          QuantMind is a mathematical simulation tool. It does not provide financial, investment, or legal advice. All simulations are based on historical probability and do not guarantee future results.
          {"\n\n"}
          2. MODEL RISK
          Users acknowledge that Monte Carlo simulations (GBM, Fat-Tails) are approximations of reality and may fail to predict "Black Swan" events or structural market shifts.
          {"\n\n"}
          3. USAGE LIMITS
          Free tier users are subject to rate limiting on simulation depth and AI context volume.
        </Typography>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.xl },
  title: { marginBottom: 20 },
  text: { color: theme.colors.textSecondary, lineHeight: 24 },
});
