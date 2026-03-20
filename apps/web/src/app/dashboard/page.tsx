'use client';

import React from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  PieChart, 
  LineChart, 
  MessageSquare, 
  Settings, 
  PlusCircle, 
  Search,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Shield,
  Zap,
  Cpu
} from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';

export default function DashboardPage() {
  const portfolios = [
    { id: '1', name: 'TECH_GROWTH_V4', value: '$124,500', change: '+12.4%', status: 'BALANCED', color: 'var(--accent-cyan)' },
    { id: '2', name: 'SAFE_HAVEN_TREASURY', value: '$85,200', change: '+2.1%', status: 'LOW_RISK', color: 'var(--success)' },
    { id: '3', name: 'AGGRESSIVE_ALPHA_X', value: '$42,000', change: '-5.2%', status: 'HIGH_VOL', color: 'var(--error)' },
  ];

  return (
    <div className="terminal-container">
      <GlowEffect color="var(--accent-purple)" size={800} style={{ top: '-10%', left: '-5%', opacity: 0.1 }} />
      <GlowEffect color="var(--accent-cyan)" size={600} style={{ bottom: '10%', right: '5%', opacity: 0.08 }} />

      {/* Sidebar Navigation */}
      <aside className="terminal-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Zap size={20} fill="var(--accent-cyan)" color="var(--accent-cyan)" />
          </div>
        </div>
        <nav className="sidebar-icons">
          <Link href="/dashboard" title="Dashboard" className="nav-link active">
            <LayoutDashboard size={20} />
            <div className="active-indicator" />
          </Link>
          <Link href="/portfolios" title="Portfolios" className="nav-link"><PieChart size={20} /></Link>
          <Link href="/simulations" title="Simulations" className="nav-link"><LineChart size={20} /></Link>
          <Link href="/assistant" title="AI Assistant" className="nav-link"><MessageSquare size={20} /></Link>
          <div className="sidebar-divider" />
          <Link href="/settings" title="Settings" className="nav-link"><Settings size={20} /></Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="terminal-main">
        {/* Top Header */}
        <header className="terminal-header">
          <div className="search-wrapper">
             <div className="search-bar">
                <Search size={16} color="var(--text-muted)" />
                <input type="text" placeholder="EXECUTE_COMMAND_OR_SEARCH..." className="mono" />
                <div className="search-shortcut mono">CTRL+K</div>
             </div>
          </div>

          <div className="header-actions">
            <button className="notification-btn">
              <Bell size={20} color="var(--text-muted)" />
              <div className="notif-dot" />
            </button>
            <div className="user-profile">
               <div className="user-meta mono">
                  <span className="user-name">OPERATOR_ID::SHIFT_7</span>
                  <span className="user-access">ACCESS_LEVEL::PRO</span>
               </div>
               <div className="avatar-ring">
                  <div className="avatar">QM</div>
               </div>
            </div>
          </div>
        </header>

        <section className="dashboard-content">
          <div className="content-header">
            <div className="title-group">
              <div className="status-indicator">
                 <div className="pulse-dot" />
                 <span className="mono">SYSTEM_STABLE // REALTIME_FEED_ACTIVE</span>
              </div>
              <h1 className="page-title">EXECUTIVE_CONSOLE</h1>
            </div>
            <button className="action-btn">
              <PlusCircle size={18} /> <span>INITIALIZE_PORTFOLIO</span>
            </button>
          </div>

          <div className="dashboard-grid">
            {/* Portfolio Matrix */}
            <GlassCard className="grid-item portfolio-matrix" intensity="low">
              <div className="item-header">
                <div className="header-left">
                  <Cpu size={16} color="var(--accent-cyan)" />
                  <h2 className="mono">PORTFOLIO_REGISTRY</h2>
                </div>
                <Link href="/portfolios" className="text-secondary mono">VIEW_ALL</Link>
              </div>
              <div className="registry-list">
                {portfolios.map(p => (
                  <div key={p.id} className="registry-entry">
                    <div className="entry-main">
                       <div className="entry-indicator" style={{ background: p.color }} />
                       <div className="entry-info">
                          <h3 className="mono">{p.name}</h3>
                          <span className="entry-status mono">{p.status}</span>
                       </div>
                    </div>
                    <div className="entry-metrics">
                       <span className="entry-val mono">{p.value}</span>
                       <span className={`entry-delta mono ${p.change.startsWith('+') ? 'up' : 'down'}`}>
                         {p.change}
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Performance Engine */}
            <GlassCard className="grid-item simulation-engine" intensity="low">
              <div className="item-header">
                <div className="header-left">
                   <TrendingUp size={16} color="var(--accent-purple)" />
                   <h2 className="mono">MONTE_CARLO_ENGINE</h2>
                </div>
                <div className="engine-status">
                   <span className="mono">10K_ITERATIONS</span>
                </div>
              </div>
              <div className="visualization-container">
                 <div className="grid-bg">
                    <div className="scan-line" />
                    <div className="chart-glow" />
                 </div>
                 <div className="viz-legend mono">
                    <div className="legend-item">
                       <div className="dot median" />
                       <span>MEDIAN_PROJECTION</span>
                    </div>
                    <div className="legend-item">
                       <div className="dot risk" />
                       <span>TAIL_RISK_5%</span>
                    </div>
                 </div>
              </div>
            </GlassCard>

            {/* AI Core */}
            <GlassCard className="grid-item ai-core" intensity="medium">
              <div className="item-header">
                <div className="header-left">
                  <div className="ai-icon-bg">
                    <MessageSquare size={14} color="#fff" />
                  </div>
                  <h2 className="mono">RISK_ASSISTANT_AI</h2>
                </div>
              </div>
              <div className="ai-feed">
                 <div className="ai-bubble">
                    <p>Anomaly detected in <span className="highlight">AGGRESSIVE_ALPHA_X</span>. Volatility skew suggests potential downside risk exceeding 2.4σ. Deployment of tail-risk hedges is recommended.</p>
                 </div>
                 <div className="ai-controls">
                    <button className="suggest-btn mono">EXECUTE_REBALANCE</button>
                    <button className="suggest-btn mono">RISK_DECOMPOSITION</button>
                 </div>
              </div>
            </GlassCard>

            {/* Global Metrics */}
            <GlassCard className="grid-item global-metrics" intensity="low">
               <div className="metrics-belt">
                  <div className="metric-unit">
                    <span className="m-tag mono">SHARPE_RATIO</span>
                    <span className="m-val mono">1.42</span>
                  </div>
                  <div className="metric-sep" />
                  <div className="metric-unit">
                    <span className="m-tag mono">PORTFOLIO_BETA</span>
                    <span className="m-val mono">0.85</span>
                  </div>
                  <div className="metric-sep" />
                  <div className="metric-unit">
                    <span className="m-tag mono">MAX_DRAWDOWN</span>
                    <span className="m-val mono error">-14.2%</span>
                  </div>
                  <div className="metric-sep" />
                  <div className="metric-unit">
                    <span className="m-tag mono">ALPHA_GEN</span>
                    <span className="m-val mono success">+4.8%</span>
                  </div>
               </div>
            </GlassCard>
          </div>
        </section>
      </main>

      <style jsx>{`
        .terminal-container {
          display: flex;
          height: 100vh;
          overflow: hidden;
          background: var(--background);
          color: #fff;
          position: relative;
        }

        .terminal-sidebar {
          width: 72px;
          background: rgba(0, 0, 0, 0.4);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem 0;
          backdrop-blur-xl: ;
          z-index: 10;
        }

        .sidebar-brand {
          margin-bottom: 4rem;
        }

        .brand-icon {
          width: 40px;
          height: 40px;
          background: rgba(0, 217, 255, 0.1);
          border: 1px solid rgba(0, 217, 255, 0.2);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sidebar-icons {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          flex: 1;
        }

        .nav-link {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 12px;
        }

        .nav-link:hover {
          color: var(--accent-cyan);
          background: rgba(255, 255, 255, 0.05);
        }

        .nav-link.active {
          color: var(--accent-cyan);
          background: rgba(0, 217, 255, 0.08);
          border: 1px solid rgba(0, 217, 255, 0.15);
        }

        .active-indicator {
          position: absolute;
          left: -14px;
          width: 4px;
          height: 20px;
          background: var(--accent-cyan);
          border-radius: 0 4px 4px 0;
          box-shadow: 0 0 10px var(--accent-cyan);
        }

        .sidebar-divider {
          width: 24px;
          height: 1px;
          background: var(--border-color);
          margin: 1rem 0;
        }

        .terminal-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 5;
        }

        .terminal-header {
          height: 80px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 3rem;
          background: rgba(5, 7, 10, 0.4);
          backdrop-filter: blur(10px);
        }

        .search-bar {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          display: flex;
          align-items: center;
          padding: 0.6rem 1.25rem;
          width: 460px;
          gap: 1rem;
          transition: border-color 0.2s;
        }

        .search-bar:focus-within {
           border-color: var(--accent-cyan);
        }

        .search-bar input {
          background: transparent;
          border: none;
          color: #fff;
          width: 100%;
          outline: none;
          font-size: 0.8rem;
          letter-spacing: 0.5px;
        }

        .search-shortcut {
          font-size: 0.65rem;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.05);
          padding: 3px 6px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .header-actions {
          display: flex;
          gap: 2.5rem;
          align-items: center;
        }

        .notification-btn {
          position: relative;
        }

        .notif-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background: var(--error);
          border-radius: 50%;
          border: 2px solid var(--background);
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .user-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .user-name {
          font-size: 0.75rem;
          font-weight: 700;
          color: #fff;
        }

        .user-access {
          font-size: 0.6rem;
          color: var(--accent-cyan);
          letter-spacing: 1px;
        }

        .avatar-ring {
           padding: 3px;
           border: 1px solid var(--accent-purple);
           border-radius: 50%;
        }

        .avatar {
          width: 34px;
          height: 34px;
          background: linear-gradient(135deg, var(--accent-purple), #4f46e5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 800;
        }

        .dashboard-content {
          flex: 1;
          padding: 3rem;
          overflow-y: auto;
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 3.5rem;
        }

        .status-indicator {
           display: flex;
           align-items: center;
           gap: 0.75rem;
           margin-bottom: 0.75rem;
        }

        .pulse-dot {
           width: 8px;
           height: 8px;
           background: var(--success);
           border-radius: 50%;
           box-shadow: 0 0 8px var(--success);
           animation: pulse 2s infinite;
        }

        @keyframes pulse {
           0% { opacity: 0.4; transform: scale(0.9); }
           50% { opacity: 1; transform: scale(1.1); }
           100% { opacity: 0.4; transform: scale(0.9); }
        }

        .status-indicator span {
           font-size: 0.65rem;
           color: var(--text-muted);
           letter-spacing: 1.5px;
        }

        .page-title {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -1px;
          color: #fff;
        }

        .action-btn {
          background: #fff;
          color: #000;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.8rem;
          letter-spacing: 0.5px;
        }

        .action-btn:hover {
           transform: translateY(-2px);
           box-shadow: 0 10px 20px rgba(255, 255, 255, 0.1);
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 360px 1fr 380px;
          grid-template-rows: auto auto;
          gap: 1.75rem;
        }

        .grid-item {
          padding: 2rem;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .header-left {
           display: flex;
           align-items: center;
           gap: 0.75rem;
        }

        .item-header h2 {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: var(--text-muted);
        }

        .text-secondary {
          font-size: 0.7rem;
          color: var(--accent-cyan);
          letter-spacing: 1px;
        }

        .registry-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .registry-entry {
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s;
        }

        .registry-entry:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .entry-main {
           display: flex;
           align-items: center;
           gap: 1rem;
        }

        .entry-indicator {
           width: 4px;
           height: 32px;
           border-radius: 2px;
        }

        .entry-info h3 {
          font-size: 0.85rem;
          font-weight: 700;
          margin-bottom: 0.2rem;
        }

        .entry-status {
          font-size: 0.65rem;
          color: var(--text-muted);
          letter-spacing: 0.5px;
        }

        .entry-metrics {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
        }

        .entry-val {
          font-weight: 700;
          font-size: 1rem;
        }

        .entry-delta {
          font-size: 0.7rem;
          font-weight: 700;
        }

        .entry-delta.up { color: var(--success); }
        .entry-delta.down { color: var(--error); }

        .simulation-engine {
           height: 480px;
           display: flex;
           flex-direction: column;
        }

        .visualization-container {
           flex: 1;
           display: flex;
           flex-direction: column;
           gap: 1.5rem;
        }

        .grid-bg {
           flex: 1;
           background: #000;
           border-radius: 12px;
           position: relative;
           overflow: hidden;
           border: 1px solid rgba(255, 255, 255, 0.05);
           background-image: 
             linear-gradient(rgba(0, 217, 255, 0.03) 1px, transparent 1px),
             linear-gradient(90deg, rgba(0, 217, 255, 0.03) 1px, transparent 1px);
           background-size: 32px 32px;
        }

        .scan-line {
           position: absolute;
           top: 0;
           left: 0;
           right: 0;
           height: 2px;
           background: linear-gradient(to right, transparent, var(--accent-cyan), transparent);
           opacity: 0.3;
           animation: scan 4s linear infinite;
        }

        @keyframes scan {
           from { top: 0% }
           to { top: 100% }
        }

        .chart-glow {
           position: absolute;
           bottom: 25%;
           left: 0;
           right: 0;
           height: 50%;
           background: radial-gradient(ellipse at center, rgba(0, 217, 255, 0.08), transparent);
        }

        .viz-legend {
           display: flex;
           gap: 3rem;
           justify-content: center;
        }

        .legend-item {
           display: flex;
           align-items: center;
           gap: 0.75rem;
           font-size: 0.65rem;
           color: var(--text-muted);
           letter-spacing: 1px;
        }

        .dot {
           width: 8px;
           height: 8px;
           border-radius: 2px;
        }

        .dot.median { background: var(--accent-cyan); box-shadow: 0 0 10px var(--accent-cyan); }
        .dot.risk { background: var(--error); box-shadow: 0 0 10px var(--error); }

        .ai-core {
           border: 1px solid rgba(124, 58, 237, 0.2) !important;
        }

        .ai-icon-bg {
           width: 28px;
           height: 28px;
           background: var(--accent-purple);
           border-radius: 8px;
           display: flex;
           align-items: center;
           justify-content: center;
        }

        .ai-feed {
           display: flex;
           flex-direction: column;
           gap: 2rem;
        }

        .ai-bubble {
           background: rgba(124, 58, 237, 0.08);
           border: 1px solid rgba(124, 58, 237, 0.15);
           padding: 1.5rem;
           border-radius: 16px 16px 16px 4px;
        }

        .ai-bubble p {
           font-size: 0.9rem;
           line-height: 1.6;
           color: rgba(255, 255, 255, 0.9);
        }

        .highlight {
           color: var(--accent-cyan);
           font-weight: 700;
           font-family: 'JetBrains Mono', monospace;
        }

        .ai-controls {
           display: flex;
           flex-direction: column;
           gap: 0.75rem;
        }

        .suggest-btn {
           text-align: left;
           padding: 1rem 1.25rem;
           background: rgba(255, 255, 255, 0.03);
           border: 1px solid rgba(255, 255, 255, 0.06);
           border-radius: 10px;
           font-size: 0.7rem;
           color: var(--text-muted);
           letter-spacing: 1px;
        }

        .suggest-btn:hover {
           background: rgba(255, 255, 255, 0.08);
           color: #fff;
           border-color: rgba(255, 255, 255, 0.12);
        }

        .global-metrics {
           grid-column: span 3;
           padding: 1.5rem !important;
        }

        .metrics-belt {
           display: flex;
           justify-content: space-between;
           align-items: center;
           padding: 0 4rem;
        }

        .metric-unit {
           display: flex;
           flex-direction: column;
           align-items: center;
           gap: 0.5rem;
        }

        .m-tag {
           font-size: 0.65rem;
           color: var(--text-muted);
           letter-spacing: 2px;
        }

        .m-val {
           font-size: 1.5rem;
           font-weight: 800;
        }

        .m-val.success { color: var(--success); }
        .m-val.error { color: var(--error); }

        .metric-sep {
           width: 1px;
           height: 40px;
           background: linear-gradient(to bottom, transparent, var(--border-color), transparent);
        }
      `}</style>
    </div>
  );
}
