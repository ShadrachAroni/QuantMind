import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { theme } from '../../constants/theme';
import { usePortfolioStore } from '../../store/portfolioStore';
import { Plus, ChevronRight } from 'lucide-react-native';

export function PortfolioListScreen({ navigation }: any) {
  const { portfolios, fetchPortfolios, isLoading } = usePortfolioStore();

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const totalValue = portfolios.reduce((sum, p) => sum + (p.total_value || 0), 0);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('PortfolioDetail', { id: item.id })}
    >
      <View style={styles.cardHeader}>
        <Typography variant="body" style={styles.cardTitle}>{item.name}</Typography>
        {(ChevronRight as any)({ size: 18, color: theme.colors.textTertiary })}
      </View>
      <View style={styles.cardStats}>
        <View style={styles.statBox}>
          <Typography variant="caption" style={styles.statLabel}>VALUE</Typography>
          <Typography variant="body" style={styles.statValue}>
            ${(item.total_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
        </View>
        <View style={styles.statBox}>
          <Typography variant="caption" style={styles.statLabel}>ASSETS</Typography>
          <Typography variant="body" style={styles.statValue}>{item.assets?.length || 0}</Typography>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Typography variant="h2" style={styles.title}>Vault</Typography>
          <Typography variant="caption" style={styles.subtitle}>
            Total Holdings: ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Typography>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('PortfolioBuilder')}
        >
          {(Plus as any)({ size: 20, color: theme.colors.background })}
          <Typography variant="button" style={styles.addButtonText}>NEW</Typography>
        </TouchableOpacity>
      </View>

      <FlatList
        data={portfolios}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchPortfolios} tintColor={theme.colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Typography variant="body" style={styles.emptyText}>No portfolios found.</Typography>
            <Typography variant="caption" style={styles.emptySubtext}>Create a new portfolio to begin risk analysis.</Typography>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    color: theme.colors.textPrimary,
  },
  subtitle: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fonts.mono,
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.roundness.md,
  },
  addButtonText: {
    color: theme.colors.background,
    marginLeft: 4,
  },
  list: {
    padding: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.roundness.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontFamily: theme.typography.fonts.mono,
    fontWeight: '600',
  },
  cardStats: {
    flexDirection: 'row',
    gap: theme.spacing.xl,
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    color: theme.colors.textTertiary,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: theme.typography.fonts.mono,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl,
    marginTop: 100,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
});
