import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, KeyboardAvoidingView, Dimensions } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { usePortfolioStore } from '../../store/portfolioStore';
import { api } from '../../services/api';
import { Search, Plus, X, ChevronLeft, Cpu, Activity, Zap, Layers, Target, Sparkles } from 'lucide-react-native';
import { Asset } from '@quantmind/shared-types';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { sharedTheme } from '../../constants/theme';
import { STRINGS } from '../../constants/strings';

const { width } = Dimensions.get('window');

// Custom Weight Slider Component - Enhanced for FX1
const WeightSlider = ({ value, onChange, color }: { value: number, onChange: (val: number) => void, color: string }) => {
  const { theme } = useTheme();
  const handlePress = (event: any) => {
    const { locationX } = event.nativeEvent;
    const sliderWidth = width - 80 - 48; // Adjusted for padding
    const percentage = Math.max(0, Math.min(100, (locationX / sliderWidth) * 100));
    onChange(Math.round(percentage));
  };

  return (
    <View style={styles.sliderContainer}>
      <TouchableOpacity 
        style={styles.sliderTrack} 
        activeOpacity={1} 
        onPress={handlePress}
      >
        <View style={[styles.sliderFill, { width: `${value}%`, backgroundColor: color }]} />
        <View style={[styles.sliderHandle, { left: `${value}%`, borderColor: color, backgroundColor: theme.background }]} />
      </TouchableOpacity>
      <View style={styles.sliderValueBox}>
        <Typography variant="monoBold" style={[styles.sliderValue, { color }]}>{value}%</Typography>
      </View>
    </View>
  );
};

