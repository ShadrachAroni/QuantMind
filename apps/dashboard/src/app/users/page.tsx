'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Activity, Shield, MoreHorizontal, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';

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
    const { data, error, count } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .range((page - 1) * pageSize, page * pageSize - 1)
      .ilike('id', `%${searchTerm}%`); // Simplified search for now

    if (data) setUsers(data);
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
    <div className="admin-layout">
       <aside className="sidebar">
        <div className="sidebar-header">
          <span className="logo-text">Quant<span className="accent">Mind</span> <span className="admin-badge">Admin</span></span>
        </div>
        <nav className="sidebar-nav">
          <Link href="/" className="nav-item">
            <Activity size={20} /> Dashboard
          </Link>
          <Link href="/users" className="nav-item active">
            <User size={20} /> User Management
          </Link>
          <Link href="/logs" className="nav-item">
            <Shield size={20} /> Audit Logs
          </Link>
        </nav>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <h1>User Governance</h1>
          <div className="search-box">
             <Search size={18} />
             <input 
               type="text" 
               placeholder="Search by ID or email..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
             />
          </div>
        </header>

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Tier</th>
                <th>Onboarding</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="loading-row">Retrieving registry...</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td className="mono">{u.id.substring(0, 18)}...</td>
                    <td>
                      <select 
                        value={u.tier} 
                        onChange={(e) => updateTier(u.id, e.target.value)}
                        className={`tier-select ${u.tier}`}
                      >
                        <option value="free">FREE</option>
                        <option value="plus">PLUS</option>
                        <option value="pro">PRO</option>
                        <option value="student">STUDENT</option>
                      </select>
                    </td>
                    <td>
                      <span className={`status-pill ${u.onboarding_completed ? 'completed' : 'pending'}`}>
                        {u.onboarding_completed ? 'COMPLETED' : 'PENDING'}
                      </span>
                    </td>
                    <td className="text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="action-icon"><MoreHorizontal size={18} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
           <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
             <ChevronLeft size={20} />
           </button>
           <span>Page {page}</span>
           <button onClick={() => setPage(p => p + 1)}>
             <ChevronRight size={20} />
           </button>
        </div>
      </main>

      <style jsx>{`
        .admin-layout { display: flex; min-height: 100vh; }
        .sidebar { width: 280px; background: #0E1117; border-right: 1px solid #30363D; display: flex; flex-direction: column; padding: 2rem 0; }
        .sidebar-header { padding: 0 2rem 3rem; font-weight: 800; font-size: 1.25rem; }
        .accent { color: #00D9FF; }
        .admin-badge { font-size: 0.7rem; background: #7C3AED; padding: 2px 6px; border-radius: 4px; vertical-align: middle; margin-left: 4px; }
        .sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
        .nav-item { display: flex; align-items: center; gap: 1rem; padding: 1rem 2rem; color: #8B949E; transition: all 0.2s; text-decoration: none; }
        .nav-item:hover, .nav-item.active { color: #fff; background: rgba(255, 255, 255, 0.05); border-left: 4px solid #00D9FF; }
        .main-content { flex: 1; background: #05070A; padding: 2rem 3rem; }
        .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .search-box { display: flex; align-items: center; gap: 0.5rem; background: #161B22; border: 1px solid #30363D; padding: 0.5rem 1rem; borderRadius: 8px; width: 400px; }
        .search-box input { background: transparent; border: none; color: #fff; width: 100%; outline: none; }
        .table-container { background: #161B22; border-radius: 12px; border: 1px solid #30363D; overflow: hidden; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th { text-align: left; padding: 1rem; background: #0E1117; color: #8B949E; font-size: 0.75rem; letter-spacing: 1px; }
        .admin-table td { padding: 1rem; border-top: 1px solid #30363D; font-size: 0.9rem; }
        .mono { font-family: 'Roboto Mono', monospace; font-size: 0.8rem; color: #00D9FF; }
        .tier-select { background: #0E1117; border: 1px solid #30363D; color: #fff; padding: 0.25rem 0.5rem; border-radius: 4px; outline: none; }
        .status-pill { font-size: 0.7rem; padding: 2px 8px; border-radius: 100px; font-weight: 700; }
        .status-pill.completed { background: rgba(50, 215, 75, 0.1); color: #32D74B; }
        .status-pill.pending { background: rgba(255, 214, 10, 0.1); color: #FFD60A; }
        .pagination { display: flex; align-items: center; justify-content: center; gap: 2rem; margin-top: 2rem; color: #8B949E; }
        .loading-row { text-align: center; color: #8B949E; padding: 4rem; }
      `}</style>
    </div>
  );
}
