'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, PlusCircle, Grid, List as ListIcon, SlidersHorizontal, Briefcase } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { PortfolioCard } from '@/components/ui/PortfolioCard';
import { cn } from '@/lib/utils';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { LimitBanner } from '@/components/subscription/LimitBanner';
import { useUser } from '@/components/UserContext';

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL_STATUS');
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useUser();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const userTier = profile?.tier || 'free';
  
  const supabase = createClient();

  useEffect(() => {
    const fetchPortfolios = async () => {
      setIsLoading(true);
      // Fetch portfolios
      const { data: portfolioData } = await supabase
        .from('portfolios')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch latest prices for valuation
      const { data: priceData } = await supabase
        .from('prices')
        .select('symbol, price, open, timestamp')
        .order('timestamp', { ascending: false });

      if (portfolioData && priceData) {
        // Deduplicate prices to keep only latest for each symbol
        const latestPrices = new Map<string, { price: number; open: number }>();
        priceData.forEach(p => {
           if (!latestPrices.has(p.symbol)) {
              latestPrices.set(p.symbol, { 
                 price: Number(p.price), 
                 open: Number(p.open || p.price) 
              });
           }
        });

        const priceMap = latestPrices;

        // Enhanced data with real stats from assets and prices
        const enhanced = portfolioData.map(p => {
          const assets = Array.isArray(p.assets) ? p.assets : [];
          
          // Calculate Real-time Total Value
          let totalValue = 0;
          let totalOpenValue = 0;
          
          assets.forEach((asset: any) => {
             const market = priceMap.get(asset.symbol);
             const price = market?.price || 0;
             const open = market?.open || price;
             const quantity = Number(asset.quantity || asset.amount || 0);
             
             totalValue += quantity * price;
             totalOpenValue += quantity * open;
          });

          // Fallback to notional if assets are empty (new portfolio)
          const displayValue = totalValue || Number(p.notional_value || 0);
          const displayOpenValue = totalOpenValue || displayValue;
          
          // Calculate 24h Change based on aggregate asset movements
          const change24h = displayOpenValue > 0 
            ? Number(((displayValue - displayOpenValue) / displayOpenValue * 100).toFixed(2))
            : 0;

          // Generate deterministic history sparkline based on current change and ID
          const history = Array.from({ length: 12 }, (_, i) => {
             const base = displayValue * 0.95;
             const variance = displayValue * 0.1;
             // Use i and portfolio id for a stable-looking curve
             const noise = (Math.sin(i + p.id.charCodeAt(0)) + 1) / 2;
             return base + (variance * noise);
          });

          return {
            ...p,
            total_value: displayValue,
            history,
            change_24h: change24h,
            asset_count: assets.length,
            risk_profile: p.metadata?.risk_profile || 'MODERATE',
            status: p.metadata?.strategy || p.status || 'DIVERSIFIED'
          };
        });
        setPortfolios(enhanced);
      }
      setIsLoading(false);
    };

    fetchPortfolios();

    // Section 14.1 Realtime sub
    const portfolioChannel = supabase
      .channel('registry-portfolios')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolios' }, () => {
        fetchPortfolios();
      })
      .subscribe();

    const priceChannel = supabase
      .channel('registry-prices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prices' }, () => {
        fetchPortfolios();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(portfolioChannel);
      supabase.removeChannel(priceChannel);
    };
  }, [supabase]);

  const filtered = portfolios.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL_STATUS' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-700">
      {/* Header & Local Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight uppercase font-mono">Portfolio_Registry</h1>
          <p className="text-[#848D97] text-xs md:text-sm mt-1">Manage and monitor institutional-grade asset vaults.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full md:w-auto">
           <div className="hidden sm:block w-72">
              <LimitBanner 
                currentValue={portfolios.length} 
                maxValue={userTier === 'pro' ? 1000 : userTier === 'plus' ? 5 : userTier === 'student' ? 3 : 1} 
                unit="Portfolios" 
                onUpgrade={() => setIsUpgradeModalOpen(true)}
              />
           </div>
           
           <button 
             onClick={(e) => {
               const maxPortfolios = userTier === 'pro' ? 1000 : userTier === 'plus' ? 5 : userTier === 'student' ? 3 : 1;
               if (portfolios.length >= maxPortfolios) {
                 e.preventDefault();
                 setIsUpgradeModalOpen(true);
               } else {
                 window.location.href = '/dashboard/portfolios/new';
               }
             }}
             className="flex items-center justify-center gap-3 bg-[#00D9FF] text-[#05070A] px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] md:text-xs transition-all hover:bg-[#00D9FF]/90 hover:shadow-[0_0_20px_rgba(0,217,255,0.3)] w-full md:w-auto"
           >
             <PlusCircle size={18} />
             Create New Module
           </button>
        </div>
      </div>

      {/* Toolbar (Search & Filter) */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1 max-w-md group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848D97] group-focus-within:text-[#00D9FF] transition-colors" size={16} />
               <input
                 type="text"
                 placeholder="Search registry..."
                 className="w-full bg-[#12121A] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#00D9FF]/30 transition-all font-mono placeholder:text-white/10"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
            
            <div className="flex items-center bg-[#12121A] border border-white/5 rounded-xl p-1 overflow-x-auto no-scrollbar">
               {['ALL_STATUS', 'DIVERSIFIED', 'CONCENTRATED', 'REBALANCING'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      "px-3 md:px-4 py-1.5 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                      statusFilter === status 
                        ? "bg-white/10 text-white shadow-sm" 
                        : "text-[#848D97] hover:text-white"
                    )}
                  >
                    {status.replace('_', ' ')}
                  </button>
               ))}
            </div>
         </div>

         <div className="flex items-center justify-between sm:justify-end gap-3">
            <button className="p-2.5 bg-[#12121A] border border-white/5 rounded-xl text-[#848D97] hover:text-white transition-colors">
               <SlidersHorizontal size={18} />
            </button>
            <div className="w-px h-6 bg-white/5 mx-1" />
            <div className="flex items-center bg-[#12121A] border border-white/5 rounded-xl p-1">
               <button className="p-1.5 bg-white/10 text-white rounded-lg shadow-sm">
                  <Grid size={16} />
               </button>
               <button className="p-1.5 text-[#848D97] hover:text-white transition-colors">
                  <ListIcon size={16} />
               </button>
            </div>
         </div>
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
           {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-white/[0.02] border border-white/5 rounded-3xl" />
           ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
           {filtered.map((portfolio) => (
              <PortfolioCard key={portfolio.id} portfolio={portfolio} />
           ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-white/[0.01] border border-dashed border-white/5 rounded-3xl">
           <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-[#848D97] mb-6">
              <Briefcase size={32} />
           </div>
           <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">No Modules Found</h3>
           <p className="text-[#848D97] text-sm mb-8">Initiate a new portfolio protocol to begin monitoring.</p>
           <Link 
            href="/dashboard/portfolios/new"
            className="flex items-center gap-2 text-[#00D9FF] font-bold uppercase tracking-widest text-xs hover:underline transition-all"
           >
              <PlusCircle size={14} /> Initialize Procedure
           </Link>
        </div>
      )}
      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        requiredTier={userTier === 'free' ? 'plus' : 'pro'}
        featureName="Additional Portfolio Capacity"
      />
    </div>
  );
}
