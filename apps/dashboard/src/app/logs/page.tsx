'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Activity, Shield, FileText, ChevronLeft, ChevronRight, Filter, Search, Terminal } from 'lucide-react';
import { AdminLayout } from '../../components/ui/AdminLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';

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
    <AdminLayout>
      <GlowEffect color="#00D9FF" size={600} style={{ top: -100, left: -200, opacity: 0.08 }} />
      
      <header className="top-bar">
        <div className="header-title">
          <span className="breadcrumb">SECURITY // GOVERNANCE</span>
          <h1>AUDIT_TRAIL</h1>
        </div>
        <div className="header-actions">
           <div className="search-box">
              <Search size={14} color="var(--text-muted)" />
              <input type="text" placeholder="FILTER_LOGS..." className="mono" />
           </div>
           <button className="filter-btn mono">
              <Filter size={14} /> FILTERS
           </button>
        </div>
      </header>

      <div className="log-container">
         {loading ? (
           <div className="loading mono">
              <Activity className="animate-spin" size={20} />
              SEQUENCING_LOG_STREAM...
           </div>
         ) : (
           <div className="log-stream">
             {logs.map((log, i) => (
               <GlassCard key={log.id} intensity="low" className="log-entry">
                  <div className="log-meta">
                    <div className="meta-left">
                       <Terminal size={12} color="var(--accent-cyan)" />
                       <span className="log-timestamp mono">{new Date(log.created_at).toLocaleString().toUpperCase()}</span>
                    </div>
                    <span className={`log-action mono ${log.action.toLowerCase()}`}>{log.action}</span>
                  </div>
                  <div className="log-body">
                     <span className="log-admin mono">ADMIN_ID::{log.admin_id.substring(0,8).toUpperCase()}</span>
                     <p className="log-desc">{log.description}</p>
                  </div>
                  {log.metadata && (
                    <div className="log-details">
                       <pre className="log-json mono">{JSON.stringify(log.metadata, null, 2)}</pre>
                    </div>
                  )}
               </GlassCard>
             ))}
           </div>
         )}
      </div>

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

        .header-actions {
           display: flex;
           gap: 1rem;
        }

        .search-box {
           background: rgba(255, 255, 255, 0.03);
           border: 1px solid rgba(255, 255, 255, 0.05);
           border-radius: 8px;
           padding: 0 1rem;
           display: flex;
           align-items: center;
           gap: 0.75rem;
           width: 300px;
        }

        .search-box input {
           background: transparent;
           border: none;
           color: #fff;
           font-size: 0.75rem;
           width: 100%;
           outline: none;
        }

        .filter-btn {
           background: rgba(255, 255, 255, 0.03);
           border: 1px solid rgba(255, 255, 255, 0.05);
           padding: 0.6rem 1.25rem;
           border-radius: 8px;
           color: var(--text-muted);
           font-size: 0.75rem;
           display: flex;
           align-items: center;
           gap: 0.5rem;
           transition: all 0.2s;
        }

        .filter-btn:hover {
           background: rgba(255, 255, 255, 0.06);
           color: #fff;
        }

        .log-stream {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .log-entry {
          padding: 1.5rem;
        }

        .log-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
          align-items: center;
        }

        .meta-left {
           display: flex;
           align-items: center;
           gap: 0.75rem;
        }

        .log-timestamp {
          font-size: 0.65rem;
          color: var(--text-muted);
          letter-spacing: 0.5px;
        }

        .log-action {
          font-size: 0.6rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          padding: 4px 10px;
          border-radius: 4px;
          background: rgba(0, 217, 255, 0.1);
          color: var(--accent-cyan);
          border: 1px solid rgba(0, 217, 255, 0.15);
        }

        .log-action.delete {
          color: var(--error);
          background: rgba(255, 69, 58, 0.1);
          border-color: rgba(255, 69, 58, 0.15);
        }

        .log-body {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .log-admin {
          font-weight: 700;
          font-size: 0.75rem;
          color: var(--accent-purple);
          background: rgba(124, 58, 237, 0.05);
          padding: 4px 8px;
          border-radius: 4px;
        }

        .log-desc {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 400;
        }

        .log-details {
           margin-top: 1.25rem;
           padding-top: 1.25rem;
           border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .log-json {
          background: rgba(0, 0, 0, 0.2);
          padding: 1.25rem;
          border-radius: 8px;
          font-size: 0.75rem;
          color: var(--accent-cyan);
          overflow-x: auto;
          border: 1px solid rgba(0, 217, 255, 0.05);
        }

        .loading {
          text-align: center;
          padding: 8rem;
          color: var(--text-muted);
          font-size: 0.8rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          letter-spacing: 2px;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2.5rem;
          margin-top: 4rem;
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
           border-color: rgba(255, 255, 255, 0.1);
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

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 2s linear infinite;
        }
      `}</style>
    </AdminLayout>
  );
}
