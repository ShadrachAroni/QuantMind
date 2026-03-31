'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  Activity, 
  Zap, 
  FileText, 
  Globe, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Download,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Fuel,
  ChevronRight,
  PieChart as PieChartIcon,
  Search
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { TierBadge } from '@/components/ui/TierBadge';
import { GlowEffect } from '@/components/ui/GlowEffect';
import { cn, formatCurrency } from '@/lib/utils';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { useUser } from '@/components/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { marketDataService, KlineData } from '@/lib/services/market-data';
import { blockchainService } from '@/lib/services/blockchain';
import { OnChainTransaction, GasMetrics, DeFiPosition } from '@quantmind/shared-types';

// --- MOCK DATA ---
const MOCK_MARKET_DATA = {
  symbol: "BTC/USDT",
  price: 64231.50,
  change24h: 2.45,
  high24h: 65120.00,
  low24h: 62800.00,
  volume24h: "1.2B",
  lastTicks: Array.from({ length: 40 }, (_, i) => ({
    time: i,
    open: 63000 + Math.random() * 2000,
    close: 63000 + Math.random() * 2000,
    high: 65000 + Math.random() * 500,
    low: 62000 + Math.random() * 500,
    volume: 100 + Math.random() * 900
  }))
};

const MOCK_WALLETS = [
  { id: '1', network: 'Ethereum', address: '0x71C...3E4', balance: 1.24, valueUsd: 4520, tokens: 12, alias: 'Main Staking' },
  { id: '2', network: 'BSC', address: '0x92f...A1B', balance: 12.5, valueUsd: 7800, tokens: 8, alias: 'Yield Farming' },
  { id: '3', network: 'Solana', address: '7vkx...9ps', balance: 450.2, valueUsd: 65200, tokens: 24, alias: 'SOL Vault' },
];

const MOCK_TRANSACTIONS = [
  { hash: '0xabc...123', network: 'Ethereum', method: 'Swap', status: 'success', value: '1.2 ETH', fee: '$12.40', time: '2 mins ago' },
  { hash: '0xdfg...456', network: 'Solana', method: 'Stake', status: 'success', value: '100 SOL', fee: '$0.002', time: '15 mins ago' },
  { hash: '0xhjk...789', network: 'BSC', method: 'Transfer', status: 'pending', value: '500 USDT', fee: '$0.45', time: 'Just now' },
  { hash: '0xzyx...000', network: 'Ethereum', method: 'Mint', status: 'failed', value: '0 ETH', fee: '$2.10', time: '1 hour ago' },
];

const MOCK_NEWS = [
  { id: '1', title: 'Ethereum Pectra Upgrade Set for Q1 2025', source: 'CoinDesk', time: '4h ago', sentiment: 'bullish' },
  { id: '2', title: 'SEC Targets Solana Staking Features', source: 'TheBlock', time: '6h ago', sentiment: 'bearish' },
  { id: '3', title: 'Binance Smart Chain DAU Hits All-Time High', source: 'Binance', time: '8h ago', sentiment: 'bullish' },
];

