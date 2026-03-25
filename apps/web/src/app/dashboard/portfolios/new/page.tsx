'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronRight, 
  ChevronLeft, 
  PlusCircle, 
  Database, 
  ShieldCheck, 
  Activity, 
  Zap, 
  X,
  Plus,
  AlertCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { GlassCard } from '@/components/ui/GlassCard';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { AssetSearch } from '@/components/portfolios/AssetSearch';
import { cn, formatCurrency } from '@/lib/utils';

export default function NewPortfolioPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [portfolioCount, setPortfolioCount] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  React.useEffect(() => {
    const checkCapacity = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch profile for tier
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('tier')
          .eq('id', user.id)
          .single();
        setUserProfile(profile);

        // Fetch current count
        const { count } = await supabase
          .from('portfolios')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        setPortfolioCount(count || 0);
      }
    };
    checkCapacity();
  }, [supabase]);

  const getLimit = (tier: string) => {
    if (tier === 'pro') return Infinity;
    if (tier === 'plus') return 5;
    if (tier === 'student') return 3;
    return 1;
  };

  const isAtLimit = userProfile && portfolioCount >= getLimit(userProfile.tier);

  // Form State
  const [name, setName] = useState('');
  const [strategy, setStrategy] = useState('DIVERSIFIED');
  const [riskProfile, setRiskProfile] = useState('MODERATE');
  const [selectedAssets, setSelectedAssets] = useState<any[]>([]);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [stopLoss, setStopLoss] = useState(5);
  const [takeProfit, setTakeProfit] = useState(15);

  const addAsset = (asset: any) => {
    setSelectedAssets([...selectedAssets, asset]);
    setWeights({ ...weights, [asset.id]: 0 });
  };

  const removeAsset = (id: string) => {
    setSelectedAssets(selectedAssets.filter(a => a.id !== id));
    const newWeights = { ...weights };
    delete newWeights[id];
    setWeights(newWeights);
  };

  const updateWeight = (id: string, weight: number) => {
    setWeights({ ...weights, [id]: weight });
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const [initialNotional, setInitialNotional] = useState(100000); // Default $100k

  const handleInitialize = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('AUth session expired');

      // Fetch current prices to calculate units
      const { data: prices } = await supabase.from('prices').select('symbol, price');

      // Calculate quantities and costs based on weights and notional
      const assetsToSave = selectedAssets.map(asset => {
        const priceData = prices?.find(p => p.symbol === asset.symbol);
        const price = priceData ? priceData.price : 1.0;
        const targetValue = initialNotional * (weights[asset.id] / 100);
        return {
           id: asset.id,
           symbol: asset.symbol,
           name: asset.name,
           weight: weights[asset.id],
           quantity: targetValue / price, // Institutional quantity
           avg_price: price // Initial acquisition cost
        };
      });

      const { data: portfolio, error: pError } = await supabase
        .from('portfolios')
        .insert({
          user_id: user.id,
          name,
          description: `${strategy} | ${riskProfile}`,
          assets: assetsToSave,
          notional_value: initialNotional,
          metadata: {
            strategy,
            risk_profile: riskProfile,
            stop_loss: stopLoss,
            take_profit: takeProfit
          },
          total_value: initialNotional,
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (pError) throw pError;

      // Log Notification
      await supabase.from('user_notifications').insert({
        user_id: user.id,
        type: 'system_update',
        title: 'STRAT_MODULE_DEPLOYED',
        message: `Institutional Portfolio '${name}' has been initialized and vaulted.`,
        metadata: { route: `/dashboard/portfolios/${portfolio.id}` }
      });
      
      router.push('/dashboard/portfolios?success=created');
    } catch (err: any) {
      console.error('Initialization failure:', err);
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <LoadingOverlay visible={isLoading} message="INITIALIZING_MODULE..." />

      <div className="mb-12">
        <h1 className="text-3xl font-bold text-white tracking-tight uppercase font-mono mb-2">Initialize_New_Vault</h1>
        <div className="flex items-center gap-4">
           {[1, 2, 3].map((s) => (
             <div key={s} className="flex items-center gap-3">
               <div className={cn(
                 "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all",
                 step >= s ? "bg-[#00D9FF] border-[#00D9FF] text-[#05070A]" : "border-white/10 text-[#848D97]"
               )}>
                 {s}
               </div>
               <span className={cn(
                 "text-[10px] font-bold uppercase tracking-widest",
                 step >= s ? "text-white" : "text-[#848D97]"
               )}>
                 {s === 1 ? 'Metadata' : s === 2 ? 'Allocation' : 'Thresholds'}
               </span>
               {s < 3 && <div className="w-8 h-px bg-white/5" />}
             </div>
           ))}
        </div>
      </div>

      <GlassCard className="p-8" intensity="medium">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="space-y-4">
               <div>
                  <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] mb-2 block">Module_Identifier</label>
                  <input
                    type="text"
                    placeholder="E.g. TECH_ALPHA_BETA"
                    className="w-full bg-[#12121A] border border-white/10 rounded-xl py-4 px-6 text-white focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] mb-2 block">Deployment_Strategy</label>
                    <select 
                      className="w-full bg-[#12121A] border border-white/10 rounded-xl py-4 px-6 text-white focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono appearance-none"
                      value={strategy}
                      onChange={(e) => setStrategy(e.target.value)}
                    >
                       <option value="DIVERSIFIED">DIVERSIFIED</option>
                       <option value="CONCENTRATED">CONCENTRATED</option>
                       <option value="INDEX_REPLICATOR">INDEX_REPLICATOR</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] mb-2 block">Risk_Profile</label>
                    <select 
                      className="w-full bg-[#12121A] border border-white/10 rounded-xl py-4 px-6 text-white focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono appearance-none"
                      value={riskProfile}
                      onChange={(e) => setRiskProfile(e.target.value)}
                    >
                       <option value="CONSERVATIVE">CONSERVATIVE</option>
                       <option value="MODERATE">MODERATE</option>
                       <option value="AGGRESSIVE">AGGRESSIVE</option>
                    </select>
                  </div>
               </div>
             </div>

             <div className="flex justify-end pt-4">
                <button 
                  disabled={!name}
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 bg-[#00D9FF] text-[#05070A] px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs disabled:opacity-50 transition-all hover:bg-[#00D9FF]/90"
                >
                   Next Stage <ChevronRight size={14} />
                </button>
             </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div>
                <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] mb-4 block">Asset_Acquisition</label>
                <AssetSearch onSelect={addAsset} selectedIds={selectedAssets.map(a => a.id)} />
             </div>

             {selectedAssets.length > 0 && (
                <div className="space-y-4">
                   <div className="flex items-center justify-between text-[10px] font-bold text-[#848D97] uppercase tracking-widest px-4">
                      <span>Asset</span>
                      <span>Weight (%)</span>
                   </div>
                   <div className="space-y-3">
                      {selectedAssets.map((asset) => (
                        <div key={asset.id} className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center font-bold text-xs text-[#00D9FF]">
                                 {asset.symbol.substring(0, 2)}
                              </div>
                              <div>
                                 <h4 className="text-sm font-bold text-white font-mono">{asset.symbol}</h4>
                                 <span className="text-[10px] text-[#848D97] font-medium">{asset.name}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <input 
                                type="number"
                                className="w-20 bg-[#05070A] border border-white/10 rounded-lg py-2 px-3 text-right text-sm text-white focus:outline-none focus:border-[#00D9FF]/30 font-mono"
                                value={weights[asset.id]}
                                onChange={(e) => updateWeight(asset.id, Number(e.target.value))}
                              />
                              <button onClick={() => removeAsset(asset.id)} className="text-[#848D97] hover:text-[#FF453A] transition-colors">
                                 <X size={16} />
                              </button>
                           </div>
                        </div>
                      ))}
                   </div>
                   
                   <div className="flex items-center justify-between p-4 border-t border-white/5 pt-6">
                      <span className="text-xs font-bold text-[#848D97] uppercase tracking-widest">Aggregate Weight</span>
                      <span className={cn(
                        "text-xl font-mono font-bold",
                        totalWeight === 100 ? "text-[#32D74B]" : "text-[#FFD60A]"
                      )}>
                         {totalWeight}%
                      </span>
                   </div>
                </div>
             )}

             <div className="flex items-center justify-between pt-4">
                <button onClick={() => setStep(1)} className="flex items-center gap-2 text-[#848D97] font-bold uppercase tracking-widest text-xs hover:text-white transition-all">
                   <ChevronLeft size={14} /> Metadata Stage
                </button>
                <button 
                  disabled={selectedAssets.length === 0 || totalWeight !== 100}
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 bg-[#00D9FF] text-[#05070A] px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs disabled:opacity-50 transition-all hover:bg-[#00D9FF]/90"
                >
                   Final Validation <ChevronRight size={14} />
                </button>
             </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                   <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] mb-4 block">Initial_Capital_Injection (USD)</label>
                   <input 
                     type="number"
                     className="w-full bg-[#12121A] border border-white/10 rounded-xl py-4 px-6 text-white focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono"
                     value={initialNotional}
                     onChange={(e) => setInitialNotional(Number(e.target.value))}
                     step="1000"
                   />
                </div>
                <div>
                   <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] mb-4 block">Tail_Risk_Hedge (Stop Loss %)</label>
                   <div className="relative">
                      <input 
                        type="range" min="1" max="50" step="1" 
                        className="w-full accent-[#00D9FF]"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(Number(e.target.value))}
                      />
                      <div className="flex justify-between mt-2 text-[10px] font-mono text-[#848D97]">
                         <span>1%</span>
                         <span className="text-white font-bold">{stopLoss}%</span>
                         <span>50%</span>
                      </div>
                   </div>
                </div>
                <div>
                   <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] mb-4 block">Profit_Realization (Take Profit %)</label>
                   <div className="relative">
                      <input 
                        type="range" min="5" max="200" step="5" 
                        className="w-full accent-[#32D74B]"
                        value={takeProfit}
                        onChange={(e) => setTakeProfit(Number(e.target.value))}
                      />
                      <div className="flex justify-between mt-2 text-[10px] font-mono text-[#848D97]">
                         <span>5%</span>
                         <span className="text-white font-bold">{takeProfit}%</span>
                         <span>200%</span>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                   <Zap size={20} className="text-[#00D9FF] shrink-0 mt-1" />
                   <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Protocol Deployment Summary</h4>
                      <p className="text-xs text-[#848D97] leading-relaxed">
                         Module <span className="text-white font-bold">{name}</span> will be initialized with {selectedAssets.length} assets.
                         Execution engine set to <span className="text-white font-bold">{strategy}</span> mode.
                         Risk limits established at <span className="text-[#FF453A] font-bold">-{stopLoss}%</span> downside and <span className="text-[#32D74B] font-bold">+{takeProfit}%</span> upside target.
                      </p>
                   </div>
                </div>
             </div>

             <div className="flex items-center justify-between pt-4">
                <button onClick={() => setStep(2)} className="flex items-center gap-2 text-[#848D97] font-bold uppercase tracking-widest text-xs hover:text-white transition-all">
                   <ChevronLeft size={14} /> Allocation Stage
                </button>
                
                {isAtLimit ? (
                  <Link 
                    href="/dashboard/subscription"
                    className="flex items-center gap-3 bg-[#D4A017]/20 border border-[#D4A017]/30 text-[#D4A017] px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all hover:bg-[#D4A017]/30"
                  >
                    <AlertCircle size={18} /> Capacity_Reached: Consult Billing
                  </Link>
                ) : (
                  <button 
                    onClick={handleInitialize}
                    className="flex items-center gap-2 bg-[#00D9FF] text-[#05070A] px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all hover:bg-[#00D9FF]/90 shadow-[0_0_20px_rgba(0,217,255,0.2)]"
                  >
                    <ShieldCheck size={18} /> Deploy Module
                  </button>
                )}
             </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
