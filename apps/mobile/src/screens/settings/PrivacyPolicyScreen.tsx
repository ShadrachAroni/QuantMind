import React from 'react';
import { ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { theme } from '../../constants/theme';

export function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Typography variant="h1" style={styles.title}>Privacy Policy</Typography>
        <Typography variant="body" style={styles.text}>
          Last Updated: March 2026
          {"\n\n"}
          QuantMind ("we", "our", or "us") is committed to protecting your financial data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our institutional risk terminal.
          {"\n\n"}
          1. DATA COLLECTION
          We collect account information, portfolio metadata, and simulation parameters to provide our services. We do NOT sell your financial data to third parties.
          {"\n\n"}
          2. ENCRYPTION
          All portfolio data is encrypted at rest using AES-256 and in transit via TLS 1.3.
          {"\n\n"}
          3. AI PROCESSING
          Simulation queries processed by our AI Assistant are anonymized before being transmitted to our model providers (Anthropic).
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
