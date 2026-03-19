import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { AssetCard } from '../../components/ui/AssetCard';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { theme } from '../../constants/theme';
import { usePortfolioStore } from '../../store/portfolioStore';
import { api } from '../../services/api';
import { Search, Info, Plus } from 'lucide-react-native';
import { Asset } from '@quantmind/shared-types';

export function PortfolioBuilderScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const { createPortfolio } = usePortfolioStore();
  
  const SearchIcon = Search as any;
  const PlusIcon = Plus as any;

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const results = await api.searchAssets(searchQuery);
      setSearchResults(results);
    } catch (e: any) {
      Alert.alert('Search failed', e.message);
    } finally {
      setIsSearching(false);
    }
  };

  const addAsset = async (assetData: any) => {
    if (selectedAssets.find(a => a.ticker === assetData.ticker)) {
      Alert.alert('Asset exists', 'This asset is already in your portfolio.');
      return;
    }

    setIsSearching(true);
    try {
      // Automatically fetch historical params (mu, sigma)
      const features = await api.getAssetHistory(assetData.ticker);
      
      const newAsset: Asset = {
        ticker: assetData.ticker,
        name: assetData.name || assetData.ticker,
        weight: 0, // Need to manually balance later
        expected_return: features.expectedReturn || 0.08,
        volatility: features.volatility || 0.15,
      };
      
      setSelectedAssets([...selectedAssets, newAsset]);
      setSearchResults([]);
      setSearchQuery('');
    } catch (e: any) {
      Alert.alert('Failed to fetch asset data', e.message);
    } finally {
      setIsSearching(false);
    }
  };

  const removeAsset = (ticker: string) => {
    setSelectedAssets(selectedAssets.filter(a => a.ticker !== ticker));
  };

  const updateWeight = (ticker: string, weightString: string) => {
    const val = parseFloat(weightString);
    const weight = isNaN(val) ? 0 : val / 100;
    
    setSelectedAssets(selectedAssets.map(a => 
      a.ticker === ticker ? { ...a, weight } : a
    ));
  };

  const handleSave = async () => {
    if (!name) {
      Alert.alert('Error', 'Please provide a portfolio name.');
      return;
    }
    
    if (selectedAssets.length === 0) {
      Alert.alert('Error', 'Add at least one asset to the portfolio.');
      return;
    }

    const totalWeight = selectedAssets.reduce((sum, a) => sum + a.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      Alert.alert('Invalid Weights', `Total portfolio weight must equal 100%. Currently: ${(totalWeight * 100).toFixed(1)}%`);
      return;
    }

    setIsSaving(true);
    try {
      const newPort = await createPortfolio(name, description, selectedAssets);
      navigation.navigate('PortfolioDetail', { id: newPort.id });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to construct portfolio');
    } finally {
      setIsSaving(false);
    }
  };

  const currentTotalWeight = selectedAssets.reduce((sum, a) => sum + a.weight, 0);
  const isValidWeight = Math.abs(currentTotalWeight - 1.0) < 0.001;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
             <Typography variant="button" style={{color: theme.colors.textSecondary}}>← Back</Typography>
          </TouchableOpacity>
          <Typography variant="h2" style={styles.title}>Portfolio Constructor</Typography>
        </View>

        <View style={styles.card}>
          <Typography variant="caption" style={styles.label}>PORTFOLIO ID / NAME</Typography>
          <TextInput
            style={styles.input}
            placeholder="e.g. Q1 Tech Growth"
            placeholderTextColor={theme.colors.textTertiary}
            value={name}
            onChangeText={setName}
          />

          <Typography variant="caption" style={[styles.label, { marginTop: 16 }]}>STRATEGY DESCRIPTION (OPTIONAL)</Typography>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the thesis..."
            placeholderTextColor={theme.colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <Typography variant="h3" style={styles.sectionTitle}>Asset Selection</Typography>
        
        <View style={styles.searchRow}>
          <TextInput
            style={[styles.input, styles.searchInput]}
            placeholder="Search symbol (e.g. AAPL, BTC-USD)"
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={isSearching}>
            <SearchIcon size={20} color={theme.colors.background} />
          </TouchableOpacity>
        </View>

        {searchResults.length > 0 && (
          <View style={styles.searchResults}>
            {searchResults.map((res: any, idx) => (
              <TouchableOpacity key={`${res.ticker}-${idx}`} style={styles.searchResultItem} onPress={() => addAsset(res)}>
                <Typography variant="button">{res.ticker}</Typography>
                <Typography variant="caption" numberOfLines={1} style={{ flex: 1, marginLeft: 10 }}>{res.name}</Typography>
                <PlusIcon size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedAssets.length > 0 && (
          <View style={styles.assetsContainer}>
            <View style={styles.assetHeaderRow}>
              <Typography variant="caption" style={{flex: 2}}>ASSET</Typography>
              <Typography variant="caption" style={{flex: 1, textAlign: 'right'}}>WEIGHT (%)</Typography>
              <View style={{width: 40}} />
            </View>

            {selectedAssets.map((asset) => (
              <View key={asset.ticker} style={styles.assetRow}>
                <View style={styles.assetInfo}>
                  <Typography variant="button" style={styles.assetTicker}>{asset.ticker}</Typography>
                  <Typography variant="caption" style={styles.assetHint}>μ: {((asset.expected_return || 0) * 100).toFixed(1)}%</Typography>
                </View>
                <TextInput
                  style={styles.weightInput}
                  keyboardType="numeric"
                  value={asset.weight === 0 ? '' : (asset.weight * 100).toString()}
                  onChangeText={(val) => updateWeight(asset.ticker, val)}
                  placeholder="0"
                  placeholderTextColor={theme.colors.textTertiary}
                />
                <TouchableOpacity onPress={() => removeAsset(asset.ticker)} style={styles.removeBtn}>
                  <Typography variant="caption" style={{color: theme.colors.error}}>Rem</Typography>
                </TouchableOpacity>
              </View>
            ))}

            <View style={[styles.weightFooter, !isValidWeight && { borderColor: theme.colors.error }]}>
              <Typography variant="caption">TOTAL ALLOCATION</Typography>
              <Typography 
                variant="button" 
                style={{ color: isValidWeight ? theme.colors.success : theme.colors.error }}
              >
                {(currentTotalWeight * 100).toFixed(1)}% / 100%
              </Typography>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.saveButton, (!name || selectedAssets.length === 0) && { opacity: 0.5 }]} 
          onPress={handleSave}
          disabled={isSaving}
        >
          <Typography variant="button" style={styles.saveBtnText}>CONSTRUCT & SAVE PORTFOLIO</Typography>
        </TouchableOpacity>

      </ScrollView>

      <LoadingOverlay visible={isSearching || isSaving} message={isSaving ? "Constructing..." : "Fetching Market Data..."} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    marginBottom: 8,
  },
  title: {
    color: '#FFF',
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
  },
  label: {
    color: theme.colors.textSecondary,
    marginBottom: 8,
    fontFamily: theme.typography.fonts.mono,
  },
  input: {
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.md,
    padding: theme.spacing.md,
    color: theme.colors.textPrimary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  searchInput: {
    flex: 1,
    marginRight: theme.spacing.sm,
    fontFamily: theme.typography.fonts.mono,
  },
  searchBtn: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
  },
  searchResults: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.roundness.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
    marginTop: -theme.spacing.sm, // pull up closer to search bar
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  assetsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  assetHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 8,
    marginBottom: 8,
  },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  assetInfo: {
    flex: 2,
  },
  assetTicker: {
    fontFamily: theme.typography.fonts.mono,
    color: theme.colors.primary,
  },
  assetHint: {
    fontSize: 9,
    color: theme.colors.textTertiary,
  },
  weightInput: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.sm,
    padding: 8,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fonts.mono,
    textAlign: 'center',
  },
  removeBtn: {
    width: 40,
    alignItems: 'flex-end',
  },
  weightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.roundness.md,
    alignItems: 'center',
    marginBottom: 40,
  },
  saveBtnText: {
    color: theme.colors.background,
    fontFamily: theme.typography.fonts.mono,
  },
});