export function PortfolioBuilderScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  
  // Manual Entry States
  const [mTicker, setMTicker] = useState('');
  const [mName, setMName] = useState('');
  const [mReturn, setMReturn] = useState('8.0');
  const [mVol, setMVol] = useState('15.0');
  const [mDiv, setMDiv] = useState('0.0');
  const [mClass, setMClass] = useState<string>('stocks');
  
  const { createPortfolio } = usePortfolioStore();
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();
  
  const SearchIcon = Search as any;
  const PlusIcon = Plus as any;
  const XIcon = X as any;
  const BackIcon = ChevronLeft as any;
  const CpuIcon = Cpu as any;
  const ActivityIcon = Activity as any;
  const ZapIcon = Zap as any;
  const LayersIcon = Layers as any;
  const TargetIcon = Target as any;
  const SparklesIcon = Sparkles as any;

  const dynamicStyles = getStyles(theme, isDark);

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const results = await api.searchAssets(searchQuery);
      setSearchResults(results);
    } catch (e: any) {
      showToast(e.message.toUpperCase(), 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const addAsset = async (assetData: any) => {
    if (selectedAssets.find(a => a.ticker === assetData.ticker)) {
      setSearchResults([]);
      setSearchQuery('');
      return;
    }

    setIsSearching(true);
    try {
      const features = await api.getAssetHistory(assetData.ticker);
      
      const newAsset: Asset = {
        ticker: assetData.ticker,
        name: assetData.name || assetData.ticker,
        weight: 0,
        expected_return: features.expectedReturn || 0.08,
        volatility: features.volatility || 0.15,
        dividend_yield: 0,
        asset_class: assetData.asset_class || 'stocks',
      };
      
      setSelectedAssets([...selectedAssets, newAsset]);
      setSearchResults([]);
      setSearchQuery('');
    } catch (e: any) {
      showToast(e.message.toUpperCase(), 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const analyzePortfolio = async () => {
    if (selectedAssets.length === 0) return;
    setIsSearching(true);
    try {
      // Create a context summary for the AI
      const ctx = {
        assets: selectedAssets.map(a => ({
          ticker: a.ticker,
          weight: a.weight,
          ret: a.expected_return,
          vol: a.volatility,
          class: a.asset_class,
        }))
      };
      
      const response = await api.aiChat(
        "Analyze my current portfolio selection and provide 3 brief strategic insights. Focus on diversification and risk-adjusted return potential.",
        { assets_context: ctx },
        'portfolio_doctor'
      );
      
      // Navigate to AI Chat with the response or show it as an alert
      // For responsiveness, we'll navigate to the chat screen with this context
      navigation.navigate('AI', { 
        screen: 'AIChat', 
        params: { 
          initialMessage: "Analyze my current portfolio selection",
          context: { assets_context: ctx },
          workflow: 'portfolio_doctor'
        } 
      });
    } catch (e: any) {
      showToast('AI_BRIDGE_FAILURE: System overloaded.', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const addManualAsset = () => {
    if (!mTicker) {
      showToast('ERROR: Ticker required.', 'error');
      return;
    }
    
    if (selectedAssets.find(a => a.ticker === mTicker.toUpperCase())) {
      showToast('ERROR: Asset already exists.', 'error');
      return;
    }

    const newAsset: Asset = {
      ticker: mTicker.toUpperCase(),
      name: mName || mTicker.toUpperCase(),
      weight: 0,
      expected_return: (parseFloat(mReturn) + parseFloat(mDiv)) / 100, // Total return include div
      volatility: parseFloat(mVol) / 100,
      asset_class: mClass as any,
    };

    setSelectedAssets([...selectedAssets, newAsset]);
    setMTicker('');
    setMName('');
    setMReturn('8.0');
    setMVol('15.0');
    setMDiv('0.0');
    setIsManualMode(false);
  };

  const removeAsset = (ticker: string) => {
    setSelectedAssets(selectedAssets.filter(a => a.ticker !== ticker));
  };

  const updateWeight = (ticker: string, weightPercent: number) => {
    const weight = weightPercent / 100;
    setSelectedAssets(selectedAssets.map(a => 
      a.ticker === ticker ? { ...a, weight } : a
    ));
  };

  const updateParameter = (ticker: string, field: 'expected_return' | 'volatility' | 'dividend_yield', value: string) => {
    const numValue = parseFloat(value) / 100;
    if (isNaN(numValue)) return;
    
    setSelectedAssets(selectedAssets.map(a => 
      a.ticker === ticker ? { ...a, [field]: numValue } : a
    ));
  };

  const handleSave = async () => {
    if (!name) {
      showToast('ERROR: Portfolio name required.', 'error');
      return;
    }
    
    if (selectedAssets.length === 0) {
      showToast('ERROR: Add assets first.', 'error');
      return;
    }

    const totalWeight = selectedAssets.reduce((sum, a) => sum + a.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      showToast('INVALID_WEIGHTS: Total must equal 100%.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const newPort = await createPortfolio(name, description, selectedAssets);
      showToast('STRATEGY_DEPOLYED: Initialized.', 'success');
      navigation.navigate('PortfolioDetail', { id: newPort.id });
    } catch (e: any) {
      showToast(e.message.toUpperCase() || 'FAILED_TO_CONSTRUCT', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const currentTotalWeight = selectedAssets.reduce((sum, a) => sum + a.weight, 0);
  const isValidWeight = Math.abs(currentTotalWeight - 1.0) < 0.001;

  return (
    <KeyboardAvoidingView style={[dynamicStyles.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={dynamicStyles.scroll} showsVerticalScrollIndicator={false}>
        <View style={dynamicStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[dynamicStyles.backBtn, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)' }]}>
            <BackIcon size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <View>
            <Typography variant="mono" style={[dynamicStyles.subHeader, { color: theme.textTertiary }]}>{STRINGS.STRAT}_BUILDER_V4</Typography>
            <Typography variant="h2" style={[dynamicStyles.title, { color: theme.textPrimary }]}>{STRINGS.MODEL_BUILDER}</Typography>
          </View>
        </View>

        <GlassCard intensity="high" style={dynamicStyles.setupCard}>
          <View style={dynamicStyles.inputRow}>
            <View style={dynamicStyles.inputField}>
              <View style={dynamicStyles.labelRow}>
                <Typography variant="mono" style={[dynamicStyles.label, { color: theme.textTertiary }]}>{STRINGS.IDENTIFIER}</Typography>
                <GlowEffect color={name ? theme.primary : theme.textTertiary} size={4} glowRadius={4} />
              </View>
              <TextInput
                style={[dynamicStyles.textInput, { borderColor: theme.border, color: theme.textPrimary }]}
                placeholder={STRINGS.STRATEGY_UID}
                placeholderTextColor={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}
                value={name}
                onChangeText={(t) => setName(t.toUpperCase())}
              />
            </View>
          </View>

          <View style={[dynamicStyles.inputField, { marginTop: 20 }]}>
            <Typography variant="mono" style={[dynamicStyles.label, { color: theme.textTertiary }]}>PARAMETERS / CONSTRAINTS</Typography>
            <TextInput
              style={[dynamicStyles.textInput, dynamicStyles.textArea, { borderColor: theme.border, color: theme.textPrimary }]}
              placeholder="Thesis objectives and risk limits..."
              placeholderTextColor={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
            />
          </View>
        </GlassCard>

        {/* Search Section */}
        <View style={dynamicStyles.sectionHeader}>
           <LayersIcon size={14} color={theme.textTertiary} />
           <Typography variant="h3" style={[dynamicStyles.sectionTitle, { color: theme.textSecondary }]}>{STRINGS.ASSET_PROVISIONING}</Typography>
           <TouchableOpacity 
             onPress={() => setIsManualMode(!isManualMode)} 
             style={[dynamicStyles.modeToggle, { backgroundColor: isManualMode ? theme.primary + '20' : 'rgba(255,255,255,0.05)' }]}
           >
             <Typography variant="mono" style={{ fontSize: 9, color: isManualMode ? theme.primary : theme.textTertiary }}>
               {isManualMode ? 'SEARCH_ENGINE' : 'MANUAL_ENTRY'}
             </Typography>
           </TouchableOpacity>
        </View>
        
        {!isManualMode ? (
          <View style={[dynamicStyles.searchBar, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)' }]}>
            <SearchIcon size={18} color={theme.textTertiary} style={dynamicStyles.searchIcon} />
            <TextInput
              style={[dynamicStyles.searchInput, { color: theme.textPrimary }]}
              placeholder={STRINGS.ASSET_DISCOVERY}
              placeholderTextColor={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="characters"
              onSubmitEditing={handleSearch}
            />
            {isSearching && <GlowEffect color={theme.primary} size={4} glowRadius={8} />}
          </View>
        ) : (
          <GlassCard style={dynamicStyles.manualForm}>
            <View style={dynamicStyles.manualRow}>
              <View style={[dynamicStyles.inputField, { flex: 1.5 }]}>
                <Typography variant="mono" style={dynamicStyles.manualLabel}>TICKER</Typography>
                <TextInput
                  style={[dynamicStyles.manualInput, { color: theme.textPrimary, borderColor: theme.border }]}
                  value={mTicker}
                  onChangeText={(t) => setMTicker(t.toUpperCase())}
                  placeholder="AAPL"
                  placeholderTextColor="rgba(255,255,255,0.1)"
                />
              </View>
              <View style={[dynamicStyles.inputField, { flex: 2, marginLeft: 12 }]}>
                <Typography variant="mono" style={dynamicStyles.manualLabel}>NAME</Typography>
                <TextInput
                  style={[dynamicStyles.manualInput, { color: theme.textPrimary, borderColor: theme.border }]}
                  value={mName}
                  onChangeText={setMName}
                  placeholder="APPLE INC"
                  placeholderTextColor="rgba(255,255,255,0.1)"
                />
              </View>
              <View style={[dynamicStyles.inputField, { flex: 1.5, marginLeft: 12 }]}>
                <Typography variant="mono" style={dynamicStyles.manualLabel}>CLASS</Typography>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dynamicStyles.classScroll}>
                  {['stocks', 'crypto', 'bonds', 'cash'].map(c => (
                    <TouchableOpacity key={c} onPress={() => setMClass(c)} style={[dynamicStyles.classChip, mClass === c && { backgroundColor: theme.primary + '33', borderColor: theme.primary }]}>
                      <Typography variant="mono" style={{ fontSize: 8, color: mClass === c ? theme.primary : theme.textTertiary }}>{c.toUpperCase()}</Typography>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={[dynamicStyles.manualRow, { marginTop: 16 }]}>
              <View style={dynamicStyles.inputField}>
                <Typography variant="mono" style={dynamicStyles.manualLabel}>RETURN (%)</Typography>
                <TextInput
                  style={[dynamicStyles.manualInput, { color: theme.primary, borderColor: theme.border }]}
                  value={mReturn}
                  onChangeText={setMReturn}
                  keyboardType="numeric"
                />
              </View>
              <View style={[dynamicStyles.inputField, { marginLeft: 12 }]}>
                <Typography variant="mono" style={dynamicStyles.manualLabel}>VOL (%)</Typography>
                <TextInput
                  style={[dynamicStyles.manualInput, { color: theme.primary, borderColor: theme.border }]}
                  value={mVol}
                  onChangeText={setMVol}
                  keyboardType="numeric"
                />
              </View>
              <View style={[dynamicStyles.inputField, { marginLeft: 12 }]}>
                <Typography variant="mono" style={dynamicStyles.manualLabel}>DIV_YIELD (%)</Typography>
                <TextInput
                  style={[dynamicStyles.manualInput, { color: theme.secondary, borderColor: theme.border }]}
                  value={mDiv}
                  onChangeText={setMDiv}
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity 
                style={[dynamicStyles.addManualBtn, { backgroundColor: theme.primary }]} 
                onPress={addManualAsset}
              >
                <PlusIcon size={20} color={theme.background} />
              </TouchableOpacity>
            </View>
          </GlassCard>
        )}

        {searchResults.length > 0 && (
          <GlassCard style={dynamicStyles.searchResults}>
            {searchResults.map((res: any, idx) => (
              <TouchableOpacity key={`${res.ticker}-${idx}`} style={[dynamicStyles.resultItem, { borderBottomColor: theme.border }]} onPress={() => addAsset(res)}>
                <View style={dynamicStyles.resultInfo}>
                  <View style={[dynamicStyles.resultTickerBox, { backgroundColor: theme.primary + '10' }]}>
                    <Typography variant="monoBold" style={[dynamicStyles.resultTicker, { color: theme.primary }]}>{res.ticker}</Typography>
                  </View>
                  <Typography variant="caption" numberOfLines={1} style={[dynamicStyles.resultName, { color: theme.textTertiary }]}>{res.name.toUpperCase()}</Typography>
                </View>
                <PlusIcon size={18} color={theme.primary} />
              </TouchableOpacity>
            ))}
          </GlassCard>
        )}

        {/* Selected Assets List */}
        {selectedAssets.length > 0 && (
          <View style={dynamicStyles.assetsList}>
             <View style={dynamicStyles.sectionHeader}>
                <TargetIcon size={14} color={theme.textTertiary} />
                <Typography variant="h3" style={[dynamicStyles.sectionTitle, { color: theme.textSecondary }]}>{STRINGS.WEIGHT_CALIBRATION}</Typography>
                
                <TouchableOpacity 
                  onPress={analyzePortfolio}
                  style={[dynamicStyles.aiDoctorBtn, { backgroundColor: theme.secondary + '10', borderColor: theme.secondary + '33' }]}
                >
                  <SparklesIcon size={12} color={theme.secondary} />
                  <Typography variant="monoBold" style={{ color: theme.secondary, fontSize: 9, marginLeft: 6 }}>AI_DOCTOR</Typography>
                </TouchableOpacity>
             </View>
            
            {selectedAssets.map((asset) => (
              <GlassCard key={asset.ticker} style={dynamicStyles.assetCard}>
                <View style={dynamicStyles.assetHeader}>
                   <View style={dynamicStyles.assetMeta}>
                     <View style={[dynamicStyles.assetTickerBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                       <Typography variant="monoBold" style={[dynamicStyles.assetTicker, { color: theme.textPrimary }]}>{asset.ticker}</Typography>
                     </View>
                     {asset.asset_class && (
                       <View style={[dynamicStyles.classBadge, { backgroundColor: theme.primary + '10' }]}>
                         <Typography variant="mono" style={[dynamicStyles.classBadgeText, { color: theme.primary }]}>{asset.asset_class.toUpperCase()}</Typography>
                       </View>
                     )}
                     <View style={dynamicStyles.paramEditRow}>
                       <View style={dynamicStyles.paramBox}>
                         <Typography variant="mono" style={dynamicStyles.paramLabel}>RET:</Typography>
                         <TextInput 
                           style={[dynamicStyles.paramInput, { color: theme.primary, width: 35 }]}
                           value={((asset.expected_return || 0) * 100).toFixed(1)}
                           keyboardType="numeric"
                           onChangeText={(val) => updateParameter(asset.ticker, 'expected_return', val)}
                         />
                         <Typography variant="mono" style={dynamicStyles.percent}>%</Typography>
                       </View>
                       <View style={[dynamicStyles.paramBox, { marginLeft: 6 }]}>
                         <Typography variant="mono" style={dynamicStyles.paramLabel}>VOL:</Typography>
                         <TextInput 
                           style={[dynamicStyles.paramInput, { color: theme.primary, width: 35 }]}
                           value={((asset.volatility || 0) * 100).toFixed(1)}
                           keyboardType="numeric"
                           onChangeText={(val) => updateParameter(asset.ticker, 'volatility', val)}
                         />
                         <Typography variant="mono" style={dynamicStyles.percent}>%</Typography>
                       </View>
                       <View style={[dynamicStyles.paramBox, { marginLeft: 6 }]}>
                         <Typography variant="mono" style={dynamicStyles.paramLabel}>DIV:</Typography>
                         <TextInput 
                           style={[dynamicStyles.paramInput, { color: theme.secondary, width: 35 }]}
                           value={((asset.dividend_yield || 0) * 100).toFixed(1)}
                           keyboardType="numeric"
                           onChangeText={(val) => updateParameter(asset.ticker, 'dividend_yield', val)}
                         />
                         <Typography variant="mono" style={dynamicStyles.percent}>%</Typography>
                       </View>
                     </View>
                   </View>
                   <TouchableOpacity onPress={() => removeAsset(asset.ticker)} style={[dynamicStyles.removeBtn, { backgroundColor: theme.error + '05' }]}>
                     <XIcon size={14} color={theme.error} />
                   </TouchableOpacity>
                </View>

                <WeightSlider 
                  value={Math.round(asset.weight * 100)} 
                  onChange={(val) => updateWeight(asset.ticker, val)} 
                  color={theme.primary}
                />
              </GlassCard>
            ))}

            <GlassCard intensity="low" style={[dynamicStyles.allocationFooter, !isValidWeight && { borderColor: theme.error + '33' }]}>
              <View style={dynamicStyles.footerRow}>
                <View>
                  <Typography variant="mono" style={[dynamicStyles.totalLabel, { color: theme.textTertiary }]}>TOTAL_EXPOSURE</Typography>
                  <View style={dynamicStyles.totalValueContainer}>
                    <Typography 
                      variant="h2" 
                      style={[dynamicStyles.totalValue, { color: isValidWeight ? theme.primary : theme.error }]}
                    >
                      {(currentTotalWeight * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="mono" style={[dynamicStyles.totalTarget, { color: theme.textTertiary }]}>/ 100.0% </Typography>
                  </View>
                </View>
                {isValidWeight ? (
                  <View style={[dynamicStyles.validTag, { backgroundColor: theme.primary + '10' }]}>
                    <ZapIcon size={12} color={theme.primary} />
                    <Typography variant="mono" style={[dynamicStyles.validText, { color: theme.primary }]}>{STRINGS.READY}</Typography>
                  </View>
                ) : (
                  <View style={[dynamicStyles.invalidTag, { backgroundColor: theme.error + '10' }]}>
                    <ActivityIcon size={12} color={theme.error} />
                    <Typography variant="mono" style={[dynamicStyles.invalidText, { color: theme.error }]}>{STRINGS.PENDING}</Typography>
                  </View>
                )}
              </View>
            </GlassCard>
          </View>
        )}

        <TouchableOpacity 
          style={[dynamicStyles.saveButton, { backgroundColor: theme.primary }, (!name || selectedAssets.length === 0 || !isValidWeight) && dynamicStyles.disabledButton]} 
          onPress={handleSave}
          disabled={isSaving || !isValidWeight}
        >
          {isValidWeight && <GlowEffect color={theme.primary} size={width} glowRadius={30} type="steady" style={dynamicStyles.saveGlow} />}
          <Typography variant="monoBold" style={[dynamicStyles.saveBtnText, { color: theme.background }]}>{STRINGS.INITIALIZE_STRATEGY}</Typography>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <LoadingOverlay visible={isSearching || isSaving} message={isSaving ? "OPTIMIZING..." : "FETCHING_DATA..."} />
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: sharedTheme.spacing.xl,
    paddingTop: 64,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  subHeader: {
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    letterSpacing: 1,
  },
  setupCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 32,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputField: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    letterSpacing: 1,
    fontSize: 9,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontFamily: sharedTheme.typography.fonts.mono,
    fontSize: 13,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 2,
    flex: 1,
  },
  modeToggle: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  manualForm: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
  },
  manualRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  manualLabel: {
    fontSize: 8,
    color: theme.textTertiary,
    marginBottom: 4,
  },
  classScroll: {
    maxHeight: 40,
  },
  classChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginRight: 6,
    justifyContent: 'center',
  },
  manualInput: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    fontFamily: sharedTheme.typography.fonts.mono,
    fontSize: 12,
  },
  addManualBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  paramEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  paramBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  paramLabel: {
    fontSize: 10,
    color: theme.textTertiary,
    marginRight: 4,
  },
  paramInput: {
    fontSize: 11,
    fontFamily: sharedTheme.typography.fonts.mono,
    width: 40,
    padding: 0,
    textAlign: 'right',
  },
  percent: {
    fontSize: 9,
    color: theme.textTertiary,
    marginLeft: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: sharedTheme.typography.fonts.mono,
    fontSize: 12,
  },
  searchResults: {
    marginTop: -16,
    marginBottom: 24,
    padding: 0,
    overflow: 'hidden',
    borderRadius: 16,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  resultTickerBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  resultTicker: {
    fontSize: 12,
  },
  resultName: {
    fontSize: 10,
    flex: 1,
  },
  assetsList: {
    marginBottom: 32,
  },
  assetCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  assetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  assetTickerBox: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  assetTicker: {
    fontSize: 13,
  },
  classBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  classBadgeText: {
    fontSize: 8,
    letterSpacing: 0.5,
  },
  assetReturn: {
    fontSize: 10,
  },
  removeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  sliderValue: {
    fontSize: 12,
  },
  allocationFooter: {
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  totalValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  totalValue: {
    fontSize: 24,
  },
  totalTarget: {
    fontSize: 11,
  },
  validTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  validText: {
    fontSize: 10,
  },
  invalidTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  invalidText: {
    fontSize: 10,
  },
  saveButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 40,
  },
  saveGlow: {
    position: 'absolute',
    opacity: 0.2,
  },
  saveBtnText: {
    fontSize: 14,
    letterSpacing: 2,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    opacity: 0.5,
  },
  aiDoctorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
});

const styles = StyleSheet.create({
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 2,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 2,
  },
  sliderHandle: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginLeft: -8,
  },
  sliderValueBox: {
    width: 45,
    alignItems: 'flex-end',
  },
  sliderValue: {
    fontSize: 12,
  },
});
