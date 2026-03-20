'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { GlassCard } from '../ui/GlassCard';
import { BarChart3, TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

export function SubscriptionAnalytics() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    mrr: 0,
    tierDistribution: {
      free: 0,
      plus: 0,
      pro: 0,
      student: 0,
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    
    // Fetch user profiles for tier distribution
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('tier');

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      return;
    }

    // Fetch active subscriptions for MRR calculation
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('status', 'active');

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      return;
    }

    const distribution = { free: 0, plus: 0, pro: 0, student: 0 };
    profiles?.forEach(p => {
      if (distribution.hasOwnProperty(p.tier)) {
        distribution[p.tier as keyof typeof distribution]++;
      }
    });

    // Approximate MRR (Monthly Recurring Revenue)
    // Prices: Plus $9.99, Pro $19.99, Student $4.99
    const PRICE_MAP = { free: 0, plus: 9.99, pro: 19.99, student: 4.99 };
    let totalMRR = 0;
    subscriptions?.forEach(s => {
      totalMRR += PRICE_MAP[s.tier as keyof typeof PRICE_MAP] || 0;
    });

    setStats({
      totalUsers: profiles?.length || 0,
      activeSubscriptions: subscriptions?.length || 0,
      mrr: totalMRR,
      tierDistribution: distribution,
    });
    setLoading(false);
  }

  if (loading) return <div className="loading mono">CALCULATING_METRICS...</div>;

  return (
    <div className="analytics-grid">
      <GlassCard className="stat-card" intensity="low">
        <div className="stat-icon mrr">
          <DollarSign size={20} />
        </div>
        <div className="stat-info">
          <Typography variant="mono" className="stat-label">MONTHLY_RECURRING_REV</Typography>
          <Typography variant="h3" className="stat-value">${stats.mrr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
          <div className="stat-trend positive">
            <TrendingUp size={12} />
            <span className="mono">+12.4% // PERIOD</span>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="stat-card" intensity="low">
        <div className="stat-icon users">
          <Users size={20} />
        </div>
        <div className="stat-info">
          <Typography variant="mono" className="stat-label">TOTAL_REGISTRY_ENTRIES</Typography>
          <Typography variant="h3" className="stat-value">{stats.totalUsers.toLocaleString()}</Typography>
          <div className="stat-trend positive">
            <TrendingUp size={12} />
            <span className="mono">+4.2% // PERIOD</span>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="stat-card" intensity="low">
        <div className="stat-icon active">
          <Activity size={20} />
        </div>
        <div className="stat-info">
          <Typography variant="mono" className="stat-label">ACTIVE_SUBS_SIGNAL</Typography>
          <Typography variant="h3" className="stat-value">{stats.activeSubscriptions.toLocaleString()}</Typography>
          <div className="stat-trend positive">
            <TrendingUp size={12} />
            <span className="mono">+2.1% // PERIOD</span>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="distribution-card" intensity="medium">
        <div className="card-header">
           <BarChart3 size={16} color="var(--accent-cyan)" />
           <span className="mono">TIER_DISTRIBUTION_MATRIX</span>
        </div>
        <div className="bars-container">
          {Object.entries(stats.tierDistribution).map(([tier, count]) => {
            const percentage = stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0;
            return (
              <div key={tier} className="distribution-row">
                <div className="row-info">
                  <span className={`tier-label mono ${tier}`}>{tier.toUpperCase()}</span>
                  <span className="mono count">{count}</span>
                </div>
                <div className="bar-wrapper">
                  <div 
                    className={`bar ${tier}`} 
                    style={{ width: `${Math.max(2, percentage)}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <style jsx>{`
        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: auto auto;
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          padding: 1.5rem;
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .stat-icon.mrr { color: var(--success); background: rgba(50, 215, 75, 0.05); }
        .stat-icon.users { color: var(--accent-cyan); background: rgba(0, 212, 255, 0.05); }
        .stat-icon.active { color: var(--secondary); background: rgba(123, 95, 255, 0.05); }

        .stat-info {
          flex: 1;
        }

        .stat-label {
          font-size: 0.65rem;
          color: var(--text-muted);
          letter-spacing: 1.5px;
          margin-bottom: 0.5rem;
          display: block;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 0.5rem;
        }

        .stat-trend {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.6rem;
          font-weight: 700;
        }

        .stat-trend.positive { color: var(--success); }

        .distribution-card {
          grid-column: span 3;
          padding: 1.5rem 2rem;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.7rem;
          color: var(--text-muted);
          letter-spacing: 1px;
          margin-bottom: 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 1rem;
        }

        .bars-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .distribution-row {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .row-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tier-label {
          font-size: 0.7rem;
          font-weight: 800;
        }

        .tier-label.free { color: var(--text-muted); }
        .tier-label.plus { color: var(--accent-cyan); }
        .tier-label.pro { color: var(--secondary); }
        .tier-label.student { color: var(--warning); }

        .count {
          font-size: 0.8rem;
          color: #fff;
          opacity: 0.8;
        }

        .bar-wrapper {
          height: 6px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 3px;
          overflow: hidden;
        }

        .bar {
          height: 100%;
          border-radius: 3px;
        }

        .bar.free { background: var(--text-muted); opacity: 0.3; }
        .bar.plus { background: var(--accent-cyan); box-shadow: 0 0 10px var(--accent-cyan); }
        .bar.pro { background: var(--secondary); box-shadow: 0 0 10px var(--secondary); }
        .bar.student { background: var(--warning); box-shadow: 0 0 10px var(--warning); }

        .loading {
          padding: 4rem;
          text-align: center;
          color: var(--text-muted);
          letter-spacing: 2px;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}

function Typography({ variant, children, className }: any) {
  const Tag = variant === 'h3' ? 'h3' : 'span';
  return <Tag className={`typography ${variant} ${className}`}>{children}</Tag>;
}
