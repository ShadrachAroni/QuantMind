'use client';

import React, { useEffect, useState } from 'react';
import { 
  Database, 
  ArrowUpRight, 
  TrendingUp, 
  Search, 
  Filter,
  Activity,
  DollarSign
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { GlassCard } from '@/components/ui/GlassCard';
import { MarketStatus } from '@/components/dashboard/MarketStatus';
import { cn, formatCurrency } from '@/lib/utils';
import { 
  BarChart3, 
  PieChart, 
  Settings2, 
  Zap, 
  Lock,
  ChevronDown
} from 'lucide-react';

interface AssetHolding {
  symbol: string;
  name: string;
  category: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  total_value: number;
  last_updated?: string;
  vaults: string[];
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<AssetHolding[]>([]);
  const [totalAum, setTotalAum] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [userTier, setUserTier] = useState<string>('free');
  const [showProAnalytics, setShowProAnalytics] = useState(false);

  const supabase = createClient();

  const fetchData = async () => {
    setIsLoading(true);
    const { data: portfolios } = await supabase.from('portfolios').select('name, assets');
    const { data: prices } = await supabase
      .from('prices')
      .select('symbol, price, timestamp, updated_at')
      .order('timestamp', { ascending: false });
    const { data: assetMetadata } = await supabase.from('assets').select('ticker, name, category');

    if (portfolios) {
      const holdingsMap: Record<string, { quantity: number; avg_price_sum: number; count: number; vaults: string[] }> = {};
      
      portfolios.forEach(p => {
        const pAssets = p.assets as any[];
        if (Array.isArray(pAssets)) {
          pAssets.forEach(a => {
            if (!holdingsMap[a.symbol]) {
              holdingsMap[a.symbol] = { quantity: 0, avg_price_sum: 0, count: 0, vaults: [] };
            }
            holdingsMap[a.symbol].quantity += Number(a.quantity || 0);
            holdingsMap[a.symbol].avg_price_sum += Number(a.avg_price || 0);
            holdingsMap[a.symbol].count += 1;
            if (!holdingsMap[a.symbol].vaults.includes(p.name)) {
              holdingsMap[a.symbol].vaults.push(p.name);
            }
          });
        }
      });

      const priceMap: Record<string, { price: number; updated_at: string }> = {};
      if (prices) {
        prices.forEach(p => {
          if (!priceMap[p.symbol]) {
            priceMap[p.symbol] = { price: Number(p.price), updated_at: p.updated_at };
          }
        });
      }

      const metaMap: Record<string, { name: string; category: string }> = {};
      if (assetMetadata) {
        assetMetadata.forEach(m => {
          metaMap[m.ticker] = { name: m.name, category: m.category };
        });
      }

      const aggregatedAssets: AssetHolding[] = Object.keys(holdingsMap).map(symbol => {
        const priceData = priceMap[symbol] || { price: 0, updated_at: new Date().toISOString() };
        const meta = metaMap[symbol] || { name: symbol, category: 'UNCLASSIFIED' };
        const totalQty = holdingsMap[symbol].quantity;
        return {
          symbol,
          name: meta.name,
          category: meta.category,
          quantity: totalQty,
          avg_price: holdingsMap[symbol].avg_price_sum / holdingsMap[symbol].count,
          current_price: priceData.price,
          total_value: totalQty * priceData.price,
          last_updated: priceData.updated_at,
          vaults: holdingsMap[symbol].vaults
        };
      });

      const ordered = aggregatedAssets.sort((a, b) => b.total_value - a.total_value);
      setAssets(ordered);
      setTotalAum(ordered.reduce((acc, a) => acc + a.total_value, 0));
      setLastSyncTime(new Date());
    }
    // Fetch User Tier
    const { data: profile } = await supabase.from('user_profiles').select('tier').single();
    if (profile) setUserTier(profile.tier);

    setIsLoading(false);
  };

  useEffect(() => {
    setIsMounted(true);
    fetchData();

    const channel = supabase
      .channel('assets-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prices' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolios' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const filtered = assets.filter(a => {
    const matchesSearch = a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         a.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || a.category.toUpperCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['ALL', 'CRYPTO', 'EQUITY', 'FOREX'];

  return (
    <div className="p-8 space-y-8 min-h-full bg-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight uppercase font-mono flex items-center gap-3">
            <Database className="text-[#00D9FF]" size={28} />
             Station_Assets
          </h1>
          <p className="text-[#848D97] text-sm mt-1 uppercase tracking-widest font-mono">Institutional holdings aggregate across all vaults.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-[#12121A] border border-white/5 rounded-2xl p-4">
          <div className="text-right">
             <span className="block text-[10px] text-[#848D97] uppercase tracking-[0.2em] mb-1">Total_AUM</span>
             <span className="text-2xl font-mono font-bold text-white">
                <span className="text-[#00D9FF] mr-2">$</span>
                {totalAum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
             </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#00D9FF]/10 flex items-center justify-center text-[#00D9FF]">
             <DollarSign size={20} />
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <GlassCard className="p-6" intensity="low">
            <div className="flex items-center justify-between mb-4">
               <span className="text-[10px] text-[#848D97] uppercase tracking-widest">Active Instruments</span>
               <Activity size={14} className="text-[#00D9FF]" />
            </div>
            <p className="text-2xl font-mono font-bold text-white uppercase">{assets.length} Assets</p>
         </GlassCard>
         <GlassCard className="p-6" intensity="low">
            <div className="flex items-center justify-between mb-4">
               <span className="text-[10px] text-[#848D97] uppercase tracking-widest">Global Status</span>
               <Activity size={14} className="text-[#00D9FF]" />
            </div>
            <div className="flex items-center">
               <MarketStatus />
            </div>
         </GlassCard>
         <GlassCard className="p-6" intensity="low">
            <div className="flex items-center justify-between mb-4">
               <span className="text-[10px] text-[#848D97] uppercase tracking-widest">Last Synced</span>
               <TrendingUp size={14} className="text-[#00D9FF]" />
            </div>
            <p className="text-2xl font-mono font-bold text-white uppercase">
               {isMounted && lastSyncTime ? lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
            </p>
         </GlassCard>
      </div>

      {/* Main Registry */}
      <div className="space-y-4">
         <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-md group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848D97] group-focus-within:text-[#00D9FF] transition-colors" size={16} />
               <input
                 type="text"
                 placeholder="Search aggregate holdings..."
                 className="w-full bg-[#12121A] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#00D9FF]/30 transition-all font-mono placeholder:text-white/10"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
            
            <div className="flex items-center gap-2 p-1 bg-[#12121A] border border-white/5 rounded-xl">
               {categories.map(cat => (
                 <button
                   key={cat}
                   onClick={() => setSelectedCategory(cat)}
                   className={cn(
                     "px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all font-mono",
                     selectedCategory === cat 
                       ? "bg-[#00D9FF] text-black" 
                       : "text-[#848D97] hover:text-white"
                   )}
                 >
                   {cat}
                 </button>
               ))}
            </div>
         </div>

         <div className="overflow-x-auto rounded-3xl border border-white/5 bg-white/[0.01]">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                     <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97]">Instrument</th>
                     <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97]">Total_Quantity</th>
                     <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97]">Avg_Cost</th>
                     <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97]">Market_Price</th>
                     <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] text-right">Aggregate_Value</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5 font-mono">
                  {isLoading ? (
                    <tr><td colSpan={5} className="p-12 text-center text-white/20 animate-pulse">Syncing institutional ledger...</td></tr>
                  ) : filtered.length > 0 ? filtered.map((asset) => (
                     <tr key={asset.symbol} className="hover:bg-white/[0.02] group transition-colors">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#00D9FF] font-bold border border-white/5">
                                 {asset.symbol.substring(0, 2)}
                              </div>
                              <div>
                                 <span className="block text-sm font-bold text-white mb-0.5">{asset.symbol}</span>
                                 <span className="block text-[10px] text-[#848D97] uppercase tracking-wider">{asset.name}</span>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col">
                              <span className="text-sm text-white font-medium">{asset.quantity.toLocaleString()}</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                 {asset.vaults.slice(0, 2).map((v, i) => (
                                   <span key={i} className="text-[7px] bg-white/10 text-white/50 px-1 rounded uppercase border border-white/5">{v}</span>
                                 ))}
                                 {asset.vaults.length > 2 && <span className="text-[7px] text-white/30">+{asset.vaults.length - 2}</span>}
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#848D97]">
                           ${asset.avg_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                              <span className="text-sm text-white">${asset.current_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              <ArrowUpRight size={12} className="text-[#32D74B]" />
                           </div>
                           <span className="block text-[8px] text-[#848D97] uppercase mt-1">Updated_{asset.last_updated ? new Date(asset.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-4">
                              <div className="text-right">
                                 <span className="block text-sm font-bold text-white">${asset.total_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                 <span className="block text-[10px] text-[#32D74B]">+{((asset.current_price - asset.avg_price) / asset.avg_price * 100).toFixed(2)}%</span>
                              </div>
                               <button 
                                 onClick={() => window.location.href = `/dashboard/oracle?prompt=${encodeURIComponent(`Provide a comprehensive institutional-grade risk analysis for my ${asset.symbol} (${asset.name}) holdings. Factors to consider: current aggregate value of ${formatCurrency(asset.total_value)}, market concentration, and potential regime shifts affecting ${asset.category} assets.`)}`}
                                 className="w-8 h-8 rounded-lg bg-[#00D9FF]/10 text-[#00D9FF] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-[#00D9FF] hover:text-black"
                                 title="Analyze in Oracle"
                               >
                                  <TrendingUp size={14} />
                               </button>
                           </div>
                        </td>
                     </tr>
                  )) : (
                     <tr><td colSpan={5} className="p-12 text-center text-[#848D97] uppercase tracking-widest text-xs">No holdings detected in active vaults</td></tr>
                  )}
               </tbody>
            </table>
         </div>

         {/* PRO Features Section */}
         <div className="mt-12 space-y-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white uppercase font-mono tracking-tight">Institutional_Analytics</h2>
                  <div className="px-2 py-0.5 rounded bg-[#00D9FF]/20 border border-[#00D9FF]/30 text-[#00D9FF] text-[8px] font-bold tracking-widest uppercase">PRO_NODES</div>
               </div>
               {userTier !== 'pro' && (
                  <button 
                    onClick={() => window.location.href = '/dashboard/settings'}
                    className="flex items-center gap-2 text-[#848D97] hover:text-white transition-all text-[10px] uppercase font-bold tracking-widest"
                  >
                    <Lock size={12} /> Upgrade_for_Full_Access
                  </button>
               )}
            </div>

            <div className={cn(
               "grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all",
               userTier !== 'pro' ? "opacity-40 grayscale pointer-events-none blur-[2px]" : ""
            )}>
               <GlassCard className="p-6 relative overflow-hidden" intensity="low">
                  <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-2 text-[#00D9FF]">
                        <BarChart3 size={16} />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Risk Attribution</span>
                     </div>
                     <Settings2 size={14} className="text-[#848D97]" />
                  </div>
                  <div className="space-y-4">
                     <div className="flex justify-between items-end">
                        <span className="text-[10px] text-[#848D97] uppercase">Aggregate Beta</span>
                        <span className="text-xl font-mono font-bold text-white">0.94</span>
                     </div>
                     <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#00D9FF] h-full w-[94%]" />
                     </div>
                     <p className="text-[9px] text-white/40 uppercase leading-relaxed">Systematic exposure is within neutral bounds for current market volatility.</p>
                  </div>
                  {userTier !== 'pro' && <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10"><Lock size={24} className="text-[#00D9FF]" /></div>}
               </GlassCard>

               <GlassCard className="p-6 relative overflow-hidden" intensity="low">
                  <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-2 text-[#FFD60A]">
                        <PieChart size={16} />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Diversification Score</span>
                     </div>
                  </div>
                  <div className="flex flex-col items-center justify-center h-24">
                     <div className="text-3xl font-mono font-bold text-white">8/10</div>
                     <span className="text-[8px] text-[#32D74B] uppercase mt-1">OPTIMIZED_CORRELATION</span>
                  </div>
                  {userTier !== 'pro' && <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10"><Lock size={24} className="text-[#FFD60A]" /></div>}
               </GlassCard>

               <GlassCard className="p-6 relative overflow-hidden" intensity="medium">
                  <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-2 text-[#FF453A]">
                        <Zap size={16} />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Rebalance Sentinel</span>
                     </div>
                  </div>
                  <button 
                    onClick={() => window.location.href = '/dashboard/oracle?prompt=Generate a comprehensive rebalancing protocol for my current asset distribution to optimize for maximum risk-adjusted returns.'}
                    className="w-full py-3 bg-[#FF453A]/10 border border-[#FF453A]/20 rounded-xl text-[#FF453A] text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#FF453A] hover:text-white transition-all"
                  >
                     Generate_Protocol
                  </button>
                  {userTier !== 'pro' && <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10"><Lock size={24} className="text-[#FF453A]" /></div>}
               </GlassCard>
            </div>
         </div>
      </div>
    </div>
  );
}
