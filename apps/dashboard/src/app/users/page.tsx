'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Activity, Shield, MoreHorizontal, ChevronLeft, ChevronRight, Search, Database } from 'lucide-react';
import { AdminLayout } from '../../components/ui/AdminLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchUsers();
  }, [page]);

  async function fetchUsers() {
    setLoading(true);
    // Fetch profiles with their active subscription status
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        subscriptions:subscriptions(status, current_period_end)
      `)
      .range((page - 1) * pageSize, page * pageSize - 1)
      .ilike('id', `%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (data) {
      // Flatten the subscription status for easier rendering
      const processedUsers = data.map(u => ({
        ...u,
        subscription_status: (u.subscriptions as any)?.[0]?.status || 'none',
        period_end: (u.subscriptions as any)?.[0]?.current_period_end
      }));
      setUsers(processedUsers);
    }
    setLoading(false);
  }

  async function updateTier(userId: string, tier: string) {
    const { error } = await supabase
      .from('user_profiles')
      .update({ tier })
      .eq('id', userId);
    
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, tier } : u));
    }
  }

  return (
    <AdminLayout>
      <GlowEffect color="#7C3AED" size={500} style={{ bottom: -100, right: -200, opacity: 0.1 }} />
      
      <header className="top-bar">
        <div className="header-title">
          <span className="breadcrumb">REGISTRY // MANAGEMENT</span>
          <h1>USER_GOVERNANCE</h1>
        </div>
        <div className="header-actions">
           <div className="search-box">
              <Search size={14} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="SEARCH_REGISTRY..." 
                className="mono"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              />
           </div>
        </div>
      </header>

      <GlassCard className="table-wrapper" intensity="low">
        <div className="table-header">
           <div className="header-info">
              <Database size={14} color="var(--accent-cyan)" />
              <span className="mono">ACTIVE_ENTRIES</span>
           </div>
        </div>
        <div className="scroll-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="mono">IDENTIFIER</th>
                <th className="mono">SERVICE_TIER</th>
                <th className="mono">STATUS</th>
                <th className="mono">RENEWAL</th>
                <th className="mono">ONBOARDING</th>
                <th className="mono">TIMESTAMP</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="loading-row mono">FETCHING_REGISTRY...</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td className="mono user-id">{u.id.substring(0, 18).toUpperCase()}...</td>
                    <td>
                      <select 
                        value={u.tier} 
                        onChange={(e) => updateTier(u.id, e.target.value)}
                        className={`tier-select mono ${u.tier}`}
                      >
                        <option value="free">FREE</option>
                        <option value="plus">PLUS</option>
                        <option value="pro">PRO</option>
                        <option value="student">STUDENT</option>
                      </select>
                    </td>
                    <td>
                      <span className={`status-pill mono ${u.subscription_status}`}>
                        {u.subscription_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="timestamp mono">
                      {u.period_end ? new Date(u.period_end).toLocaleDateString().toUpperCase() : 'N/A'}
                    </td>
                    <td>
                      <span className={`status-pill mono ${u.onboarding_completed ? 'completed' : 'pending'}`}>
                        {u.onboarding_completed ? 'COMPLETED' : 'PENDING'}
                      </span>
                    </td>
                    <td className="timestamp mono">{new Date(u.created_at).toLocaleDateString().toUpperCase()}</td>
                    <td className="actions">
                      <button className="action-icon"><MoreHorizontal size={18} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <div className="pagination mono">
         <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="page-btn">
           <ChevronLeft size={18} />
         </button>
         <span className="page-indicator">BLOCK_{page.toString().padStart(3, '0')}</span>
         <button onClick={() => setPage(p => p + 1)} className="page-btn">
           <ChevronRight size={18} />
         </button>
      </div>

      <style jsx>{`
        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 3rem;
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

        .search-box {
           background: rgba(255, 255, 255, 0.03);
           border: 1px solid rgba(255, 255, 255, 0.05);
           border-radius: 8px;
           padding: 0.75rem 1.25rem;
           display: flex;
           align-items: center;
           gap: 1rem;
           width: 400px;
        }

        .search-box input {
           background: transparent;
           border: none;
           color: #fff;
           font-size: 0.8rem;
           width: 100%;
           outline: none;
        }

        .table-wrapper {
           overflow: hidden;
        }

        .table-header {
           padding: 1.5rem 2rem;
           border-bottom: 1px solid rgba(255, 255, 255, 0.05);
           background: rgba(255, 255, 255, 0.01);
        }

        .header-info {
           display: flex;
           align-items: center;
           gap: 0.75rem;
           font-size: 0.7rem;
           color: var(--text-muted);
           letter-spacing: 1px;
        }

        .scroll-container {
           overflow-x: auto;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table th {
          text-align: left;
          padding: 1.25rem 2rem;
          background: rgba(255, 255, 255, 0.02);
          color: var(--text-muted);
          font-size: 0.65rem;
          letter-spacing: 1.5px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .admin-table td {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          font-size: 0.9rem;
          vertical-align: middle;
        }

        .user-id {
          font-size: 0.75rem;
          color: var(--accent-cyan);
          opacity: 0.8;
        }

        .tier-select {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #fff;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          outline: none;
          font-size: 0.75rem;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .tier-select:hover {
           border-color: var(--accent-cyan);
        }

        .status-pill {
          font-size: 0.6rem;
          padding: 4px 10px;
          border-radius: 4px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .status-pill.completed, .status-pill.active {
          background: rgba(50, 215, 75, 0.1);
          color: var(--success);
          border: 1px solid rgba(50, 215, 75, 0.15);
        }

        .status-pill.pending, .status-pill.trialing {
          background: rgba(255, 214, 10, 0.1);
          color: var(--warning);
          border: 1px solid rgba(255, 214, 10, 0.15);
        }

        .status-pill.past_due {
          background: rgba(255, 69, 58, 0.1);
          color: var(--error);
          border: 1px solid rgba(255, 69, 58, 0.15);
        }

        .status-pill.none {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .timestamp {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .actions {
           text-align: right;
        }

        .action-icon {
          color: var(--text-muted);
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        .action-icon:hover {
          opacity: 1;
        }

        .loading-row {
          text-align: center;
          color: var(--text-muted);
          padding: 8rem;
          letter-spacing: 2px;
          font-size: 0.8rem;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2.5rem;
          margin-top: 3rem;
          padding-bottom: 4rem;
        }

        .page-btn {
           width: 44px;
           height: 44px;
           border-radius: 12px;
           background: rgba(255, 255, 255, 0.03);
           border: 1px solid rgba(255, 255, 255, 0.05);
           color: #fff;
           display: flex;
           align-items: center;
           justify-content: center;
           transition: all 0.2s;
        }

        .page-btn:hover:not(:disabled) {
           background: rgba(255, 255, 255, 0.08);
        }

        .page-btn:disabled {
           opacity: 0.3;
           cursor: not-allowed;
        }

        .page-indicator {
           font-size: 0.8rem;
           color: var(--text-muted);
           letter-spacing: 2px;
           font-weight: 700;
        }
      `}</style>
    </AdminLayout>
  );
}
