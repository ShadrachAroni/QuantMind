'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Plus, Send, BarChart3, Clock, Users, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { AdminLayout } from '../../components/ui/AdminLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { supabase } from '../../lib/supabase';
import { HoloLoader } from '../../components/ui/HoloLoader';
import { logSystemEvent } from '../../lib/notifications';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState({ totalSent: 0, avgOpenRate: 0, avgCtr: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*, email_templates(name), campaign_recipients(status)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCampaigns(data);
      
      let totalSent = 0;
      let totalOpened = 0;
      let totalClicked = 0;

      data.forEach(campaign => {
        const recs = campaign.campaign_recipients || [];
        totalSent += recs.length;
        totalOpened += recs.filter((r: any) => r.status === 'opened' || r.status === 'clicked').length;
        totalClicked += recs.filter((r: any) => r.status === 'clicked').length;
      });

      setGlobalStats({
        totalSent,
        avgOpenRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
        avgCtr: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0
      });
    }
    setLoading(false);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'var(--success)';
      case 'scheduled': return 'var(--accent-cyan)';
      case 'pending_approval': return 'var(--accent-purple)';
      case 'draft': return 'var(--text-muted)';
      default: return 'var(--text-muted)';
    }
  };

  const handleLaunch = async (id: string, name: string) => {
    try {
      setLoading(true);
      
      // 1. Update status to scheduled
      const { error: updateError } = await supabase
        .from('email_campaigns')
        .update({ 
          status: 'scheduled',
          scheduled_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // 2. Trigger Edge Function immediate processing
      const { error: invokeError } = await supabase.functions.invoke('campaign-executor');
      if (invokeError) throw invokeError;

      // 3. Log event
      await logSystemEvent(`Manual initialization triggered for campaign: ${name}.`, 'upgrade');
      
      // 4. Refresh
      await fetchCampaigns();
      alert(`CAMPAIGN_${name.toUpperCase()}_INITIALIZED_SUCCESSFULLY`);
    } catch (err) {
      console.error('Launch failed:', err);
      alert('LAUNCH_PROTOCOL_FAILURE: Check system logs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <header className="top-bar">
        <div className="header-title">
          <span className="breadcrumb">TERMINAL // CAMPAIGNS</span>
          <h1>CAMPAIGN_CONSOLE</h1>
        </div>
        <button className="create-btn" onClick={() => window.location.href = '/campaigns/create'}>
          <Plus size={16} /> INITIALIZE_NEW_CAMPAIGN
        </button>
      </header>

      <section className="analytics-overview">
        <GlassCard className="overview-card">
          <div className="card-header">
            <BarChart3 size={18} color="var(--accent-cyan)" />
            <h2>AGGREGATE_PERFORMANCE</h2>
          </div>
          <div className="metrics-grid">
            <div className="metric">
              <span className="label">TOTAL_SENT</span>
              <span className="value">{globalStats.totalSent >= 1000 ? (globalStats.totalSent / 1000).toFixed(1) + 'K' : globalStats.totalSent}</span>
            </div>
            <div className="metric">
              <span className="label">AVG_OPEN_RATE</span>
              <span className="value">{globalStats.avgOpenRate.toFixed(1)}%</span>
            </div>
            <div className="metric">
              <span className="label">AVG_CTR</span>
              <span className="value">{globalStats.avgCtr.toFixed(1)}%</span>
            </div>
          </div>
        </GlassCard>
      </section>

      <div className="campaigns-list">
        {loading ? (
          <div className="py-24 relative min-h-[400px]">
            <HoloLoader 
              progress={Math.floor(Math.random() * 80) + 10} 
              phase="SCANNING_CAMPAIGN_VECTORS..." 
              isMuted={true} 
              onToggleMute={() => {}} 
              fullScreen={false} 
            />
          </div>
        ) : (
          campaigns.map((campaign) => {
            const recs = campaign.campaign_recipients || [];
            const recipientCount = recs.length;
            const openedCount = recs.filter((r: any) => r.status === 'opened' || r.status === 'clicked').length;
            const openRate = recipientCount > 0 ? ((openedCount / recipientCount) * 100).toFixed(1) : '0.0';

            return (
              <GlassCard key={campaign.id} className="campaign-item">
                <div className="campaign-header">
                  <div className="campaign-title">
                    <div className="status-indicator" style={{ background: getStatusColor(campaign.status) }} />
                    <h3>{campaign.name}</h3>
                    <span className="template-tag mono">{campaign.email_templates?.name}</span>
                  </div>
                  <div className="campaign-meta mono">
                    {campaign.status === 'scheduled' ? (
                      <><Clock size={12} /> {new Date(campaign.scheduled_at).toLocaleDateString()}</>
                    ) : (
                      <><CheckCircle2 size={12} /> {campaign.status.toUpperCase()}</>
                    )}
                  </div>
                </div>

                <div className="campaign-stats">
                  <div className="mini-stat">
                    <Users size={12} />
                    <span>RECIPIENTS: <b className="mono">{recipientCount}</b></span>
                  </div>
                  <div className="mini-stat">
                    <Send size={12} />
                    <span>SENT: <b className="mono">100%</b></span>
                  </div>
                  <div className="mini-stat">
                    <BarChart3 size={12} />
                    <span>OPEN_RATE: <b className="mono" style={{ color: Number(openRate) > 20 ? 'var(--success)' : 'var(--accent-cyan)' }}>{openRate}%</b></span>
                  </div>
                </div>

                <div className="campaign-actions">
                  <button className="action-btn" onClick={() => window.location.href = `/campaigns/${campaign.id}`}>
                    VIEW_DETAILED_ANALYTICS <ChevronRight size={14} />
                  </button>
                  {campaign.status === 'pending_approval' && (
                    <button className="approve-btn" onClick={() => handleLaunch(campaign.id, campaign.name)}>EXECUTE_APPROVAL</button>
                  )}
                </div>
              </GlassCard>
            );
          })
        )}
      </div>

      <style jsx>{`
        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 3rem;
        }
        .header-title h1 {
          font-size: 2.2rem;
          font-weight: 800;
          color: #fff;
        }
        .breadcrumb {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          color: var(--text-muted);
          letter-spacing: 2px;
          margin-bottom: 0.5rem;
          display: block;
        }
        .create-btn {
          background: var(--accent-cyan);
          color: #020617;
          border: none;
          padding: 0.75rem 1.25rem;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.75rem;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .create-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 20px rgba(0, 217, 255, 0.4);
        }
        .analytics-overview {
          margin-bottom: 3rem;
        }
        .card-header {
          padding: 1.5rem 2rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .card-header h2 {
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .metrics-grid {
          padding: 2rem;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }
        .metric {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .metric .label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.65rem;
          color: var(--text-muted);
          letter-spacing: 1.5px;
        }
        .metric .value {
          font-size: 2rem;
          font-weight: 800;
          color: #fff;
        }
        .campaigns-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .campaign-item {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .campaign-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .campaign-title {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          box-shadow: 0 0 10px currentColor;
        }
        .campaign-title h3 {
          font-size: 1.1rem;
          font-weight: 700;
        }
        .template-tag {
          font-size: 0.6rem;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 8px;
          border-radius: 4px;
          color: var(--accent-purple);
        }
        .campaign-meta {
          font-size: 0.7rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .campaign-stats {
          display: flex;
          gap: 2.5rem;
          padding: 1rem 0;
          border-top: 1px solid rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }
        .mini-stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .mini-stat b {
          color: #fff;
        }
        .campaign-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .action-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--accent-cyan);
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        .approve-btn {
          background: var(--accent-purple);
          color: #fff;
          border: none;
          padding: 0.5rem 1.25rem;
          border-radius: 6px;
          font-weight: 800;
          font-size: 0.7rem;
          cursor: pointer;
        }
        .loading {
          text-align: center;
          padding: 4rem;
          color: var(--text-muted);
          font-size: 0.8rem;
          letter-spacing: 2px;
        }
      `}</style>
    </AdminLayout>
  );
}