export default function AnalyticsDashboard() {
  const { profile } = useUser();
  const [activeTab, setActiveTab] = useState<'market' | 'onchain' | 'defi'>('market');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Terminal State
  const [marketData, setMarketData] = useState<any>(MOCK_MARKET_DATA);
  const [klines, setKlines] = useState<KlineData[]>(MOCK_MARKET_DATA.lastTicks);
  const [gasData, setGasData] = useState<GasMetrics | null>(null);
  const [transactions, setTransactions] = useState<OnChainTransaction[]>([]);
  const [yieldPositions, setYieldPositions] = useState<DeFiPosition[]>([]);

  const fetchStreamData = async () => {
    setIsRefreshing(true);
    try {
      const [ticker, newKlines, gas, txs, yields] = await Promise.all([
        marketDataService.get24hTicker('BTCUSDT'),
        marketDataService.getKlines('BTCUSDT', '1h', 40),
        blockchainService.getGasPrices('ethereum'),
        blockchainService.getRecentActivity('0x71C...3E4', 'ethereum'),
        blockchainService.getYieldRadarPositions()
      ]);

      if (ticker) setMarketData(ticker);
      if (newKlines) setKlines(newKlines);
      if (gas) setGasData(gas);
      setTransactions(txs);
      setYieldPositions(yields);
    } catch (err) {
      console.error('Terminal sync failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStreamData();
    const interval = setInterval(fetchStreamData, 15000); // 15s updates (rate-limit safe)
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchStreamData();
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-1000">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-[#00D9FF] uppercase tracking-widest">Global_Analytics_Terminal</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] animate-pulse" />
           </div>
           <h1 className="text-3xl font-bold text-white uppercase font-mono tracking-tight">Institutional_Metrics</h1>
           <p className="text-[#848D97] text-sm mt-1">Real-time market visualization and cross-chain on-chain surveillance.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className={cn(
              "p-3 rounded-xl border border-white/10 glass-hover transition-all text-[#848D97] hover:text-white",
              isRefreshing && "animate-spin"
            )}
            title="Refresh Data Feeds"
          >
            <RefreshCw size={18} />
          </button>
          <div className="h-10 w-px bg-white/10 mx-2 hidden md:block" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-[#848D97] tracking-widest mb-1">Tier_Access</span>
            <TierBadge tier="pro" />
          </div>
        </div>
      </div>

      <FeatureGate
        requiredTier="pro"
        featureName="Institutional Analytics"
        className="min-h-[70vh]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Terminal Navigation */}
            <div className="flex items-center gap-1 p-1 bg-black/40 border border-white/5 rounded-2xl w-fit">
              {[
                { id: 'market', icon: TrendingUp, label: 'Market_Data' },
                { id: 'onchain', icon: Activity, label: 'On-Chain' },
                { id: 'defi', icon: Zap, label: 'Yield_DeFi' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                    activeTab === tab.id 
                      ? "bg-white/10 text-white shadow-lg" 
                      : "text-[#848D97] hover:text-white"
                  )}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'market' && (
                <motion.div
                  key="market"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  {/* Candlestick Terminal - Custom implementation */}
                  <GlassCard className="p-8 relative overflow-hidden group" intensity="high">
                     <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div className="flex items-center gap-6">
                           <div>
                              <div className="flex items-center gap-2">
                                 <h2 className="text-2xl font-bold text-white font-mono">{MOCK_MARKET_DATA.symbol}</h2>
                                 <span className="text-xs bg-[#34C759]/20 text-[#34C759] px-2 py-0.5 rounded-full font-bold">+{MOCK_MARKET_DATA.change24h}%</span>
                              </div>
                              <p className="text-[10px] text-[#848D97] font-mono tracking-widest mt-1">BINANCE_DATA_FEED // TICK_STREAM</p>
                           </div>
                           <div className="h-10 w-px bg-white/10 hidden md:block" />
                           <div className="hidden md:block">
                              <p className="text-[10px] text-[#848D97] uppercase font-bold tracking-widest mb-1">Last_Price</p>
                              <p className="text-xl font-mono text-white font-bold">{formatCurrency(MOCK_MARKET_DATA.price)}</p>
                           </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-8">
                           <div>
                              <p className="text-[9px] text-[#848D97] uppercase font-bold tracking-widest mb-1">High_24h</p>
                              <p className="text-xs font-mono text-white">{formatCurrency(MOCK_MARKET_DATA.high24h)}</p>
                           </div>
                           <div>
                              <p className="text-[9px] text-[#848D97] uppercase font-bold tracking-widest mb-1">Low_24h</p>
                              <p className="text-xs font-mono text-white">{formatCurrency(MOCK_MARKET_DATA.low24h)}</p>
                           </div>
                           <div>
                              <p className="text-[9px] text-[#848D97] uppercase font-bold tracking-widest mb-1">Vol_24h</p>
                              <p className="text-xs font-mono text-[#00D9FF]">{MOCK_MARKET_DATA.volume24h}</p>
                           </div>
                        </div>
                     </div>

                     {/* Custom SVG Candlestick Chart */}
                     <div className="h-[300px] w-full relative">
                        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                           <div className="w-full h-px bg-white/10 absolute top-[25%]" />
                           <div className="w-full h-px bg-white/10 absolute top-[50%]" />
                           <div className="w-full h-px bg-white/10 absolute top-[75%]" />
                        </div>
                        <svg className="w-full h-full" preserveAspectRatio="none">
                           {klines.map((tick, i) => {
                             const spacing = 100 / klines.length;
                             const x = i * spacing + spacing / 2;
                             const isUp = tick.close >= tick.open;
                             const color = isUp ? '#34C759' : '#FF453A';
                             
                             // Scale price range dynamically
                             const prices = klines.map(k => [k.high, k.low]).flat();
                             const min = Math.min(...prices);
                             const max = Math.max(...prices);
                             const range = max - min;
                             
                             const normalizeY = (val: number) => 100 - ((val - min) / (range || 1)) * 100;
                             
                             return (
                               <g key={i}>
                                 <line 
                                   x1={`${x}%`} y1={`${normalizeY(tick.high)}%`} 
                                   x2={`${x}%`} y2={`${normalizeY(tick.low)}%`} 
                                   stroke={color} strokeWidth="1" 
                                 />
                                 <rect 
                                   x={`${x - spacing/3}%`} 
                                   y={`${normalizeY(Math.max(tick.open, tick.close))}%`} 
                                   width={`${spacing/1.5}%`} 
                                   height={`${Math.max(2, Math.abs(normalizeY(tick.open) - normalizeY(tick.close)))}%`} 
                                   fill={color} 
                                   rx="1"
                                 />
                               </g>
                             );
                           })}
                        </svg>
                     </div>
                  </GlassCard>

                  {/* On-Chain Metrics Quick View */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <GlassCard className="p-6 overflow-hidden relative">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-[#00D9FF]/10 rounded-lg text-[#00D9FF]">
                          <Fuel size={18} />
                        </div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Network_Gas</h3>
                      </div>
                      <div className="flex items-end gap-2 mb-2">
                        <span className="text-2xl font-mono text-white font-bold">12.5</span>
                        <span className="text-[10px] text-[#848D97] pb-1 font-mono">GWEI (LOW)</span>
                      </div>
                      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                        <div className="bg-[#34C759] h-full transition-all w-[30%]" />
                      </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-[#7C3AED]/10 rounded-lg text-[#7C3AED]">
                          <Activity size={18} />
                        </div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest">TPS_Surveillance</h3>
                      </div>
                      <div className="flex items-end gap-2 mb-2">
                        <span className="text-2xl font-mono text-white font-bold">2,450</span>
                        <span className="text-[10px] text-[#848D97] pb-1 font-mono">AVG_TPS</span>
                      </div>
                      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                        <div className="bg-[#7C3AED] h-full transition-all w-[65%]" />
                      </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-[#FF9F0A]/10 rounded-lg text-[#FF9F0A]">
                          <ShieldCheck size={18} />
                        </div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Nodes_Active</h3>
                      </div>
                      <div className="flex items-end gap-2 mb-2">
                        <span className="text-2xl font-mono text-white font-bold">14.8K</span>
                        <span className="text-[10px] text-[#848D97] pb-1 font-mono">VAL_COUNT</span>
                      </div>
                      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                        <div className="bg-[#FF9F0A] h-full transition-all w-[85%]" />
                      </div>
                    </GlassCard>
                  </div>
                </motion.div>
              )}

              {activeTab === 'onchain' && (
                <motion.div
                  key="onchain"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Wallet Distribution */}
                    <GlassCard className="p-8">
                       <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                             <PieChartIcon size={20} className="text-[#00D9FF]" />
                             <h3 className="text-xs font-bold text-white uppercase tracking-widest">Asset_Allocation</h3>
                          </div>
                          <span className="text-[10px] font-mono text-[#848D97]">3 WALLETS LINKED</span>
                       </div>
                       
                       <div className="flex items-center justify-center py-8">
                          <div className="relative w-48 h-48">
                             {/* Simple SVG Donut Chart */}
                             <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                <circle cx="18" cy="18" r="16" fill="none" stroke="#ffffff10" strokeWidth="4" />
                                <circle cx="18" cy="18" r="16" fill="none" stroke="#00D9FF" strokeWidth="4" strokeDasharray="30 100" />
                                <circle cx="18" cy="18" r="16" fill="none" stroke="#7C3AED" strokeWidth="4" strokeDasharray="45 100" strokeDashoffset="-30" />
                                <circle cx="18" cy="18" r="16" fill="none" stroke="#FF9F0A" strokeWidth="4" strokeDasharray="25 100" strokeDashoffset="-75" />
                             </svg>
                             <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xs text-[#848D97] uppercase font-bold tracking-tighter">Total_NAV</span>
                                <span className="text-lg font-bold text-white font-mono">$77.5K</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-3 gap-4 mt-8">
                          <div className="text-center">
                             <div className="w-2 h-2 rounded-full bg-[#00D9FF] mx-auto mb-2" />
                             <p className="text-[10px] text-white font-bold">ETH</p>
                             <p className="text-[9px] text-[#848D97]">30%</p>
                          </div>
                          <div className="text-center">
                             <div className="w-2 h-2 rounded-full bg-[#7C3AED] mx-auto mb-2" />
                             <p className="text-[10px] text-white font-bold">SOL</p>
                             <p className="text-[9px] text-[#848D97]">45%</p>
                          </div>
                          <div className="text-center">
                             <div className="w-2 h-2 rounded-full bg-[#FF9F0A] mx-auto mb-2" />
                             <p className="text-[10px] text-white font-bold">BNB</p>
                             <p className="text-[9px] text-[#848D97]">25%</p>
                          </div>
                       </div>
                    </GlassCard>

                    {/* Quick Wallet List */}
                    <div className="space-y-4">
                      {MOCK_WALLETS.map((w) => (
                        <GlassCard key={w.id} className="p-5 flex items-center justify-between hover:border-[#00D9FF]/30 transition-all cursor-pointer group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#B0B8C1]">
                              <Wallet size={20} />
                            </div>
                            <div>
                               <p className="text-xs font-bold text-white uppercase tracking-widest">{w.alias}</p>
                               <p className="text-[10px] font-mono text-[#848D97]">{w.address}</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-sm font-bold text-white font-mono">{w.balance} {w.network === 'Solana' ? 'SOL' : w.network === 'Ethereum' ? 'ETH' : 'BNB'}</p>
                             <p className="text-[10px] text-[#34C759] font-mono">{formatCurrency(w.valueUsd)}</p>
                          </div>
                        </GlassCard>
                      ))}
                      <button className="w-full p-4 rounded-2xl border border-dashed border-white/10 text-[#848D97] text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/5 transition-all">
                        <Plus size={14} /> Link_New_Protocol
                      </button>
                    </div>
                  </div>

                  {/* Transaction History Table */}
                  <GlassCard className="overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                       <h3 className="text-xs font-bold text-white uppercase tracking-widest">Transaction_Vault</h3>
                       <div className="flex gap-2">
                          <button aria-label="Filter Transactions" className="p-2 rounded-lg bg-white/5 text-[#848D97] hover:text-white transition-all"><Filter size={14} /></button>
                          <button aria-label="Download Transactions" className="p-2 rounded-lg bg-white/5 text-[#848D97] hover:text-white transition-all"><Download size={14} /></button>
                       </div>
                    </div>
                    <div className="overflow-x-auto">
                       <table className="w-full text-left border-collapse">
                          <thead>
                             <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-6 py-4 text-[10px] font-bold text-[#848D97] uppercase tracking-widest">Transaction_Hash</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[#848D97] uppercase tracking-widest">Network</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[#848D97] uppercase tracking-widest">Method</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[#848D97] uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[#848D97] uppercase tracking-widest text-right">Value</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[#848D97] uppercase tracking-widest text-right">Action</th>
                             </tr>
                          </thead>
                          <tbody>
                             {MOCK_TRANSACTIONS.map((tx, i) => (
                               <tr key={i} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group">
                                  <td className="px-6 py-4 font-mono text-[10px] text-white">{tx.hash}</td>
                                  <td className="px-6 py-4 text-[11px] text-[#848D97]">
                                     <span className="flex items-center gap-2">
                                        <div className={cn(
                                          "w-1.5 h-1.5 rounded-full",
                                          tx.network === 'Ethereum' ? 'bg-[#7C3AED]' : tx.network === 'Solana' ? 'bg-[#14F195]' : 'bg-[#F3BA2F]'
                                        )} />
                                        {tx.network}
                                     </span>
                                  </td>
                                  <td className="px-6 py-4 text-[11px] font-bold text-white uppercase">{tx.method}</td>
                                  <td className="px-6 py-4">
                                     <span className={cn(
                                       "text-[9px] font-bold uppercase py-0.5 px-2 rounded-full",
                                       tx.status === 'success' ? "bg-[#34C759]/10 text-[#34C759]" : 
                                       tx.status === 'pending' ? "bg-[#FF9F0A]/10 text-[#FF9F0A] animate-pulse" : 
                                       "bg-[#FF453A]/10 text-[#FF453A]"
                                     )}>
                                       {tx.status}
                                     </span>
                                  </td>
                                  <td className="px-6 py-4 text-[11px] font-mono text-white text-right">{tx.value}</td>
                                  <td className="px-6 py-4 text-right">
                                     <button aria-label="View Transaction Details" className="text-[#848D97] hover:text-[#00D9FF] transition-colors"><ExternalLink size={14} /></button>
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar / Intel Column */}
          <div className="lg:col-span-4 space-y-8">
             {/* News Aggregator */}
             <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-3">
                      <Globe size={18} className="text-[#00D9FF]" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest">Crypto_Intel</h3>
                   </div>
                   <button className="text-[10px] font-bold text-[#00D9FF] uppercase tracking-widest hover:underline">View_All</button>
                </div>
                
                <div className="space-y-6">
                   {MOCK_NEWS.map((news) => (
                     <div key={news.id} className="group cursor-pointer">
                        <div className="flex items-center gap-2 mb-1.5">
                           <span className="text-[9px] font-bold text-[#848D97] uppercase">{news.source}</span>
                           <span className="w-1 h-1 rounded-full bg-white/10" />
                           <span className="text-[9px] font-mono text-[#848D97]">{news.time}</span>
                           <span className={cn(
                             "ml-auto text-[8px] font-bold uppercase px-1.5 rounded",
                             news.sentiment === 'bullish' ? "bg-[#34C759]/10 text-[#34C759]" : "bg-[#FF453A]/10 text-[#FF453A]"
                           )}>
                             {news.sentiment}
                           </span>
                        </div>
                        <h4 className="text-sm font-bold text-white group-hover:text-[#00D9FF] transition-colors leading-snug">
                           {news.title}
                        </h4>
                     </div>
                   ))}
                </div>
             </GlassCard>

             {/* Yield / DeFi Overview */}
             <GlassCard className="p-6 overflow-hidden relative">
                <div className="flex items-center gap-3 mb-6">
                   <Zap size={18} className="text-[#7C3AED]" />
                   <h3 className="text-xs font-bold text-white uppercase tracking-widest">Yield_Farming_APY</h3>
                </div>
                
                <div className="space-y-4">
                   {[
                     { pair: 'WETH/USDC', protocol: 'Uniswap V3', low: '18.4', high: '24.2' },
                     { pair: 'SOL/USDC', protocol: 'Raydium', low: '32.1', high: '48.5' },
                     { pair: 'BNB/BUSD', protocol: 'PancakeSwap', low: '12.4', high: '15.8' },
                   ].map((farm, i) => (
                     <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
                        <div className="flex items-center justify-between mb-3">
                           <span className="text-xs font-bold text-white">{farm.pair}</span>
                           <span className="text-[9px] font-mono text-[#848D97] uppercase">{farm.protocol}</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-[#848D97] uppercase tracking-widest mb-1">Estimated_APY</span>
                              <span className="text-lg font-mono text-[#00D9FF] font-bold">{farm.high}%</span>
                           </div>
                           <button aria-label="View Farm Details" className="p-1.5 rounded-lg bg-[#00D9FF]/10 text-[#00D9FF] hover:bg-[#00D9FF]/20 transition-all">
                              <ChevronRight size={14} />
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
                
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                   <Zap size={160} className="text-white" />
                </div>
             </GlassCard>
             
             {/* Security Check */}
             <GlassCard className="p-6 bg-[#34C759]/5 border-[#34C759]/20" intensity="low">
                <div className="flex gap-4">
                   <ShieldCheck className="text-[#34C759] shrink-0 mt-0.5" size={20} />
                   <div>
                      <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-1">Security_Scan_Passed</h4>
                      <p className="text-[10px] text-[#34C759]/80 leading-relaxed font-mono">
                         3 linked wallets analyzed. No malicious contract signatures or high-risk permissions detected in the last scan.
                      </p>
                   </div>
                </div>
             </GlassCard>
          </div>
        </div>
      </FeatureGate>
    </div>
  );
}
