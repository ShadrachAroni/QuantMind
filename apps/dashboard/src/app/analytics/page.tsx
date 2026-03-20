'use client';

import React from 'react';
import { AdminLayout } from '../../components/ui/AdminLayout';
import { SubscriptionAnalytics } from '../../components/analytics/SubscriptionAnalytics';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { Shield, Zap } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <AdminLayout>
      <GlowEffect color="#7C3AED" size={600} style={{ top: -100, right: -200, opacity: 0.15 }} />
      <GlowEffect color="#00D9FF" size={400} style={{ bottom: -50, left: -100, opacity: 0.1 }} />
      
      <header className="page-header">
        <div className="title-group">
          <span className="breadcrumb mono">INTEL // GROWTH_ANALYTICS</span>
          <h1>REVENUE_SIGNAL</h1>
        </div>
        <div className="status-indicator">
          <div className="pulse" />
          <span className="mono">STREAMING_LIVE_DATA</span>
        </div>
      </header>

      <SubscriptionAnalytics />

      <footer className="page-footer">
        <Zap size={14} color="var(--text-muted)" />
        <span className="mono">QUANTMIND_OS // SUBSCRIPTION_ENGINE_v4.2 // SECURE_ACCESS_GRANTED</span>
      </footer>

      <style jsx>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 4rem;
        }

        .breadcrumb {
          font-size: 0.7rem;
          color: var(--text-muted);
          letter-spacing: 2px;
          margin-bottom: 0.5rem;
          display: block;
        }

        h1 {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -1px;
          color: #fff;
          margin: 0;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(50, 215, 75, 0.05);
          border: 1px solid rgba(50, 215, 75, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          color: var(--success);
          font-size: 0.65rem;
          letter-spacing: 1px;
        }

        .pulse {
          width: 6px;
          height: 6px;
          background: var(--success);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--success);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0.4; transform: scale(0.8); }
        }

        .page-footer {
          margin-top: 4rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          opacity: 0.3;
          font-size: 0.65rem;
          color: var(--text-muted);
          letter-spacing: 1px;
          padding-bottom: 4rem;
        }
      `}</style>
    </AdminLayout>
  );
}
