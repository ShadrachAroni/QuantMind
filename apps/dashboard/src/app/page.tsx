'use client';

import Link from 'next/link';
import { Users, Shield, Activity, FileText, Settings, LogOut, ChevronRight, Zap, Target } from 'lucide-react';
import { AdminLayout } from '../components/ui/AdminLayout';
import { GlassCard } from '../components/ui/GlassCard';
import { GlowEffect } from '../components/ui/GlowEffect';
import { useAuth } from '../components/auth/AuthProvider';

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const stats = [
    { label: 'TOTAL_USERS', value: '1,284', icon: Users, color: '#00D9FF' },
    { label: 'ACTIVE_SIMULATIONS', value: '45,021', icon: Activity, color: '#7C3AED' },
    { label: 'OPEN_TICKETS', value: '12', icon: FileText, color: '#F59E0B' },
    { label: 'SYSTEM_HEALTH', value: '99.9%', icon: Shield, color: '#10B981' },
  ];

  return (
    <AdminLayout>
      <GlowEffect color="#7C3AED" size={600} style={{ top: -200, right: -200, opacity: 0.15 }} />
      <GlowEffect color="#00D9FF" size={500} style={{ bottom: -200, left: -200, opacity: 0.1 }} />

      <header className="top-bar">
        <div className="header-title">
          <span className="breadcrumb">TERMINAL // OVERVIEW</span>
          <h1>DASHBOARD_CONSOLE</h1>
        </div>
        <div className="user-profile">
          <div className="user-meta">
            <span className="admin-name">{user?.email?.split('@')[0].toUpperCase()}</span>
            <span className="admin-status">AUTHORIZED_SESSION // MFA_ACTIVE</span>
          </div>
          <div className="avatar">{user?.email?.[0].toUpperCase()}</div>
        </div>
      </header>

      <section className="stats-grid">
        {stats.map((stat, idx) => (
          <GlassCard key={stat.label} intensity="low" className="stat-card">
            <div className="stat-content">
              <div className="stat-info">
                <span className="stat-label mono">{stat.label}</span>
                <span className="stat-value mono">{stat.value}</span>
              </div>
              <div className="stat-icon-wrapper" style={{ boxShadow: `0 0 20px ${stat.color}20` }}>
                <stat.icon size={20} color={stat.color} />
              </div>
            </div>
            <div className="stat-edge" style={{ background: stat.color }} />
          </GlassCard>
        ))}
      </section>

      <div className="dashboard-grid">
        <GlassCard className="recent-activity">
          <div className="section-header">
            <div className="title-row">
              <FileText size={16} color="var(--accent-cyan)" />
              <h2>AUDIT_STREAM</h2>
            </div>
            <Link href="/logs" className="view-all">ACCESS_FULL_TRAIL <ChevronRight size={14} /></Link>
          </div>
          <div className="activity-list">
            {[
              { time: '2m', type: 'ADMIN_ACTION', desc: 'Updated user "john@example.com" to "PRO" tier.' },
              { time: '15m', type: 'SYS_OTA', desc: 'Deployed OTA update "v1.2.4" to 5% cohort.' },
              { time: '1h', type: 'SECURITY_BLK', desc: 'Blocked IP 192.168.1.1 after 5 failed attempts.' },
              { time: '3h', type: 'KERNEL_LOG', desc: 'Simulations convolved: 14,200 paths processed.' },
            ].map((item, i) => (
              <div key={i} className="activity-item">
                <div className="activity-meta">
                  <span className="activity-time mono">{item.time}_AGO</span>
                  <span className="activity-type mono">{item.type}</span>
                </div>
                <p className="activity-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="system-status">
          <div className="section-header">
            <div className="title-row">
              <Activity size={16} color="var(--accent-purple)" />
              <h2>SYSTEM_HEALTH</h2>
            </div>
          </div>
          <div className="status-grid">
            {[
              { name: 'SIMULATION_ENGINE', status: 'ONLINE', value: '99.9%', color: 'var(--success)' },
              { name: 'AI_ORACLE_API', status: 'OPERATIONAL', value: 'OK', color: 'var(--success)' },
              { name: 'TRANSCODER_NODES', status: 'SCALING', value: 'X4', color: 'var(--accent-cyan)' },
              { name: 'SECURITY_KERNEL', status: 'LOCKED', value: 'SHIELD_ON', color: 'var(--success)' },
            ].map((sys) => (
              <div key={sys.name} className="status-item">
                <div className="sys-info">
                  <span className="sys-name mono">{sys.name}</span>
                  <span className="sys-status" style={{ color: sys.color }}>{sys.status}</span>
                </div>
                <span className="sys-value mono">{sys.value}</span>
              </div>
            ))}
          </div>
          
          <div className="health-metrics">
             <div className="metrics-chip">
                <Zap size={10} color="var(--accent-cyan)" />
                <span className="mono">CPU: 12.4%</span>
             </div>
             <div className="metrics-chip">
                <Target size={10} color="var(--accent-purple)" />
                <span className="mono">LATENCY: 42ms</span>
             </div>
          </div>
        </GlassCard>
      </div>

      <style jsx>{`
        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 3.5rem;
        }

        .breadcrumb {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          color: var(--text-muted);
          letter-spacing: 2px;
          margin-bottom: 0.5rem;
          display: block;
        }

        .header-title h1 {
          font-size: 2.2rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #fff;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          background: rgba(255, 255, 255, 0.03);
          padding: 0.5rem 0.5rem 0.5rem 1.25rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .user-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .admin-name {
          font-weight: 700;
          font-size: 0.9rem;
        }

        .admin-status {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.6rem;
          color: var(--success);
          letter-spacing: 0.5px;
        }

        .avatar {
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, var(--accent-purple), var(--accent-cyan));
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.85rem;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-content {
          padding: 1.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .stat-label {
          font-size: 0.65rem;
          color: var(--text-muted);
          letter-spacing: 1.5px;
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #fff;
        }

        .stat-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .stat-edge {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          opacity: 0.5;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 2rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 2rem 2rem 0;
        }

        .title-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .section-header h2 {
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .view-all {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.65rem;
          color: var(--accent-cyan);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          opacity: 0.8;
          transition: opacity 0.2s;
        }

        .view-all:hover {
          opacity: 1;
        }

        .activity-list {
          padding: 0 2rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .activity-item {
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.03);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          transition: transform 0.2s, border-color 0.2s;
        }

        .activity-item:hover {
          transform: translateX(4px);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .activity-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .activity-time {
          font-size: 0.6rem;
          color: var(--text-muted);
        }

        .activity-type {
          font-size: 0.6rem;
          padding: 2px 6px;
          background: rgba(124, 58, 237, 0.1);
          color: var(--accent-purple);
          border-radius: 4px;
        }

        .activity-desc {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.4;
        }

        .status-grid {
          padding: 0 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }

        .sys-info {
           display: flex;
           flex-direction: column;
           gap: 0.25rem;
        }

        .sys-name {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .sys-status {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .sys-value {
          font-size: 0.9rem;
          font-weight: 700;
        }

        .health-metrics {
           padding: 0 2rem 2rem;
           display: flex;
           gap: 1rem;
        }

        .metrics-chip {
           display: flex;
           align-items: center;
           gap: 0.5rem;
           background: rgba(255, 255, 255, 0.05);
           padding: 6px 12px;
           border-radius: 8px;
           font-size: 0.65rem;
           color: var(--text-muted);
        }
      `}</style>
    </AdminLayout>
  );
}
