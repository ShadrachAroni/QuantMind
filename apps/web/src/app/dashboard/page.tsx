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
  ArrowDownRight
} from 'lucide-react';

export default function DashboardPage() {
  const portfolios = [
    { id: '1', name: 'Tech Growth', value: '$124,500', change: '+12.4%', status: 'Balanced' },
    { id: '2', name: 'Safe Haven', value: '$85,200', change: '+2.1%', status: 'Low Risk' },
    { id: '3', name: 'Aggressive Alpha', value: '$42,000', change: '-5.2%', status: 'High Vol' },
  ];

  return (
    <div className="terminal-container">
      {/* Sidebar Navigation */}
      <aside className="terminal-sidebar">
        <div className="sidebar-brand">
          <span className="logo-accent">Q</span>M
        </div>
        <nav className="sidebar-icons">
          <Link href="/dashboard" title="Dashboard" className="active"><LayoutDashboard size={24} /></Link>
          <Link href="/portfolios" title="Portfolios"><PieChart size={24} /></Link>
          <Link href="/simulations" title="Simulations"><LineChart size={24} /></Link>
          <Link href="/assistant" title="AI Assistant"><MessageSquare size={24} /></Link>
          <div className="sidebar-divider" />
          <Link href="/settings" title="Settings"><Settings size={24} /></Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="terminal-main">
        {/* Top Header */}
        <header className="terminal-header">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Search instruments, portfolios, or AI prompts..." />
            <span className="search-shortcut">⌘K</span>
          </div>
          <div className="header-actions">
            <button className="icon-btn"><Bell size={20} /></button>
            <div className="user-info">
              <div className="avatar">JD</div>
              <span className="user-tier">PRO</span>
            </div>
          </div>
        </header>

        <section className="dashboard-content">
          <div className="dashboard-header-row">
            <div>
              <h1 className="page-title">Portfolio Console</h1>
              <p className="page-subtitle">Real-time risk analytics and Monte Carlo simulations.</p>
            </div>
            <button className="create-btn">
              <PlusCircle size={18} /> New Portfolio
            </button>
          </div>

          <div className="dashboard-grid">
            {/* Portfolio List */}
            <div className="grid-item portfolio-list">
              <div className="item-header">
                <h2>Your Portfolios</h2>
                <Link href="/portfolios" className="text-link">Edit All</Link>
              </div>
              <div className="portfolio-cards">
                {portfolios.map(p => (
                  <div key={p.id} className="p-card">
                    <div className="p-card-info">
                      <h3>{p.name}</h3>
                      <span className="p-status">{p.status}</span>
                    </div>
                    <div className="p-card-values">
                      <span className="p-value">{p.value}</span>
                      <span className={`p-change ${p.change.startsWith('+') ? 'up' : 'down'}`}>
                        {p.change.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {p.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulation Preview */}
            <div className="grid-item simulation-preview">
              <div className="item-header">
                <h2>Monte Carlo Simulation (GBM)</h2>
                <div className="simulation-toggles">
                  <button className="active">10k Path</button>
                  <button>Shocks</button>
                </div>
              </div>
              <div className="chart-area">
                <div className="fake-chart">
                  {/* CHART COMPONENT GOES HERE */}
                  <div className="chart-grid-lines" />
                  <div className="chart-bar-glow" />
                </div>
                <div className="chart-legend">
                   <span><i className="legend-dot median" /> Median (50th)</span>
                   <span><i className="legend-dot risk" /> Tail Risk (5th)</span>
                </div>
              </div>
            </div>

            {/* AI Context Panel */}
            <div className="grid-item ai-context">
              <div className="item-header">
                <h2>AI Risk Assistant</h2>
              </div>
              <div className="ai-message">
                 <div className="ai-avatar"><MessageSquare size={16} /></div>
                 <p>I've noticed your "Aggressive Alpha" portfolio has a <strong>95% VaR of $4,200</strong>. This is 12% higher than your set risk limit. Would you like me to suggest some hedging strategies?</p>
              </div>
              <div className="ai-suggestions">
                 <button>Hedging Strategies</button>
                 <button>Rebalance for Volatility</button>
              </div>
            </div>

            {/* Metrics Widget */}
            <div className="grid-item metrics-widget">
               <div className="metrics-summary">
                  <div className="metric">
                    <span className="m-label">Sharpe Ratio</span>
                    <span className="m-value">1.42</span>
                  </div>
                  <div className="metric">
                    <span className="m-label">Beta vs SPX</span>
                    <span className="m-value">0.85</span>
                  </div>
                  <div className="metric">
                    <span className="m-label">Max Drawdown</span>
                    <span className="m-value up">-14.2%</span>
                  </div>
               </div>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .terminal-container {
          display: flex;
          height: 100vh;
          overflow: hidden;
          background: var(--background);
        }

        .terminal-sidebar {
          width: 80px;
          background: #000;
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem 0;
        }

        .sidebar-brand {
          font-weight: 900;
          font-size: 1.5rem;
          color: #fff;
          margin-bottom: 3rem;
        }

        .logo-accent {
          color: var(--accent-cyan);
        }

        .sidebar-icons {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          flex: 1;
        }

        .sidebar-icons a {
          color: var(--text-muted);
          transition: color 0.2s;
        }

        .sidebar-icons a:hover, .sidebar-icons a.active {
          color: var(--accent-cyan);
        }

        .sidebar-divider {
          width: 30px;
          height: 1px;
          background: var(--border-color);
          margin: 0.5rem 0;
        }

        .terminal-main {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .terminal-header {
          height: 64px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
        }

        .search-bar {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          display: flex;
          align-items: center;
          padding: 0.4rem 1rem;
          width: 400px;
        }

        .search-bar input {
          background: transparent;
          border: none;
          color: #fff;
          margin-left: 0.8rem;
          width: 100%;
          outline: none;
          font-size: 0.85rem;
        }

        .search-shortcut {
          font-size: 0.7rem;
          color: var(--text-muted);
          background: rgba(255,255,255,0.1);
          padding: 2px 4px;
          border-radius: 4px;
        }

        .header-actions {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }

        .icon-btn {
          color: var(--text-muted);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        .avatar {
          width: 32px;
          height: 32px;
          background: var(--accent-purple);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .user-tier {
          font-size: 0.65rem;
          border: 1px solid var(--accent-cyan);
          color: var(--accent-cyan);
          padding: 1px 4px;
          border-radius: 4px;
        }

        .dashboard-content {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .dashboard-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .page-title {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .page-subtitle {
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .create-btn {
          background: var(--accent-cyan);
          color: #000;
          padding: 0.6rem 1.2rem;
          border-radius: 6px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 320px 1fr 340px;
          grid-template-rows: 1fr auto;
          gap: 1.5rem;
          height: calc(100vh - 250px);
        }

        .grid-item {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .item-header h2 {
          font-size: 1rem;
          font-weight: 700;
        }

        .text-link {
          font-size: 0.8rem;
          color: var(--accent-cyan);
        }

        .portfolio-cards {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .p-card {
          padding: 1rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .p-card:hover {
          border-color: var(--accent-cyan);
        }

        .p-card h3 {
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }

        .p-status {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .p-card-values {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .p-value {
          font-weight: 700;
          font-size: 0.95rem;
        }

        .p-change {
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .p-change.up { color: var(--success); }
        .p-change.down { color: var(--error); }

        .simulation-preview {
          grid-row: span 1;
        }

        .chart-area {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .fake-chart {
          flex: 1;
          background: #000;
          border-radius: 8px;
          position: relative;
          overflow: hidden;
          background-image: linear-gradient(rgba(0, 217, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 217, 255, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .chart-bar-glow {
          position: absolute;
          bottom: 20%;
          left: 0;
          right: 0;
          height: 60%;
          background: linear-gradient(to right, transparent, rgba(0, 217, 255, 0.1), transparent);
        }

        .chart-legend {
          display: flex;
          gap: 2rem;
          justify-content: center;
          padding-top: 1rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .legend-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 4px;
        }

        .legend-dot.median { background: var(--accent-cyan); }
        .legend-dot.risk { background: var(--error); }

        .ai-message {
          display: flex;
          gap: 1rem;
          background: rgba(124, 58, 237, 0.1);
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .ai-avatar {
          width: 32px;
          height: 32px;
          background: var(--accent-purple);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ai-message p {
          font-size: 0.85rem;
          line-height: 1.5;
        }

        .ai-suggestions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .ai-suggestions button {
          text-align: left;
          padding: 0.8rem 1rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-size: 0.8rem;
          transition: background 0.2s;
        }

        .ai-suggestions button:hover {
          background: rgba(255,255,255,0.08);
        }

        .metrics-widget {
           grid-column: span 3;
           padding: 1rem 1.5rem;
        }

        .metrics-summary {
          display: flex;
          justify-content: space-around;
        }

        .metric {
           display: flex;
           flex-direction: column;
           align-items: center;
           gap: 0.4rem;
        }

        .m-label {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .m-value {
           font-size: 1.25rem;
           font-weight: 800;
        }

        .m-value.up { color: var(--error); }
      `}</style>
    </div>
  );
}
