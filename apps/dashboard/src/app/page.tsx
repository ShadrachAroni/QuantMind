import Link from 'next/link';
import { Users, Shield, Activity, FileText, Settings, LogOut, ChevronRight } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    { label: 'Total Users', value: '1,284', icon: Users, color: '#00D9FF' },
    { label: 'Active Simulations', value: '45,021', icon: Activity, color: '#7C3AED' },
    { label: 'Open Tickets', value: '12', icon: FileText, color: '#F59E0B' },
    { label: 'System Health', value: '99.9%', icon: Shield, color: '#10B981' },
  ];

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="logo-text">Quant<span className="accent">Mind</span> <span className="admin-badge">Admin</span></span>
        </div>
        <nav className="sidebar-nav">
          <Link href="/dashboard" className="nav-item active">
            <Activity size={20} /> Dashboard
          </Link>
          <Link href="/users" className="nav-item">
            <Users size={20} /> User Management
          </Link>
          <Link href="/logs" className="nav-item">
            <FileText size={20} /> Audit Logs
          </Link>
          <Link href="/flags" className="nav-item">
            <Settings size={20} /> Feature Flags
          </Link>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn">
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <h1>Dashboard Overview</h1>
          <div className="user-profile">
            <span className="admin-name">Super Admin</span>
            <div className="avatar">SA</div>
          </div>
        </header>

        <section className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="stat-info">
                <span className="stat-label">{stat.label}</span>
                <span className="stat-value">{stat.value}</span>
              </div>
              <div className="stat-icon-wrapper" style={{ backgroundColor: `${stat.color}20` }}>
                <stat.icon size={24} color={stat.color} />
              </div>
            </div>
          ))}
        </section>

        <section className="dashboard-sections">
          <div className="recent-activity">
             <div className="section-header">
               <h2>Recent Audit Logs</h2>
               <Link href="/logs" className="view-all">View All <ChevronRight size={16} /></Link>
             </div>
             <div className="activity-list">
                <div className="activity-item">
                   <span className="activity-time">2 mins ago</span>
                   <span className="activity-desc"><strong>Admin</strong> updated user "john@example.com" to "PRO" tier.</span>
                </div>
                <div className="activity-item">
                   <span className="activity-time">15 mins ago</span>
                   <span className="activity-desc"><strong>System</strong> deployed OTA update "v1.2.4" to 5% cohort.</span>
                </div>
                <div className="activity-item">
                   <span className="activity-time">1 hour ago</span>
                   <span className="activity-desc"><strong>Security</strong> blocked IP 192.168.1.1 after 5 failed attempts.</span>
                </div>
             </div>
          </div>

          <div className="system-status">
             <div className="section-header">
               <h2>System Status</h2>
             </div>
             <div className="status-grid">
                <div className="status-item">
                   <span>Simulation Engine</span>
                   <span className="status-badge online">Online</span>
                </div>
                <div className="status-item">
                   <span>AI API (Anthropic)</span>
                   <span className="status-badge online">Operational</span>
                </div>
                <div className="status-item">
                   <span>Supabase Edge Fns</span>
                   <span className="status-badge online">99.9%</span>
                </div>
             </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .admin-layout {
          display: flex;
          min-height: 100vh;
        }

        .sidebar {
          width: 280px;
          background: var(--card-bg);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          padding: 2rem 0;
        }

        .sidebar-header {
          padding: 0 2rem 3rem;
          font-weight: 800;
          font-size: 1.25rem;
        }

        .accent {
          color: var(--accent-cyan);
        }

        .admin-badge {
          font-size: 0.7rem;
          background: var(--accent-purple);
          padding: 2px 6px;
          border-radius: 4px;
          vertical-align: middle;
          margin-left: 4px;
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 2rem;
          color: var(--text-muted);
          transition: all 0.2s;
        }

        .nav-item:hover, .nav-item.active {
          color: #fff;
          background: rgba(255, 255, 255, 0.05);
          border-left: 4px solid var(--accent-cyan);
        }

        .sidebar-footer {
          padding: 2rem;
          border-top: 1px solid var(--border-color);
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--error);
          font-weight: 600;
        }

        .main-content {
          flex: 1;
          background: var(--background);
          padding: 2rem 3rem;
        }

        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
        }

        .top-bar h1 {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .avatar {
          width: 40px;
          height: 40px;
          background: var(--accent-purple);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
           background: var(--card-bg);
           padding: 1.5rem;
           border-radius: 12px;
           border: 1px solid var(--border-color);
           display: flex;
           justify-content: space-between;
           align-items: center;
        }

        .stat-label {
          display: block;
          color: var(--text-muted);
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 800;
        }

        .stat-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dashboard-sections {
           display: grid;
           grid-template-columns: 2fr 1fr;
           gap: 2rem;
        }

        .recent-activity, .system-status {
           background: var(--card-bg);
           padding: 2rem;
           border-radius: 12px;
           border: 1px solid var(--border-color);
        }

        .section-header {
           display: flex;
           justify-content: space-between;
           align-items: center;
           margin-bottom: 1.5rem;
        }

        .section-header h2 {
          font-size: 1.1rem;
          font-weight: 700;
        }

        .view-all {
          font-size: 0.8rem;
          color: var(--accent-cyan);
          display: flex;
          align-items: center;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .activity-item {
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-time {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .activity-desc {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.9);
        }

        .status-grid {
           display: flex;
           flex-direction: column;
           gap: 1.5rem;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-badge {
          font-size: 0.75rem;
          padding: 4px 8px;
          border-radius: 100px;
          font-weight: 600;
        }

        .status-badge.online {
          background: rgba(16, 185, 129, 0.1);
          color: var(--success);
        }
      `}</style>
    </div>
  );
}
