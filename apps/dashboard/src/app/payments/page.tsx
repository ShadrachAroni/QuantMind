'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/ui/AdminLayout';
import { ShieldCheck, Loader2, Activity, DollarSign, History, RefreshCcw, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { GlassCard } from '../../components/ui/GlassCard';
import { useToast } from '../../components/ui/ToastProvider';
import { HoloLoader } from '../../components/ui/HoloLoader';

export default function PaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ successRate: 0, churnRate: 0, totalRevenue: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const { success, error } = useToast();

  useEffect(() => {
    fetchPaymentData();
  }, []);

  async function fetchPaymentData() {
    setLoading(true);
    
    // 1. Fetch Transactions
    const { data: txData } = await supabase
      .from('paystack_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (txData) setTransactions(txData);

    // 2. Calculate Metrics (Simplified for Dashboard)
    const { count: successCount } = await supabase
      .from('paystack_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'success');

    const { count: totalCount } = await supabase
      .from('paystack_transactions')
      .select('*', { count: 'exact', head: true });

    const { count: activeSubs } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: canceledSubs } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'canceled');

    setMetrics({
      successRate: totalCount ? Math.round((successCount || 0) / totalCount * 1000) / 10 : 0,
      churnRate: (activeSubs || 0) + (canceledSubs || 0) ? Math.round((canceledSubs || 0) / ((activeSubs || 0) + (canceledSubs || 0)) * 1000) / 10 : 0,
      totalRevenue: txData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0
    });

    setLoading(false);
  }

  const copyCallbackUrl = () => {
    navigator.clipboard.writeText('https://quantmind-dashboard.vercel.app/settings/billings');
    success('URL_COPIED', 'The callback endpoint has been copied to your clipboard.');
  };



  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] relative min-h-[400px]">
          <HoloLoader 
            progress={Math.floor(Math.random() * 40) + 20} 
            phase="HYDRATING_PAYMENT_NODE..." 
            isMuted={true} 
            onToggleMute={() => {}} 
            fullScreen={false} 
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <header className="flex justify-between items-end mb-12">
          <div>
            <span className="mono text-[10px] text-cyan-500 mb-1 block">GATEWAY // PAYSTACK</span>
            <h1 className="text-4xl font-extrabold text-theme-primary">Payment Orchestration</h1>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={fetchPaymentData}
              className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCcw size={20} />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div className="p-6 bg-[#1A1B23] rounded-[24px] border border-white/5 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4 relative z-10">
                 <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1 mono">CHECKOUT_SUCCESS</span>
                    <h3 className="text-3xl font-black text-theme-primary">{metrics.successRate}%</h3>
                 </div>
                 <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
                    <ShieldCheck size={20} />
                 </div>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden relative z-10">
                 <div className="h-full bg-green-400 transition-all duration-1000" style={{ width: `${metrics.successRate}%` }} />
              </div>
           </div>

           <div className="p-6 bg-[#1A1B23] rounded-[24px] border border-white/5 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4 relative z-10">
                 <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1 mono">SUBSCRIPTION_CHURN</span>
                    <h3 className="text-3xl font-black text-theme-primary">{metrics.churnRate}%</h3>
                 </div>
                 <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                    <Activity size={20} />
                 </div>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden relative z-10">
                 <div className="h-full bg-purple-400 transition-all duration-1000" style={{ width: `${metrics.churnRate}%` }} />
              </div>
           </div>

           <div className="p-6 bg-[#1A1B23] rounded-[24px] border border-white/5 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4 relative z-10">
                 <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1 mono">ESTIMATED_REVENUE</span>
                    <h3 className="text-3xl font-black text-cyan-400">KES {metrics.totalRevenue.toLocaleString()}</h3>
                 </div>
                 <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
                    <DollarSign size={20} />
                 </div>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden relative z-10">
                 <div className="h-full bg-cyan-400 w-full" />
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <History className="text-cyan-500" size={20} />
                <h2 className="text-lg font-bold text-theme-primary mono uppercase italic">Real-Time Transaction Stream</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 mono text-[10px] text-gray-400 uppercase">
                      <th className="pb-4 font-normal">Reference</th>
                      <th className="pb-4 font-normal">Status</th>
                      <th className="pb-4 font-normal">Amount</th>
                      <th className="pb-4 font-normal">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500 mono text-xs uppercase italic">No transactions detected in current block</td>
                      </tr>
                    ) : (
                      transactions.map(transaction => (
                        <tr key={transaction.id} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 font-mono text-xs text-cyan-400">{transaction.reference}</td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                              transaction.status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                            }`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-gray-300 tabular-nums">
                            {Number(transaction.amount).toLocaleString()} <span className="text-[10px] text-gray-500">{transaction.currency}</span>
                          </td>
                          <td className="py-4 text-xs text-gray-500 mono">
                            {new Date(transaction.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Activity className="text-purple-500" size={20} />
                  <h2 className="text-lg font-bold text-theme-primary mono uppercase italic">Gateway Linkage</h2>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mono text-[10px] text-gray-500 uppercase mb-2 block">Authorized Callback URL</label>
                  <p className="text-xs text-gray-400 mb-2">Configure this precise URI in your Paystack Dashboard to resolve payment redirections.</p>
                  <div className="flex bg-black/40 border border-white/5 rounded-xl overflow-hidden transition-all hover:border-cyan-500/50">
                    <input 
                      type="text"
                      readOnly
                      value="https://quantmind-dashboard.vercel.app/settings/billings"
                      className="w-full bg-transparent px-4 py-3 text-xs text-cyan-400 mono outline-none"
                    />
                    <button 
                      onClick={copyCallbackUrl}
                      className="px-4 py-3 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest text-white transition-colors border-l border-white/5"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>

        </div>
      </div>
    </AdminLayout>
  );
}
