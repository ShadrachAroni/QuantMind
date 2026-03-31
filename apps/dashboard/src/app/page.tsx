'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Activity, FileText, Shield, ArrowUpRight, ArrowDownRight, 
  Plus, MoreHorizontal, Search, LayoutDashboard, DollarSign, Clock,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { AdminLayout } from '../components/ui/AdminLayout';
import { useAuth } from '../components/auth/AuthProvider';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    proUsers: 0,
    simulations: 0,
    tickets: 0,
    revenue: 0, 
    expenses: 0,
    portfolios: 0,
    oracleMessages: 0,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        { count: userCount },
        { count: proCount },
        { count: activeSimsCount },
        { count: openTicketsCount },
        { count: portfolioCount },
        { count: oracleCount },
        { data: auditLogData },
        { data: transactionData },
        { data: allRevenueData }
      ] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).in('tier', ['plus', 'pro', 'student']),
        supabase.from('simulations').select('*', { count: 'exact', head: true }).eq('status', 'running'),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('portfolios').select('*', { count: 'exact', head: true }),
        supabase.from('oracle_chat_messages').select('*', { count: 'exact', head: true }),
        supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(6),
        supabase.from('paystack_transactions').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('paystack_transactions').select('amount').eq('status', 'success')
      ]);

      const totalRevenue = allRevenueData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

      setStats({
        users: userCount || 0,
        proUsers: proCount || 0, // Now represents all premium tiers
        simulations: activeSimsCount || 0,
        tickets: openTicketsCount || 0,
        revenue: totalRevenue,
        expenses: totalRevenue * 0.12, 
        portfolios: portfolioCount || 0,
        oracleMessages: oracleCount || 0,
      });

      if (auditLogData) setRecentLogs(auditLogData);
      if (transactionData) setRecentTransactions(transactionData);
    } catch (err) {
      console.error('DASHBOARD_FETCH_ERROR:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Realtime subscriptions for dashboard metrics
    const channels = [
      supabase.channel('admin-metrics-profiles').on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, fetchDashboardData).subscribe(),
      supabase.channel('admin-metrics-sims').on('postgres_changes', { event: '*', schema: 'public', table: 'simulations' }, fetchDashboardData).subscribe(),
      supabase.channel('admin-metrics-portfolios').on('postgres_changes', { event: '*', schema: 'public', table: 'portfolios' }, fetchDashboardData).subscribe(),
      supabase.channel('admin-metrics-oracle').on('postgres_changes', { event: '*', schema: 'public', table: 'oracle_chat_messages' }, fetchDashboardData).subscribe(),
      supabase.channel('admin-metrics-tickets').on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, fetchDashboardData).subscribe(),
      supabase.channel('admin-metrics-logs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_audit_log' }, fetchDashboardData).subscribe(),
      supabase.channel('admin-metrics-trans').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'paystack_transactions' }, fetchDashboardData).subscribe(),
    ];

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, []);

  return (
    <AdminLayout>
      <div className="dashboard-root animate-fade-in">
        <header className="welcome-header">
           <h1 className="text-4xl font-black text-white tracking-tighter">
             SYSTEM_OVERVIEW <span className="text-purple-500">/</span> <span className="capitalize text-gray-400 font-medium tracking-normal text-2xl">{user?.email?.split('@')[0] || 'Admin'}</span>
           </h1>
        </header>

        {/* Core Metrics Grid */}
        <div className="summary-grid">
           <div className="summary-card glass-card group">
              <div className="card-top">
                 <span className="label mono italic text-purple-400">Yield Engine (Portfolios)</span>
                 <div className="trend purple animate-pulse">ACTIVE_NODES</div>
              </div>
              <div className="amount font-black tabular-nums tracking-tighter neon-text-purple">
                {loading ? '0' : stats.portfolios}
              </div>
              <div className="card-stats-row border-white/5">
                 <div className="mini-icon-box purple shadow-[0_0_20px_rgba(168,85,247,0.4)]"><LayoutDashboard size={14} /></div>
                 <div className="mini-info">
                    <strong className="mono italic text-[10px] text-purple-300">PORTFOLIO_DENSITY</strong>
                    <p className="text-[10px] text-gray-500 leading-tight">Total user portfolios currently under management.</p>
                 </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-600/10 blur-[60px] rounded-full pointer-events-none" />
           </div>

            <div className="summary-card glass-card group">
              <div className="card-top">
                 <span className="label mono italic text-cyan-400">Premium Density</span>
                 <div className="trend cyan flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                   INSTITUTIONAL
                 </div>
              </div>
              <div className="amount font-black tabular-nums tracking-tighter neon-text-cyan flex items-baseline gap-2">
                {loading ? '0' : stats.proUsers}
                <span className="text-xl text-gray-500 font-medium font-sans">USERS</span>
              </div>
              <div className="card-stats-row border-white/5">
                 <div className="mini-icon-box cyan shadow-[0_0_20px_rgba(34,211,238,0.4)]"><Users size={14} /></div>
                 <div className="mini-info">
                    <strong className="mono italic text-[10px] text-cyan-300">UPGRADE_CONVERSION</strong>
                    <p className="text-[10px] text-gray-500 leading-tight">Total users on Plus, Pro, or Student tiers.</p>
                 </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-cyan-600/10 blur-[60px] rounded-full pointer-events-none" />
            </div>

            <div className="summary-card glass-card group">
              <div className="card-top">
                 <span className="label mono italic text-pink-400">System Revenue (KES)</span>
                 <div className="trend pink">AGGREGATED</div>
              </div>
              <div className="amount font-black tabular-nums tracking-tighter text-pink-500/90">
                {loading ? '---,---' : stats.revenue.toLocaleString()}
              </div>
              <div className="card-stats-row border-white/5">
                 <div className="mini-icon-box pink bg-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.4)]"><DollarSign size={14} /></div>
                 <div className="mini-info">
                    <strong className="mono italic text-[10px] text-pink-300">TOTAL_PROCESSED</strong>
                    <p className="text-[10px] text-gray-500 leading-tight">Total lifetime volume via Paystack gateway.</p>
                 </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-pink-600/10 blur-[60px] rounded-full pointer-events-none" />
            </div>
          </div>

        {/* Main Operational View */}
        <div className="main-stats-grid">
           <div className="audit-area">
              <div className="glass-card p-8 h-full bg-[#0f1016]/40">
                <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-2xl">
                      <Activity className="text-purple-500" size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-white italic mono tracking-tighter">ADMIN_AUDIT_LOG</h2>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-gray-500 mono uppercase tracking-widest">Real-time system event stream</span>
                        <Link href="/logs" className="text-[9px] text-purple-400 hover:text-purple-300 mono uppercase font-bold tracking-widest underline decoration-purple-500/30">View_All_Logs</Link>
                      </div>
                    </div>
                  </div>
                  <button onClick={fetchDashboardData} className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all active:scale-95">
                    <Clock size={16} className="text-gray-400" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  {recentLogs.length === 0 ? (
                    <div className="py-24 text-center text-gray-700 mono text-xs uppercase tracking-widest">NO_AUDIT_DATA_STREAMING</div>
                  ) : (
                    recentLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-5 p-5 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-purple-500/30 hover:bg-white/[0.03] transition-all group">
                        <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl group-hover:scale-110 transition-transform">
                          <Shield size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1.5">
                            <span className="text-[9px] font-black text-purple-400 mono uppercase tracking-wider">{log.action_type || 'SYSTEM'}</span>
                            <span className="text-[9px] text-gray-600 font-bold mono">{new Date(log.created_at).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed font-medium">{log.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
           </div>

           <div className="transactions-area">
              <div className="glass-card p-8 h-full flex flex-col bg-[#0f1016]/40">
                 <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-cyan-400/10 rounded-2xl">
                        <DollarSign className="text-cyan-400" size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white italic mono tracking-tighter">TRANSACTION_FLOW</h3>
                        <p className="text-[9px] text-gray-500 mono uppercase tracking-widest">Live financial ingress</p>
                      </div>
                    </div>
                    <Link href="/payments" className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                      <MoreHorizontal size={18} className="text-gray-500" />
                    </Link>
                 </div>
                 
                 <div className="trans-list flex-1 space-y-3">
                    {recentTransactions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-gray-700 mono text-xs uppercase tracking-widest gap-4">
                         <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-800 animate-spin" />
                         FLOW_NOT_INITIALIZED
                      </div>
                    ) : (
                      recentTransactions.map((transaction, index) => (
                        <div key={index} className="flex items-center gap-5 p-5 rounded-2xl bg-white/[0.01] border border-transparent hover:border-cyan-500/20 hover:bg-white/[0.03] transition-all">
                           <div className="p-2.5 bg-cyan-400/10 text-cyan-400 rounded-xl"><DollarSign size={18} /></div>
                           <div className="flex-1 min-w-0">
                              <strong className="block text-white mono text-[11px] truncate">{transaction.reference}</strong>
                              <span className="text-[9px] font-black text-gray-600 mono uppercase">{new Date(transaction.created_at).toLocaleDateString()}</span>
                           </div>
                           <div className="text-sm font-black text-cyan-400 tabular-nums">
                              +KES {Number(transaction.amount).toLocaleString()}
                           </div>
                        </div>
                      ))
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-root {
          display: flex;
          flex-direction: column;
          gap: 3rem;
          max-width: 1600px;
          margin: 0 auto;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }

        .summary-card {
          padding: 2.5rem;
          position: relative;
          overflow: hidden;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .trend {
          font-size: 10px;
          font-weight: 900;
          padding: 6px 14px;
          border-radius: 20px;
          letter-spacing: 0.5px;
        }

        .trend.purple { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
        .trend.cyan { background: rgba(34, 211, 238, 0.1); color: #22d3ee; }

        .amount {
          font-size: 3.5rem;
          color: #fff;
          margin-bottom: 2.5rem;
          letter-spacing: -2px;
        }

        .card-stats-row {
           display: flex;
           align-items: center;
           gap: 1.25rem;
           padding-top: 2rem;
           border-top: 1px solid rgba(255,255,255,0.05);
        }

        .mini-icon-box {
           width: 44px;
           height: 44px;
           border-radius: 14px;
           display: flex;
           align-items: center;
           justify-content: center;
        }

        .mini-icon-box.purple { background: #a855f7; color: #fff; }
        .mini-icon-box.cyan { background: #22d3ee; color: #000; }

        .mini-info { flex: 1; }

        .main-stats-grid {
           display: grid;
           grid-template-columns: 1.4fr 1fr;
           gap: 2.5rem;
        }

        .card-bg {
           border-radius: 32px;
           border: 1px solid rgba(255,255,255,0.03);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        :global(.animate-fade-in) {
          animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @media (max-width: 1400px) {
           .main-stats-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
           .summary-grid { grid-template-columns: 1fr; }
           .amount { font-size: 2.5rem; }
        }
      `}</style>
    </AdminLayout>
  );
}
