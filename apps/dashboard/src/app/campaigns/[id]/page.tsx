'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BarChart3, Users, MousePointer2, MailOpen, TrendingUp, AlertTriangle } from 'lucide-react';
import { AdminLayout } from '../../../components/ui/AdminLayout';
import { GlassCard } from '../../../components/ui/GlassCard';
import { supabase } from '../../../lib/supabase';

export default function CampaignAnalyticsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaignDetails();
  }, [id]);

  async function fetchCampaignDetails() {
    const { data: campaignData } = await supabase
      .from('email_campaigns')
      .select('*, public.email_templates(*)')
      .eq('id', id)
      .single();

    const { data: recipientStats } = await supabase
      .from('campaign_recipients')
      .select('variant, status')
      .eq('campaign_id', id);

    if (campaignData) {
      setCampaign(campaignData);
      processStats(recipientStats || []);
    }
    setLoading(false);
  }

  function processStats(data: any[]) {
    const total = data.length;
    const variantA = data.filter(r => r.variant === 'A');
    const variantB = data.filter(r => r.variant === 'B');

    const getMetrics = (subset: any[]) => ({
      count: subset.length,
      opened: subset.filter(r => r.status === 'opened' || r.status === 'clicked').length,
      clicked: subset.filter(r => r.status === 'clicked').length,
    });

    setStats({
      total,
      A: getMetrics(variantA),
      B: getMetrics(variantB),
    });
  }

  if (loading) return <AdminLayout><div className="loading mono">RECONSTRUCTING_DATA_VECTORS...</div></AdminLayout>;
  if (!campaign) return <AdminLayout><div className="error mono">ERROR_CAMPAIGN_NOT_FOUND</div></AdminLayout>;

  return (
    <AdminLayout>
      <header className="top-bar">
        <button className="back-btn" onClick={() => router.back()}>
          <ArrowLeft size={16} /> BACK_TO_CONSOLE
        </button>
        <div className="header-title">
          <span className="breadcrumb">TERMINAL // CAMPAIGNS // {campaign.id.substring(0,8)}</span>
          <h1>{campaign.name.toUpperCase()}</h1>
        </div>
      </header>

      <section className="stats-header">
        <GlassCard className="main-stats">
          <div className="stat-row">
             <div className="stat-box">
                <span className="label mono">TOTAL_RECIPIENTS</span>
                <span className="value">{stats.total}</span>
             </div>
             <div className="stat-box">
                <span className="label mono">OVERALL_OPEN_RATE</span>
                <span className="value" style={{ color: 'var(--success)' }}>
                  {stats.total > 0 ? ((stats.A.opened + stats.B.opened) / stats.total * 100).toFixed(1) : 0}%
                </span>
             </div>
             <div className="stat-box">
                <span className="label mono">CONVERSION_CTR</span>
                <span className="value" style={{ color: 'var(--accent-cyan)' }}>
                  {stats.total > 0 ? ((stats.A.clicked + stats.B.clicked) / stats.total * 100).toFixed(1) : 0}%
                </span>
             </div>
          </div>
        </GlassCard>
      </section>

      <div className="ab-split-grid">
        <GlassCard className="variant-card">
          <div className="variant-header">
             <div className="variant-id mono">VARIANT_A (CONTROL)</div>
             <h3 className="mono">{campaign.subject_a}</h3>
          </div>
          <div className="variant-metrics">
             <div className="v-metric">
                <MailOpen size={14} color="var(--accent-cyan)" />
                <span className="v-label">OPENS</span>
                <span className="v-value">{stats.A.opened}</span>
                <span className="v-perc">{stats.A.count > 0 ? (stats.A.opened / stats.A.count * 100).toFixed(1) : 0}%</span>
             </div>
             <div className="v-metric">
                <MousePointer2 size={14} color="var(--success)" />
                <span className="v-label">CLICKS</span>
                <span className="v-value">{stats.A.clicked}</span>
                <span className="v-perc">{stats.A.count > 0 ? (stats.A.clicked / stats.A.count * 100).toFixed(1) : 0}%</span>
             </div>
          </div>
        </GlassCard>

        <GlassCard className="variant-card experimental">
          <div className="variant-header">
             <div className="variant-id mono">VARIANT_B (EXPERIMENTAL)</div>
             <h3 className="mono">{campaign.subject_b || 'N/A'}</h3>
          </div>
          <div className="variant-metrics">
             <div className="v-metric">
                <MailOpen size={14} color="var(--accent-cyan)" />
                <span className="v-label">OPENS</span>
                <span className="v-value">{stats.B.opened}</span>
                <span className="v-perc">{stats.B.count > 0 ? (stats.B.opened / stats.B.count * 100).toFixed(1) : 0}%</span>
             </div>
             <div className="v-metric">
                <MousePointer2 size={14} color="var(--success)" />
                <span className="v-label">CLICKS</span>
                <span className="v-value">{stats.B.clicked}</span>
                <span className="v-perc">{stats.B.count > 0 ? (stats.B.clicked / stats.B.count * 100).toFixed(1) : 0}%</span>
             </div>
          </div>
          {stats.B.clicked > stats.A.clicked && (
            <div className="winner-badge mono"><TrendingUp size={10} /> PERFORMANCE_LEADER</div>
          )}
        </GlassCard>
      </div>

      <style jsx>{`
        .top-bar { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 3rem; }
        .back-btn { background: transparent; border: none; color: var(--text-muted); font-size: 0.7rem; font-family: 'JetBrains Mono', monospace; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
        .header-title h1 { font-size: 2.2rem; font-weight: 800; color: #fff; }
        .breadcrumb { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: var(--text-muted); letter-spacing: 2px; }
        
        .stats-header { margin-bottom: 2rem; }
        .stat-row { display: grid; grid-template-columns: repeat(3, 1fr); padding: 2rem; gap: 2rem; }
        .stat-box { display: flex; flex-direction: column; gap: 0.5rem; }
        .stat-box .label { font-size: 0.6rem; color: var(--text-muted); letter-spacing: 1.5px; }
        .stat-box .value { font-size: 2rem; font-weight: 800; }
        
        .ab-split-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        .variant-card { padding: 2rem; display: flex; flex-direction: column; gap: 2rem; position: relative; }
        .experimental { border: 1px solid rgba(124, 58, 237, 0.3); }
        .variant-header { display: flex; flex-direction: column; gap: 0.75rem; }
        .variant-id { font-size: 0.6rem; color: var(--text-muted); letter-spacing: 1px; }
        .variant-header h3 { font-size: 0.95rem; color: #fff; line-height: 1.4; opacity: 0.9; }
        
        .variant-metrics { display: flex; flex-direction: column; gap: 1.25rem; }
        .v-metric { 
            display: grid; grid-template-columns: 20px 100px 1fr 60px; align-items: center; 
            background: rgba(255, 255, 255, 0.03); padding: 1rem; border-radius: 10px;
        }
        .v-label { font-size: 0.7rem; color: var(--text-muted); font-weight: 700; }
        .v-value { font-family: 'JetBrains Mono', monospace; font-size: 1.1rem; font-weight: 700; }
        .v-perc { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: #fff; text-align: right; opacity: 0.6; }
        
        .winner-badge { 
            position: absolute; top: 1.5rem; right: 1.5rem; background: var(--success); color: #020617; 
            padding: 4px 10px; border-radius: 4px; font-size: 0.55rem; font-weight: 900; 
            display: flex; align-items: center; gap: 4px; box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
        }
        .loading { text-align: center; padding: 4rem; color: var(--text-muted); font-size: 0.8rem; letter-spacing: 2px; }
      `}</style>
    </AdminLayout>
  );
}
