import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore, AIConfig } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { Typography } from '../../components/ui/Typography';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { 
  Shield, 
  Key, 
  Cpu, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ChevronLeft,
  Info,
  ExternalLink
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { sharedTheme } from '../../constants/theme';
import * as Linking from 'expo-linking';

export function CustomAIIntegrationsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { 
    aiConfigs, 
    fetchAIConfigs, 
    saveAIConfig, 
    toggleAIConfig, 
    deleteAIConfig,
    isLoading 
  } = useAuthStore();

  const [provider, setProvider] = useState<'anthropic' | 'openai' | 'google'>('anthropic');
  const [modelId, setModelId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAIConfigs();
  }, []);

  const handleSave = async () => {
    if (!modelId || !apiKey) {
      Alert.alert('Incomplete Data', 'Please provide both a Model ID and an API Key.');
      return;
    }

    setIsSaving(true);
    try {
      await saveAIConfig(provider, modelId, apiKey);
      setModelId('');
      setApiKey('');
      Alert.alert('Clearance Granted', 'Your custom AI model has been integrated into the terminal.');
    } catch (error: any) {
      Alert.alert('Integration Failed', error.message || 'An error occurred while saving the configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const providers = [
    { id: 'anthropic', name: 'Anthropic', defaultModel: 'claude-3-opus-20240229' },
    { id: 'openai', name: 'OpenAI', defaultModel: 'gpt-4-turbo' },
    { id: 'google', name: 'Google Gemini', defaultModel: 'gemini-1.5-pro' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color={theme.textPrimary} size={24} />
        </TouchableOpacity>
        <Typography variant="h3" style={styles.headerTitle}>SECURE_VAULT_INTEGRATIONS</Typography>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Security Banner */}
        <View style={[styles.banner, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
          <Shield size={20} color={theme.primary} />
          <Typography style={[styles.bannerText, { color: theme.primary }]}>
            All API keys are encrypted at rest using industry-standard AES-256 GCM in our secure backend vault.
          </Typography>
        </View>

        {/* Existing Configs */}
        <View style={styles.section}>
          <Typography variant="label" style={styles.sectionLabel}>ACTIVE_CONFIGURATIONS</Typography>
          {aiConfigs.length === 0 ? (
            <View style={[styles.emptyState, { borderColor: theme.border }]}>
              <Typography style={{ color: theme.textTertiary }}>NO_CUSTOM_MODELS_DETECTED</Typography>
            </View>
          ) : (
            aiConfigs.map((config) => (
              <View key={config.id} style={[styles.configItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.configInfo}>
                  <View style={styles.providerBadge}>
                    <Cpu size={14} color={theme.primary} />
                    <Typography style={[styles.providerText, { color: theme.primary }]}>{config.provider.toUpperCase()}</Typography>
                  </View>
                  <Typography variant="h4" style={{ color: theme.textPrimary }}>{config.model_id}</Typography>
                  <Typography variant="caption" style={{ color: theme.textTertiary }}>Last Updated: {new Date(config.updated_at).toLocaleDateString()}</Typography>
                </View>

                <View style={styles.configActions}>
                  <TouchableOpacity 
                    onPress={() => toggleAIConfig(config.id, !config.is_active)}
                    style={styles.actionButton}
                  >
                    {config.is_active ? (
                      <CheckCircle2 size={24} color={theme.success} />
                    ) : (
                      <View style={[styles.circle, { borderColor: theme.textTertiary }]} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => {
                        Alert.alert(
                            "Confirm Deletion",
                            "Are you sure you want to remove this configuration?",
                            [
                                { text: "Cancel", style: "cancel" },
                                { text: "Delete", style: "destructive", onPress: () => deleteAIConfig(config.id) }
                            ]
                        );
                    }}
                    style={styles.actionButton}
                  >
                    <Trash2 size={20} color={theme.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Add New Config */}
        <View style={styles.section}>
          <Typography variant="label" style={styles.sectionLabel}>INITIALIZE_NEW_MODEL</Typography>
          
          <View style={[styles.formContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Typography variant="caption" style={{ marginBottom: 8, color: theme.textSecondary }}>SELECT_PROVIDER</Typography>
            <View style={styles.providerGrid}>
              {providers.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => {
                    setProvider(p.id as any);
                    if (!modelId) setModelId(p.defaultModel);
                  }}
                  style={[
                    styles.providerOption,
                    { borderColor: provider === p.id ? theme.primary : theme.border },
                    provider === p.id && { backgroundColor: theme.primary + '10' }
                  ]}
                >
                  <Typography style={{ color: provider === p.id ? theme.primary : theme.textSecondary }}>{p.name}</Typography>
                </TouchableOpacity>
              ))}
            </View>

            <Typography variant="caption" style={{ marginTop: 16, marginBottom: 8, color: theme.textSecondary }}>MODEL_IDENTIFIER</Typography>
            <TextInput
              style={[styles.input, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="e.g., claude-3-sonnet-20240229"
              placeholderTextColor={theme.textTertiary}
              value={modelId}
              onChangeText={setModelId}
            />

            <Typography variant="caption" style={{ marginTop: 16, marginBottom: 8, color: theme.textSecondary }}>API_ACCESS_TOKEN</Typography>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.background, paddingLeft: 40 }]}
                placeholder="sk-..."
                placeholderTextColor={theme.textTertiary}
                value={apiKey}
                onChangeText={setApiKey}
                secureTextEntry
              />
              <Key size={18} color={theme.textTertiary} style={styles.inputIcon} />
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Plus size={20} color="#fff" />
                  <Typography style={styles.saveButtonText}>INJECT_CONFIGURATION</Typography>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Documentation */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Info size={16} color={theme.textTertiary} />
            <Typography variant="caption" style={{ marginLeft: 8, color: theme.textTertiary }}>
              Need help finding your API key?
            </Typography>
          </View>
          <TouchableOpacity 
            onPress={() => Linking.openURL('https://docs.anthropic.com/claude/reference/getting-started-with-the-api')}
            style={styles.linkRow}
          >
            <Typography variant="caption" style={{ color: theme.primary }}>Get Anthropic Key</Typography>
            <ExternalLink size={12} color={theme.primary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Ambient Glow */}
      <View style={styles.glowOverlay}>
        <GlowEffect color={theme.primary} size={400} glowRadius={200} opacity={0.03} />
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
  banner: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
    alignItems: 'center',
  },
  bannerText: {
    fontSize: 12,
    marginLeft: 12,
    flex: 1,
    fontFamily: sharedTheme.typography.fonts.mono,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    marginBottom: 12,
    opacity: 0.6,
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  configItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  configInfo: {
    flex: 1,
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  providerText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
    fontFamily: sharedTheme.typography.fonts.mono,
  },
  configActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  formContainer: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  providerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  providerOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: '30%',
    alignItems: 'center',
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: sharedTheme.typography.fonts.mono,
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
  },
  saveButton: {
    marginTop: 24,
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
    letterSpacing: 1,
  },
  infoSection: {
    marginTop: 8,
    paddingHorizontal: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
