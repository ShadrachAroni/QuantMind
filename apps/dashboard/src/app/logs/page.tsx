'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Activity, Shield, FileText, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import Link from 'next/link';

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    fetchLogs();
  }, [page]);

  async function fetchLogs() {
    setLoading(true);
    const { data } = await supabase
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (data) setLogs(data);
    setLoading(false);
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
          <Link href="/users" className="nav-item">
            <FileText size={20} /> User Management
          </Link>
          <Link href="/logs" className="nav-item active">
            <Shield size={20} /> Audit Logs
          </Link>
        </nav>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <h1>Security Audit Trail</h1>
          <button className="filter-btn"><Filter size={18} /> Filter</button>
        </header>

        <div className="log-container">
           {loading ? (
             <div className="loading">Sequencing logs...</div>
           ) : (
             logs.map((log) => (
               <div key={log.id} className="log-entry">
                  <div className="log-meta">
                    <span className="log-timestamp">{new Date(log.created_at).toLocaleString()}</span>
                    <span className={`log-action ${log.action.toLowerCase()}`}>{log.action}</span>
                  </div>
                  <div className="log-body">
                     <span className="log-admin">ADMIN_{log.admin_id.substring(0,8)}</span>
                     <span className="log-desc">{log.description}</span>
                  </div>
                  {log.metadata && (
                    <pre className="log-json">{JSON.stringify(log.metadata, null, 2)}</pre>
                  )}
               </div>
             ))
           )}
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
        .filter-btn { display: flex; align-items: center; gap: 0.5rem; background: #161B22; border: 1px solid #30363D; padding: 0.5rem 1rem; border-radius: 8px; color: #8B949E; }
        .log-container { display: flex; flex-direction: column; gap: 1rem; }
        .log-entry { background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 1.5rem; }
        .log-meta { display: flex; justify-content: space-between; margin-bottom: 0.75rem; }
        .log-timestamp { font-family: 'Roboto Mono', monospace; font-size: 0.75rem; color: #8B949E; }
        .log-action { font-size: 0.7rem; font-weight: 800; letter-spacing: 1px; padding: 2px 6px; border-radius: 4px; background: rgba(0, 217, 255, 0.1); color: #00D9FF; }
        .log-action.delete { color: #FF453A; background: rgba(255, 69, 58, 0.1); }
        .log-body { display: flex; align-items: center; gap: 1rem; }
        .log-admin { font-weight: 700; font-size: 0.85rem; color: #7C3AED; }
        .log-desc { font-size: 0.9rem; color: #E6EDF3; }
        .log-json { background: #0D1117; padding: 1rem; border-radius: 8px; margin-top: 1rem; font-size: 0.75rem; color: #00D9FF; overflow-x: auto; }
        .loading { text-align: center; padding: 4rem; color: #8B949E; }
        .pagination { display: flex; align-items: center; justify-content: center; gap: 2rem; margin-top: 2rem; color: #8B949E; }
      `}</style>
    </div>
  );
}
